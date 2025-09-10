"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaParser = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
class SchemaParser {
    static async parseSchemaFile(filePath) {
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
    static async parseTypeScriptSchema(filePath) {
        try {
            // First, try to compile the TypeScript file to JavaScript
            const compiledPath = await this.compileTypeScriptSchema(filePath);
            // Import the compiled JavaScript
            const schemaModule = await Promise.resolve(`${compiledPath}`).then(s => __importStar(require(s)));
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
        }
        catch (error) {
            // Fallback: try to parse the TypeScript file as text
            try {
                return await this.parseTypeScriptAsText(filePath);
            }
            catch (fallbackError) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                const fallbackErrorMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown fallback error';
                throw new Error(`Failed to parse TypeScript schema: ${errorMessage}. Fallback also failed: ${fallbackErrorMessage}`);
            }
        }
    }
    static async compileTypeScriptSchema(filePath) {
        const outputPath = filePath.replace('.ts', '.temp.js');
        // Use TypeScript compiler to compile the single file
        const result = (0, child_process_1.spawnSync)('npx', ['tsc', filePath, '--outFile', outputPath, '--target', 'ES2020', '--module', 'CommonJS'], {
            stdio: 'pipe'
        });
        if (result.status !== 0) {
            throw new Error(`TypeScript compilation failed: ${result.stderr.toString()}`);
        }
        return outputPath;
    }
    static async parseTypeScriptAsText(filePath) {
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
        }
        catch (error) {
            throw new Error('Failed to parse schema object from TypeScript file');
        }
    }
    static saveSchema(schema, filePath) {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, JSON.stringify(schema, null, 2));
    }
    static getPreviousSchema(schemaDir, version) {
        const previousVersion = version - 1;
        const previousSchemaPath = path.join(schemaDir, `schema_v${previousVersion}.json`);
        if (fs.existsSync(previousSchemaPath)) {
            try {
                const schemaContent = fs.readFileSync(previousSchemaPath, 'utf-8');
                return JSON.parse(schemaContent);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                console.warn(`Failed to parse previous schema: ${errorMessage}`);
                return null;
            }
        }
        return null;
    }
    static async findSchemaFile() {
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
exports.SchemaParser = SchemaParser;
