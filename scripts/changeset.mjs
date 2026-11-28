// Runs the Changesets CLI with `workspaces` hidden from package.json.
//
// Changesets only versions workspace packages, and the library is the root
// package (example/ and demo/ are the workspaces). Without `workspaces` it
// treats the repo as a single package, which is what we want. The field is
// put back afterwards, keeping any version Changesets wrote.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const file = new URL('../package.json', import.meta.url);
const original = readFileSync(file, 'utf8');
const { workspaces, ...rest } = JSON.parse(original);
const indent = original.match(/^\s+/m)?.[0] ?? '  ';
const write = (pkg) => writeFileSync(file, JSON.stringify(pkg, null, indent) + '\n');

write(rest);
let status = 1;
try {
  const bin = createRequire(import.meta.url).resolve('@changesets/cli/bin.js');
  status = spawnSync(process.execPath, [bin, ...process.argv.slice(2)], { stdio: 'inherit' }).status ?? 1;
} finally {
  // Re-insert `workspaces` where it was, on top of whatever Changesets wrote.
  const current = JSON.parse(readFileSync(file, 'utf8'));
  const keys = Object.keys(JSON.parse(original));
  const merged = {};
  for (const key of keys) {
    if (key === 'workspaces') merged.workspaces = workspaces;
    else if (key in current) merged[key] = current[key];
  }
  for (const key of Object.keys(current)) if (!(key in merged)) merged[key] = current[key];
  write(merged);
}
process.exit(status);
