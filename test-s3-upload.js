/**
 * Simple test script to verify S3 upload functionality
 */

const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testS3Upload() {
  try {
    console.log('🧪 Testing S3 Upload Functionality...\n');

    // Create a simple test image file (1x1 pixel PNG)
    const testImageData = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    // Test 1: General upload API
    console.log('📤 Testing general upload API...');
    const formData1 = new FormData();
    formData1.append('files', testImageData, {
      filename: 'test-image.png',
      contentType: 'image/png'
    });
    formData1.append('folder', 'test-uploads');
    formData1.append('type', 'image');

    const response1 = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData1,
    });

    const result1 = await response1.json();
    console.log('✅ General upload result:', result1.success ? 'SUCCESS' : 'FAILED');
    if (result1.success) {
      console.log('   📁 Files uploaded:', result1.files.length);
      console.log('   🔗 Sample URL:', result1.files[0]?.url);
    } else {
      console.log('   ❌ Error:', result1.message);
    }

    console.log('\n📤 Testing product upload API...');
    const formData2 = new FormData();
    formData2.append('files', testImageData, {
      filename: 'test-product-image.png',
      contentType: 'image/png'
    });
    formData2.append('kind', 'image');
    formData2.append('productId', 'test-product-123');

    const response2 = await fetch('http://localhost:3000/api/products/upload', {
      method: 'POST',
      body: formData2,
    });

    const result2 = await response2.json();
    console.log('✅ Product upload result:', result2.success ? 'SUCCESS' : 'FAILED');
    if (result2.success) {
      console.log('   📁 Files uploaded:', result2.data.files.length);
      console.log('   🔗 Sample URL:', result2.data.files[0]?.url);
      console.log('   📂 Folder:', result2.data.folder);
    } else {
      console.log('   ❌ Error:', result2.message);
    }

    console.log('\n🎉 S3 Upload Test Complete!');
    
    if (result1.success && result2.success) {
      console.log('✅ All tests passed! S3 upload functionality is working correctly.');
    } else {
      console.log('❌ Some tests failed. Check the error messages above.');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testS3Upload();
