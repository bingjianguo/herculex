import { setIn, update, produce, deleteIn } from './utils/manipulate';
import { isObject } from './utils/is';
import global from './global';
import wrapDataInstance from './wrapDataInstance';
// 保证每次更改 store 是 immutable 的
function mutationHandler (func, state, payload) {
  if (!func) {
    return payload;
  }
  if (func._shouldImmutable) {
    return produce(state, draftState => {
      func(draftState, payload);
    });
  }
  const result = func(state, payload);
  // 确保return的值是一个新对象
  return result === state ? { ...result } : result;
}

const innerMutation = {
  $setIn: (s, d) => setIn(s, d.path, d.value),
  $update: (s, o) => update(s, o),
  $deleteIn: (s, d) => deleteIn(s, d),
  $resetStore: function() {
    const { config } = global.getInstanceByViewId(global.getCurrentViewId());
    let next = { ...config.state };
    return next;
  }
};
function commitGlobal(type, payload) {
  const {
    mutations = {}
  } = global.globalStoreConfig;
  if (!type) {
    throw new Error(`not found ${type} action`);
  }
  if (isObject(type)) {
    payload = type;
    type = 'update';
  }
  const finalMutation = mutationHandler(mutations[type], global.getGlobalState(), payload);
  console.info(`%c global mutation: ${type}`, 'color: #03A9F4; font-weight: bold', payload, new Date().getTime());
  const tmp = { state: finalMutation, mutation: { type: `$global:${type}`, payload } };
  global.emitter.emitEvent('updateState', tmp);
  // commit 的结果是一个同步行为
  return global.getGlobalState();
}

function dispatchGlobal(type, payload) {
  const {
    actions = {}
  } = global.globalStoreConfig;
  const actionFunc = actions[type];
  if (!actionFunc) {
    return console.error('not found an action', type, actions);
  }
  const self = this;
  global.emitter.emitEvent('dispatchAction', { type, payload });
  const res = actionFunc.call(self, {
    commit: commitGlobal.bind(self),
    dispatch: dispatchGlobal.bind(self),
    message: global.messageManager,
    put: function (type, ...args) {
      const func = actions[type];
      if (!func) {
        throw new Error(`not found ${type} action`);
      }
      if (func) {
        func.apply(self, args);
      }
    },
    get state() {
      return wrapDataInstance(global.getGlobalState());
    },
    get getters() {
      return wrapDataInstance(global.getGlobalState().$getters);
    },
    get global() {
      return wrapDataInstance(global.getGlobalState());
    },
    getRef(name) {
      return global.getComponentRef(name);
    },
    select(filter) {
      return filter(wrapDataInstance({ ...global.getGlobalState() }));
    },
    getState(instanceName) {
      if (!instanceName) {
        return wrapDataInstance(global.getGlobalState());
      }
      return global.getState(instanceName);
    }
  }, payload);
  // 保证结果为一个 promise
  if (res instanceof Promise) {
    return res;
  }
  return Promise.resolve(res);
}

function getConfigFromGlobal(global, key) {
  const targetInstanceObj = global.getInstance(key || global.getCurrentViewId());
  const instance = targetInstanceObj ? targetInstanceObj.store.getInstance() : {};
  return { ...targetInstanceObj.config, instance };
}
function getConfigFromInstance(target) {
  return {
    mutations: target.mutations,
    actions: target.actions,
    instance: target.getInstance()
  };
}
export function createConnectHelpers(global, key, config = {}, isInstance) {
  return {
    commitGlobal: commitGlobal.bind(this),
    dispatchGlobal: dispatchGlobal.bind(this),
    commit(type, payload) {
      const finalKey = key || global.getCurrentPath() || global.getCurrentViewId() || -1;
      const { instance, mutations = {} } = global.storeInstance ? getConfigFromInstance(global) : getConfigFromGlobal(global, finalKey);
      Object.assign(mutations, config.mutations);
      if (!type) {
        throw new Error(`${type} not found`);
      }
      if (isObject(type)) {
        payload = type;
        type = 'update';
      }
      if (type.startsWith('$global:')) {
        const realType = type.split(':').pop();
        return commitGlobal.call(instance, realType, payload);
      }
      const prevState = { ...instance.data };
      const finalMutation = mutationHandler(mutations[type], wrapDataInstance(instance.data), payload);
      instance.$emitter.emitEvent('updateState', { state: finalMutation, mutation: { type, payload }, prevState });
      // commit 的结果是一个同步行为
      return instance.data;
    },
    dispatch(type, payload) {
      const finalKey = key || global.getCurrentPath() || global.getCurrentViewId() || -1;
      const {
        instance,
        mutations = {},
        actions = {}
      } = global.storeInstance ? getConfigFromInstance(global) : getConfigFromGlobal(global, finalKey);
      if (!type) {
        throw new Error('action type not found');
      }
      if (type.startsWith('$global:')) {
        const realType = type.split(':').pop();
        return dispatchGlobal.call(this, realType, payload);
      }
      // 获取目标 instance 的数据
      Object.assign(mutations, config.mutations);
      Object.assign(actions, config.actions);

      const actionFunc = actions[type];
      if (!actionFunc) {
        throw new Error('action not found');
      }
      const self = this;
      instance.$emitter.emitEvent('dispatchAction', { type, payload });
      const res = actionFunc.call(self, {
        commit: this.commit.bind(self),
        dispatch: this.dispatch.bind(self),
        message: global.messageManager,
        dispatchGlobal: dispatchGlobal.bind(self),
        commitGlobal: commitGlobal.bind(self),
        put: function (type, ...args) {
          const func = actions[type];
          if (!func) {
            throw new Error(`not found ${type} action`);
          }
          if (func) {
            func.apply(self, args);
          }
        },
        get state() {
          return wrapDataInstance(instance.data, self);
        },
        get getters() {
          return wrapDataInstance(instance.data.$getters, self);
        },
        get global() {
          return wrapDataInstance(instance.data.$global);
        },
        getRef(name) {
          return global.getComponentRef(name);
        },
        getState(instanceName) {
          if (!instanceName) {
            return wrapDataInstance(instance.data, self);
          }
          return global.getState(instanceName);
        },
        select(filter) {
          return filter(wrapDataInstance({ ...instance.data }));
        }
      }, payload);
      // 保证结果为一个 promise
      if (res instanceof Promise) {
        return res;
      }
      return Promise.resolve(res);
    }
  };
}
// 创建 commit 和 dispatch instance
export default function createHelpers(actions, mutationsObj, emitter, getInstance) {
  const mutations = Object.assign({}, mutationsObj, innerMutation);
  return {
    commitGlobal: commitGlobal.bind(this),
    dispatchGlobal: dispatchGlobal.bind(this),
    commit(type, payload) {
      if (!type) {
        throw new Error(`not found ${type} action`);
      }
      if (isObject(type)) {
        payload = type;
        type = 'update';
      }
      if (type.startsWith('$global:')) {
        const realType = type.split(':').pop();
        return commitGlobal.call(this, realType, payload);
      }
      const prevState = { ...this.data };
      const finalMutation = mutationHandler(mutations[type], wrapDataInstance(this.data), payload);
      // 触发更新机制
      emitter.emitEvent('updateState', { state: finalMutation, mutation: { type, payload }, prevState });
      // commit 的结果是一个同步行为，返回值
      return this.data;
    },
    dispatch(type, payload) {
      const actionCache = Object.assign({}, actions, this);
      if (!type) {
        throw new Error('action type not found');
      }
      if (type.startsWith('$global:')) {
        const realType = type.split(':').pop();
        return dispatchGlobal.call(this, realType, payload);
      }
      const actionFunc = actionCache[type];
      if (!actionFunc) {
        return console.error('not found an action', type, actions);
      }
      const self = this;
      emitter.emitEvent('dispatchAction', { type, payload });
      const res = actionFunc.call(self, {
        commit: this.commit.bind(self),
        dispatch: this.dispatch.bind(self),
        dispatchGlobal: dispatchGlobal.bind(self),
        commitGlobal: commitGlobal.bind(self),
        message: global.messageManager,
        put: function (type, ...args) {
          const func = actionCache[type];
          if (!func) {
            throw new Error(`not found ${type} action`);
          }
          if (func) {
            func.apply(self, args);
          }
        },
        get state() {
          return wrapDataInstance(self.data, self);
        },
        get getters() {
          return wrapDataInstance(self.data.$getters, self);
        },
        get global() {
          return wrapDataInstance(self.data.$global);
        },
        getRef(name) {
          return global.getComponentRef(name);
        },
        getState(instanceName) {
          if (!instanceName) {
            return wrapDataInstance(self.data, self);
          }
          return global.getState(instanceName);
        },
        select(filter) {
          return filter(wrapDataInstance({ ...self.data }));
        }
      }, payload);
      // 保证结果为一个 promise
      if (res instanceof Promise) {
        return res;
      }
      return Promise.resolve(res);
    }
  };
}