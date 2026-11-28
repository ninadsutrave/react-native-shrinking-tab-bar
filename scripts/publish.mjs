// Publishes the version in package.json if npm doesn't have it yet, then tags
// it and creates a GitHub release from its CHANGELOG.md section. Run by the
// Release workflow once the Version Packages pull request is merged.
//
// It uses `npm publish` so trusted publishing (OIDC) adds provenance on its own.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const run = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8', ...opts });

const { name, version } = JSON.parse(readFileSync('package.json', 'utf8'));
const tag = `v${version}`;

let published = false;
try {
  published = run('npm', ['view', `${name}@${version}`, 'version']).trim() === version;
} catch {
  // npm view exits non-zero when the version doesn't exist.
}

if (published) {
  console.log(`${name}@${version} is already on npm.`);
} else {
  execFileSync('npm', ['publish', '--access', 'public'], { stdio: 'inherit' });
  console.log(`Published ${name}@${version}.`);
}

const remoteTags = run('git', ['ls-remote', '--tags', 'origin', tag]).trim();
if (!remoteTags) {
  run('git', ['tag', tag]);
  run('git', ['push', 'origin', tag]);
  console.log(`Pushed tag ${tag}.`);
}

let hasRelease = true;
try {
  run('gh', ['release', 'view', tag]);
} catch {
  hasRelease = false;
}
if (!hasRelease) {
  const changelog = readFileSync('CHANGELOG.md', 'utf8');
  const start = changelog.indexOf(`## ${version}`);
  const next = start === -1 ? -1 : changelog.indexOf('\n## ', start + 1);
  const notes =
    start === -1
      ? `See CHANGELOG.md.`
      : changelog.slice(changelog.indexOf('\n', start) + 1, next === -1 ? undefined : next).trim();
  writeFileSync('.release-notes.md', notes + '\n');
  run('gh', ['release', 'create', tag, '--title', tag, '--notes-file', '.release-notes.md']);
  console.log(`Created GitHub release ${tag}.`);
}
