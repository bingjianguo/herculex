## 安装方式

### 脚手架方式
- 支付宝小程序研发流程项目
可直接使用 支付宝小程序IDE 创建小程序时选择 Herculex 脚手架，该脚手架会把最佳使用案例都放进去，[参考](https://yuque.antfin-inc.com/industryprod-eco/ao09to/id9vl6)

- CLI 方式
```tnpm install -g herculex-cli  ```

然后直接 ```herculex init``` 就好啦,可以选择当前 github 上提供的标准脚手架作为项目初始化

### 手动引入
安装
```shell
tnpm install --save herculex
```

## 最简单的 Herculex 示例
更简单的案例 [参考](https://github.com/herculesJS/herculex-appx-examples)
#### 创建一个 ```store```。
- store.js
```js
import Store from 'herculex';
export default new Store({
  state: {
    loading: true,
    donationTargetEntry: [],
    myCurrentPoint: 0,
  },
  mutations: {
   setLoading(state) {
   	 state.loading = true
   },
   addPoint(state) {
   		++state.myCurrentPoint;
   }
  },
  getters: {
  	myCurrentPointAdd: state => state.myCurrentPoint++
  },
  actions: {
  	async load({ commit }) {
	   setTimeout(function(){
		   commit('setLoading');   
	   }, 2000);
	}
  }
});


```
你可以通过 ```store.subscribe,store.dispatch,store.commit``` 来监听或者触发 store action
#### 小程序中的事件层
这里自动绑定了 this.commit, this.dispatch, this.data等

- index.js
```js
import store from './store';
Page(store.register({
	onLoad() {
		this.dispatch('load'); // 在页面事件层触发 mutations 改变 state
		console.log('state', this.state.loading) // true
		this.commit('TEST_LOADING', { myCurrentPoint: 1 }) // 若没有命中 mutations 则做浅merge行为
		console.log('state', this.state.myCurrentPoint) // 1
	},
	increment() {
		this.commit('addPoint');
	}
}))
```
我们在小程序的 ```Page``` 里这么写
- index.axml
```vue
<!-- axml -->
<view>
  <view>{{myCurrentPoint}}</view>
  <view>{{$getters.myCurrentPointAdd}}</view>
  <button onTap="increment">+</button>
  <button onTap="increment">+</button>
</view>
```

## 接下来学什么？
* 核心概念
  * [State](./state.md)
  * [Getter](./getters.md)
  * [Action](./action.md)
  * [Mutation](./mutation.md)