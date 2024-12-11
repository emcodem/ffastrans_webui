export type FetcherOptions = {
    /** The HTTP method to use for the request. Default is 'GET'. */
    method?: string;
    /** The request payload, if any. Default is null. */
    body?: Document | XMLHttpRequestBodyInit | null;
    /** Milliseconds between XMLHttpRequest upload progress events before the request is aborted. Default is 30000 ms. */
    timeout?: number;
    /** Sets the withCredentials property of the XMLHttpRequest object. Default is false. */
    withCredentials?: boolean;
    /** Sets the responseType property of the XMLHttpRequest object. Default is an empty string. */
    responseType?: XMLHttpRequestResponseType;
    /** An object representing any headers to send with the request. */
    headers?: Record<string, string>;
    /** The number of retry attempts to make if the request fails. Default is 3. */
    retries?: number;
    /** Called before the request is made. */
    onBeforeRequest?: (xhr: XMLHttpRequest, retryCount: number) => void | Promise<void>;
    /** Function for tracking upload progress. */
    onUploadProgress?: (event: ProgressEvent) => void;
    /** A function to determine whether to retry the request. */
    shouldRetry?: (xhr: XMLHttpRequest) => boolean;
    /** Called after the response has succeeded or failed but before the promise is resolved. */
    onAfterResponse?: (xhr: XMLHttpRequest, retryCount: number) => void | Promise<void>;
    /** Called when no XMLHttpRequest upload progress events have been received for `timeout` ms. */
    onTimeout?: (timeout: number) => void;
    /** Signal to abort the upload. */
    signal?: AbortSignal;
};
/**
 * Fetches data from a specified URL using XMLHttpRequest, with optional retry functionality and progress tracking.
 *
 * @param url The URL to send the request to.
 * @param options Optional settings for the fetch operation.
 */
export declare function fetcher(url: string, options?: FetcherOptions): Promise<XMLHttpRequest>;
//# sourceMappingURL=fetcher.d.ts.map