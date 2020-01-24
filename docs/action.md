### 基本使用
概念上和 vuex 一致Action 类似于 mutation，不同在于：Action 提交的是 mutation，而不是直接变更状态。Action 可以包含任意异步操作。
让我们来注册一个简单的 action：

```
  // 开启账单查询
async setupCreditCardBillQuery({ commit, state, getters, dispatch }, payload) {
    const cardId = getters.getIn(cardInfo, ['userCardInfo', 'cardId']);
    const [error, { resultStatus = '', memo }] = await commonService.setupCreditCardBillQuery(
      { cardId, billQuerySwitchOn: true });
    // 错误状态 return
    if (error) {
		commit('setError');
		..
	}
    // 开启开关后
      dispatch('$global:getCardDetail', { cardId, forceRefresh: true });
    });
  },
```
action 不受同步约束限制，即可先做一些异步的事情，并且触发新的action或者 commit。

### action 的触发
和 commit 一样，action 也在 page controller 和 action 里面触发，action 没有反模式必须每次使用申明完，action 也有命名空间，使用方法和commit相同。

### action 的实践
action 既然是分发中心，那么基本就会处理一些复杂动作/动作编排。例如
- api service：调用 service 层的api相关映射
- my service：调用 my 层封装的service
- 动画 serevice： 调用动画相关service 
拿到结果后做一些state数据调整，commit一下。

action 的一些常用封装可以用middleware机制实现，后面会提到。