import {
  CognitoIdentityCredentialProvider as _CognitoIdentityCredentialProvider,
  FromCognitoIdentityParameters as _FromCognitoIdentityParameters,
} from "@aws-sdk/credential-provider-cognito-identity";
export interface FromCognitoIdentityParameters extends Pick<
  _FromCognitoIdentityParameters,
  Exclude<keyof _FromCognitoIdentityParameters, "client">
> {}
export type CognitoIdentityCredentialProvider = _CognitoIdentityCredentialProvider;
export declare const fromCognitoIdentity: (
  options: FromCognitoIdentityParameters,
) => CognitoIdentityCredentialProvider;
