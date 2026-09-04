const fs = require('fs');

const path = 'src/components/dashboard/ExecutiveDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const missingIcons = ['Plane', 'CreditCard', 'UserPlus', 'ChevronDown', 'Trash2', 'StickyNote', 'Circle'];
for (const icon of missingIcons) {
  if (content.includes(`<${icon} `) || content.includes(` ${icon},`) || content.includes(`{${icon}}`) || content.includes(` ${icon} `)) {
    if (!content.includes(`  ${icon},`) && !content.includes(`  ${icon}\n`)) {
      content = content.replace(/} from 'lucide-react';/, `  ${icon},\n} from 'lucide-react';`);
    }
  }
}

fs.writeFileSync(path, content);
