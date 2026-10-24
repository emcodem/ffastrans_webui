import { FromWebTokenInit } from "@aws-sdk/credential-provider-web-identity";
import { RuntimeConfigAwsCredentialIdentityProvider } from "@aws-sdk/types";
export declare const fromWebToken: (
  init: FromWebTokenInit,
) => RuntimeConfigAwsCredentialIdentityProvider;
