/**
 * UppyManager - Manages Uppy file upload initialization and event handling
 */
import "@uppy/core/dist/style.css";
import "@uppy/dashboard/dist/style.css";
export interface UppyConfig {
    targetDivId: string;
    chunkSize?: number;
    parallelUploads?: number;
    theme?: string;
    debug?: boolean;
    endpoint?: string;
}
export declare const DEFAULT_UPPY_CONFIG: Partial<UppyConfig>;
export interface UploadedFile {
    id: string;
    filename: string;
    path: string;
    size: number;
    lastModified: number;
}
export interface UploadProgress {
    fileId: string;
    bytesUploaded: number;
    bytesTotal: number;
}
/**
 * UppyManager class for handling file uploads
 */
export declare class UppyManager {
    private uppy;
    private config;
    private underConstruction;
    private uploadedFiles;
    private onFileUploadedCallback?;
    private onUploadCompleteCallback?;
    constructor(config: UppyConfig);
    /**
     * Initialize Uppy with Dashboard and Tus plugins
     */
    private initializeUppy;
    /**
     * Attach event handlers to Uppy instance
     */
    private attachEventHandlers;
    /**
     * Parse uploaded file information from Uppy response
     */
    private parseUploadedFile;
    /**
     * Set callback for individual file uploads
     */
    onFileUploaded(callback: (file: UploadedFile) => void): void;
    /**
     * Set callback for all uploads complete
     */
    onUploadComplete(callback: (successful: any[], failed: any[]) => void): void;
    /**
     * Get all uploaded files
     */
    getUploadedFiles(): UploadedFile[];
    /**
     * Clear all uploaded files tracking
     */
    clearUploadedFiles(): void;
    /**
     * Get Uppy instance for advanced usage
     */
    getInstance(): any;
    /**
     * Destroy Uppy instance and clean up
     */
    destroy(): void;
    /**
     * Sleep utility function
     */
    private sleep;
}
//# sourceMappingURL=uppy-manager.d.ts.map