# 设计
小程序可以跨页数据通信，为了让设计更简单我们可采用全局store的方式通信。
Herculex 提供了一个全局store概念，在页面的store中只要开启了 global:
```connectGlobal置true```，则可以使用globalstore：
# 使用
在任何地方 ```this.dispatch('$global:xxx')``` 即可触发全局store的数据变化，此时在页面视图层使用
 $global.xxx 即可访问。
在任何getters中也可以使用 global：
```
 getters: {
    creditCardInfoList: (_, getters, global) => global.getIn(['entity', 'cardList'], [], mapCardListInfoToUI),
    creditCardInfoListCount: (_, getters) => getters.creditCardInfoList.length,
  },
```