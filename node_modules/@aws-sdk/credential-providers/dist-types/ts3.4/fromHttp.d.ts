import { FromHttpOptions, HttpProviderCredentials } from "@aws-sdk/credential-provider-http";
import { AwsCredentialIdentityProvider } from "@smithy/types";
export { FromHttpOptions, HttpProviderCredentials };
export declare const fromHttp: (options?: FromHttpOptions) => AwsCredentialIdentityProvider;
