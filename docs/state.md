# 单一状态树
### 理念
Herculex 也使用单一状态树理念，用一个对象就包含了全部的应用层级状态。至此它便作为一个 “唯一数据源 ([SSOT](https://en.wikipedia.org/wiki/Single_source_of_truth))”。每个应用将仅仅包含一个 store 实例。单一状态树让我们能够直接地定位任一特定的状态片段，在调试的过程中也能轻易地取得整个当前应用状态的快照。

单状态树和模块化理念并不冲突——在后面的章节里会讨论如何将状态和状态变更事件分布到各个子模块中。

### 命名空间约定

Herculex 在全局维护了一颗单一状态树，并默认以 Page Path 为命名空间。例如：
若我们的 app.json 里包含

```
pages: [
	"pages/card-home/index",
	"pages/installment-records/index",
]
```
且这两个page都使用了
```
Page(store.register({
	onLoad(){},
	...
}))
```
则在全局会维护一颗state解构，且关联页面会默认将所有自己page的state，getters，mutations等打入 Page state，方便开发者快速应用
```
{
	global: {},
	card-home: {},
	installment-records: {}
}
```
### 在页面层中获得 Herculex 状态

那么我们如何在页面中展示状态呢？由于 Herculex 的状态存储是响应式的

全局 store.js（文件位置与app.js同层）
```
export default new GlobalStore({
  state: {
    globalCount: 1,
  },
  plugins: ['logger'],
  mutations: {
    updateCount (state, { value = false }) {
      return state.setIn(['globalCount'], value);
    },
  },
  actions: {
    async getCount ({ state, global, commit }) {
      const res = await XXXX();
      commit('setCount', {
        globalCount: res.count,
      });
    }
  }
});
```

页面 store.js
```
export default new Store({
    connectGlobal: true,
	state: {
		count: 0
	},
	getters: {
		sum : (state, getetrs, global) => state.getIn(['count'], 1) + global.getIn(['count'], 1),
	},
	mutations: {},
	action: {},
})
```
页面 index.js
```
Page(store.register({
	onLoad() {
		console.log('state', this.state);
		console.log('state getters', this.state.$getters);
		console.log('state global', this.state.$global);
	}
}))
```
创建一个页面 index.axml
```
<view class="installment-apply-wrapper">
  {{count}}
  {{$global.globalCount}}
  {{$getters.sum}}
</view>
```

每当 herculex 的 state.count 变化的时候, 都会重新取其计算属性，将新的 state 值 setData后 塞到对应页面的 data 里。herculex 由于已经做了命名空间约束，所以这里的data默认关注所有这个页面下 state 注册的实例内容。比如，这里的 count 不需要再去做 map，自动关联。页面也可以直接使用全局store的响应式数据，只需在页面中 connectGlobal 变成true，全局的global就会挂载在页面的state上，可以获取到全局store的state的所有属性，除此外还能获取到getIn，setIn、deleteIn等方法以及$route属性,在页面中直接通过$global获取到。

注：global的$route属性包含当前页面的一些信息，具体如下：

```
{
	context: {} // 上下文
	currentPath: "" // 当前页面
	from: "index" // 上一页面
	fromViewId: "" // 上一页面的viewId
	query: {} // 小程序页面的路由参数，例如跳转到小程序页面的路径为‘pagas/index/index?count=1&status=2’，那么query的值就是{count:1, status: 2}
	viewId: 49 
}
```

### 局部状态
使用 Herculex 并不意味着你需要将所有的状态放入 Herculex。虽然将所有的状态放到 Herculex 会使状态变化更显式和易调试，但也会使代码变得冗长和不直观。如果有些状态严格属于单个组件，最好还是作为组件的局部状态 setData。你应该根据你的应用开发需要进行权衡和确定。

### 引用区域

> Herculex和vuex的思想类似，有兴趣可以学习下vuex

#### getters 

getters中的每一个属性都是一个函数，函数都接受三个参数，state就是其中之一：

```
state: {
	count: 1,
},
getters: {
	test1: (state, getters, global) => state.count +1
}
```


#### actions 中:第一个参数

state是action函数第一个参数中的一个属性：

```
action: {
	async XXX({ commit, state, global, message, getters, dispatch }, payload) {
		...
		const res = await XXXX();
	  	....
 	}
}
```

#### page Controler 中(每个页面的index.js)：

每个page页面的index中都会用到state的值来进行逻辑运算：

pages/XXX/index.js
```
Page(store.register({
  onLoad(options) {
    console.log('this.state', this.state);
	console.log('global', this.state.$global);
  }
}));
```
