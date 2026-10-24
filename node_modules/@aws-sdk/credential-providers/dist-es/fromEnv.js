export const fromEnv = (init) => {
    return async (args) => {
        const { fromEnv: _fromEnv } = await import("@aws-sdk/credential-provider-env");
        return _fromEnv(init)(args);
    };
};
