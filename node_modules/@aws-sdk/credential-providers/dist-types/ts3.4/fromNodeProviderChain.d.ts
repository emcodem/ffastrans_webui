import {
  DefaultProviderInit,
  MemoizedRuntimeConfigAwsCredentialIdentityProvider,
} from "@aws-sdk/credential-provider-node";
export declare const fromNodeProviderChain: (
  init?: DefaultProviderInit,
) => MemoizedRuntimeConfigAwsCredentialIdentityProvider;
