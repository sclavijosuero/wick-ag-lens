const fs = require('fs');
const path = require('path');

const CORE_DIR = path.join(__dirname, 'core');
const EXT_CORE_DIR = path.join(__dirname, 'extension', 'core');

// Clean and recreate the extension/core directory
if (fs.existsSync(EXT_CORE_DIR)) {
    fs.rmSync(EXT_CORE_DIR, { recursive: true, force: true });
}
fs.mkdirSync(EXT_CORE_DIR, { recursive: true });

// Copy all core files into the extension artifact
fs.readdirSync(CORE_DIR).forEach(file => {
    const srcFile = path.join(CORE_DIR, file);
    const destFile = path.join(EXT_CORE_DIR, file);
    if (fs.statSync(srcFile).isFile()) {
        fs.copyFileSync(srcFile, destFile);
        console.log(`[Build] Copied ${file} to extension/core/`);
    }
});

console.log('✅ WICK-AG-Lens v3.0.0 Build Complete. The /extension folder is ready for the Web Store.');