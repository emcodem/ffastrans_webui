import type { ILayoutConfig, ICellConfig } from "../../dependencies/dhtmlx/9.2.4/types/ts-layout/sources/types";
import type { Layout } from "../../dependencies/dhtmlx/9.2.4/types/ts-layout/sources/Layout";
import { UserPermissions, type IUserPermissionsResponse } from "./types";

// Declare dhx as global to access the loaded library
declare const dhx924: {
    dhx: {
        Layout: typeof Layout;
        [key: string]: any;
    };
    [key: string]: any;
};

/**
 * Fetch user permissions from server
 */
async function getUserPermissions(): Promise<UserPermissions> {
    try {
        const response = await fetch("/getuserpermissionsasync?" + Math.random());
        
        if (!response.ok) {
            throw new Error(`Failed to fetch permissions: ${response.statusText}`);
        }
        
        const data: IUserPermissionsResponse = await response.json();
        const userPermissions = new UserPermissions(data);
        
        console.log("User permissions loaded:", userPermissions);
        return userPermissions;
    } catch (error) {
        console.error("Failed to load user permissions:", error);
        throw error;
    }
}

/**
 * Create a dhtmlx Layout with proper TypeScript typing
 */
export function createLayout(containerId: string | HTMLElement): Layout {
    const config: ILayoutConfig = {
        type: "line",
        rows: [
            {
                id: "header",
                header: "Header",
                height: "80px",
                html: "<h1>Welcomeaaa</h1>",
                resizable: true,
                
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
                        resizable: true,
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
            document.addEventListener("DOMContentLoaded", async () => {
                const layout = createLayout(document.body);
                console.log("Layout initialized on document.body", layout);
                
                // Load user permissions
                const userPermissions = await getUserPermissions();
                (window as any).m_userpermissions = userPermissions;
            });
        } else {
            (async () => {
                const layout = createLayout(document.body);
                console.log("Layout initialized on document.body", layout);
                
                // Load user permissions
                const userPermissions = await getUserPermissions();
                (window as any).m_userpermissions = userPermissions;
            })();
        }
    };
    
    waitForDhx();
}

// Auto-initialize on import
initializeApp();

