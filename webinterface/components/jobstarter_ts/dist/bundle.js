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
exports.createLayout = createLayout;
exports.initializeApp = initializeApp;
const types_1 = __webpack_require__(/*! ./types */ "./types.ts");
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
 * Create a dhtmlx Layout with proper TypeScript typing
 */
function createLayout(containerId) {
    const config = {
        type: "line",
        rows: [
            {
                id: "header",
                header: "Header",
                height: "80px",
                html: "<h1>Welcomeaaa</h1>",
                resizable: true,
            },
            {
                cols: [
                    {
                        id: "sidebar",
                        header: "Sidebar",
                        width: "250px",
                        html: "<div>Navigation</div>",
                        resizable: true,
                    },
                    {
                        id: "main",
                        header: "Main",
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
            // dhx not ready yet, wait a bit and try again
            setTimeout(waitForDhx, 100);
            return;
        }
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", async () => {
                const layout = createLayout(document.body);
                console.log("Layout initialized on document.body", layout);
                // Load user permissions
                const userPermissions = await getUserPermissions();
                window.m_userpermissions = userPermissions;
            });
        }
        else {
            (async () => {
                const layout = createLayout(document.body);
                console.log("Layout initialized on document.body", layout);
                // Load user permissions
                const userPermissions = await getUserPermissions();
                window.m_userpermissions = userPermissions;
            })();
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