import { SchemaDefinition } from "./schema-types";
import * as fs from "fs";
import * as path from "path";
import { register } from "ts-node";

export class SchemaParser {
  static async parseSchemaFile(filePath: string): Promise<SchemaDefinition> {
    const absolutePath = path.resolve(filePath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Schema file not found: ${absolutePath}`);
    }

    if (!filePath.endsWith(".ts")) {
      throw new Error("Unsupported schema file format. Use .ts files.");
    }

    return await this.parseTypeScriptSchema(absolutePath);
  }

  private static async parseTypeScriptSchema(filePath: string): Promise<SchemaDefinition> {
    try {
      // Register ts-node so we can import .ts files
      register({
        transpileOnly: true, // skip type-checking, faster
        compilerOptions: {
          module: "CommonJS",
          target: "ES2020",
          esModuleInterop: true,
        },
      });

      // Import schema.ts dynamically
      const schemaModule = await import(filePath);
      const schemaObject = schemaModule.default || schemaModule;

      if (!schemaObject || typeof schemaObject !== "object") {
        throw new Error("Schema file must export a default object");
      }

      return {
        tables: schemaObject || [],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(`Failed to parse TypeScript schema: ${errorMessage}`);
    }
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
      const schemaContent = fs.readFileSync(absolutePath, "utf-8");
      return JSON.parse(schemaContent);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.warn(`⚠️ Failed to parse reference schema: ${errorMessage}`);
      return null;
    }
  }

  static async findSchemaFile(): Promise<string> {
    const possiblePaths = [
      "./pg-migrate/schema.ts",
      "./src/schema.ts"
    ];

    for (const filePath of possiblePaths) {
      const absolutePath = path.resolve(filePath);
      if (fs.existsSync(absolutePath)) {
        return absolutePath;
      }
    }

    throw new Error("No schema file found. Please create a schema.ts file in the root directory.");
  }
}
