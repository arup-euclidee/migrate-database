import { DatabaseSchema, ValidationResult } from './types/schema-types';
export declare class SchemaValidator {
    private schema;
    private errors;
    private warnings;
    private context;
    constructor(schema: DatabaseSchema);
    validate(): ValidationResult;
    private collectContext;
    private validateTable;
    private validateCrossTableRelations;
    private addResults;
    private getResult;
}
