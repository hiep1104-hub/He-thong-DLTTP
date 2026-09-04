#!/bin/bash
TARGET="src/components/tasks/TasksHubView.tsx"

# Remove imports
sed -i '/import { TaskList } from/d' $TARGET
sed -i '/import { TaskKanban } from/d' $TARGET
sed -i '/import { CustomerGroupedTaskList } from/d' $TARGET

for file in TaskList.tsx TaskKanban.tsx CustomerGroupedTaskList.tsx; do
  echo "" >> $TARGET
  echo "// --- START OF $file ---" >> $TARGET
  cat src/components/tasks/$file | grep -v "^import " >> $TARGET
  rm src/components/tasks/$file
done

