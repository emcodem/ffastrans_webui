import type { FromHttpOptions, HttpProviderCredentials } from "@aws-sdk/credential-provider-http";
import type { AwsCredentialIdentityProvider } from "@smithy/types";
export type { FromHttpOptions, HttpProviderCredentials };
/**
 * Creates a provider that gets credentials via HTTP request.
 *
 * ```javascript
 * import { fromHttp } from "@aws-sdk/credential-providers"; // ES6 import
 * // const { fromHttp } = require("@aws-sdk/credential-providers"); // CommonJS import
 *
 * const client = new FooClient({
 *   credentials: fromHttp({
 *     // Optional. The URL to make the HTTP request to. If not specified, the provider will use the value in
 *     // the `AWS_CONTAINER_CREDENTIALS_FULL_URI` or `AWS_CONTAINER_CREDENTIALS_RELATIVE_URI` environment variable.
 *     awsContainerCredentialsFullUri: "http://localhost:8080/credentials",
 *   }),
 * });
 * ```
 *
 * @public
 */
export declare const fromHttp: (options?: FromHttpOptions) => AwsCredentialIdentityProvider;
