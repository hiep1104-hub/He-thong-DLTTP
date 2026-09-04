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

content = content.replace(/import React, { useState, useEffect } from 'react';/, `import React, { useState, useMemo, useEffect, useRef } from 'react';\n${additionalImports}`);

fs.writeFileSync(path, content);
