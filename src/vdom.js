import { vNodeType, vChildType } from './strings';

/**
 * 创建文本元素.
 * @param {String} text 
 */
const createTextVNode = text => {
  return {
    // 虚拟dom的类型. TEXT, HTML. COMPONENT等.
    nodeType: vNodeType.TEXT,

    // 节点标签: div, p等
    tag: null,

    // 虚拟dom节点的属性: {style: {color: 'red'}, key: 'xxx'}
    props: null,

    // 虚拟dom渲染后的真实的dom节点.
    el: null,

    children: text,
    childType: vChildType.EMPTY
  };
}

/**
 * 创建虚拟dom.
 * @param {String} tag 标签名称. div, function, null等
 * @param {Object} props 虚拟元素的属性对象. 
 * @param {Array} children 虚拟元素的子元素.
 */
const createElement = (tag, props, children) => {
  let nodeType;
  let childType;

  // 根据传入的tag, 设置虚拟元素的类型.
  switch (typeof tag) {
    case 'string': {
      nodeType = vNodeType.HTML;
      break;
    }
    case 'function': {
      nodeType = vNodeType.COMPONENT;
      break;
    }
    default: {
      nodeType = vNodeType.TEXT;
      break;
    }
  }

  // 根据传入的children, 设置子元素的标志, 方便后期使用.
  if (!children) {
    childType = vChildType.EMPTY;
  } else if (Array.isArray(children)) {
    if (!children.length) {
      childType = vChildType.EMPTY;
    } else {
      childType = children.length > 1 ? vChildType.MULTI : vChildType.SINGLE;
    }
  } else {
    // 文本
    childType = vChildType.SINGLE;
    children = createTextVNode(children);
  }

  return {
    // 虚拟dom渲染后的真实的dom节点.
    el: null,

    // 虚拟dom的类型. TEXT, HTML. COMPONENT等.
    nodeType,

    // 节点标签: div, p等
    tag,

    // 虚拟dom节点的属性: {style: {color: 'red'}, key: 'xxx'}
    props,

    // 虚拟dom的子节点
    children,

    // 虚拟dom子节点的类型: empty, single, multipy。
    // 不同的类型，在挂载和更新时, 会有不同的处理逻辑.
    childType
  };
}

export default createElement;