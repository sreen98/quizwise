import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const input = JSON.parse(readFileSync(0, 'utf8'));
const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const filePath = String(input.tool_input?.file_path ?? input.tool_response?.filePath ?? '');
const relative = path.relative(projectDir, filePath);

if (!filePath || relative.startsWith('..') || path.isAbsolute(relative) || !existsSync(filePath)) {
  process.exit(0);
}

const prettier = path.join(projectDir, 'node_modules', 'prettier', 'bin', 'prettier.cjs');
if (existsSync(prettier)) {
  try {
    execFileSync(process.execPath, [prettier, '--write', '--ignore-unknown', '--log-level', 'silent', filePath], {
      cwd: projectDir,
      stdio: 'ignore'
    });
  } catch {
    process.stderr.write(`Prettier could not format ${relative}. Check it for a syntax error.\n`);
  }
}

if (/^(tsconfig[\w.]*\.json|eslint\.config\.js|package\.json)$/.test(relative)) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: `${relative} changed. Tell the developer to run "TypeScript: Restart TS Server" and "ESLint: Restart ESLint Server" (or reload the window), otherwise the editor can show stale errors that the command line does not.`
      }
    })
  );
  process.exit(0);
}

if (relative.startsWith('.claude') || relative.startsWith('node_modules')) {
  process.exit(0);
}

const text = readFileSync(filePath, 'utf8');
const lineOf = position => text.slice(0, position).split('\n').length;
const ALLOWED_DIRECTIVE = /^(\/\/\/ <reference|\/\/ @ts-expect-error|\/\/ eslint-disable|\/\* eslint-disable)/;

const findScriptComments = () => {
  const ts = createRequire(path.join(projectDir, 'package.json'))('typescript');
  const isJsx = /\.(tsx|jsx)$/.test(filePath);
  const sourceFile = ts.createSourceFile(
    filePath,
    text,
    ts.ScriptTarget.Latest,
    true,
    isJsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
  const ranges = new Map();
  const collect = found => found?.forEach(range => ranges.set(range.pos, range));

  const visit = node => {
    if (node.kind !== ts.SyntaxKind.JsxText) {
      collect(ts.getLeadingCommentRanges(text, node.pos));
      collect(ts.getTrailingCommentRanges(text, node.end));
    }
    node.getChildren(sourceFile).forEach(visit);
  };
  visit(sourceFile);

  return [...ranges.values()].map(range => ({ position: range.pos, comment: text.slice(range.pos, range.end) }));
};

const findPatternComments = pattern =>
  [...text.matchAll(pattern)].map(match => ({ position: match.index, comment: match[0] }));

let comments = [];
if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(filePath)) {
  comments = findScriptComments();
} else if (/\.css$/.test(filePath)) {
  comments = findPatternComments(/\/\*[\s\S]*?\*\//g);
} else if (/\.html$/.test(filePath)) {
  comments = findPatternComments(/<!--[\s\S]*?-->/g);
}

const disallowed = comments.filter(({ comment }) => !ALLOWED_DIRECTIVE.test(comment));

if (disallowed.length > 0) {
  const list = disallowed
    .sort((a, b) => a.position - b.position)
    .map(({ position, comment }) => `  ${relative}:${lineOf(position)}: ${comment.split('\n')[0].trim()}`)
    .join('\n');
  process.stderr.write(
    `Comments are not allowed in source files (CLAUDE.md, Code). Remove these, renaming or splitting code instead:\n${list}\n`
  );
  process.exit(2);
}
