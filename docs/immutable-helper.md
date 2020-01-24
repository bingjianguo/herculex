# 暴露的对象实例都绑上 immutable-helper

state、global、getters 都有 getIn、setIn、deleteIn、updateIn ，compose 等实例方法。

```
export default {
    getters: {
    xxx: (state, getters,global) => state.getIn([xxx, xxx, xxx], defalut),
    ....
  }
}
```

在这里提供了：
```getIn``` 方法：
#### 参数1: 访问路径数组
#### 参数2: 若是取不到的默认值，注意“空”不是取不到。不填为null

```setIn``` 方法:
#### 参数1: 访问路径数组
#### 参数2: 为设置的值，没有则帮助创建父亲节点。
 

```deleteIn``` 方法:
#### 参数1: 访问路径数组