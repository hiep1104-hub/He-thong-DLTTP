#!/bin/bash
TARGET="src/components/dashboard/ExecutiveDashboard.tsx"

# We will just copy the components into ExecutiveDashboard.tsx and remove the files.
# But we need to remove the imports in ExecutiveDashboard.tsx first.

sed -i '/import { WorkbenchHeader, WorkbenchArchetype } from/d' $TARGET
sed -i '/import { RoleMetricCards } from/d' $TARGET
sed -i '/import { TaxObligationMiniRadar } from/d' $TARGET
sed -i '/import { DailyQuickNotes } from/d' $TARGET

# We will remove the imports from the widget files as well, to avoid duplicate imports.
# Then append them.

for file in WorkbenchHeader.tsx RoleMetricCards.tsx TaxObligationMiniRadar.tsx DailyQuickNotes.tsx; do
  echo "" >> $TARGET
  echo "// --- START OF $file ---" >> $TARGET
  cat src/components/dashboard/$file | grep -v "^import " >> $TARGET
  rm src/components/dashboard/$file
done

