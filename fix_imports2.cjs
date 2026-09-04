const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/ExecutiveDashboard.tsx', 'utf-8');

const parts = code.split('// --- START OF');
let newCode = parts[0];

for (let i = 1; i < parts.length; i++) {
  let part = parts[i];
  
  // Find the index of the first `export ` or `interface ` or `const ` that is at the top level
  let firstExportIndex = part.indexOf('export ');
  let firstInterfaceIndex = part.indexOf('interface ');
  
  let validIndex = -1;
  if (firstExportIndex !== -1 && firstInterfaceIndex !== -1) {
    validIndex = Math.min(firstExportIndex, firstInterfaceIndex);
  } else {
    validIndex = Math.max(firstExportIndex, firstInterfaceIndex);
  }
  
  if (validIndex !== -1) {
    part = part.substring(validIndex);
  }
  
  newCode += '\n// --- START OF' + part;
}

fs.writeFileSync('src/components/dashboard/ExecutiveDashboard.tsx', newCode);
