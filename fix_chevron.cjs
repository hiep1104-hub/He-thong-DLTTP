const fs = require('fs');

function fixIcons(path) {
  let content = fs.readFileSync(path, 'utf8');
  const possibleIcons = [
    'ChevronUp', 'ChevronDown', 'Eye', 'EyeOff', 'Edit', 'Edit2', 'Edit3'
  ];

  for (const icon of possibleIcons) {
    if (content.includes(`<${icon} `) || content.includes(` ${icon},`) || content.includes(`{${icon}}`) || content.includes(` ${icon} `)) {
      if (!content.includes(`  ${icon},`) && !content.includes(`  ${icon}\n`)) {
        content = content.replace(/} from 'lucide-react';/, `  ${icon},\n} from 'lucide-react';`);
      }
    }
  }
  fs.writeFileSync(path, content);
}

fixIcons('src/components/tasks/TaskWorkspace.tsx');
fixIcons('src/components/tasks/TasksHubView.tsx');
