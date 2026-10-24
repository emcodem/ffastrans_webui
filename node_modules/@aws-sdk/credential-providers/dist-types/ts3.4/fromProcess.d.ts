import { FromProcessInit } from "@aws-sdk/credential-provider-process";
import { RuntimeConfigAwsCredentialIdentityProvider } from "@aws-sdk/types";
export declare const fromProcess: (
  init?: FromProcessInit,
) => RuntimeConfigAwsCredentialIdentityProvider;
