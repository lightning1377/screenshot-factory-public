import type { VNode } from 'preact';

type VNodeLike = VNode<any> | VNodeLike[] | string | number | boolean | null | undefined;

function isVNode(value: VNodeLike): value is VNode<any> {
  return !Array.isArray(value) && typeof value === 'object' && value !== null && 'props' in value;
}

function normalizeNodes(input: VNodeLike): VNodeLike[] {
  if (Array.isArray(input)) {
    return input.flatMap((item) => normalizeNodes(item));
  }
  return [input];
}

function childrenOf(node: VNode<any>): VNodeLike[] {
  const children = node.props?.children as VNodeLike | VNodeLike[] | undefined;
  if (children === undefined) return [];
  return normalizeNodes(children);
}

export function findNode(
  root: VNodeLike,
  predicate: (node: VNode<any>) => boolean,
): VNode<any> | null {
  if (Array.isArray(root)) {
    for (const item of root) {
      const found = findNode(item, predicate);
      if (found) return found;
    }
    return null;
  }

  if (!isVNode(root)) return null;
  if (predicate(root)) return root;

  for (const child of childrenOf(root)) {
    const found = findNode(child, predicate);
    if (found) return found;
  }

  return null;
}

export function collectNodes(
  root: VNodeLike,
  predicate: (node: VNode<any>) => boolean,
): VNode<any>[] {
  if (Array.isArray(root)) {
    return root.flatMap((item) => collectNodes(item, predicate));
  }

  if (!isVNode(root)) return [];

  const result: VNode<unknown>[] = [];
  if (predicate(root)) {
    result.push(root);
  }

  for (const child of childrenOf(root)) {
    result.push(...collectNodes(child, predicate));
  }

  return result;
}
