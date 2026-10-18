import { readFileSync } from 'node:fs';

let command = '';
try {
  command = String(JSON.parse(readFileSync(0, 'utf8')).tool_input?.command ?? '');
} catch {
  process.exit(0);
}

const changedDependencies = /\bnpm\s+(install|i|add|uninstall|remove|rm|un|ci)\b/.test(command);

if (changedDependencies) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext:
          'Dependencies changed. Tell the developer to run "TypeScript: Restart TS Server" and "ESLint: Restart ESLint Server" (or reload the window), otherwise the editor can show stale type errors that the command line does not.'
      }
    })
  );
}
