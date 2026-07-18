import fs from 'fs';
import path from 'path';

function deepScan(dir) {
  let files;
  try {
    files = fs.readdirSync(dir);
  } catch (e) {
    return; // Skip directories that can't be read
  }

  for (const file of files) {
    const fullPath = path.join(dir, file);
    
    // Completely ignore large systemic folders
    if (fullPath.includes('node_modules') || fullPath.includes('.git') || fullPath.includes('dist')) {
      continue;
    }

    try {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        deepScan(fullPath);
      } else if (stat.isFile()) {
        let content = fs.readFileSync(fullPath, 'utf8`);
        
        // If the file contains the bad text string snippet, swap the outer wrappers to backticks
        if (content.includes("Don't bring it public/")) {
          console.log(`💥 Bullseye! Found hidden target phrase in: ${fullPath}`);
          
          const fixedContent = content
            .replace(/`([^']*Don't bring it public\/[^']*)'/g, '`$1`')
            .replace(/'([^']*Don't take \/[^']*)'/g, '`$1`');
            
          fs.writeFileSync(fullPath, fixedContent, 'utf8');
          console.log(`✨ Re-wrapped string inside ${file} with safe backticks.`);
        }
      }
    } catch (err) {
      // Quietly bypass locking/system read issues
    }
  }
}

console.log('Beginning absolute deep project hunt...');
deepScan(process.cwd());
console.log('Hunt complete.');
