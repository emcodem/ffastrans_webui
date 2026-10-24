export const fromNodeProviderChain = (init = {}) => {
    let chain;
    return async (args) => {
        if (!chain) {
            const { defaultProvider } = await import("@aws-sdk/credential-provider-node");
            chain = defaultProvider({ ...init });
        }
        return chain(args);
    };
};
