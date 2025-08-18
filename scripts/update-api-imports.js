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

// Function to update imports in a file
function updateImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Update database connection imports
    if (content.includes('@/dbConfig/dbConfig')) {
      content = content.replace(
        /from ["']@\/dbConfig\/dbConfig["']/g,
        'from "@/utils/db"'
      );
      updated = true;
    }
    
    // Update NextResponse imports to remove NextResponse
    if (content.includes('NextResponse') && content.includes('NextRequest')) {
      content = content.replace(
        /import \{ NextRequest, NextResponse \} from ["']next\/server["']/g,
        'import { NextRequest } from "next/server"'
      );
      updated = true;
    }
    
    // Add new utility imports if file contains API logic
    if (content.includes('export async function') && !content.includes('@/utils/apiResponse')) {
      // Check if it's an API route
      if (content.includes('NextRequest') || content.includes('request: NextRequest')) {
        // Add the new imports after existing imports
        const importRegex = /(import.*from.*["'].*["'];?\n?)/g;
        const imports = content.match(importRegex) || [];
        
        if (imports.length > 0) {
          const lastImport = imports[imports.length - 1];
          const newImports = `import { ApiResponseHandler, ErrorMessages, SuccessMessages } from "@/utils/apiResponse";\nimport { Validator, ValidationSchemas } from "@/utils/validation";\n`;
          
          content = content.replace(lastImport, lastImport + newImports);
          updated = true;
        }
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
    }
    
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
}

// Main execution
console.log('🔄 Starting API import updates...\n');

const srcDir = path.join(__dirname, '..', 'src');
const tsFiles = findTsFiles(srcDir);

console.log(`📁 Found ${tsFiles.length} TypeScript files to process\n`);

tsFiles.forEach(file => {
  updateImports(file);
});

console.log('\n🎉 API import updates completed!');
console.log('\n📋 Next steps:');
console.log('1. Review the updated files');
console.log('2. Replace NextResponse.json calls with ApiResponseHandler');
console.log('3. Add input validation where needed');
console.log('4. Test the APIs');
