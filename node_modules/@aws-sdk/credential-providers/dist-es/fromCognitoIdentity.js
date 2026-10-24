export const fromCognitoIdentity = (options) => {
    return async (args) => {
        const { fromCognitoIdentity: _fromCognitoIdentity } = await import("@aws-sdk/credential-provider-cognito-identity");
        return _fromCognitoIdentity(options)(args);
    };
};
