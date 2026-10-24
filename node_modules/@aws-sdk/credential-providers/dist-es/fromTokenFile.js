export const fromTokenFile = (init = {}) => {
    return async (args) => {
        const { fromTokenFile: _fromTokenFile } = await import("@aws-sdk/credential-provider-web-identity");
        return _fromTokenFile({ ...init })(args);
    };
};
