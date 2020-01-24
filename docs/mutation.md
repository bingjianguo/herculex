### mutation 本体
更改 store 中的状态的唯一方法是提交 mutation。这个过程与vuex类似，每个 mutation 都有一个字符串的 事件类型 (type) 和 一个 回调函数 (handler)。这个回调函数就是我们实际进行状态更改的地方，并且它会接受 state 作为第一个参数, payload 为第二个参数
```
export default ({
  state: {
    count: 1
  },
  mutations: {
    increment (state, payload) {  
      // 变更状态
      state.count++
	  state.aaa = payload
    }
  }
})
```
与 vuex 不同的是， 这里的state和payload也都绑上了上一节提到过的 getIn，setIn 等辅助操作函数。比如也可以简单的return 一个设置来塞state下内嵌的值。
```
mutations: {
    increment (state, payload) {  
	  return state.setIn(['foo', 'bar'], 123);
    }
```

### 调用方式
#### 基本调用
这部分和vuex体验相同，当触发一个类型为 increment 的 mutation 时，调用此函数。要唤醒一个 mutation handler，你需要以相应的 type 调用 store.commit 方法：
在小程序中可以调用 commit 目前就是三个地方
- page controller
- action
- store实例(暂不开放)
举例一：
- 在page controller 下(index.js)：

```

onLoad() {
	this.commit('handlePrepareData'); // 
}

```
- action 中

```
async getDetail({ commit }) {
	commit('addNumber');
}
```

### 反模式用法

以上的使用和vuex没啥区别只是内化到了小程序，但是业务使用中发现虽然vuex的想法是让大家去抽象每个mutation行为，但是实际研发中效率上还是弱了一些大家基本都会写一个名叫 “setState” 类似的mutation，然后在想用到的地方给他传入一个object，在里面直接做浅merge。那么这里不如稍微放弃写存粹，提供这个反模式。若 commit 的第一个参数没有命中mutations里面申明的任何一个type，那么就做浅merge行为。而这个type我们依然可以在devtool和测试中监控，type依然表达业务修改的意义，只是不用再去那边写了。
- 例如在调用处这么写且mutations里面没有 updateCardNumber 那么：
```
this.commit('updateCardNumber', { cardNumber: 123 })
```

### 命名空间

因为在 CCA 的场景下。整个App 的 store 的设计就是
- global
- /pages/xxx
- /pages/xxxx
每个页面其实可以说就是一个独立命名空间，名字就是默认的 path，或者我们自定义。
由于小程序暂时不允许触发一个不再当前页面的页面的 state 更新，且业务场景较少却增加了使用成本暂时不支持page间命名空间的触发。但是页面间的联动我们可以使用global store。触发方式global store 的 mutation 可用：

```
this.commit($global:xxx)
```
这样数据即可被更新到global中，其他页面若关注了global即可建立响应数据通道。