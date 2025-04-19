import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'api-tester.ts');

// Read the file
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    process.exit(1);
  }
  
  // Replace the type error
  const result = data.replace('new Promise<r>', 'new Promise<Result>');
  
  // Write the file back
  fs.writeFile(filePath, result, 'utf8', (err) => {
    if (err) {
      console.error('Error writing file:', err);
      process.exit(1);
    }
    console.log('Successfully fixed type error in api-tester.ts');
  });
}); 