import { readFileSync } from 'node:fs';

const deny = reason => {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: reason
      }
    })
  );
  process.exit(0);
};

let command = '';
try {
  command = String(JSON.parse(readFileSync(0, 'utf8')).tool_input?.command ?? '');
} catch {
  deny('The hook could not read this command, so it was blocked to be safe.');
}

const PROTECTED = /PLAN\.md|ReactJS_Assignment_Quiz_Platform\.pdf|(^|[\s"'\\/.=])docs([\\/]|\s|$|["'])/i;
const DELETE_COMMANDS = new Set([
  'rm',
  'del',
  'erase',
  'rmdir',
  'rd',
  'ri',
  'mv',
  'move',
  'mi',
  'ren',
  'rni',
  'unlink',
  'truncate',
  'remove-item',
  'move-item',
  'rename-item',
  'clear-content',
  'set-content'
]);
const TEXT_SEARCH_COMMANDS = new Set(['grep', 'rg', 'findstr', 'select-string', 'echo', 'write-output', 'write-host']);

if (/(^|[\s"'=/\\(])\.git([\\/]|\s|$|["')])/i.test(command)) {
  deny('Touching the .git folder is not allowed (CLAUDE.md, Git).');
}

const segments = command
  .split(/\r?\n|&&|\|\||[;|]/)
  .map(segment => segment.replace(/\s#.*$/, '').trim())
  .filter(Boolean);

for (const segment of segments) {
  const tokens = segment
    .replace(/["'`]/g, '')
    .split(/[\s()]+/)
    .map(token => token.toLowerCase())
    .filter(token => token && token !== '&' && token !== '$');
  const [first = '', second = ''] = tokens;

  const runsGit = tokens.some(token => /(^|[\\/])git(\.exe)?$/.test(token));
  if (runsGit && !TEXT_SEARCH_COMMANDS.has(first)) {
    deny('Git commands are not allowed. The developer does all Git work (CLAUDE.md, Git).');
  }

  const deletes =
    DELETE_COMMANDS.has(first) ||
    tokens.includes('-delete') ||
    /\b(rmSync|unlinkSync|rmdirSync|renameSync|truncateSync)\b/.test(segment) ||
    />\s*["']?(\.[\\/])?(PLAN\.md|ReactJS_Assignment_Quiz_Platform\.pdf)/i.test(segment);
  if (deletes && PROTECTED.test(segment)) {
    deny('PLAN.md, docs/ and the assignment PDF must never be deleted, moved or overwritten (CLAUDE.md, Boundaries).');
  }

  const installsPackages =
    first === 'npm' &&
    ['install', 'i', 'add'].includes(second) &&
    tokens.slice(2).some(token => !token.startsWith('-'));
  if (installsPackages && !tokens.includes('--save-exact') && !tokens.includes('-e')) {
    deny('Install packages with --save-exact so package.json keeps exact versions (CLAUDE.md, Code).');
  }
}
