"use strict";
exports.__esModule = true;
var Ajv = require("ajv");
var openapi2Schema = require('swagger-schema-official/schema.json');
var openapi3Schema = require('./resources/openapi-3.0.json');
var merge = require('lodash.merge');
var OpenAPISchemaValidator = /** @class */ (function () {
    function OpenAPISchemaValidator(args) {
        var v = new Ajv({ schemaId: 'auto', allErrors: true });
        v.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));
        var version = (args && parseInt(String(args.version), 10)) || 2;
        var schema = merge({}, version === 2 ? openapi2Schema : openapi3Schema, args ? args.extensions : {});
        v.addSchema(schema);
        this.validator = v.compile(schema);
    }
    OpenAPISchemaValidator.prototype.validate = function (openapiDoc) {
        if (!this.validator(openapiDoc)) {
            return { errors: this.validator.errors };
        }
        else {
            return { errors: [] };
        }
    };
    return OpenAPISchemaValidator;
}());
exports["default"] = OpenAPISchemaValidator;
//# sourceMappingURL=index.js.map