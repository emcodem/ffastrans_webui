import { AwsCredentialIdentityProvider } from "@smithy/types";
import { RemoteProviderInit } from "./fromContainerMetadata";
export declare const fromInstanceMetadata: (
  init?: RemoteProviderInit,
) => AwsCredentialIdentityProvider;
