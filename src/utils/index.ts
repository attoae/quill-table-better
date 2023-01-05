interface Properties {
  [propertyName: string]: string
}
/**
 * getEventComposedPath
 * @param {Event} e
 * @return {Array} event.path
 */
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

export function setElementProperty(node: HTMLElement, properties: Properties) {
  const style = node.style;
  for (const propertyName in properties) {
    style.setProperty(propertyName, properties[propertyName]);
  }
}