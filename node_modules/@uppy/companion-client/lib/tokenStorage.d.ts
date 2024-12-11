/**
 * This module serves as an Async wrapper for LocalStorage
 * Why? Because the Provider API `storage` option allows an async storage
 */
export declare function setItem(key: string, value: string): Promise<void>;
export declare function getItem(key: string): Promise<string | null>;
export declare function removeItem(key: string): Promise<void>;
//# sourceMappingURL=tokenStorage.d.ts.map