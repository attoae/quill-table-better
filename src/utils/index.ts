interface Properties {
  [propertyName: string]: string
}

export function getEventComposedPath(e: any) {
  const path = e.path || (e.composedPath && e.composedPath()) || [];
  if (path.length) return path;
  let target = e.target;
  path.push(target);

  while (target && target.parentNode) {
    target = target.parentNode;
    path.push(target);
  }
  return path;
}

export function getBounds(target: Element, container: Element) {
  const targetBounds = target.getBoundingClientRect();
  const containerBounds = container.getBoundingClientRect();
  const left = targetBounds.left - containerBounds.left;
  const top = targetBounds.top - containerBounds.top;
  const width = targetBounds.width;
  const height = targetBounds.height;
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height
  }
}

export function setElementProperty(node: HTMLElement, properties: Properties) {
  const style = node.style;
  if (!style) {
    node.setAttribute('style', properties.toString());
    return;
  }
  for (const propertyName in properties) {
    style.setProperty(propertyName, properties[propertyName]);
  }
}