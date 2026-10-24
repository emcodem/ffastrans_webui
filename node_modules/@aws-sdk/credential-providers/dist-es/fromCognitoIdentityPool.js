export const fromCognitoIdentityPool = (options) => {
    return async (args) => {
        const { fromCognitoIdentityPool: _fromCognitoIdentityPool } = await import("@aws-sdk/credential-provider-cognito-identity");
        return _fromCognitoIdentityPool(options)(args);
    };
};
