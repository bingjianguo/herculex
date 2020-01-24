# 知识点
有时候我们需要从 store 中的 state 中派生出一些状态，例如对列表进行过滤并计数, 对服务端返回的结果做针对UI的适配。由于小程序页面级计算属性在 axml 里解耦，于是一些相关的计算可以在 store 的 getters 里完成。

```
// store.js
function filters(data) {
    return data.filter(todo => todo.done).length
}
export default {
  state: {
     todos: [
          { id: 1, text: '...', done: true },
          { id: 2, text: '...', done: false }
      ]
  },
    getters: {
    doneTodosCount: state => state.getIn('todos', [], filters)// 返回一个新的元素，并做防空，等同于filters(state.todos)
  }
}
```
如果有多个组件需要用到此属性，我们要么复制这个函数，或者抽取到一个共享函数然后在多处导入它——无论哪种方式都不是很理想。
Herculex 和 vuex 一样允许我们在 store 中定义“getter”（可以认为是 store 的计算属性）。就像计算属性一样，getter 的返回值会根据它的依赖被缓存起来，且只有当它的依赖值发生了改变才会被重新计算。
Getter 接受 state 作为其第一个参数，state默认会绑上一些helpers函数，方便开发者快速映射需要的state值。
Getter 接受 getters 作为其第二个参数，方便开发者快速映射处理上下文getters的值。
Getter 接受 global 作为其第三个参数，方便开发者映射 global 命名空间下的state。当全局store发生变更则此getters 也会随之发生改变。 
# getters 在页面中的获取
直接在需要用到的地方做：
```
<div>{$getters.xxx}</div>
```
# getters 在组件中获取
### mapStateToProps
组件级数据流体系，不过现在实际上aaa是被丢到了 data里，并没有拦截props。如果method层要获取需要this.data.aaa获取
//connect 中
mapStateToProps: {
    aaa: (state, getters, global) => getters.getIn('xxx')
}
### mapGettersToProps
mapGettersToProps: ['aaa']// 目前仅支持数组形式,如这里就是把getters.aaa映射到了这个组件的data

# getters 在小程序业务实践
整体 demo 的讲解会在后面章节重点突出：

由于小程序 view 层设计是比较纯的，在 view 级做计算属性除非引入 sjs，但业务实践觉得还是很难做好。于是我们推荐就  getters 里做完然后在页面 AXML 里直接使用。下面贴一下信用卡还款页 getters 的 demo。

每个 getters 可以去做一些从 中心数据池 - UI 的映射，过程中我们提供了一些好用的方法帮助大家，比如 getIn，setIn 等，便于业务同学做防空，兜底，不断的compose

```
import { LOADING_TYPE, REPAY_STATUS_TYPE } from '../../../constants';;
const getMobilesWrapper = pickObject(['smsMobile', 'smsTelecom', 'smsUnicon']);
...
module.exports = {
  // 账单获取 loading
  isCardItemLoading: state => state.loading.getCardItem === LOADING_TYPE.REQUEST,
  // 卡片完整信息
  cardInfo: (state, getters, global) => getCurrentCardInfo(global),
  // 卡片简略信息
  cardItemInfo: (state, getters, global) => getBriefCardInfo(global),
  // ID
  cardId: (_, getters) => getters.getIn(['userCardInfo', 'cardId'], ''),
  // 是否可以付款
  applyInstalFlowId: (_, getters) => state.getIn(['orderInfo', 'applyInstalFlowId'], null),
  // 
  appointDeducts: (_, getters) => state.getIn(['userCardInfo', 'appointDeductInfo', 'deductId'], null, mapAppointDeductsToUI),
  // 是否展示会员等级文案
  showMemberMessageFlag: (_, getters) => !!getters.memberLevelMessage,
  // 是否显示积分抵扣部分 - 接口返回正常且额度不足以抵扣
  // 是否显示协议 radio
  showAgreements: (_, getters) => getters.showPayAgreement || getters.showFeeAgreement,
  // 是否显示支付宝还款协议
  showPayAgreement: state => state.getIn(['isAgreementUncheck', 'payment'], false),
};
```

上述操作做的就是：
从 数据中心池 拿想要的响应式依赖数据，需要做一些兜底防空映射，数据 mapping 操作，并吐出来一个 UI 级的变量。这个数据链接过程会被抽象在这个 js 中（未来可能也支持托管的 json 模式，方便编译器更好的理解）
那么在 UI 层中就可直接使用：

### 贴个简单的片段
```
<block a:if="{{!!$global.errorType}}">
  <error-view type="{{$global.errorType}}" onButtonTap="handleReload"></error-view>
</block>
<view class="card-detail-container" a:if="{{!$global.errorType}}">
  <header-card-info cardItemInfo="{{$getters.cardItemInfo}}"/>
  <view class="page-repay-body">
    <query-bill showBillGuide="{{showRedPot}}"
                title="{{UI.QUERY_CREDIT_CARD_BILL}}"
                extraText="{{UI.OPEN_BILL_QUERY}}"
                onBillQueryClick="$getters.onBillQueryClick"/>
    <bill-info onInstallmentButtonTap="onStagingRepayment" spaceCode="{{cardDetailInstallmentRightSpaceCode}}" />
    <card-number-input cardNumberInputInfo="{{$getters.cardNumberInputInfo}}" />
</view>
```