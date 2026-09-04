const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/ExecutiveDashboard.tsx', 'utf-8');

// We have multiple imports in the middle of the file.
// Let's just remove anything that looks like an import block in the middle of the file.
// We will split the file by "// --- START OF" 
const parts = code.split('// --- START OF');
let newCode = parts[0];

for (let i = 1; i < parts.length; i++) {
  let part = parts[i];
  // Remove all lines until the first line that is not an import and not part of a multiline import.
  // Actually, standard regex for import replacement:
  part = part.replace(/import\s+[^;]+;\n/g, ''); // matches single-line imports
  // For multi-line imports, it's harder. Let's just regex all `import { ... } from '...';`
  part = part.replace(/import\s+{[\s\S]*?}\s+from\s+['"][^'"]+['"];/g, '');
  
  // also handle "import React, { ... } from 'react';"
  part = part.replace(/import\s+React[\s\S]*?from\s+['"][^'"]+['"];/g, '');

  // What if it is not matched by the above? Let's just remove lines that start with import, 
  // and if it doesn't end with ;, remove next lines until ;
  
  let lines = part.split('\n');
  let cleaned = [];
  let inImport = false;
  for (let line of lines) {
    if (line.trim().startsWith('import ') && !line.includes(';')) {
      inImport = true;
      continue;
    }
    if (inImport) {
      if (line.includes(';')) {
        inImport = false;
      }
      continue;
    }
    if (line.trim().startsWith('import ') && line.includes(';')) {
      continue;
    }
    cleaned.push(line);
  }
  
  newCode += '\n// --- START OF' + cleaned.join('\n');
}

fs.writeFileSync('src/components/dashboard/ExecutiveDashboard.tsx', newCode);
