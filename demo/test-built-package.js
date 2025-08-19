// Test script to verify the built package works correctly
const path = require('path');

// Test importing the built package
try {
  console.log('Testing built package...');
  
  // Test CommonJS import
  const cjsPackage = require('../dist/index.js');
  console.log('✅ CommonJS import successful');
  console.log('Available exports:', Object.keys(cjsPackage));
  console.log('PRODUCTION constant:', cjsPackage.PRODUCTION);
  console.log('SANDBOX constant:', cjsPackage.SANDBOX);
  
  // Test that ReactAuthnetIFrame is available
  if (cjsPackage.ReactAuthnetIFrame) {
    console.log('✅ ReactAuthnetIFrame component available');
  } else {
    console.log('❌ ReactAuthnetIFrame component not found');
  }
  
  console.log('\n🎉 Package build verification successful!');
  
} catch (error) {
  console.error('❌ Package build verification failed:', error.message);
  process.exit(1);
}

