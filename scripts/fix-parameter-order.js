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

// Function to fix parameter order issues in a file
function fixParameterOrder(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Fix ApiResponseHandler.success calls with wrong parameter order
    // Pattern: ApiResponseHandler.success(data, number) -> ApiResponseHandler.success(data, "Success", number)
    content = content.replace(
      /ApiResponseHandler\.success\(([^,]+),\s*(\d+)\)/g,
      (match, data, status) => {
        updated = true;
        return `ApiResponseHandler.success(${data}, "Success", ${status})`;
      }
    );
    
    // Fix ApiResponseHandler.error calls with wrong parameter order
    // Pattern: ApiResponseHandler.error(message, number) -> ApiResponseHandler.error(message, number)
    // This is already correct, no changes needed
    
    // Fix any remaining parameter order issues
    // Look for patterns where the second parameter is a number but should be a string
    content = content.replace(
      /ApiResponseHandler\.(success|error|validationError|notFound|unauthorized|forbidden|conflict)\(([^,]+),\s*(\d+)\)/g,
      (match, method, firstParam, secondParam) => {
        updated = true;
        if (method === 'success') {
          return `ApiResponseHandler.${method}(${firstParam}, "Success", ${secondParam})`;
        } else if (method === 'error') {
          return `ApiResponseHandler.${method}(${firstParam}, ${secondParam})`;
        } else {
          return `ApiResponseHandler.${method}(${firstParam})`;
        }
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
console.log('🔄 Starting to fix parameter order issues...\n');

const srcDir = path.join(__dirname, '..', 'src');
const tsFiles = findTsFiles(srcDir);

console.log(`📁 Found ${tsFiles.length} TypeScript files to process\n`);

tsFiles.forEach(file => {
  fixParameterOrder(file);
});

console.log('\n🎉 Parameter order issues fixed!');
console.log('\n📋 Next steps:');
console.log('1. Check TypeScript compilation again');
console.log('2. Test the APIs');
console.log('3. Add input validation where needed');
