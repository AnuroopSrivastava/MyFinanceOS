// One-off migration: repoint Button/InteractiveCard imports to @financeos/ui
// and convert className="btn btn-*" to variant="*" on <Button> lines.
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const root = 'D:/PROJECTS/MYFINANCEOS/apps/web/src';

// Find files referencing the local ui components.
const grep = (pat) =>
  execSync(`grep -rl "${pat}" "${root}" --include="*.tsx" --include="*.ts"`, {
    encoding: 'utf8',
  })
    .split('\n')
    .filter(Boolean);

const targets = new Set([
  ...grep('from \'./ui/Button.js\''),
  ...grep('from \'../ui/Button.js\''),
  ...grep("from './Button.js'"),
  ...grep("from './components/ui/InteractiveCard.js'"),
]);

let changed = 0;
for (const file of targets) {
  let src = readFileSync(file, 'utf8');
  const before = src;

  src = src.replace(/from '\.\/ui\/Button\.js'/g, "from '@financeos/ui'");
  src = src.replace(/from '\.\.\/ui\/Button\.js'/g, "from '@financeos/ui'");
  src = src.replace(/from '\.\/Button\.js'/g, "from '@financeos/ui'");
  src = src.replace(/from '\.\/components\/ui\/InteractiveCard\.js'/g, "from '@financeos/ui'");

  // Only convert className="btn btn-*" on lines that open a <Button>.
  src = src.replace(/^(\s*<Button[\s\S]*?)\bclassName="btn btn-primary"/gm, '$1variant="primary"');
  src = src.replace(/^(\s*<Button[\s\S]*?)\bclassName="btn btn-secondary"/gm, '$1variant="secondary"');
  src = src.replace(/^(\s*<Button[\s\S]*?)\bclassName="btn btn-danger"/gm, '$1variant="danger"');

  if (src !== before) {
    writeFileSync(file, src);
    changed++;
    console.log(`migrated ${file}`);
  }
}
console.log(`\n${changed} files changed`);
