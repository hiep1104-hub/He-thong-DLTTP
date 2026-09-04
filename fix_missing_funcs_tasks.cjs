const fs = require('fs');
const path = 'src/components/tasks/TasksHubView.tsx';
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
import { TaskStatus, TaskPriority, TaskRiskLevel, Department } from '../../types';
`;

content = content.replace(/import React, { useState } from 'react';/, `import React, { useState, useMemo, useEffect } from 'react';\n${additionalImports}`);

fs.writeFileSync(path, content);
