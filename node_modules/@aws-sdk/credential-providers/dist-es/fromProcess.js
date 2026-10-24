export const fromProcess = (init) => {
    return async (args) => {
        const { fromProcess: _fromProcess } = await import("@aws-sdk/credential-provider-process");
        return _fromProcess(init)(args);
    };
};
