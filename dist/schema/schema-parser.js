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
        if (filePath.endsWith('.ts')) {
            return await this.parseTypeScriptSchema(absolutePath);
        }
        throw new Error('Unsupported schema file format. Use .ts files.');
    }
    static async parseTypeScriptSchema(filePath) {
        try {
            // Compile TypeScript to JavaScript temporarily
            const compiledPath = await this.compileTypeScriptSchema(filePath);
            // Import the compiled JavaScript
            const schemaModule = await Promise.resolve(`${compiledPath}`).then(s => __importStar(require(s)));
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Failed to parse TypeScript schema: ${errorMessage}`);
        }
    }
    static async compileTypeScriptSchema(filePath) {
        const outputPath = filePath.replace('.ts', '.temp.js');
        // Use TypeScript compiler to compile the single file
        const result = (0, child_process_1.spawnSync)('npx', [
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
    static saveSchema(schema, filePath) {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, JSON.stringify(schema, null, 2));
    }
    static getReferenceSchema(referencePath) {
        const absolutePath = path.resolve(referencePath);
        if (!fs.existsSync(absolutePath)) {
            return null;
        }
        try {
            const schemaContent = fs.readFileSync(absolutePath, 'utf-8');
            return JSON.parse(schemaContent);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            console.warn(`Failed to parse reference schema: ${errorMessage}`);
            return null;
        }
    }
    static async findSchemaFile() {
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
exports.SchemaParser = SchemaParser;
