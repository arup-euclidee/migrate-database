import * as fs from 'fs';
import * as path from 'path';

export class FileUtils {
  static ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  static writeFile(filePath: string, content: string): void {
    const dir = path.dirname(filePath);
    this.ensureDirectoryExists(dir);
    fs.writeFileSync(filePath, content);
  }

  static readFile(filePath: string): string {
    return fs.readFileSync(filePath, 'utf-8');
  }

  static fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  static getFilesInDirectory(dirPath: string): string[] {
    if (!fs.existsSync(dirPath)) {
      return [];
    }
    return fs.readdirSync(dirPath);
  }
}