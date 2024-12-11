declare function findDOMElement<T>(element: T, context?: ParentNode): T extends Element ? T : T extends Node | string ? Element | null : null;
export default findDOMElement;
//# sourceMappingURL=findDOMElement.d.ts.map