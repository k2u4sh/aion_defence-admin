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

// Function to fix final issues in a file
function fixFinalIssues(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Fix the { status: number } syntax that was incorrectly converted
    content = content.replace(
      /ApiResponseHandler\.(success|error|validationError|notFound|unauthorized|forbidden|conflict)\([^,]+,\s*[^,]+,\s*{\s*status:\s*(\d+)\s*}\)/g,
      (match, method, status) => {
        updated = true;
        if (method === 'success') {
          return `ApiResponseHandler.success(null, "Success", ${status})`;
        } else {
          return `ApiResponseHandler.${method}("Error", ${status})`;
        }
      }
    );
    
    // Fix any remaining { status: number } patterns
    content = content.replace(
      /,\s*{\s*status:\s*(\d+)\s*}\s*\)/g,
      (match, status) => {
        updated = true;
        return `, ${status})`;
      }
    );
    
    // Fix the specific pattern: ApiResponseHandler.success(data, message, { status: number })
    content = content.replace(
      /ApiResponseHandler\.success\(([^,]+),\s*([^,]+),\s*{\s*status:\s*(\d+)\s*}\)/g,
      (match, data, message, status) => {
        updated = true;
        return `ApiResponseHandler.success(${data}, ${message}, ${status})`;
      }
    );
    
    // Fix the specific pattern: ApiResponseHandler.error(message, { status: number })
    content = content.replace(
      /ApiResponseHandler\.error\(([^,]+),\s*{\s*status:\s*(\d+)\s*}\)/g,
      (match, message, status) => {
        updated = true;
        return `ApiResponseHandler.error(${message}, ${status})`;
      }
    );
    
    // Fix the specific pattern: ApiResponseHandler.validationError(errors, { status: number })
    content = content.replace(
      /ApiResponseHandler\.validationError\(([^,]+),\s*{\s*status:\s*(\d+)\s*}\)/g,
      (match, errors, status) => {
        updated = true;
        return `ApiResponseHandler.validationError(${errors}, "Validation failed")`;
      }
    );
    
    // Fix the specific pattern: ApiResponseHandler.notFound(message, { status: number })
    content = content.replace(
      /ApiResponseHandler\.notFound\(([^,]+),\s*{\s*status:\s*(\d+)\s*}\)/g,
      (match, message, status) => {
        updated = true;
        return `ApiResponseHandler.notFound(${message})`;
      }
    );
    
    // Fix the specific pattern: ApiResponseHandler.unauthorized(message, { status: number })
    content = content.replace(
      /ApiResponseHandler\.unauthorized\(([^,]+),\s*{\s*status:\s*(\d+)\s*}\)/g,
      (match, message, status) => {
        updated = true;
        return `ApiResponseHandler.unauthorized(${message})`;
      }
    );
    
    // Fix the specific pattern: ApiResponseHandler.forbidden(message, { status: number })
    content = content.replace(
      /ApiResponseHandler\.forbidden\(([^,]+),\s*{\s*status:\s*(\d+)\s*}\)/g,
      (match, message, status) => {
        updated = true;
        return `ApiResponseHandler.forbidden(${message})`;
      }
    );
    
    // Fix the specific pattern: ApiResponseHandler.conflict(message, { status: number })
    content = content.replace(
      /ApiResponseHandler\.conflict\(([^,]+),\s*{\s*status:\s*(\d+)\s*}\)/g,
      (match, message, status) => {
        updated = true;
        return `ApiResponseHandler.conflict(${message})`;
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
console.log('🔄 Starting to fix final issues...\n');

const srcDir = path.join(__dirname, '..', 'src');
const tsFiles = findTsFiles(srcDir);

console.log(`📁 Found ${tsFiles.length} TypeScript files to process\n`);

tsFiles.forEach(file => {
  fixFinalIssues(file);
});

console.log('\n🎉 Final issues fixed!');
console.log('\n📋 Next steps:');
console.log('1. Check TypeScript compilation again');
console.log('2. Test the APIs');
console.log('3. Add input validation where needed');
