const { ProviderError, CredentialsProviderError, loadConfig, NODE_REGION_CONFIG_FILE_OPTIONS } = require("@smithy/core/config");
const { normalizeProvider } = require("@smithy/core");

const createCredentialChain = (...credentialProviders) => {
    let expireAfter = -1;
    const baseFunction = async (awsIdentityProperties) => {
        const credentials = await propertyProviderChain(...credentialProviders)(awsIdentityProperties);
        if (!credentials.expiration && expireAfter !== -1) {
            credentials.expiration = new Date(Date.now() + expireAfter);
        }
        return credentials;
    };
    const withOptions = Object.assign(baseFunction, {
        expireAfter(milliseconds) {
            if (milliseconds < 5 * 60_000) {
                throw new Error("@aws-sdk/credential-providers - createCredentialChain(...).expireAfter(ms) may not be called with a duration lower than five minutes.");
            }
            expireAfter = milliseconds;
            return withOptions;
        },
    });
    return withOptions;
};
const propertyProviderChain = (...providers) => async (awsIdentityProperties) => {
    if (providers.length === 0) {
        throw new ProviderError("No providers in chain", { tryNextLink: false });
    }
    let lastProviderError;
    for (const provider of providers) {
        try {
            return await provider(awsIdentityProperties);
        }
        catch (err) {
            lastProviderError = err;
            if (err?.tryNextLink) {
                continue;
            }
            throw err;
        }
    }
    throw lastProviderError;
};

const fromCognitoIdentity = (options) => {
    return async (args) => {
        const { fromCognitoIdentity: _fromCognitoIdentity } = require('@aws-sdk/credential-provider-cognito-identity');
        return _fromCognitoIdentity(options)(args);
    };
};

const fromCognitoIdentityPool = (options) => {
    return async (args) => {
        const { fromCognitoIdentityPool: _fromCognitoIdentityPool } = require('@aws-sdk/credential-provider-cognito-identity');
        return _fromCognitoIdentityPool(options)(args);
    };
};

const fromContainerMetadata = (init) => {
    return async (props) => {
        init?.logger?.debug("@smithy/credential-provider-imds", "fromContainerMetadata");
        const { fromContainerMetadata: _fromContainerMetadata } = require('@smithy/credential-provider-imds');
        return _fromContainerMetadata(init)();
    };
};

const fromEnv = (init) => {
    return async (args) => {
        const { fromEnv: _fromEnv } = require('@aws-sdk/credential-provider-env');
        return _fromEnv(init)(args);
    };
};

const fromHttp = (options = {}) => {
    return async (args) => {
        const { fromHttp: _fromHttp } = require('@aws-sdk/credential-provider-http');
        return _fromHttp(options)(args);
    };
};

const fromIni = (init = {}) => {
    return async (args) => {
        const { fromIni: _fromIni } = require('@aws-sdk/credential-provider-ini');
        return _fromIni({ ...init })(args);
    };
};

const fromInstanceMetadata = (init) => {
    return async (props) => {
        init?.logger?.debug("@smithy/credential-provider-imds", "fromInstanceMetadata");
        const { setCredentialFeature } = require('@aws-sdk/core/client');
        const { fromInstanceMetadata: _fromInstanceMetadata } = require('@smithy/credential-provider-imds');
        return _fromInstanceMetadata(init)().then((creds) => setCredentialFeature(creds, "CREDENTIALS_IMDS", "0"));
    };
};

const fromLoginCredentials = (init) => {
    return async (args) => {
        const { fromLoginCredentials: _fromLoginCredentials } = require('@aws-sdk/credential-provider-login');
        return _fromLoginCredentials({ ...init })(args);
    };
};

const fromNodeProviderChain = (init = {}) => {
    let chain;
    return async (args) => {
        if (!chain) {
            const { defaultProvider } = require('@aws-sdk/credential-provider-node');
            chain = defaultProvider({ ...init });
        }
        return chain(args);
    };
};

const fromProcess = (init) => {
    return async (args) => {
        const { fromProcess: _fromProcess } = require('@aws-sdk/credential-provider-process');
        return _fromProcess(init)(args);
    };
};

const fromSSO = (init = {}) => {
    return async (args) => {
        const { fromSSO: _fromSSO } = require('@aws-sdk/credential-provider-sso');
        return _fromSSO({ ...init })(args);
    };
};

const ASSUME_ROLE_DEFAULT_REGION = "us-east-1";
const fromTemporaryCredentials$1 = (options, credentialDefaultProvider, regionProvider) => {
    let stsClient;
    return async (awsIdentityProperties = {}) => {
        const { callerClientConfig } = awsIdentityProperties;
        const profile = options.clientConfig?.profile ?? callerClientConfig?.profile;
        const logger = options.logger ?? callerClientConfig?.logger;
        logger?.debug("@aws-sdk/credential-providers - fromTemporaryCredentials (STS)");
        const params = { ...options.params, RoleSessionName: options.params.RoleSessionName ?? "aws-sdk-js-" + Date.now() };
        if (params?.SerialNumber) {
            if (!options.mfaCodeProvider) {
                throw new CredentialsProviderError(`Temporary credential requires multi-factor authentication, but no MFA code callback was provided.`, {
                    tryNextLink: false,
                    logger,
                });
            }
            params.TokenCode = await options.mfaCodeProvider(params?.SerialNumber);
        }
        const { AssumeRoleCommand, STSClient } = require('./loadSts-C4jOcYxJ.js');
        if (!stsClient) {
            const defaultCredentialsOrError = typeof credentialDefaultProvider === "function" ? credentialDefaultProvider() : undefined;
            const credentialSources = [
                options.masterCredentials,
                options.clientConfig?.credentials,
                void callerClientConfig?.credentials,
                callerClientConfig?.credentialDefaultProvider?.(),
                defaultCredentialsOrError,
            ];
            let credentialSource = "STS client default credentials";
            if (credentialSources[0]) {
                credentialSource = "options.masterCredentials";
            }
            else if (credentialSources[1]) {
                credentialSource = "options.clientConfig.credentials";
            }
            else if (credentialSources[2]) {
                credentialSource = "caller client's credentials";
                throw new Error("fromTemporaryCredentials recursion in callerClientConfig.credentials");
            }
            else if (credentialSources[3]) {
                credentialSource = "caller client's credentialDefaultProvider";
            }
            else if (credentialSources[4]) {
                credentialSource = "AWS SDK default credentials";
            }
            const regionSources = [
                options.clientConfig?.region,
                callerClientConfig?.region,
                await regionProvider?.({
                    profile,
                }),
                ASSUME_ROLE_DEFAULT_REGION,
            ];
            let regionSource = "default partition's default region";
            if (regionSources[0]) {
                regionSource = "options.clientConfig.region";
            }
            else if (regionSources[1]) {
                regionSource = "caller client's region";
            }
            else if (regionSources[2]) {
                regionSource = "file or env region";
            }
            const requestHandlerSources = [
                filterRequestHandler(options.clientConfig?.requestHandler),
                filterRequestHandler(callerClientConfig?.requestHandler),
            ];
            let requestHandlerSource = "STS default requestHandler";
            if (requestHandlerSources[0]) {
                requestHandlerSource = "options.clientConfig.requestHandler";
            }
            else if (requestHandlerSources[1]) {
                requestHandlerSource = "caller client's requestHandler";
            }
            logger?.debug?.(`@aws-sdk/credential-providers - fromTemporaryCredentials STS client init with ` +
                `${regionSource}=${await normalizeProvider(coalesce(regionSources))()}, ${credentialSource}, ${requestHandlerSource}.`);
            stsClient = new STSClient({
                userAgentAppId: callerClientConfig?.userAgentAppId,
                ...options.clientConfig,
                credentials: coalesce(credentialSources),
                logger,
                profile,
                region: coalesce(regionSources),
                requestHandler: coalesce(requestHandlerSources),
            });
        }
        if (options.clientPlugins) {
            for (const plugin of options.clientPlugins) {
                stsClient.middlewareStack.use(plugin);
            }
        }
        const { Credentials } = await stsClient.send(new AssumeRoleCommand(params));
        if (!Credentials || !Credentials.AccessKeyId || !Credentials.SecretAccessKey) {
            throw new CredentialsProviderError(`Invalid response from STS.assumeRole call with role ${params.RoleArn}`, {
                logger,
            });
        }
        return {
            accessKeyId: Credentials.AccessKeyId,
            secretAccessKey: Credentials.SecretAccessKey,
            sessionToken: Credentials.SessionToken,
            expiration: Credentials.Expiration,
            credentialScope: Credentials.CredentialScope,
        };
    };
};
const filterRequestHandler = (requestHandler) => {
    return requestHandler?.metadata?.handlerProtocol === "h2" ? undefined : requestHandler;
};
const coalesce = (args) => {
    for (const item of args) {
        if (item !== undefined) {
            return item;
        }
    }
};

const fromTemporaryCredentials = (options) => {
    return fromTemporaryCredentials$1(options, fromNodeProviderChain, async ({ profile = process.env.AWS_PROFILE }) => loadConfig({
        environmentVariableSelector: (env) => env.AWS_REGION,
        configFileSelector: (profileData) => {
            return profileData.region;
        },
        default: () => undefined,
    }, { ...NODE_REGION_CONFIG_FILE_OPTIONS, profile })());
};

const fromTokenFile = (init = {}) => {
    return async (args) => {
        const { fromTokenFile: _fromTokenFile } = require('@aws-sdk/credential-provider-web-identity');
        return _fromTokenFile({ ...init })(args);
    };
};

const fromWebToken = (init) => {
    return async (args) => {
        const { fromWebToken: _fromWebToken } = require('@aws-sdk/credential-provider-web-identity');
        return _fromWebToken({ ...init })(args);
    };
};

exports.createCredentialChain = createCredentialChain;
exports.fromCognitoIdentity = fromCognitoIdentity;
exports.fromCognitoIdentityPool = fromCognitoIdentityPool;
exports.fromContainerMetadata = fromContainerMetadata;
exports.fromEnv = fromEnv;
exports.fromHttp = fromHttp;
exports.fromIni = fromIni;
exports.fromInstanceMetadata = fromInstanceMetadata;
exports.fromLoginCredentials = fromLoginCredentials;
exports.fromNodeProviderChain = fromNodeProviderChain;
exports.fromProcess = fromProcess;
exports.fromSSO = fromSSO;
exports.fromTemporaryCredentials = fromTemporaryCredentials;
exports.fromTokenFile = fromTokenFile;
exports.fromWebToken = fromWebToken;
exports.propertyProviderChain = propertyProviderChain;
