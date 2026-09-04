const fs = require('fs');

const path = 'src/components/tasks/TasksHubView.tsx';
let content = fs.readFileSync(path, 'utf8');

const possibleIcons = [
  'Search', 'Filter', 'LayoutList', 'Kanban', 'Calendar as CalendarIcon', 'Building', 
  'Building2', 'UserCheck', 'AlertTriangle', 'Clock', 'CheckCircle2', 'FileText', 'Plus', 
  'ArrowUpDown', 'ChevronRight', 'ShieldAlert', 'Paperclip', 'CheckSquare', 'Zap', 
  'Calendar', 'Layers', 'DollarSign', 'Tag', 'FileSpreadsheet', 'ListFilter', 'Users',
  'MessageSquare', 'MoreHorizontal', 'CalendarRange', 'ExternalLink', 'ArrowRight'
];

for (const icon of possibleIcons) {
  const iconName = icon.split(' as ')[0];
  if (content.includes(`<${iconName} `) || content.includes(` ${iconName},`) || content.includes(`{${iconName}}`) || content.includes(` ${iconName} `)) {
    if (!content.includes(`  ${icon},`) && !content.includes(`  ${icon}\n`)) {
      content = content.replace(/} from 'lucide-react';/, `  ${icon},\n} from 'lucide-react';`);
    }
  }
}

fs.writeFileSync(path, content);
