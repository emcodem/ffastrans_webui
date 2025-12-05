/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./init.ts":
/*!*****************!*\
  !*** ./init.ts ***!
  \*****************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.userPermissions = void 0;
exports.createFileTabbar = createFileTabbar;
exports.createLayout = createLayout;
exports.initializeApp = initializeApp;
const events_1 = __webpack_require__(/*! ../../dependencies/dhtmlx/9.2.4/events */ "../../dependencies/dhtmlx/9.2.4/events.ts");
const types_1 = __webpack_require__(/*! ./types */ "./types.ts");
// Exported global reference for easier access
exports.userPermissions = null;
/**
 * Fetch user permissions from server
 */
async function getUserPermissions() {
    try {
        const response = await fetch("/getuserpermissionsasync?" + Math.random());
        if (!response.ok) {
            throw new Error(`Failed to fetch permissions: ${response.statusText}`);
        }
        const data = await response.json();
        const userPermissions = new types_1.UserPermissions(data);
        console.log("User permissions loaded:", userPermissions);
        return userPermissions;
    }
    catch (error) {
        console.error("Failed to load user permissions:", error);
        throw error;
    }
}
/**
 * Create tabbar with browse and upload tabs based on user permissions
 */
function createFileTabbar(cell) {
    const { show_browse, show_upload } = exports.userPermissions.getUIFeatureVisibility();
    // Create views configuration for dhtmlx Tabbar
    const views = [];
    if (show_browse) {
        views.push({
            tab: "browse"
        });
    }
    if (show_upload) {
        views.push({
            tab: "upload",
            html: "<div id='main_upload_area' style='height:100%'/>"
        });
    }
    if (views.length === 0) {
        views.push({
            tab: "noaccess"
        });
        console.warn("No file operations available based on permissions");
    }
    // Create the tabbar with proper config
    const tabbar = new dhx924.dhx.Tabbar(null, {
        views: views
    });
    tabbar.events.on(events_1.TabbarEvents.change, (id, prev) => {
        console.log(`Tab changed from ${prev} to ${id}`);
        tabbar.getCell(id).attachHTML("<div style='padding:10px'>Content for " + id + " tab</div>");
        // Additional logic for tab change can be added here
    });
    console.log("Tabbar created with views:", views.map(v => v.id));
    return tabbar;
}
/**
 * Create a dhtmlx Layout with proper TypeScript typing
 */
function createLayout(containerId) {
    const config = {
        type: "line",
        rows: [
            {
                id: "header",
                //header: "Header",
                height: "20px",
                html: "",
                resizable: true,
            },
            {
                cols: [
                    {
                        id: "main_left",
                        header: "Left",
                        resizable: true,
                        collapsable: true,
                    },
                    {
                        id: "main_right",
                        header: "Right",
                        html: "<div>Content</div>",
                        resizable: true,
                    },
                ],
            },
        ],
    };
    const layout = new dhx924.dhx.Layout(containerId, config);
    return layout;
}
/**
 * Initialize the layout on page load
 */
function initializeApp() {
    const waitForDhx = () => {
        if (typeof window.dhx924?.dhx === "undefined") {
            setTimeout(waitForDhx, 100);
            return;
        }
        const initializeComponents = async () => {
            // Load user permissions
            const userPerms = await getUserPermissions();
            exports.userPermissions = userPerms;
            window.m_userpermissions = userPerms;
            console.log("User permissions available as window.m_userpermissions or import { userPermissions }");
            // Initialize layout
            const layout = createLayout(document.body);
            console.log("Layout initialized on document.body", layout);
            // Create file tabbar in main_left
            const mainLeftCell = layout.getCell("main_left");
            if (mainLeftCell) {
                let _tabbar = createFileTabbar(mainLeftCell);
                mainLeftCell.attach(_tabbar);
                console.log("File tabbar attached to main_left");
            }
        };
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", initializeComponents);
        }
        else {
            initializeComponents();
        }
    };
    waitForDhx();
}
// Auto-initialize on import
initializeApp();


/***/ }),

/***/ "./types.ts":
/*!******************!*\
  !*** ./types.ts ***!
  \******************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UserPermissions = void 0;
/**
 * Class to manage user permissions
 */
class UserPermissions {
    constructor(permissionsData) {
        this.permissions = new Map();
        this.username = '';
        // Parse the permissions response
        for (let i = 0; i < permissionsData.length; i++) {
            const entry = permissionsData[i];
            if (entry && entry.key) {
                this.permissions.set(entry.key, entry.value);
                // Extract username if present
                if (entry.key === 'username') {
                    this.username = entry.value;
                }
            }
        }
    }
    /**
     * Check if user has a specific permission
     */
    hasPermission(permissionKey) {
        const value = this.permissions.get(permissionKey);
        return value !== undefined && value !== false;
    }
    /**
     * Get all menu permissions
     */
    getMenuPermissions() {
        const menuPerms = new Map();
        this.permissions.forEach((value, key) => {
            if (key.startsWith('GROUPRIGHT_MENU_')) {
                menuPerms.set(key, value);
            }
        });
        return menuPerms;
    }
    /**
     * Check if user can view specific menu
     */
    canViewMenu(menuType) {
        return this.hasPermission(`GROUPRIGHT_MENU_VIEW_${menuType}`);
    }
    /**
     * Get username
     */
    getUsername() {
        return this.username;
    }
    /**
     * Get raw permission value
     */
    getPermissionValue(key) {
        return this.permissions.get(key);
    }
    /**
     * Get all permissions as Map
     */
    getAllPermissions() {
        return new Map(this.permissions);
    }
    /**
     * Get UI feature visibility based on FILTER_JOBSTATUS_BUTTONS permission
     * @returns Object with boolean flags for browse, upload, and preview visibility
     */
    getUIFeatureVisibility() {
        const defaults = {
            show_browse: true,
            show_upload: true,
            show_preview: true
        };
        const filterPermission = this.permissions.get('FILTER_JOBSTATUS_BUTTONS');
        if (!filterPermission || !filterPermission.filter) {
            return defaults;
        }
        try {
            const regex = new RegExp(filterPermission.filter, 'i');
            return {
                show_browse: regex.test('browse'),
                show_upload: regex.test('upload'),
                show_preview: regex.test('preview')
            };
        }
        catch (error) {
            console.error('Invalid filter regex in FILTER_JOBSTATUS_BUTTONS:', error);
            return defaults;
        }
    }
}
exports.UserPermissions = UserPermissions;


/***/ }),

/***/ "../../dependencies/dhtmlx/9.2.4/events.ts":
/*!*************************************************!*\
  !*** ../../dependencies/dhtmlx/9.2.4/events.ts ***!
  \*************************************************/
/***/ ((__unused_webpack_module, exports) => {


/**
 * DHTMLX 9.2.4 Suite - Event Enums
 * This File was created by Copilot asking: can we create a single file that contains all event declarations from the dhtmlx 942 suite?
 * This file re-exports all event enums from the DHTMLX suite for use in TypeScript code.
 * It provides runtime values that match the type definitions, enabling intellisense support
 * while avoiding webpack import resolution issues with .d.ts type-only files.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ProgressBarEvents = exports.UploaderEvents = exports.SelectionEvents = exports.NavigationBarEvents = exports.ChartEvents = exports.TimepickerEvents = exports.WindowEvents = exports.PopupEvents = exports.SidebarEvents = exports.SliderEvents = exports.ColorpickerEvents = exports.CalendarEvents = exports.ComboboxEvents = exports.FormEvents = exports.ListEvents = exports.DataViewEvents = exports.TreeEvents = exports.GridSystemEvents = exports.GridEvents = exports.TabbarEvents = exports.LayoutEvents = void 0;
// Layout Events
exports.LayoutEvents = {
    beforeShow: "beforeShow",
    afterShow: "afterShow",
    beforeHide: "beforeHide",
    afterHide: "afterHide",
    beforeResizeStart: "beforeResizeStart",
    resize: "resize",
    afterResizeEnd: "afterResizeEnd",
    beforeAdd: "beforeAdd",
    afterAdd: "afterAdd",
    beforeRemove: "beforeRemove",
    afterRemove: "afterRemove",
    beforeCollapse: "beforeCollapse",
    afterCollapse: "afterCollapse",
    beforeExpand: "beforeExpand",
    afterExpand: "afterExpand",
};
// Tabbar Events
exports.TabbarEvents = {
    beforeChange: "beforeChange",
    change: "change",
    beforeClose: "beforeClose",
    afterClose: "afterClose",
    close: "close", // deprecated
};
// Grid Events
exports.GridEvents = {
    beforeEdit: "beforeEdit",
    afterEdit: "afterEdit",
    beforeEditEnd: "beforeEditEnd",
    afterEditEnd: "afterEditEnd",
    change: "change",
    click: "click",
    dblclick: "dblclick",
    headerClick: "headerClick",
    headerDblclick: "headerDblclick",
    headerMouseDown: "headerMouseDown",
    beforeRowHide: "beforeRowHide",
    afterRowHide: "afterRowHide",
    beforeRowShow: "beforeRowShow",
    afterRowShow: "afterRowShow",
    beforeColHide: "beforeColHide",
    afterColHide: "afterColHide",
    beforeColShow: "beforeColShow",
    afterColShow: "afterColShow",
    beforeSort: "beforeSort",
    afterSort: "afterSort",
    beforeFilter: "beforeFilter",
    afterFilter: "afterFilter",
    scroll: "scroll",
};
exports.GridSystemEvents = {
    expandStart: "expandStart",
    expandEnd: "expandEnd",
    beforeKeyDown: "beforeKeyDown",
    keyDown: "keyDown",
};
// Tree Events
exports.TreeEvents = {
    beforeExpand: "beforeExpand",
    afterExpand: "afterExpand",
    beforeCollapse: "beforeCollapse",
    afterCollapse: "afterCollapse",
    beforeSelect: "beforeSelect",
    afterSelect: "afterSelect",
    beforeCheck: "beforeCheck",
    afterCheck: "afterCheck",
    beforeDrag: "beforeDrag",
    afterDrag: "afterDrag",
    beforeDrop: "beforeDrop",
    afterDrop: "afterDrop",
    beforeEditStart: "beforeEditStart",
    beforeEditEnd: "beforeEditEnd",
    afterEditEnd: "afterEditEnd",
    beforeContextMenu: "beforeContextMenu",
    click: "click",
    dblclick: "dblclick",
};
// DataView Events
exports.DataViewEvents = {
    beforeSelect: "beforeSelect",
    afterSelect: "afterSelect",
    beforeCheck: "beforeCheck",
    afterCheck: "afterCheck",
    click: "click",
    dblclick: "dblclick",
};
// List Events
exports.ListEvents = {
    beforeSelect: "beforeSelect",
    afterSelect: "afterSelect",
    beforeCheck: "beforeCheck",
    afterCheck: "afterCheck",
    beforeEditStart: "beforeEditStart",
    beforeEditEnd: "beforeEditEnd",
    afterEditEnd: "afterEditEnd",
    click: "click",
    dblclick: "dblclick",
};
// Form Events
exports.FormEvents = {
    change: "change",
    click: "click",
};
// Combobox Events
exports.ComboboxEvents = {
    change: "change",
    beforeBlur: "beforeBlur",
    blur: "blur",
    beforeFocus: "beforeFocus",
    focus: "focus",
    beforeOpen: "beforeOpen",
    open: "open",
    beforeClose: "beforeClose",
    close: "close",
    beforeSelect: "beforeSelect",
    select: "select",
    beforeInput: "beforeInput",
    input: "input",
    beforeFilter: "beforeFilter",
    filter: "filter",
};
// Calendar Events
exports.CalendarEvents = {
    beforeChange: "beforeChange",
    change: "change",
    beforeClose: "beforeClose",
    close: "close",
};
// ColorPicker Events
exports.ColorpickerEvents = {
    beforeChange: "beforeChange",
    change: "change",
    beforeClose: "beforeClose",
    close: "close",
};
// Slider Events
exports.SliderEvents = {
    change: "change",
    beforeChange: "beforeChange",
};
// Sidebar Events
exports.SidebarEvents = {
    toggle: "toggle",
    beforeCollapse: "beforeCollapse",
    afterCollapse: "afterCollapse",
    beforeExpand: "beforeExpand",
    afterExpand: "afterExpand",
};
// Popup Events
exports.PopupEvents = {
    beforeHide: "beforeHide",
    afterHide: "afterHide",
    beforeShow: "beforeShow",
    afterShow: "afterShow",
};
// Window Events
exports.WindowEvents = {
    beforeHide: "beforeHide",
    afterHide: "afterHide",
    beforeShow: "beforeShow",
    afterShow: "afterShow",
    move: "move",
    resize: "resize",
};
// TimePicker Events
exports.TimepickerEvents = {
    beforeChange: "beforeChange",
    change: "change",
    beforeClose: "beforeClose",
    close: "close",
};
// Chart Events
exports.ChartEvents = {
    beforeRender: "beforeRender",
    afterRender: "afterRender",
    beforeMouseMove: "beforeMouseMove",
    mouseMove: "mouseMove",
    beforeTooltipShow: "beforeTooltipShow",
    tooltipShow: "tooltipShow",
    beforeTooltipHide: "beforeTooltipHide",
    tooltipHide: "tooltipHide",
};
// NavigationBar Events
exports.NavigationBarEvents = {
    beforeCollapse: "beforeCollapse",
    afterCollapse: "afterCollapse",
    beforeExpand: "beforeExpand",
    afterExpand: "afterExpand",
};
// Selection Events
exports.SelectionEvents = {
    beforeSelect: "beforeSelect",
    afterSelect: "afterSelect",
};
// Uploader Events
exports.UploaderEvents = {
    uploadFile: "uploadFile",
    uploadProgress: "uploadProgress",
    uploadFail: "uploadFail",
    uploadComplete: "uploadComplete",
    beforeSend: "beforeSend",
};
// ProgressBar Events
exports.ProgressBarEvents = {
    change: "change",
};


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./init.ts");
/******/ 	
/******/ })()
;
//# sourceMappingURL=bundle.js.map