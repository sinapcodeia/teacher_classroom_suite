const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // Handle normalizeGrade, parseFlexibleFloat, sanitizeText imports from AppContext
      const regex = /import\s+\{([^}]+)\}\s+from\s+["']@\/context\/AppContext["']/g;
      let match;
      let newContent = content;

      while ((match = regex.exec(content)) !== null) {
        const imports = match[1].split(',').map(s => s.trim());
        const toMove = imports.filter(i => ['normalizeGrade', 'parseFlexibleFloat', 'sanitizeText'].includes(i));
        const toKeep = imports.filter(i => !['normalizeGrade', 'parseFlexibleFloat', 'sanitizeText'].includes(i));

        if (toMove.length > 0) {
          let replacement = '';
          if (toKeep.length > 0) {
            replacement = `import { ${toKeep.join(', ')} } from "@/context/AppContext";`;
          }
          newContent = newContent.replace(match[0], replacement);
          newContent = `import { ${toMove.join(', ')} } from "@/lib/constants";\n` + newContent;
          changed = true;
        }
      }

      if (changed) {
        fs.writeFileSync(fullPath, newContent);
        console.log('Fixed imports: ' + fullPath);
      }
    }
  }
}
processDir('src');
