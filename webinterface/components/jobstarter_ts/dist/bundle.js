/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it uses a non-standard name for the exports (exports).
(() => {
var exports = __webpack_exports__;
/*!*****************!*\
  !*** ./init.ts ***!
  \*****************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createLayout = createLayout;
exports.initializeApp = initializeApp;
/**
 * Create a dhtmlx Layout with proper TypeScript typing
 */
function createLayout(containerId) {
    const config = {
        rows: [
            {
                id: "header",
                header: "Header",
                height: "80px",
                html: "<h1>Welcome</h1>",
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
            document.addEventListener("DOMContentLoaded", () => {
                const layout = createLayout(document.body);
                console.log("Layout initialized on document.body", layout);
            });
        }
        else {
            const layout = createLayout(document.body);
            console.log("Layout initialized on document.body", layout);
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