import { FromSSOInit, SsoCredentialsParameters } from "@aws-sdk/credential-provider-sso";
import { RuntimeConfigAwsCredentialIdentityProvider } from "@aws-sdk/types";
export declare const fromSSO: (
  init?: FromSSOInit & Partial<SsoCredentialsParameters>,
) => RuntimeConfigAwsCredentialIdentityProvider;
