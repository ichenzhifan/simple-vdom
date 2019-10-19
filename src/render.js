import { vNodeType, vChildType } from './strings';

/**
 * 更新子节点. 是虚拟dom更新时, 最核心的方法. 涉及到diff比较.
 * @param {String} preChildType 上一个子节点的类型
 * @param {String} nextChildType 待更新的子节点的类型
 * @param {Object} preChildren 上一个子节点的虚拟dom
 * @param {Object} nextChildren 待更新子节点的虚拟dom
 * @param {HTMLElement} container 挂载的容器. 
 */
const patchChildren = (preChildType, nextChildType, preChildren, nextChildren, container) => {
  // 更新的场景.
  // - 1. 老的节点
  // - 老的是一个
  // - 老的是空
  // - 老的是多个
  // 2. 新的节点.
  // - 新的是一个
  // - 新的是空
  // - 新的是多个
  // 组合起来, 共有9中情况.
  switch (preChildType) {
    case vChildType.SINGLE: {
      switch (nextChildType) {
        case vChildType.SINGLE: {
          // 都是单个. 执行更新操作
          patch(preChildren, nextChildren, container);
          break;
        }
        case vChildType.EMPTY: {
          // 新的是空. 移除老的节点.
          container.removeChild(preChildren.el);
          break;
        }
        case vChildType.MULTI: {
          // 老的是单个. 新的是多个.
          // 先删除老的节点. 然后在逐个挂载每一个新的节点.
          container.removeChild(preChildren.el);
          for (let i = 0; i < nextChildren.length; i++) {
            mount(nextChildren[i], container);
          }
          break;
        }
      }
      break;
    }
    case vChildType.EMPTY: {
      switch (nextChildType) {
        case vChildType.SINGLE: {
          // 老的是空, 新的是单个. 直接挂载.
          mount(nextChildren, container);
          break;
        }
        case vChildType.EMPTY: {
          // 两个都是空的情况. 无需任何操作.
          break;
        }
        case vChildType.MULTI: {
          // 老的是空，新的是多个. 
          // 逐个挂载新的每一个节点.
          for (let i = 0; i < nextChildren.length; i++) {
            mount(nextChildren[i], container);
          }
          break;
        }
      }
      break;
    }
    case vChildType.MULTI: {
      switch (nextChildType) {
        case vChildType.SINGLE: {
          // 老的是多个, 新的是单个.
          // 先逐个删除老的， 然后挂载新的.
          for (let i = 0; i < preChildren.length; i++) {
            container.removeChild(preChildren[i].el);
          }
          mount(nextChildren, container);
          break;
        }
        case vChildType.EMPTY: {
          // 老的是多个, 新的是空.
          // 先逐个删除老的.
          for (let i = 0; i < preChildren.length; i++) {
            container.removeChild(preChildren[i].el);
          }
          break;
        }
        case vChildType.MULTI: {
          // 不同的虚拟dom实现, 就在这里区分, 不同的类库优化策略不一样.
          // 老的是数组, 新的也是数组.
          // 实现策略. 查看相对位置.
          // - 老的是[a,b,c]，新的也是[a,b,c]：节点的相对位置是递增的. 元素不需要移动.
          // - 老的是[a,b,c], 新的是[x,e,a,h,b,e,c]： 节点a,b,c的相对位置也是递增的.元素不需要移动.
          // - 老的是[a,b,c], 新的是[b,a,c]： 那么节点b和a的相对位置, 发生改变,但接到a和c的相对位置还是递增的.
          let lastIndex = 0;

          for (let i = 0; i < nextChildren.length; i++) {
            let isFind = false;
            let nextVNode = nextChildren[i];
            let j = 0;
            for (j; j < preChildren.length; j++) {
              let preVNode = preChildren[j];

              // 1. 如果key相同, 我们认为是同一个元素.
              if (preVNode.props.key === nextVNode.props.key) {
                isFind = true;
                patch(preVNode, nextVNode, container);

                // 如果j小于lastIndex, 则相对位置发生变化.
                // 认为需要移动.
                if (j < lastIndex) {
                  // insertBefore移动元素.
                  // abc, a想移动到b之后. abc的父元素.insertBefore()
                  const flagElement = nextChildren[i - 1].el.nextSibling;
                  container.insertBefore(preVNode.el, flagElement);
                  break;
                } else {
                  lastIndex = j;
                }
              }
            }

            // 在老的中没有找到. 需要新增.
            if (!isFind) {
              const flagNode = i == 0 ? preChildren[0].el : nextChildren[i - 1].el.nextSibling;
              mount(nextVNode, container, flagNode);
            }
          }

          // 删除老的中存在， 新的中不存在的节点.
          for (let i = 0; i < preChildren.length; i++) {
            const preVNode = preChildren[i];
            const has = !!nextChildren.find(m => m.props.key === preVNode.props.key);

            if (!has) {
              container.removeChild(preVNode.el);
            }
          }
          break;
        }
      }
      break;
    }
    default: {
      break
    }
  }
};

/**
 * 更新HTML类型的虚拟节点.
 */
const patchHTML = (pre, next, container) => {
  // pre是div, next是p
  if (pre.tag !== next.tag) {
    return replaceVNode(pre, next, container);
  }

  // 1. 更新节点的props.
  const { el, props: preProps } = pre;
  const { props, children } = next;

  // 更新新的props.
  for (const key in props) {
    if (props.hasOwnProperty(key)) {
      patchProps(el, key, preProps[key], props[key]);
    }
  }

  // 删除老的props中存在, 但新的props中不存在的属性
  for (const key in preProps) {
    if (preProps.hasOwnProperty(key) && !props.hasOwnProperty(key)) {
      // 第四个参数, 表示新的props中值没有.
      patchProps(el, key, preProps[key], null);
    }
  }

  // 2. 更新子节点
  patchChildren(pre.childType, next.childType, pre.children, next.children, el);

  next.el = el;
};

/**
 * 更新文本类型的虚拟节点.
 */
const patchText = (pre, next) => {
  const { el } = pre;

  // 更新文本节点的值
  if (next.children !== pre.children) {
    el.nodeValue = next.children;
  }

  // 保存真实节点到虚拟dom中.
  next.el = el;
};

/**
 * 替换虚拟dom节点
 */
const replaceVNode = (pre, next, container) => {
  // 删除原来的
  container.removeChild(pre.el);

  // 挂载最新的.
  mount(next, container);
};

/**
 * 更新元素. 是虚拟dom中最核心的方法.
 * @param {Object} preVNode 上一次的虚拟dom
 * @param {Object} nextVNode 最新的虚拟dom
 * @param {HTMLElement} container 要挂载的节点容器.
 */
const patch = (preVNode, nextVNode, container) => {
  const {
    nodeType: preNodeType
  } = preVNode;
  const {
    nodeType
  } = nextVNode;

  // 1. prv是文本, next是html(比如div). 直接替换操作. 没有优化的空间.
  if (preNodeType !== nodeType) {
    replaceVNode(preVNode, nextVNode, container);
  } else if (nodeType === vNodeType.HTML) {
    patchHTML(preVNode, nextVNode, container);
  } else if (nodeType === vNodeType.TEXT) {
    patchText(preVNode, nextVNode, container);
  }
}

/**
 * 更新节点属性.
 * @param {HTMLElement} el 
 * @param {any} key 
 * @param {Object} pre 上一次的属性对象
 * @param {Object} next 待更新的属性对象
 */
const patchProps = (el, key, pre, next) => {
  switch (key) {
    case 'style': {
      // 更新新的props
      for (const k in next) {
        if (next.hasOwnProperty(k)) {
          el.style[k] = next[k];
        }
      }

      // 删除老的props上有, 但在新的props上没有的属性
      for (const k in pre) {
        if (pre.hasOwnProperty(k) && next && !next.hasOwnProperty(k)) {
          el.style[k] = '';
        }
      }
      break;
    }
    case 'class': {
      el.className = next;
      break;
    }
    default: {
      // 事件
      if (key[0] === '@') {
        const eventType = key.slice(1);

        if (pre) {
          el.removeEventListener(eventType, pre);
        }

        if (next) {
          el.addEventListener(eventType, next);
        }
      } else {
        el.setAttribute(key, next);
      }
      break;
    }
  }
};

/**
 * 挂载虚拟dom到指定的容器上.
 * @param {Object} vNode 虚拟dom对象
 * @param {HTMLElement} container 挂载的容器
 * @param {HTMLElement} flagNode 元素挂载时调用insertBefore方法时的参考元素. 主要用于元素更新时. 
 */
const mountElement = (vNode, container, flagNode) => {
  const {
    nodeType,
    tag,
    props,
    el,

    children,
    childType
  } = vNode;

  // 创建dom节点 
  const dom = document.createElement(tag);
  vNode.el = dom;

  // 挂载props
  if (props) {
    for (const key in props) {
      if (props.hasOwnProperty(key)) {
        const data = props[key];

        // 节点, key， 老值, 新值.
        patchProps(dom, key, null, data);
      }
    }
  }

  // 挂载子元素.
  if (childType !== vChildType.EMPTY) {
    if (childType === vChildType.SINGLE) {
      mount(children, dom);
    } else if (childType === vChildType.MULTI) {
      children.forEach(node => {
        mount(node, dom);
      })
    }
  }

  flagNode ? container.insertBefore(dom, flagNode) : container.appendChild(dom);
};

/**
 * 挂载文本类型的虚拟dom
 * @param {Object} vNode 
 * @param {HTMLElement} container 
 */
const mountText = (vNode, container) => {
  vNode.el = document.createTextNode(vNode.children);
  container.appendChild(vNode.el);
};

/**
 * 首次渲染.
 */
const mount = (vNode, container, flagNode) => {
  const { nodeType } = vNode;

  switch (nodeType) {
    case vNodeType.HTML: {
      mountElement(vNode, container, flagNode);
      break;
    }
    case vNodeType.TEXT: {
      mountText(vNode, container);
      break;
    }
    default: break;
  }
};

/**
 * 渲染或更新虚拟dom
 * @param {Object} vNode 
 * @param {HTMLElement} container 
 */
const render = (vNode, container) => {
  const isFirstRender = !container.vNode;

  // 首次渲染
  if (isFirstRender) {
    mount(vNode, container);
  } else {
    // 更新操作
    patch(container.vNode, vNode, container);
  }

  // 保存起来, 用来区分是否为首次渲染
  container.vNode = vNode;
};

export default render;