module.exports = async () => {
  console.log('\n🧹 Global teardown: Cleaning up test resources...');
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  console.log('✅ Teardown complete');
};
