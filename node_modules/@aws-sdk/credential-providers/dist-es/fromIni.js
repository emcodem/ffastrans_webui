export const fromIni = (init = {}) => {
    return async (args) => {
        const { fromIni: _fromIni } = await import("@aws-sdk/credential-provider-ini");
        return _fromIni({ ...init })(args);
    };
};
