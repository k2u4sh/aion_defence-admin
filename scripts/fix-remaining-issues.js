const fs = require('fs');
const path = require('path');

// Function to recursively find all TypeScript files
function findTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next')) {
      findTsFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to fix remaining issues in a file
function fixRemainingIssues(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Add missing imports if file uses ApiResponseHandler but doesn't have the import
    if (content.includes('ApiResponseHandler') && !content.includes('@/utils/apiResponse')) {
      // Find the last import statement
      const importRegex = /(import.*from.*["'].*["'];?\n?)/g;
      const imports = content.match(importRegex) || [];
      
      if (imports.length > 0) {
        const lastImport = imports[imports.length - 1];
        const newImports = `import { ApiResponseHandler, ErrorMessages, SuccessMessages } from "@/utils/apiResponse";\nimport { Validator, ValidationSchemas } from "@/utils/validation";\n`;
        
        content = content.replace(lastImport, lastImport + newImports);
        updated = true;
      }
    }
    
    // Fix any remaining NextResponse.json calls that might have been missed
    // Simple error responses
    content = content.replace(
      /NextResponse\.json\(\s*{\s*message:\s*["']([^"']+)["'],\s*success:\s*false\s*}\s*,\s*{\s*status:\s*(\d+)\s*}\s*\)/g,
      (match, message, status) => {
        updated = true;
        return `ApiResponseHandler.error("${message}", ${status})`;
      }
    );
    
    // Simple success responses
    content = content.replace(
      /NextResponse\.json\(\s*{\s*message:\s*["']([^"']+)["'],\s*success:\s*true,?\s*data:\s*([^}]+)\s*}\s*\)/g,
      (match, message, data) => {
        updated = true;
        return `ApiResponseHandler.success(${data}, "${message}")`;
      }
    );
    
    // Success responses with status
    content = content.replace(
      /NextResponse\.json\(\s*{\s*message:\s*["']([^"']+)["'],\s*success:\s*true,?\s*data:\s*([^}]+)\s*}\s*,\s*{\s*status:\s*(\d+)\s*}\s*\)/g,
      (match, message, data, status) => {
        updated = true;
        if (status === '200') {
          return `ApiResponseHandler.success(${data}, "${message}")`;
        } else {
          return `ApiResponseHandler.success(${data}, "${message}", ${status})`;
        }
      }
    );
    
    // Success responses without data
    content = content.replace(
      /NextResponse\.json\(\s*{\s*message:\s*["']([^"']+)["'],\s*success:\s*true\s*}\s*\)/g,
      (match, message) => {
        updated = true;
        return `ApiResponseHandler.success(null, "${message}")`;
      }
    );
    
    // Success responses without data but with status
    content = content.replace(
      /NextResponse\.json\(\s*{\s*message:\s*["']([^"']+)["'],\s*success:\s*true\s*}\s*,\s*{\s*status:\s*(\d+)\s*}\s*\)/g,
      (match, message, status) => {
        updated = true;
        if (status === '200') {
          return `ApiResponseHandler.success(null, "${message}")`;
        } else {
          return `ApiResponseHandler.success(null, "${message}", ${status})`;
        }
      }
    );
    
    // Generic NextResponse.json replacement for any remaining ones
    content = content.replace(
      /NextResponse\.json\(/g,
      (match) => {
        updated = true;
        return 'ApiResponseHandler.success(';
      }
    );
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
    }
    
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

// Main execution
console.log('🔄 Starting to fix remaining issues...\n');

const srcDir = path.join(__dirname, '..', 'src');
const tsFiles = findTsFiles(srcDir);

console.log(`📁 Found ${tsFiles.length} TypeScript files to process\n`);

tsFiles.forEach(file => {
  fixRemainingIssues(file);
});

console.log('\n🎉 Remaining issues fixed!');
console.log('\n📋 Next steps:');
console.log('1. Check TypeScript compilation');
console.log('2. Test the APIs');
console.log('3. Add input validation where needed');
