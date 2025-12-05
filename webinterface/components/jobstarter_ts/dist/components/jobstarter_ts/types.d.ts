/**
 * Represents a single permission or user property
 */
export interface IPermissionEntry {
    key: string;
    value: string | boolean | object;
}
/**
 * User permissions response from server
 * Array-like object with indexed entries and optional length property
 */
export interface IUserPermissionsResponse {
    [index: number]: IPermissionEntry;
    length: number;
}
/**
 * Class to manage user permissions
 */
export declare class UserPermissions {
    private permissions;
    private username;
    constructor(permissionsData: IUserPermissionsResponse);
    /**
     * Check if user has a specific permission
     */
    hasPermission(permissionKey: string): boolean;
    /**
     * Get all menu permissions
     */
    getMenuPermissions(): Map<string, any>;
    /**
     * Check if user can view specific menu
     */
    canViewMenu(menuType: 'JOB_STATUS' | 'SUBMIT_JOBS' | 'REVIEW_QUEUE' | 'SCHEDULER' | 'ADMIN' | 'FARM_ADMIN'): boolean;
    /**
     * Get username
     */
    getUsername(): string;
    /**
     * Get raw permission value
     */
    getPermissionValue(key: string): any;
    /**
     * Get all permissions as Map
     */
    getAllPermissions(): Map<string, any>;
    /**
     * Get UI feature visibility based on FILTER_JOBSTATUS_BUTTONS permission
     * @returns Object with boolean flags for browse, upload, and preview visibility
     */
    getUIFeatureVisibility(): {
        show_browse: boolean;
        show_upload: boolean;
        show_preview: boolean;
    };
}
//# sourceMappingURL=types.d.ts.map