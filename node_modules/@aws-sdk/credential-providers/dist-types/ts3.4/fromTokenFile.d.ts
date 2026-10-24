import { FromTokenFileInit } from "@aws-sdk/credential-provider-web-identity";
import { RuntimeConfigAwsCredentialIdentityProvider } from "@aws-sdk/types";
export declare const fromTokenFile: (
  init?: FromTokenFileInit,
) => RuntimeConfigAwsCredentialIdentityProvider;
