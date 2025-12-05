/**
 * DHTMLX 9.2.4 Suite - Event Enums
 * This File was created by Copilot asking: can we create a single file that contains all event declarations from the dhtmlx 942 suite?
 * This file re-exports all event enums from the DHTMLX suite for use in TypeScript code.
 * It provides runtime values that match the type definitions, enabling intellisense support
 * while avoiding webpack import resolution issues with .d.ts type-only files.
 */
export declare const LayoutEvents: {
    readonly beforeShow: "beforeShow";
    readonly afterShow: "afterShow";
    readonly beforeHide: "beforeHide";
    readonly afterHide: "afterHide";
    readonly beforeResizeStart: "beforeResizeStart";
    readonly resize: "resize";
    readonly afterResizeEnd: "afterResizeEnd";
    readonly beforeAdd: "beforeAdd";
    readonly afterAdd: "afterAdd";
    readonly beforeRemove: "beforeRemove";
    readonly afterRemove: "afterRemove";
    readonly beforeCollapse: "beforeCollapse";
    readonly afterCollapse: "afterCollapse";
    readonly beforeExpand: "beforeExpand";
    readonly afterExpand: "afterExpand";
};
export declare const TabbarEvents: {
    readonly beforeChange: "beforeChange";
    readonly change: "change";
    readonly beforeClose: "beforeClose";
    readonly afterClose: "afterClose";
    readonly close: "close";
};
export declare const GridEvents: {
    readonly beforeEdit: "beforeEdit";
    readonly afterEdit: "afterEdit";
    readonly beforeEditEnd: "beforeEditEnd";
    readonly afterEditEnd: "afterEditEnd";
    readonly change: "change";
    readonly click: "click";
    readonly dblclick: "dblclick";
    readonly headerClick: "headerClick";
    readonly headerDblclick: "headerDblclick";
    readonly headerMouseDown: "headerMouseDown";
    readonly beforeRowHide: "beforeRowHide";
    readonly afterRowHide: "afterRowHide";
    readonly beforeRowShow: "beforeRowShow";
    readonly afterRowShow: "afterRowShow";
    readonly beforeColHide: "beforeColHide";
    readonly afterColHide: "afterColHide";
    readonly beforeColShow: "beforeColShow";
    readonly afterColShow: "afterColShow";
    readonly beforeSort: "beforeSort";
    readonly afterSort: "afterSort";
    readonly beforeFilter: "beforeFilter";
    readonly afterFilter: "afterFilter";
    readonly scroll: "scroll";
};
export declare const GridSystemEvents: {
    readonly expandStart: "expandStart";
    readonly expandEnd: "expandEnd";
    readonly beforeKeyDown: "beforeKeyDown";
    readonly keyDown: "keyDown";
};
export declare const TreeEvents: {
    readonly beforeExpand: "beforeExpand";
    readonly afterExpand: "afterExpand";
    readonly beforeCollapse: "beforeCollapse";
    readonly afterCollapse: "afterCollapse";
    readonly beforeSelect: "beforeSelect";
    readonly afterSelect: "afterSelect";
    readonly beforeCheck: "beforeCheck";
    readonly afterCheck: "afterCheck";
    readonly beforeDrag: "beforeDrag";
    readonly afterDrag: "afterDrag";
    readonly beforeDrop: "beforeDrop";
    readonly afterDrop: "afterDrop";
    readonly beforeEditStart: "beforeEditStart";
    readonly beforeEditEnd: "beforeEditEnd";
    readonly afterEditEnd: "afterEditEnd";
    readonly beforeContextMenu: "beforeContextMenu";
    readonly click: "click";
    readonly dblclick: "dblclick";
};
export declare const DataViewEvents: {
    readonly beforeSelect: "beforeSelect";
    readonly afterSelect: "afterSelect";
    readonly beforeCheck: "beforeCheck";
    readonly afterCheck: "afterCheck";
    readonly click: "click";
    readonly dblclick: "dblclick";
};
export declare const ListEvents: {
    readonly beforeSelect: "beforeSelect";
    readonly afterSelect: "afterSelect";
    readonly beforeCheck: "beforeCheck";
    readonly afterCheck: "afterCheck";
    readonly beforeEditStart: "beforeEditStart";
    readonly beforeEditEnd: "beforeEditEnd";
    readonly afterEditEnd: "afterEditEnd";
    readonly click: "click";
    readonly dblclick: "dblclick";
};
export declare const FormEvents: {
    readonly change: "change";
    readonly click: "click";
};
export declare const ComboboxEvents: {
    readonly change: "change";
    readonly beforeBlur: "beforeBlur";
    readonly blur: "blur";
    readonly beforeFocus: "beforeFocus";
    readonly focus: "focus";
    readonly beforeOpen: "beforeOpen";
    readonly open: "open";
    readonly beforeClose: "beforeClose";
    readonly close: "close";
    readonly beforeSelect: "beforeSelect";
    readonly select: "select";
    readonly beforeInput: "beforeInput";
    readonly input: "input";
    readonly beforeFilter: "beforeFilter";
    readonly filter: "filter";
};
export declare const CalendarEvents: {
    readonly beforeChange: "beforeChange";
    readonly change: "change";
    readonly beforeClose: "beforeClose";
    readonly close: "close";
};
export declare const ColorpickerEvents: {
    readonly beforeChange: "beforeChange";
    readonly change: "change";
    readonly beforeClose: "beforeClose";
    readonly close: "close";
};
export declare const SliderEvents: {
    readonly change: "change";
    readonly beforeChange: "beforeChange";
};
export declare const SidebarEvents: {
    readonly toggle: "toggle";
    readonly beforeCollapse: "beforeCollapse";
    readonly afterCollapse: "afterCollapse";
    readonly beforeExpand: "beforeExpand";
    readonly afterExpand: "afterExpand";
};
export declare const PopupEvents: {
    readonly beforeHide: "beforeHide";
    readonly afterHide: "afterHide";
    readonly beforeShow: "beforeShow";
    readonly afterShow: "afterShow";
};
export declare const WindowEvents: {
    readonly beforeHide: "beforeHide";
    readonly afterHide: "afterHide";
    readonly beforeShow: "beforeShow";
    readonly afterShow: "afterShow";
    readonly move: "move";
    readonly resize: "resize";
};
export declare const TimepickerEvents: {
    readonly beforeChange: "beforeChange";
    readonly change: "change";
    readonly beforeClose: "beforeClose";
    readonly close: "close";
};
export declare const ChartEvents: {
    readonly beforeRender: "beforeRender";
    readonly afterRender: "afterRender";
    readonly beforeMouseMove: "beforeMouseMove";
    readonly mouseMove: "mouseMove";
    readonly beforeTooltipShow: "beforeTooltipShow";
    readonly tooltipShow: "tooltipShow";
    readonly beforeTooltipHide: "beforeTooltipHide";
    readonly tooltipHide: "tooltipHide";
};
export declare const NavigationBarEvents: {
    readonly beforeCollapse: "beforeCollapse";
    readonly afterCollapse: "afterCollapse";
    readonly beforeExpand: "beforeExpand";
    readonly afterExpand: "afterExpand";
};
export declare const SelectionEvents: {
    readonly beforeSelect: "beforeSelect";
    readonly afterSelect: "afterSelect";
};
export declare const UploaderEvents: {
    readonly uploadFile: "uploadFile";
    readonly uploadProgress: "uploadProgress";
    readonly uploadFail: "uploadFail";
    readonly uploadComplete: "uploadComplete";
    readonly beforeSend: "beforeSend";
};
export declare const ProgressBarEvents: {
    readonly change: "change";
};
export type LayoutEventName = typeof LayoutEvents[keyof typeof LayoutEvents];
export type TabbarEventName = typeof TabbarEvents[keyof typeof TabbarEvents];
export type GridEventName = typeof GridEvents[keyof typeof GridEvents];
export type GridSystemEventName = typeof GridSystemEvents[keyof typeof GridSystemEvents];
export type TreeEventName = typeof TreeEvents[keyof typeof TreeEvents];
export type DataViewEventName = typeof DataViewEvents[keyof typeof DataViewEvents];
export type ListEventName = typeof ListEvents[keyof typeof ListEvents];
export type FormEventName = typeof FormEvents[keyof typeof FormEvents];
export type ComboboxEventName = typeof ComboboxEvents[keyof typeof ComboboxEvents];
export type CalendarEventName = typeof CalendarEvents[keyof typeof CalendarEvents];
export type ColorpickerEventName = typeof ColorpickerEvents[keyof typeof ColorpickerEvents];
export type SliderEventName = typeof SliderEvents[keyof typeof SliderEvents];
export type SidebarEventName = typeof SidebarEvents[keyof typeof SidebarEvents];
export type PopupEventName = typeof PopupEvents[keyof typeof PopupEvents];
export type WindowEventName = typeof WindowEvents[keyof typeof WindowEvents];
export type TimepickerEventName = typeof TimepickerEvents[keyof typeof TimepickerEvents];
export type ChartEventName = typeof ChartEvents[keyof typeof ChartEvents];
export type NavigationBarEventName = typeof NavigationBarEvents[keyof typeof NavigationBarEvents];
export type SelectionEventName = typeof SelectionEvents[keyof typeof SelectionEvents];
export type UploaderEventName = typeof UploaderEvents[keyof typeof UploaderEvents];
export type ProgressBarEventName = typeof ProgressBarEvents[keyof typeof ProgressBarEvents];
//# sourceMappingURL=events.d.ts.map