export default VirtualList;
declare class VirtualList extends Component<any, any> {
    constructor(props: any);
    focusElement: Element | null;
    state: {
        offset: number;
        height: number;
    };
    componentDidMount(): void;
    componentWillUpdate(): void;
    componentDidUpdate(): void;
    componentWillUnmount(): void;
    handleScroll: () => void;
    handleResize: () => void;
    resize(): void;
    render({ data, rowHeight, renderRow, overscanCount, ...props }: {
        [x: string]: any;
        data: any;
        rowHeight: any;
        renderRow: any;
        overscanCount?: number | undefined;
    }): h.JSX.Element;
}
import { Component } from 'preact';
import { h } from 'preact';
//# sourceMappingURL=VirtualList.d.ts.map