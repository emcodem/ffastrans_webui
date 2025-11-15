const fs = require('fs');
const path = require('path');

// Configuration: Define what to copy
const COPY_CONFIG = [
    { src: 'dist/server.exe', dest: 'server.exe', type: 'file', required: true },
    { src: 'service_install.bat', dest: 'service_install.bat', type: 'file', required: true },
    { src: 'service_uninstall.bat', dest: 'service_uninstall.bat', type: 'file', required: true },
    { src: 'tools', dest: 'tools', type: 'dir', required: true },
    { src: 'cert', dest: 'cert', type: 'dir', required: true },
    // { src: 'node_modules/engine.io-parser', dest: 'node_modules/engine.io-parser', type: 'dir', required: true },
    // { src: 'node_modules/socket.io', dest: 'node_modules/socket.io', type: 'dir', required: true },
    // { src: 'node_modules/socket.io-parser', dest: 'node_modules/socket.io-parser', type: 'dir', required: true }
];

// Utility function to copy directory recursively
function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Utility function to copy file
function copyFile(src, dest) {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
}

// Copy items based on configuration
function copyItems(packageDir, baseDir) {
    console.log('📋 Copying files and folders...');
    
    for (const item of COPY_CONFIG) {
        const srcPath = path.join(baseDir, item.src);
        const destPath = path.join(packageDir, item.dest);
        
        if (!fs.existsSync(srcPath)) {
            if (item.required) {
                console.error(`❌ Error: Required ${item.type} not found: ${item.src}`);
                if (item.src === 'dist/server.exe') {
                    console.log('   Run your build script to create server.exe');
                } else if (item.src.startsWith('node_modules/')) {
                    console.log('   Run npm install first');
                }
                process.exit(1);
            } else {
                console.warn(`⚠️  Warning: Optional ${item.type} not found: ${item.src}`);
                continue;
            }
        }
        
        if (item.type === 'file') {
            console.log(`   📄 ${item.src} → ${item.dest}`);
            copyFile(srcPath, destPath);
        } else if (item.type === 'dir') {
            console.log(`   📂 ${item.src}/ → ${item.dest}/`);
            copyDir(srcPath, destPath);
        }
    }
}

// Print directory tree
function printTree(dir, prefix = '', isLast = true, maxDepth = 2, currentDepth = 0) {
    const items = [];
    
    if (currentDepth >= maxDepth) {
        return items;
    }
    
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        entries.sort((a, b) => {
            // Directories first, then files
            if (a.isDirectory() && !b.isDirectory()) return -1;
            if (!a.isDirectory() && b.isDirectory()) return 1;
            return a.name.localeCompare(b.name);
        });
        
        entries.forEach((entry, index) => {
            const isLastEntry = index === entries.length - 1;
            const connector = isLastEntry ? '└──' : '├──';
            const newPrefix = prefix + (isLastEntry ? '    ' : '│   ');
            
            const itemPath = path.join(dir, entry.name);
            
            if (entry.isDirectory()) {
                items.push(`${prefix}${connector} ${entry.name}/`);
                const subItems = printTree(itemPath, newPrefix, isLastEntry, maxDepth, currentDepth + 1);
                items.push(...subItems);
            } else {
                items.push(`${prefix}${connector} ${entry.name}`);
            }
        });
    } catch (error) {
        items.push(`${prefix}[Error reading directory: ${error.message}]`);
    }
    
    return items;
}

// Print package contents from filesystem
function printPackageContents(packageDir, packageName) {
    console.log('\n✅ Package created successfully!');
    console.log(`📦 Location: redist/${packageName}`);
    console.log(`\n📋 Package contents:`);
    
    const tree = printTree(packageDir);
    tree.forEach(line => console.log(line));
}

// Main packaging function
async function createPackage() {
    console.log('🚀 Starting packaging process...');
    
    const baseDir = path.join(__dirname, '..');
    
    // 1. Read version from webinterface/version.txt
    const versionPath = path.join(baseDir, 'webinterface', 'version.txt');
    if (!fs.existsSync(versionPath)) {
        console.error('❌ Error: webinterface/version.txt not found!');
        process.exit(1);
    }
    
    const version = fs.readFileSync(versionPath, 'utf8').trim();
    console.log(`📋 Version: ${version}`);
    
    // 2. Create package directory name
    const packageName = `webinterface_${version}`;
    const packageDir = path.join(baseDir, 'redist', packageName);
    
    // Clean existing package directory
    if (fs.existsSync(packageDir)) {
        console.log(`🧹 Removing existing package directory...`);
        fs.rmSync(packageDir, { recursive: true, force: true });
    }
    
    console.log(`📁 Creating package directory: ${packageName}`);
    fs.mkdirSync(packageDir, { recursive: true });
    
    // 3. Copy all configured items
    copyItems(packageDir, baseDir);
    
    // 4. Print actual package contents from filesystem
    printPackageContents(packageDir, packageName);
}

// Run the packaging
createPackage().catch(error => {
    console.error('❌ Packaging failed:', error);
    process.exit(1);
});