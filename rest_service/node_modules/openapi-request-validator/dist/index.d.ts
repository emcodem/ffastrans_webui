import * as Ajv from 'ajv';
import { IJsonSchema, OpenAPI, OpenAPIV3 } from 'openapi-types';
import { Logger } from 'ts-log';
export interface IOpenAPIRequestValidator {
    validateRequest(request: OpenAPI.Request): any;
}
export interface OpenAPIRequestValidatorArgs {
    customFormats?: {
        [formatName: string]: Ajv.FormatValidator | Ajv.FormatDefinition;
    };
    externalSchemas?: {
        [index: string]: IJsonSchema;
    };
    loggingKey?: string;
    logger?: Logger;
    parameters: OpenAPI.Parameters;
    requestBody?: OpenAPIV3.RequestBodyObject;
    schemas?: IJsonSchema[];
    componentSchemas?: IJsonSchema[];
    errorTransformer?(openAPIResponseValidatorValidationError: OpenAPIRequestValidatorError, ajvError: Ajv.ErrorObject): any;
}
export interface OpenAPIRequestValidatorError {
    errorCode: string;
    location?: string;
    message: string;
    path?: string;
    schema?: any;
}
export default class OpenAPIRequestValidator implements IOpenAPIRequestValidator {
    private bodySchema;
    private errorMapper;
    private isBodyRequired;
    private logger;
    private loggingKey;
    private requestBody;
    private requestBodyValidators;
    private validateBody;
    private validateFormData;
    private validateHeaders;
    private validatePath;
    private validateQuery;
    constructor(args: OpenAPIRequestValidatorArgs);
    validateRequest(request: any): any;
    validate(request: any): void;
}
