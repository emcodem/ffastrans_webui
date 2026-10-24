export const fromInstanceMetadata = (init) => {
    return async (props) => {
        init?.logger?.debug("@smithy/credential-provider-imds", "fromInstanceMetadata");
        const { setCredentialFeature } = await import("@aws-sdk/core/client");
        const { fromInstanceMetadata: _fromInstanceMetadata } = await import("@smithy/credential-provider-imds");
        return _fromInstanceMetadata(init)().then((creds) => setCredentialFeature(creds, "CREDENTIALS_IMDS", "0"));
    };
};
