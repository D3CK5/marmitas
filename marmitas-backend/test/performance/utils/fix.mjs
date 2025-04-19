import * as fs from 'fs';

// Read the file
const filePath = 'api-tester.ts';
const content = fs.readFileSync(filePath, 'utf8');

// Replace the type error
const updatedContent = content.replace('new Promise<r>', 'new Promise<Result>');

// Write the file back
fs.writeFileSync(filePath, updatedContent);

console.log('Fix applied successfully.'); 