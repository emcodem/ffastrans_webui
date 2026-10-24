export const fromSSO = (init = {}) => {
    return async (args) => {
        const { fromSSO: _fromSSO } = await import("@aws-sdk/credential-provider-sso");
        return _fromSSO({ ...init })(args);
    };
};
