const fs = require('fs');
const path = 'src/components/tasks/TaskWorkspace.tsx';
let content = fs.readFileSync(path, 'utf8');

const additionalImports = `
import { storageService, CURRENT_SYSTEM_DATE } from '../../services/storageService';
import { 
  formatDate, 
  PRIORITY_LABELS, 
  RISK_LABELS, 
  STATUS_LABELS, 
  DEPARTMENT_LABELS, 
  getTaskNature, 
  TaskNature, 
  TASK_NATURE_LABELS,
  formatCurrency 
} from '../../utils/formatters';
import { PermissionService } from '../../utils/permissions';
import { TaskStatus, TaskPriority, TaskRiskLevel, Department, ChecklistTemplate, AdHocServiceItem, ChecklistItem } from '../../types';
`;

content = content.replace(/import React, { useState, useMemo, useEffect } from 'react';/, `import React, { useState, useMemo, useEffect, useRef } from 'react';\n${additionalImports}`);

// Also fix missing icons
const possibleIcons = [
  'Search', 'Filter', 'LayoutList', 'Kanban', 'Calendar as CalendarIcon', 'Building', 
  'Building2', 'UserCheck', 'AlertTriangle', 'Clock', 'CheckCircle2', 'FileText', 'Plus', 
  'ArrowUpDown', 'ChevronRight', 'ShieldAlert', 'Paperclip', 'CheckSquare', 'Zap', 
  'Calendar', 'Layers', 'DollarSign', 'Tag', 'FileSpreadsheet', 'ListFilter', 'Users',
  'MessageSquare', 'MoreHorizontal', 'Upload', 'X', 'AlertCircle', 'ExternalLink', 'Image',
  'File', 'Link', 'MessageCircle', 'Play', 'Check', 'Trash2', 'FolderOpen', 'Camera', 'CalendarDays',
  'ShieldCheck', 'Settings', 'Maximize2', 'Minimize2', 'AlignLeft'
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
