type dataURItoBlobOptions = {
    mimeType?: string;
    name?: string;
};
declare function dataURItoBlob(dataURI: string, opts: dataURItoBlobOptions): Blob;
declare function dataURItoBlob(dataURI: string, opts: dataURItoBlobOptions, toFile: true): File;
export default dataURItoBlob;
//# sourceMappingURL=dataURItoBlob.d.ts.map