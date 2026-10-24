export const fromHttp = (options = {}) => {
    return async (args) => {
        const { fromHttp: _fromHttp } = await import("@aws-sdk/credential-provider-http");
        return _fromHttp(options)(args);
    };
};
