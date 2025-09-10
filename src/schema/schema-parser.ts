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

    // For TypeScript files, we need to compile and import them
    if (filePath.endsWith('.ts')) {
      return await this.parseTypeScriptSchema(absolutePath);
    }
    
    // For JSON files (backward compatibility)
    if (filePath.endsWith('.json')) {
      const schemaContent = fs.readFileSync(absolutePath, 'utf-8');
      const schemaObject = JSON.parse(schemaContent);
      
      return {
        tables: schemaObject.tables || [],
        version: schemaObject.version || 1,
        timestamp: new Date().toISOString()
      };
    }

    throw new Error('Unsupported schema file format. Use .ts or .json files.');
  }

  private static async parseTypeScriptSchema(filePath: string): Promise<SchemaDefinition> {
    try {
      // First, try to compile the TypeScript file to JavaScript
      const compiledPath = await this.compileTypeScriptSchema(filePath);
      
      // Import the compiled JavaScript
      const schemaModule = await import(compiledPath);
      
      // Clean up the compiled file
      if (fs.existsSync(compiledPath)) {
        fs.unlinkSync(compiledPath);
      }
      
      // The schema should be the default export
      const schemaObject = schemaModule.default || schemaModule;
      
      return {
        tables: schemaObject.tables || [],
        version: schemaObject.version || 1,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      // Fallback: try to parse the TypeScript file as text
      try {
        return await this.parseTypeScriptAsText(filePath);
      } catch (fallbackError) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        const fallbackErrorMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown fallback error';
        throw new Error(`Failed to parse TypeScript schema: ${errorMessage}. Fallback also failed: ${fallbackErrorMessage}`);
      }
    }
  }

  private static async compileTypeScriptSchema(filePath: string): Promise<string> {
    const outputPath = filePath.replace('.ts', '.temp.js');
    
    // Use TypeScript compiler to compile the single file
    const result = spawnSync('npx', ['tsc', filePath, '--outFile', outputPath, '--target', 'ES2020', '--module', 'CommonJS'], {
      stdio: 'pipe'
    });

    if (result.status !== 0) {
      throw new Error(`TypeScript compilation failed: ${result.stderr.toString()}`);
    }

    return outputPath;
  }

  private static async parseTypeScriptAsText(filePath: string): Promise<SchemaDefinition> {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Simple regex to extract the schema object (this is a fallback)
    const schemaMatch = content.match(/const schema = (\{[\s\S]*?\});/);
    if (!schemaMatch) {
      throw new Error('Could not find schema object in TypeScript file');
    }

    try {
      // Use eval to parse the object (be careful with this in production!)
      const schemaObject = eval(`(${schemaMatch[1]})`);
      
      return {
        tables: schemaObject.tables || [],
        version: schemaObject.version || 1,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error('Failed to parse schema object from TypeScript file');
    }
  }

  static saveSchema(schema: SchemaDefinition, filePath: string): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, JSON.stringify(schema, null, 2));
  }

  static getPreviousSchema(schemaDir: string, version: number): SchemaDefinition | null {
    const previousVersion = version - 1;
    const previousSchemaPath = path.join(schemaDir, `schema_v${previousVersion}.json`);
    
    if (fs.existsSync(previousSchemaPath)) {
      try {
        const schemaContent = fs.readFileSync(previousSchemaPath, 'utf-8');
        return JSON.parse(schemaContent);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.warn(`Failed to parse previous schema: ${errorMessage}`);
        return null;
      }
    }
    
    return null;
  }

  static async findSchemaFile(): Promise<string> {
    const possiblePaths = [
      './schema.ts',
      './src/schema.ts',
      './schemas/schema.ts',
      './database/schema.ts',
      './db/schema.ts',
      './schema.json',
      './src/schema.json',
      './schemas/schema.json',
      './database/schema.json',
      './db/schema.json'
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