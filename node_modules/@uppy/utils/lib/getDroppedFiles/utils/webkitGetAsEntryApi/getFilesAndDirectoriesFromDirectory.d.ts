/**
 * Recursive function, calls the original callback() when the directory is entirely parsed.
 */
export default function getFilesAndDirectoriesFromDirectory(directoryReader: FileSystemDirectoryReader, oldEntries: FileSystemEntry[], logDropError: (error?: unknown) => void, { onSuccess }: {
    onSuccess: (newEntries: FileSystemEntry[]) => void;
}): void;
//# sourceMappingURL=getFilesAndDirectoriesFromDirectory.d.ts.map