"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
    const layout = new dhx.Layout(containerId, config);
    return layout;
}
/**
 * Initialize the layout on page load
 */
function initializeApp() {
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
}
// Auto-initialize on import
initializeApp();
//# sourceMappingURL=init.js.map