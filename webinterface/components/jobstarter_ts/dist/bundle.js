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
    if (!exports.userPermissions) {
        console.warn("User permissions not loaded yet, cannot create tabbar");
        return null;
    }
    const { show_browse, show_upload } = exports.userPermissions.getUIFeatureVisibility();
    // Create tabs configuration
    const tabs = [];
    if (show_browse) {
        tabs.push({
            id: "tab_browse",
            text: "Browse",
            active: true,
            icon: "mdi mdi-folder-open"
        });
    }
    if (show_upload) {
        tabs.push({
            id: "tab_upload",
            text: "Upload",
            active: !show_browse,
            icon: "mdi mdi-cloud-upload"
        });
    }
    if (tabs.length === 0) {
        tabs.push({
            id: "tab_empty",
            text: "No Access",
            active: true
        });
        console.warn("No file operations available based on permissions");
    }
    // Create the tabbar
    const tabbar = new dhx924.dhx.Tabbar({
        tabs: tabs,
        mode: "top"
    });
    // Attach to cell using dhtmlx attach method
    cell.attach(tabbar);
    console.log("Tabbar created with tabs:", tabs.map(t => t.id));
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
                height: "80px",
                html: "<h1>Welcomeaaa</h1>",
                resizable: true,
            },
            {
                cols: [
                    {
                        id: "main_left",
                        header: "Left",
                        html: "<div>Navigation</div>",
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
            const layout = createLayout(document.body);
            console.log("Layout initialized on document.body", layout);
            // Load user permissions
            const userPerms = await getUserPermissions();
            exports.userPermissions = userPerms;
            window.m_userpermissions = userPerms;
            console.log("User permissions available as window.m_userpermissions or import { userPermissions }");
            // Create file tabbar in main_left
            const mainLeftCell = layout.getCell("main_left");
            if (mainLeftCell) {
                createFileTabbar(mainLeftCell);
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