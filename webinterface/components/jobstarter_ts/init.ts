import { UppyManager }      from "./uppy-manager";
import type { ILayoutConfig, ICellConfig, ICell } from "../../dependencies/dhtmlx/9.2.4/types/ts-layout/sources/types";
import type { Layout }      from "../../dependencies/dhtmlx/9.2.4/types/ts-layout/sources/Layout";
import type { Tabbar }      from "../../dependencies/dhtmlx/9.2.4/types/ts-tabbar/sources/Tabbar";
import { TabbarEvents }     from "../../dependencies/dhtmlx/9.2.4/events";
import type { ITabConfig }  from "../../dependencies/dhtmlx/9.2.4/types/ts-tabbar/sources/types";
import type { Grid }        from "../../dependencies/dhtmlx/9.2.4/types/ts-grid/sources/Grid";
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
export function createFileTabbar(cell: ICell): Tabbar {

    const { show_browse, show_upload } = userPermissions.getUIFeatureVisibility();
    
    // Create views configuration for dhtmlx Tabbar
    const views: ITabConfig[] = [];
    
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

    tabbar.events.on(TabbarEvents.change, (id: string, prev: string) => {
        console.log(`Tab changed from ${prev} to ${id}`);
        (tabbar.getCell(id) as ICell).attachHTML("<div style='padding:10px'>Content for " + id + " tab</div>");
        
        // Additional logic for tab change can be added here
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
                height: "20px",
                html: "",
                resizable: true,
                
            } as ICellConfig,
            {
                cols: [
                    {
                        id: "main_left",
                        header: "Left",
                        
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

            
            // Load user permissions
            const userPerms = await getUserPermissions();
            userPermissions = userPerms;
            window.m_userpermissions = userPerms;
            console.log("User permissions available as window.m_userpermissions or import { userPermissions }");

            // Initialize layout
            const layout: Layout = createLayout(document.body);
            console.log("Layout initialized on document.body", layout);

            // Create file tabbar in main_left
            const mainLeftCell : ICell = layout.getCell("main_left") as ICell;
            if (mainLeftCell) {
                let _tabbar : ICell = createFileTabbar(mainLeftCell);
                mainLeftCell.attach(_tabbar);
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

