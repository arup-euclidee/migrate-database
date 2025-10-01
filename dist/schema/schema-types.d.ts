export interface ColumnDefinition {
    name: string;
    type: string;
    nullable?: boolean;
    primaryKey?: boolean;
    defaultValue?: any;
    unique?: boolean;
    references?: {
        table: string;
        column: string;
    };
}
export interface TableDefinition {
    name: string;
    columns: ColumnDefinition[];
    indexes?: Array<{
        name: string;
        columns: string[];
        unique?: boolean;
    }>;
    relations?: Array<{
        type: 'many-to-one' | 'many-to-many';
        columns: string[];
        reference: {
            table: string;
            columns: string[];
        };
        onDelete?: 'CASCADE' | 'SET NULL' | 'NO ACTION' | 'RESTRICT';
        onUpdate?: 'CASCADE' | 'SET NULL' | 'NO ACTION' | 'RESTRICT';
    }>;
    constraints?: Array<{
        type: 'unique' | 'primary' | 'check' | 'foreign';
        name: string;
        columns: string[];
    }>;
}
export interface SchemaDefinition {
    tables: TableDefinition[];
    timestamp: string;
}
export interface MigrationStep {
    type: 'create_table' | 'drop_table' | 'add_column' | 'drop_column' | 'modify_column' | 'add_index' | 'drop_index';
    table: string;
    column?: string;
    definition?: any;
}
