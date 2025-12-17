import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outDir = path.join(__dirname, '../out');

function getAllHtmlFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllHtmlFiles(filePath, fileList);
    } else {
      if (path.extname(file) === '.html') {
        fileList.push(filePath);
      }
    }
  });
  return fileList;
}

function adjustPaths() {
  if (!fs.existsSync(outDir)) {
    console.log('No out directory found.');
    return;
  }

  const htmlFiles = getAllHtmlFiles(outDir);

  htmlFiles.forEach(filePath => {
    const relativePath = path.relative(outDir, filePath);
    // e.g. "index.html" (depth 0)
    // "dashboard/index.html" (depth 1)
    
    // Split by separator and count directories to determine depth
    const depth = relativePath.split(path.sep).length - 1;
    
    if (depth === 0) return; // Root files are fine with ./

    const prefix = '../'.repeat(depth); 

    let content = fs.readFileSync(filePath, 'utf8');

    // Replace assetPrefix "./" and ".//" with calculated prefix
    // Target _next and favicon which are common references that break under file:// on nested pages
    content = content.replace(/(src|href)="\.\/_next/g, `$1="${prefix}_next`);
    content = content.replace(/(src|href)="\.\/\/(_next)/g, `$1="${prefix}$2`);

    // Fix root-absolute favicon/icon paths
    content = content.replace(/(src|href)="\/favicon\.ico/g, `$1="${prefix}favicon.ico`);
    content = content.replace(/(src|href)="\.\/favicon/g, `$1="${prefix}favicon`);
    
    fs.writeFileSync(filePath, content);
    console.log(`Adjusted paths for ${relativePath} (depth ${depth})`);
  });
}

adjustPaths();
