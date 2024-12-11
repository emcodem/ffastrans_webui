declare function findAllDOMElements<T>(element: T, context?: ParentNode): T extends Element ? [T] : T extends Node | string ? Element[] | null : null;
export default findAllDOMElements;
//# sourceMappingURL=findAllDOMElements.d.ts.map