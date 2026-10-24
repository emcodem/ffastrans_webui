export const fromWebToken = (init) => {
    return async (args) => {
        const { fromWebToken: _fromWebToken } = await import("@aws-sdk/credential-provider-web-identity");
        return _fromWebToken({ ...init })(args);
    };
};
