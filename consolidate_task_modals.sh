#!/bin/bash
TARGET="src/components/tasks/TaskWorkspace.tsx"

# Create the new file with TaskDetailModal as base
cat src/components/tasks/TaskDetailModal.tsx > $TARGET

# Remove imports
sed -i '/import { EvidenceManager } from/d' $TARGET
sed -i '/import { CompletionEvidenceModal } from/d' $TARGET

# Append EvidenceManager
echo "" >> $TARGET
echo "// --- START OF EvidenceManager.tsx ---" >> $TARGET
cat src/components/tasks/EvidenceManager.tsx | grep -v "^import " >> $TARGET

# Append CompletionEvidenceModal
echo "" >> $TARGET
echo "// --- START OF CompletionEvidenceModal.tsx ---" >> $TARGET
cat src/components/tasks/CompletionEvidenceModal.tsx | grep -v "^import " >> $TARGET

# Append TaskCreateModal
echo "" >> $TARGET
echo "// --- START OF TaskCreateModal.tsx ---" >> $TARGET
cat src/components/tasks/TaskCreateModal.tsx | grep -v "^import " >> $TARGET

# Fix top-level components
cat << 'JS_EOF' > fix_workspace.cjs
const fs = require('fs');
let code = fs.readFileSync('src/components/tasks/TaskWorkspace.tsx', 'utf-8');

const parts = code.split('// --- START OF');
let newCode = parts[0];

for (let i = 1; i < parts.length; i++) {
  let part = parts[i];
  
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
  
  newCode += '\n// --- START OF\n' + part;
}

fs.writeFileSync('src/components/tasks/TaskWorkspace.tsx', newCode);
JS_EOF
node fix_workspace.cjs

