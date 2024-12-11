export interface DeterminateFileProcessing {
    mode: 'determinate';
    message: string;
    value: number;
}
export interface IndeterminateFileProcessing {
    mode: 'indeterminate';
    message?: string;
    value?: 0;
}
export type FileProcessingInfo = IndeterminateFileProcessing | DeterminateFileProcessing;
interface FileProgressBase {
    uploadComplete?: boolean;
    percentage?: number;
    bytesTotal: number | null;
    preprocess?: FileProcessingInfo;
    postprocess?: FileProcessingInfo;
}
export type FileProgressStarted = FileProgressBase & {
    uploadStarted: number;
    bytesUploaded: number;
};
export type FileProgressNotStarted = FileProgressBase & {
    uploadStarted: null;
    bytesUploaded: false;
};
export type FileProgress = FileProgressStarted | FileProgressNotStarted;
export {};
//# sourceMappingURL=FileProgress.d.ts.map