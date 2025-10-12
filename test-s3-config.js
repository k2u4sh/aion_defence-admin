/**
 * Test S3 configuration and credentials
 */

require('dotenv').config();

console.log('🔧 Testing S3 Configuration...\n');

console.log('Environment Variables:');
console.log('AWS_REGION:', process.env.AWS_REGION || 'NOT SET');
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'NOT SET');
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET');
console.log('AWS_S3_BUCKET_NAME:', process.env.AWS_S3_BUCKET_NAME || 'NOT SET');
console.log('NEXT_PUBLIC_S3_BUCKET_URL:', process.env.NEXT_PUBLIC_S3_BUCKET_URL || 'NOT SET');

console.log('\n🧪 Testing S3 Client Initialization...');

try {
  const { S3Client } = require('@aws-sdk/client-s3');
  
  const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });

  console.log('✅ S3 Client initialized successfully');
  console.log('   Region:', s3Client.config.region);
  console.log('   Credentials configured:', !!s3Client.config.credentials);

} catch (error) {
  console.error('❌ S3 Client initialization failed:', error.message);
}

console.log('\n🎯 Configuration Test Complete!');
