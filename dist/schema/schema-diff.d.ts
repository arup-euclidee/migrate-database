type Column = {
    name: string;
    type: string;
    primaryKey?: boolean;
    nullable?: boolean;
    defaultValue?: string;
};
type Index = {
    name: string;
    columns: string[];
    unique?: boolean;
};
type Relation = {
    type: 'many-to-one' | 'one-to-many' | 'one-to-one';
    columns: string[];
    reference: {
        table: string;
        columns: string[];
    };
};
type Constraint = {
    type: 'unique' | 'primary' | 'check' | 'foreign';
    name: string;
    columns: string[];
};
type Table = {
    name: string;
    columns: Column[];
    indexes?: Index[];
    relations?: Relation[];
    constraints?: Constraint[];
};
type Schema = Table[];
declare function diffSchemas(oldSchema: Schema, newSchema: Schema): any;
