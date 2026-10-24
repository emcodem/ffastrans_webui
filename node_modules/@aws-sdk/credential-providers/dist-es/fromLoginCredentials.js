export const fromLoginCredentials = (init) => {
    return async (args) => {
        const { fromLoginCredentials: _fromLoginCredentials } = await import("@aws-sdk/credential-provider-login");
        return _fromLoginCredentials({ ...init })(args);
    };
};
