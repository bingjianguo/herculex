# 简介

## Herculex 是什么？
Herculex 是一个专门为跨容器解决方案（支付宝小程序 appx/cube、rax/h5）设计的集中式的 **状态管理器**，在跨容器应用中他的使命是更规范跨容器应用特性的状态管理机制的表达。

## 为什么使用 Herculex？

当你打算开发大型跨容器应用项目时，会出现多个视图组件依赖同一个状态，来自不同视图的行为需要变更同一个状态。遇到以上情况时候，你就应该考虑使用 Herculex 了，它能把组件的共享状态抽取出来，当做一个全局单例模式进行管理。这样不管你在何处改变状态，都会通知使用该状态的组件做出相应修改。

Herculex 的状态存储是响应式的。当组件/页面从 store 中读取状态的时候，若 store 中的状态发生变化，那么相应的组件/页面数据也会相应地得到高效更新。

你不能直接改变 store 中的状态。改变 store 中的状态的唯一途径就是显式地提交 (commit) mutation。这样使得我们可以方便地跟踪每一个状态的变化，从而让我们能够实现一些工具帮助我们更好地了解我们的应用。

Herculex 在小程序研发场景做了更深度的内化，目前将各种场景都考虑在内，提供较好解决方案。

## 特点

- **专为小程序体系量身定做**：Herculex 开发背景就是我们在做复杂小程序业务发现每个数据状态管理都手动适配，setData的性能也很糟，面对域内复杂业务下缺少数据流的体系支撑。于是我们结合业务研发中各种细节做了很多内化。我们既可以向 kylin 一样使用隔离的多 store 完成，也可以利用一个运行时一样使用单 store 体系。我们可以轻易的拿到组件实例，让组件和组件通信更容易。
- **精心设计的API**：Herculex 最终选择 vuex API 设计，并坚持 vuex 的 api 设计思想融合业务研发中的规范性思想做了拓展，让业务同学学习使用起来更简单。
- **扩展强**：支持和 vuex 相同的 **插件** 机制，但对插件做了拓展。可修改初始化store内容，可直接利用插件能力对action做拦截（类似middleware，更符合 插件 的概念）目前生态上已有：api 插件，内置的logger插件等。
- **性能与轻量**：在小程序体系下一般基本响应式已存在，herculex 更关注的是托管 setData 的使用，于是只是对setData 部分做了精心的优化。并且使用immer和immutable两种方式保证mutation的高可用。
- **helpers**：为了更贴合业务最佳实践在 state 和 mutation 实例中内置 immutable helper
- **auto connect**：小程序体系下，view 层与 Page Controller是严格分离的，计算属性基本就都推荐在 getters 里完成，于是对 getters 的实现依赖state，默认集成进整个应用栈，页面上直接使用。
- **global store**：herculex 允许中心store管理方式，那么就像dva一样每个页面是一个命名空间，我们回在近期提供 redux-devtools 的拓展，给开发者更漂亮的devtools。
- **持续维护**：herculex 是行业前端组业务的命脉，所有小程序业务皆基于它，我们必须保障他的稳定性，且不断优化它
- **强大的mutation**：运行时自动识别使用 immer 还是实例中的 immutable helper 保障数据的不可变性，并且支持一部分的反模式和内置 mutation 极大提升研发效率。
- **跨平台**：目前已支持 **淘宝小程序、微信小程序**。
- **谁在用我们？**：
   - 1.行业线所有小程序相关业务
      - 行业基础四大金刚：信用卡、电子发票 各个PV超千万
      - 行业创新线: 大出行相关小程序（出行 ICON等）
      - 行业生态线：一网通办、码上租、国办、蚂蚁加油、办呗，
      - 行业解决方案：行业生态ISV正在使用：例如交警、e龙岩、海南政务...等深度配合我组小程序模板对外输出
   - 2.其他线：
      - 盒马生鲜线：淘贤达 （一套代码支持淘宝小程序/淘宝小程序插件/微信小程序 + 支付宝小程序）已完成
      - 蚂蚁财富线：证券类、金融体验
整体架构图：
![undefined](https://intranetproxy.alipay.com/skylark/lark/0/2019/png/82549/1547979414659-0215a2e6-be13-4eb2-914d-982071cbc15a.png) 

## 性能优化

- getters 记忆性优化
- setData flatDeepDiff 优化

> 下一篇将带领大家进入 Herculex 的使用