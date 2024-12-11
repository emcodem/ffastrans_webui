interface ObjectWithMIMEAndName {
    name?: string;
    mimeType: unknown;
}
export default function remoteFileObjToLocal<T extends ObjectWithMIMEAndName>(file: T): T & {
    type: T['mimeType'];
    extension: string | undefined | null;
};
export {};
//# sourceMappingURL=remoteFileObjToLocal.d.ts.map