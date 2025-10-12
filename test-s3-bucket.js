/**
 * Test S3 bucket access and permissions
 */

require('dotenv').config();
const { S3Client, ListObjectsV2Command, PutObjectCommand } = require('@aws-sdk/client-s3');

async function testS3BucketAccess() {
  console.log('🪣 Testing S3 Bucket Access...\n');

  try {
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'ap-south-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    const bucketName = process.env.AWS_S3_BUCKET_NAME || 'aiondefence';

    // Test 1: List objects in bucket
    console.log('📋 Testing bucket list access...');
    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: 5
      });
      
      const listResult = await s3Client.send(listCommand);
      console.log('✅ Bucket list access: SUCCESS');
      console.log('   📁 Objects found:', listResult.Contents?.length || 0);
      
      if (listResult.Contents && listResult.Contents.length > 0) {
        console.log('   📄 Sample objects:');
        listResult.Contents.slice(0, 3).forEach((obj, index) => {
          console.log(`      ${index + 1}. ${obj.Key} (${obj.Size} bytes)`);
        });
      }
    } catch (error) {
      console.log('❌ Bucket list access: FAILED');
      console.log('   Error:', error.message);
    }

    // Test 2: Upload a test file
    console.log('\n📤 Testing file upload...');
    try {
      const testContent = 'This is a test file for S3 upload verification.';
      const testKey = `test-uploads/test-${Date.now()}.txt`;

      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: testContent,
        ContentType: 'text/plain',
        ACL: 'public-read'
      });

      await s3Client.send(putCommand);
      console.log('✅ File upload: SUCCESS');
      console.log('   🔗 Test file URL: https://' + bucketName + '.s3.' + process.env.AWS_REGION + '.amazonaws.com/' + testKey);
      
    } catch (error) {
      console.log('❌ File upload: FAILED');
      console.log('   Error:', error.message);
    }

  } catch (error) {
    console.error('❌ S3 Bucket test failed:', error.message);
  }

  console.log('\n🎉 S3 Bucket Access Test Complete!');
}

// Run the test
testS3BucketAccess();
