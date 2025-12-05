import type { ICell } from "../../dependencies/dhtmlx/9.2.4/types/ts-layout/sources/types";
import type { Layout } from "../../dependencies/dhtmlx/9.2.4/types/ts-layout/sources/Layout";
import type { Tabbar } from "../../dependencies/dhtmlx/9.2.4/types/ts-tabbar/sources/Tabbar";
import { UserPermissions } from "./types";
declare global {
    interface Window {
        m_userpermissions: UserPermissions;
    }
}
export declare let userPermissions: UserPermissions | null;
/**
 * Create tabbar with browse and upload tabs based on user permissions
 */
export declare function createFileTabbar(cell: ICell): Tabbar;
/**
 * Create a dhtmlx Layout with proper TypeScript typing
 */
export declare function createLayout(containerId: string | HTMLElement): Layout;
/**
 * Initialize the layout on page load
 */
export declare function initializeApp(): void;
//# sourceMappingURL=init.d.ts.map