// main.ts
import { SchemaValidator } from './validation-orchestrator';
import { DatabaseSchema } from './types/schema-types';

// Your schema with TypeScript types
const schema: DatabaseSchema = [
  {
    name: 'users',
    columns: [
      { name: 'id', type: 'SERIAL', primaryKey: true },
      { name: 'email', type: 'VARCHAR(255)', nullable: false },
      { name: 'name', type: 'VARCHAR(255)', nullable: false },
      { name: 'created_at', type: 'TIMESTAMP', nullable: false, defaultValue: 'NOW' }
    ],
    indexes: [
      { name: 'idx_users_email', columns: ['email'], unique: true }
    ]
  }
  // ... more tables
];

// Validate
const validator = new SchemaValidator(schema);
const result = validator.validate();

console.log('Validation Result:');
console.log('Is Valid:', result.isValid);
console.log('Summary:', result.summary);

if (result.errors.length > 0) {
  console.log('\n❌ Errors:');
  result.errors.forEach(error => console.log('  -', error));
}

if (result.warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  result.warnings.forEach(warning => console.log('  -', warning));
}
