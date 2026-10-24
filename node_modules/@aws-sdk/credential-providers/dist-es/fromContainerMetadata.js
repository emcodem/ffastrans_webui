export const fromContainerMetadata = (init) => {
    return async (props) => {
        init?.logger?.debug("@smithy/credential-provider-imds", "fromContainerMetadata");
        const { fromContainerMetadata: _fromContainerMetadata } = await import("@smithy/credential-provider-imds");
        return _fromContainerMetadata(init)();
    };
};
