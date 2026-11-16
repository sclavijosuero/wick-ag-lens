// To run the build.js:
// >  node build.js
// ------------------------------------------

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, 'core');
const extensionDest = path.join(__dirname, 'extension', 'core');
const cliDest = path.join(__dirname, 'cli', 'core');

function buildTarget(src, dest, targetName) {
  try {
    // 1. Clean the destination directory if it already exists
    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { recursive: true, force: true });
    }

    // 2. Create the destination directory structure
    fs.mkdirSync(dest, { recursive: true });

    // 3. Copy the files recursively (Requires Node.js 16.7.0+)
    fs.cpSync(src, dest, { recursive: true });
    
  } catch (err) {
    console.error(`❌ [Error] Failed to build ${targetName}:`, err);
    process.exit(1);
  }
}

console.log('Starting WICK-AG-Lens build process...\n');

buildTarget(sourceDir, extensionDest, 'Extension');
buildTarget(sourceDir, cliDest, 'CLI');

// Final Success Messages
console.log('✅ WICK-AG-Lens v3.0.0 Build Complete.');
console.log('   📦 The /extension folder is ready for the Chrome Web Store.');
console.log('   🚀 The /cli folder is ready for npm publishing.');