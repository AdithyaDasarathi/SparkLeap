// Simple test script to verify output
console.error('This is a simple test script');
console.log('This is a log message');
process.stderr.write('Direct stderr write\n');
process.stdout.write('Direct stdout write\n');

// Print environment information
console.error('Node version:', process.version);
console.error('Current directory:', process.cwd());

// Exit with success
console.error('Test completed successfully');
