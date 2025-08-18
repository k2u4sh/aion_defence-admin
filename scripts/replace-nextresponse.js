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

// Function to replace NextResponse.json calls
function replaceNextResponse(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Pattern 1: Simple success response
    // NextResponse.json({ message: "...", success: true, data: ... }, { status: 200 })
    // -> ApiResponseHandler.success(data, message)
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
    
    // Pattern 2: Simple error response
    // NextResponse.json({ message: "...", success: false }, { status: 400 })
    // -> ApiResponseHandler.error(message, status)
    content = content.replace(
      /NextResponse\.json\(\s*{\s*message:\s*["']([^"']+)["'],\s*success:\s*false\s*}\s*,\s*{\s*status:\s*(\d+)\s*}\s*\)/g,
      (match, message, status) => {
        updated = true;
        return `ApiResponseHandler.error("${message}", ${status})`;
      }
    );
    
    // Pattern 3: Error response with data
    // NextResponse.json({ message: "...", success: false, error: ... }, { status: 500 })
    // -> ApiResponseHandler.error(message, status)
    content = content.replace(
      /NextResponse\.json\(\s*{\s*message:\s*["']([^"']+)["'],\s*success:\s*false,?\s*error:\s*[^}]*\s*}\s*,\s*{\s*status:\s*(\d+)\s*}\s*\)/g,
      (match, message, status) => {
        updated = true;
        return `ApiResponseHandler.error("${message}", ${status})`;
      }
    );
    
    // Pattern 4: Common status codes
    // 400 -> validationError
    content = content.replace(
      /NextResponse\.json\(\s*{\s*message:\s*["']([^"']+)["'],\s*success:\s*false\s*}\s*,\s*{\s*status:\s*400\s*}\s*\)/g,
      (match, message) => {
        updated = true;
        return `ApiResponseHandler.validationError({}, "${message}")`;
      }
    );
    
    // 401 -> unauthorized
    content = content.replace(
      /NextResponse\.json\(\s*{\s*message:\s*["']([^"']+)["'],\s*success:\s*false\s*}\s*,\s*{\s*status:\s*401\s*}\s*\)/g,
      (match, message) => {
        updated = true;
        return `ApiResponseHandler.unauthorized("${message}")`;
      }
    );
    
    // 403 -> forbidden
    content = content.replace(
      /NextResponse\.json\(\s*{\s*message:\s*["']([^"']+)["'],\s*success:\s*false\s*}\s*,\s*{\s*status:\s*403\s*}\s*\)/g,
      (match, message) => {
        updated = true;
        return `ApiResponseHandler.forbidden("${message}")`;
      }
    );
    
    // 404 -> notFound
    content = content.replace(
      /NextResponse\.json\(\s*{\s*message:\s*["']([^"']+)["'],\s*success:\s*false\s*}\s*,\s*{\s*status:\s*404\s*}\s*\)/g,
      (match, message) => {
        updated = true;
        return `ApiResponseHandler.notFound("${message}")`;
      }
    );
    
    // 409 -> conflict
    content = content.replace(
      /NextResponse\.json\(\s*{\s*message:\s*["']([^"']+)["'],\s*success:\s*false\s*}\s*,\s*{\s*status:\s*409\s*}\s*\)/g,
      (match, message) => {
        updated = true;
        return `ApiResponseHandler.conflict("${message}")`;
      }
    );
    
    // 500 -> error
    content = content.replace(
      /NextResponse\.json\(\s*{\s*message:\s*["']([^"']+)["'],\s*success:\s*false\s*}\s*,\s*{\s*status:\s*500\s*}\s*\)/g,
      (match, message) => {
        updated = true;
        return `ApiResponseHandler.error("${message}", 500)`;
      }
    );
    
    // Pattern 5: Generic NextResponse.json replacement
    // For any remaining NextResponse.json calls, try to convert them
    content = content.replace(
      /NextResponse\.json\(\s*{\s*message:\s*["']([^"']+)["'],\s*success:\s*(true|false),?\s*data:\s*([^}]+)\s*}\s*,\s*{\s*status:\s*(\d+)\s*}\s*\)/g,
      (match, message, success, data, status) => {
        updated = true;
        if (success === 'true') {
          if (status === '200') {
            return `ApiResponseHandler.success(${data}, "${message}")`;
          } else {
            return `ApiResponseHandler.success(${data}, "${message}", ${status})`;
          }
        } else {
          return `ApiResponseHandler.error("${message}", ${status})`;
        }
      }
    );
    
    // Pattern 6: Simple success without data
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
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
    }
    
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
}

// Main execution
console.log('🔄 Starting NextResponse replacement...\n');

const srcDir = path.join(__dirname, '..', 'src');
const tsFiles = findTsFiles(srcDir);

console.log(`📁 Found ${tsFiles.length} TypeScript files to process\n`);

tsFiles.forEach(file => {
  replaceNextResponse(file);
});

console.log('\n🎉 NextResponse replacement completed!');
console.log('\n📋 Next steps:');
console.log('1. Review the updated files');
console.log('2. Test the APIs');
console.log('3. Add input validation where needed');
console.log('4. Customize error messages if needed');
