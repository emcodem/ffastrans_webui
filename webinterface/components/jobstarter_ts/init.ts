import type { ILayoutConfig, ICellConfig } from "../../dependencies/dhtmlx/9.2.4/types/ts-layout/sources/types";
import type { Layout } from "../../dependencies/dhtmlx/9.2.4/types/ts-layout/sources/Layout";

// Declare dhx as global to access the loaded library
declare const dhx924: {
    dhx: {
        Layout: typeof Layout;
        [key: string]: any; //allows access other classes of dhx without having to declare them here TODO: do we really want this?
    };
    [key: string]: any;
};

/**
 * Create a dhtmlx Layout with proper TypeScript typing
 */
export function createLayout(containerId: string | HTMLElement): Layout {
    const config: ILayoutConfig = {
        rows: [
            {

                id: "header",
                header: "Header",
                height: "80px",
                html: "<h1>Welcome</h1>",

            } as ICellConfig,
            {
                cols: [
                    {
                        id: "sidebar",
                        header: "Sidebar",
                        width: "250px",
                        html: "<div>Navigation</div>",
                        resizable: true,
                    } as ICellConfig,
                    {
                        id: "main",
                        header: "Main",
                        html: "<div>Content</div>",
                    } as ICellConfig,
                ],
            } as ILayoutConfig,
        ],
    };

    const layout = new dhx924.dhx.Layout(containerId, config);
    return layout;
}

/**
 * Initialize the layout on page load
 */
export function initializeApp(): void {
    const waitForDhx = () => {
        if (typeof (window as any).dhx924?.dhx === "undefined") {
            // dhx not ready yet, wait a bit and try again
            setTimeout(waitForDhx, 100);
            return;
        }
        
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => {
                const layout = createLayout(document.body);
                console.log("Layout initialized on document.body", layout);
            });
        } else {
            const layout = createLayout(document.body);
            console.log("Layout initialized on document.body", layout);
        }
    };
    
    waitForDhx();
}

// Auto-initialize on import
initializeApp();

