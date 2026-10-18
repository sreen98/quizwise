import { readFileSync } from 'node:fs';
import path from 'node:path';

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

let toolInput = {};
try {
  toolInput = JSON.parse(readFileSync(0, 'utf8')).tool_input ?? {};
} catch {
  deny('The hook could not read this write, so it was blocked to be safe.');
}

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const filePath = String(toolInput.file_path ?? toolInput.notebook_path ?? '');
const relative = path.relative(projectDir, path.resolve(projectDir, filePath)).replaceAll('\\', '/');

if (/(^|\/)\.git(\/|$)/i.test(relative)) {
  deny('Writing inside .git is not allowed. The developer does all Git work (CLAUDE.md, Git).');
}

if (/^docs(\/|$)/i.test(relative) || /^ReactJS_Assignment_Quiz_Platform\.pdf$/i.test(relative)) {
  deny('docs/ and the assignment PDF belong to the developer and must not be changed (CLAUDE.md, Boundaries).');
}

const newText = [
  toolInput.content,
  toolInput.new_string,
  toolInput.new_source,
  ...(toolInput.edits ?? []).map(edit => edit.new_string)
]
  .filter(text => typeof text === 'string')
  .join('\n');

const DASHES = [0x2013, 0x2014].map(code => String.fromCharCode(code));
const ENCODED_DASHES = /&[mn]dash;|&#821[12];|&#x201[34];|\\u201[34]|\\u\{201[34]\}/i;

if (DASHES.some(dash => newText.includes(dash)) || ENCODED_DASHES.test(newText)) {
  deny(
    'The new text contains an em dash or en dash (or an encoded one). Use a comma, colon, full stop, brackets or a plain hyphen instead (CLAUDE.md, Code).'
  );
}
