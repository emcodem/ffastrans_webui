import type { ILayoutConfig, ICellConfig } from "../../dependencies/dhtmlx/9.2.4/types/ts-layout/sources/types";
import type { Layout } from "../../dependencies/dhtmlx/9.2.4/types/ts-layout/sources/Layout";
import type { Tabbar } from "../../dependencies/dhtmlx/9.2.4/types/ts-tabbar/sources/Tabbar";
import type { Grid } from "../../dependencies/dhtmlx/9.2.4/types/ts-grid/sources/Grid";
import { UserPermissions, type IUserPermissionsResponse } from "./types";

// Declare dhx as global to access the loaded library
declare const dhx924: {
    dhx: {
        Layout: typeof Layout;
        Tabbar: typeof Tabbar;
        Grid:   typeof Grid;
        [key: string]: any;
    };
    [key: string]: any;
};

// Extend window interface to include our global variables
declare global {
    interface Window {
        m_userpermissions: UserPermissions;
    }
}

// Exported global reference for easier access
export let userPermissions: UserPermissions | null = null;

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
 * Create tabbar with browse and upload tabs based on user permissions
 */
export function createFileTabbar(cell: any): Tabbar | null {
    if (!userPermissions) {
        console.warn("User permissions not loaded yet, cannot create tabbar");
        return null;
    }

    const { show_browse, show_upload } = userPermissions.getUIFeatureVisibility();
    
    // Create views configuration for dhtmlx Tabbar
    const views: any[] = [];
    
    if (show_browse) {
        views.push({
            id: "browse",
            header: "Browse"
        });
    }
    
    if (show_upload) {
        views.push({
            id: "upload",
            header: "Upload"
        });
    }
    
    if (views.length === 0) {
        views.push({
            id: "noaccess",
            header: "No Access"
        });
        console.warn("No file operations available based on permissions");
    }
    
    // Create the tabbar with proper config
    const tabbar = new dhx924.dhx.Tabbar(cell.node, {
        views: views
    });
    
    console.log("Tabbar created with views:", views.map(v => v.id));
    return tabbar;
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
                //header: "Header",
                height: "80px",
                html: "<h1>Welcomeaaa</h1>",
                resizable: true,
                
            } as ICellConfig,
            {
                cols: [
                    {
                        id: "main_left",
                        header: "Left",
                        html: "<div>Navigation</div>",
                        resizable: true,
                        collapsable: true,
                    } as ICellConfig,
                    {
                        id: "main_right",
                        header: "Right",
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
            setTimeout(waitForDhx, 100);
            return;
        }
        
        const initializeComponents = async () => {
            const layout = createLayout(document.body);
            console.log("Layout initialized on document.body", layout);
            
            // Load user permissions
            const userPerms = await getUserPermissions();
            userPermissions = userPerms;
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
        } else {
            initializeComponents();
        }
    };
    
    waitForDhx();
}

// Auto-initialize on import
initializeApp();

