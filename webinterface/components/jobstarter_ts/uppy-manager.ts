/**
 * UppyManager - Manages Uppy file upload initialization and event handling
 */

import Uppy from "@uppy/core";
import Dashboard from "@uppy/dashboard";
import Tus from "@uppy/tus";

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

export const DEFAULT_UPPY_CONFIG: Partial<UppyConfig> = {
    chunkSize: 67108864, // 60MB
    parallelUploads: 3,
    endpoint: "/tusd_proxy",
    debug: false,
    theme: "light",
};

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
export class UppyManager {
    private uppy: any;
    private config: UppyConfig;
    private underConstruction: Map<string, boolean> = new Map();
    private uploadedFiles: UploadedFile[] = [];
    private onFileUploadedCallback?: (file: UploadedFile) => void;
    private onUploadCompleteCallback?: (successful: any[], failed: any[]) => void;

    constructor(config: UppyConfig) {
        this.config = {
            ...DEFAULT_UPPY_CONFIG,
            ...config,
        } as UppyConfig;
        this.initializeUppy();
    }

    /**
     * Initialize Uppy with Dashboard and Tus plugins
     */
    private initializeUppy(): void {
        const targetElement = document.getElementById(this.config.targetDivId);
        if (!targetElement) {
            throw new Error(`Target element with id "${this.config.targetDivId}" not found`);
        }

        // Initialize Uppy instance
        this.uppy = new Uppy({
            debug: this.config.debug,
            logger: {
                debug: (...args: any[]) => console.debug("Uppy:", ...args),
                warn: (...args: any[]) => console.warn("Uppy:", ...args),
                error: (...args: any[]) => console.error("Uppy:", ...args),
            },
        });

        // Add Dashboard plugin
        this.uppy.use(Dashboard, {
            inline: true,
            target: targetElement,
            theme: this.config.theme || "light",
            debug: this.config.debug,
        });

        // Add Tus plugin
        this.uppy.use(Tus, {
            endpoint: this.config.endpoint,
            chunkSize: this.config.chunkSize,
            parallelUploads: this.config.parallelUploads,
        });

        this.attachEventHandlers();
        console.log("UppyManager initialized with target:", this.config.targetDivId);
    }

    /**
     * Attach event handlers to Uppy instance
     */
    private attachEventHandlers(): void {
        // Upload progress event
        this.uppy.on("upload-progress", async (fileInfo: any, uploadInfo: any) => {
            console.log("upload-progress event", fileInfo, uploadInfo);
            this.underConstruction.set(fileInfo.id, true);

            // Wait for server file reconstruction if using TUSD
            if (uploadInfo.bytesUploaded && uploadInfo.bytesUploaded === uploadInfo.bytesTotal) {
                this.uppy.info("Please wait while the Server is reconstructing the file...");
                while (this.underConstruction.get(fileInfo.id)) {
                    await this.sleep(3000);
                }
            }
        });

        // Upload success event
        this.uppy.on("upload-success", (file: any, response: any) => {
            console.log("upload-success event", file);
            this.underConstruction.delete(file.id);

            const uploadedFile = this.parseUploadedFile(file, response);
            this.uploadedFiles.push(uploadedFile);

            if (this.onFileUploadedCallback) {
                this.onFileUploadedCallback(uploadedFile);
            }

            console.log("upload completed:", uploadedFile.filename);
        });

        // Upload complete event (all files)
        this.uppy.on("complete", (result: any) => {
            console.log("upload successful files:", result.successful);
            console.log("upload failed files:", result.failed);
            this.uppy.info("All uploads finished.");

            if (this.onUploadCompleteCallback) {
                this.onUploadCompleteCallback(result.successful, result.failed);
            }

            this.uppy.clear();
        });

        // Error event
        this.uppy.on("error", (error: any) => {
            console.error("Uppy error:", error);
            this.uppy.info(`Upload error: ${error.message || error}`);
        });
    }

    /**
     * Parse uploaded file information from Uppy response
     */
    private parseUploadedFile(file: any, response: any): UploadedFile {
        // Normalize filename
        let normalizedFilename = file.data?.name || file.name;
        normalizedFilename = normalizedFilename.replace(/[ö\/\|:\?"\*<>\\]/g, "_");

        // Extract upload ID from response
        const uploadURL = response.uploadURL || response.uploadUrl;
        const uploadId = new URL(uploadURL).pathname
            .replace("/uppy", "")
            .replace("/tusd_proxy", "")
            .replace("/", "");

        return {
            id: file.id,
            filename: normalizedFilename,
            path: `${uploadId}_\\${normalizedFilename}`,
            size: file.data?.size || file.size,
            lastModified: file.data?.lastModified || Date.now(),
        };
    }

    /**
     * Set callback for individual file uploads
     */
    public onFileUploaded(callback: (file: UploadedFile) => void): void {
        this.onFileUploadedCallback = callback;
    }

    /**
     * Set callback for all uploads complete
     */
    public onUploadComplete(callback: (successful: any[], failed: any[]) => void): void {
        this.onUploadCompleteCallback = callback;
    }

    /**
     * Get all uploaded files
     */
    public getUploadedFiles(): UploadedFile[] {
        return [...this.uploadedFiles];
    }

    /**
     * Clear all uploaded files tracking
     */
    public clearUploadedFiles(): void {
        this.uploadedFiles = [];
    }

    /**
     * Get Uppy instance for advanced usage
     */
    public getInstance(): any {
        return this.uppy;
    }

    /**
     * Destroy Uppy instance and clean up
     */
    public destroy(): void {
        if (this.uppy) {
            this.uppy.close();
            this.uppy = null;
        }
        this.underConstruction.clear();
        this.uploadedFiles = [];
    }

    /**
     * Sleep utility function
     */
    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
