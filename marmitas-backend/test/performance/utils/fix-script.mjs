import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target file path
const targetFile = path.join(__dirname, 'api-tester.ts');

try {
  // Read the file as lines
  const content = fs.readFileSync(targetFile, 'utf8');
  const lines = content.split('\n');
  
  // Line 117 is where the error is now
  if (lines.length >= 117) {
    // Check if the line contains the error
    const lineIndex = 116; // 0-based index for line 117
    const oldLine = lines[lineIndex];
    
    // Replace 'Promise<r>' with 'Promise<Result>'
    if (oldLine.includes('Promise<r>')) {
      const newLine = oldLine.replace('Promise<r>', 'Promise<Result>');
      lines[lineIndex] = newLine;
      
      // Join lines back and write to file
      fs.writeFileSync(targetFile, lines.join('\n'), 'utf8');
      console.log('✅ Successfully fixed the type error in api-tester.ts');
      console.log(`Old line: ${oldLine.trim()}`);
      console.log(`New line: ${newLine.trim()}`);
    } else {
      console.log('⚠️ Error pattern "Promise<r>" not found on line 117.');
      console.log(`Current line 117: ${oldLine.trim()}`);
    }
  } else {
    console.log('⚠️ File has less than 117 lines.');
  }
} catch (error) {
  console.error('Error:', error.message);
} 