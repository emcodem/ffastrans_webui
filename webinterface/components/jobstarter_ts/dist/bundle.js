/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

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
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;
/*!*****************!*\
  !*** ./init.ts ***!
  \*****************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.userPermissions = void 0;
exports.createLayout = createLayout;
exports.initializeApp = initializeApp;
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
// /**
//  * Create tabbar with browse and upload tabs based on user permissions
//  */
// export function createFileTabbar(cell: ICell): Tabbar {
//     const { show_browse, show_upload } = userPermissions.getUIFeatureVisibility();
//     // Create views configuration for dhtmlx Tabbar
//     const views: ITabConfig[] = [];
//     if (show_browse) {
//         views.push({
//             tab: "browse"
//         });
//     }
//     if (show_upload) {
//         views.push({
//             tab: "upload",
//             html: "<div id='main_upload_area' style='height:100%'/>"
//         });
//     }
//     if (views.length === 0) {
//         views.push({
//             tab: "noaccess"
//         });
//         console.warn("No file operations available based on permissions");
//     }
//     // Create the tabbar with proper config
//     const tabbar = new dhx924.dhx.Tabbar(null, {
//         views: views
//     });
//     tabbar.events.on(TabbarEvents.change, (id: string, prev: string) => {
//         console.log(`Tab changed from ${prev} to ${id}`);
//         (tabbar.getCell(id) as ICell).attachHTML("<div style='padding:10px'>Content for " + id + " tab</div>");
//         // Additional logic for tab change can be added here
//     });
//     console.log("Tabbar created with views:", views.map(v => v.id));
//     return tabbar;
// }
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
                // let _tabbar : ICell = createFileTabbar(mainLeftCell);
                // mainLeftCell.attach(_tabbar);
                // console.log("File tabbar attached to main_left");
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

})();

/******/ })()
;
//# sourceMappingURL=bundle.js.map