import { SchemaDefinition } from './schema-types';
import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';

export class SchemaParser {
  static async parseSchemaFile(filePath: string): Promise<SchemaDefinition> {
    const absolutePath = path.resolve(filePath);
    
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Schema file not found: ${absolutePath}`);
    }

    if (filePath.endsWith('.ts')) {
      return await this.parseTypeScriptSchema(absolutePath);
    }

    throw new Error('Unsupported schema file format. Use .ts files.');
  }

  private static async parseTypeScriptSchema(filePath: string): Promise<SchemaDefinition> {
    try {
      // Compile TypeScript to JavaScript temporarily
      const compiledPath = await this.compileTypeScriptSchema(filePath);
      
      // Import the compiled JavaScript
      const schemaModule = await import(compiledPath);
      
      // Clean up the compiled file
      if (fs.existsSync(compiledPath)) {
        fs.unlinkSync(compiledPath);
      }
      
      // The schema should be the default export
      const schemaObject = schemaModule.default || schemaModule;
      
      if (!schemaObject || typeof schemaObject !== 'object') {
        throw new Error('Schema file must export a default object');
      }
      
      return {
        tables: schemaObject.tables || [],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to parse TypeScript schema: ${errorMessage}`);
    }
  }

  private static async compileTypeScriptSchema(filePath: string): Promise<string> {
    const outputPath = filePath.replace('.ts', '.temp.js');
    
    // Use TypeScript compiler to compile the single file
    const result = spawnSync('npx', [
      'tsc', 
      filePath, 
      '--outFile', 
      outputPath, 
      '--target', 
      'ES2020', 
      '--module', 
      'CommonJS',
      '--esModuleInterop',
      '--skipLibCheck'
    ], {
      stdio: 'pipe'
    });

    if (result.status !== 0) {
      throw new Error(`TypeScript compilation failed: ${result.stderr.toString()}`);
    }

    return outputPath;
  }

  static saveSchema(schema: SchemaDefinition, filePath: string): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, JSON.stringify(schema, null, 2));
  }

  static getReferenceSchema(referencePath: string): SchemaDefinition | null {
    const absolutePath = path.resolve(referencePath);
    
    if (!fs.existsSync(absolutePath)) {
      return null;
    }

    try {
      const schemaContent = fs.readFileSync(absolutePath, 'utf-8');
      return JSON.parse(schemaContent);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.warn(`Failed to parse reference schema: ${errorMessage}`);
      return null;
    }
  }

  static async findSchemaFile(): Promise<string> {
    const possiblePaths = [
      './schema.ts',
      './src/schema.ts',
      './prisma/schema.ts',
      './database/schema.ts',
      './db/schema.ts'
    ];

    for (const filePath of possiblePaths) {
      const absolutePath = path.resolve(filePath);
      if (fs.existsSync(absolutePath)) {
        return absolutePath;
      }
    }

    throw new Error('No schema file found. Please create a schema.ts file in the root directory.');
  }
}