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
export class UserPermissions {
    private permissions: Map<string, any>;
    private username: string;

    constructor(permissionsData: IUserPermissionsResponse) {
        this.permissions = new Map();
        this.username = '';

        // Parse the permissions response
        for (let i = 0; i < permissionsData.length; i++) {
            const entry = permissionsData[i];
            if (entry && entry.key) {
                this.permissions.set(entry.key, entry.value);
                
                // Extract username if present
                if (entry.key === 'username') {
                    this.username = entry.value as string;
                }
            }
        }
    }

    /**
     * Check if user has a specific permission
     */
    hasPermission(permissionKey: string): boolean {
        const value = this.permissions.get(permissionKey);
        return value !== undefined && value !== false;
    }

    /**
     * Get all menu permissions
     */
    getMenuPermissions(): Map<string, any> {
        const menuPerms = new Map<string, any>();
        
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
    canViewMenu(menuType: 'JOB_STATUS' | 'SUBMIT_JOBS' | 'REVIEW_QUEUE' | 'SCHEDULER' | 'ADMIN' | 'FARM_ADMIN'): boolean {
        return this.hasPermission(`GROUPRIGHT_MENU_VIEW_${menuType}`);
    }

    /**
     * Get username
     */
    getUsername(): string {
        return this.username;
    }

    /**
     * Get raw permission value
     */
    getPermissionValue(key: string): any {
        return this.permissions.get(key);
    }

    /**
     * Get all permissions as Map
     */
    getAllPermissions(): Map<string, any> {
        return new Map(this.permissions);
    }

    /**
     * Get UI feature visibility based on FILTER_JOBSTATUS_BUTTONS permission
     * @returns Object with boolean flags for browse, upload, and preview visibility
     */
    getUIFeatureVisibility(): { show_browse: boolean; show_upload: boolean; show_preview: boolean } {
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
        } catch (error) {
            console.error('Invalid filter regex in FILTER_JOBSTATUS_BUTTONS:', error);
            return defaults;
        }
    }
}
