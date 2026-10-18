# Quizwise: rules for Claude Code

`PLAN.md` is the full working brief and wins if anything here disagrees with it. It and the design file `docs/quizwise-design.html` are kept out of the repository, so they exist only on the original developer's machine. Without them, follow these rules and the README. When `PLAN.md` is there, read it at the start of every session, find the first unticked step in section 9, and say which step you will resume before doing anything.

## Workflow

- One step from PLAN.md section 9 at a time, never two at once. If a step is too big, say so and suggest splitting it.
- Before a step, explain in a few sentences what you will build and why, then wait for the developer's go-ahead.
- Before a UI step, compare the matching screen in `docs/quizwise-design.html` (when it is there) with the step. If they disagree, ask before building.
- When the developer edits code by hand, keep their changes and follow their style. Never tidy their code back.
- After a step:
  1. Run `npm run lint`, `npm run typecheck`, `npm test` and `npm run build`. Also run `npm run test:e2e` when the step changes the quiz taking flow, the results page or the leaderboard.
  2. Run the dash check: search the changed files for U+2013 and U+2014 with the search tool (not Git). It must find nothing.
  3. For UI steps, check the screen in the browser at 360 px and desktop width with the console open.
  4. Read your changes once more against these rules. For every CSS module rule, check that the same property isn't also set as a prop on that element.
  5. If the step installed packages or changed `tsconfig*.json`, `eslint.config.js` or `package.json`, tell the developer to restart the TS and ESLint servers. Editor errors that the command line does not show are usually a stale server; confirm with `npx eslint <file>` and `npm run typecheck` before changing code. A local `.vscode/settings.json` (ignored by Git) may turn off the five `no-unsafe-*` rules in the editor only; they still run in `npm run lint`, which is the source of truth.
  6. Stop. Give a short walkthrough (files created, changed or deleted, the one or two ideas that matter, what to read up on), suggest a commit message, and wait.
- Tick the step in PLAN.md only after the developer says it is committed.
- A bug from an earlier step is fixed as its own small step with its own commit, not folded into other work.
- Only say something works if you ran the check, and say which one. Say plainly what is unfinished or skipped.
- When the brief is unclear, ask. Agreed assumptions go into PLAN.md section 7 and the README.

## Git

- Never run any Git command, including read-only ones like `git status` or `git diff`, and never touch `.git/`. The developer does all Git work.
- Git hooks live in `.husky/` (Husky): pre-commit checks Prettier on the staged files and runs ESLint, pre-push runs typecheck, tests and build. Don't add other hooks, lint-staged or CI, except the build-and-deploy workflow in step 4.7.
- Suggested commit messages: a `feat:`, `fix:`, `chore:` or `docs:` prefix, then a short imperative subject in lower case, no emoji, no full stop, under about 60 characters. Early commits have no prefix.

## Code

- No comments in any source or config file. The only exception is an unavoidable tool directive such as `/// <reference ...>` or `// @ts-expect-error`, and only after trying to fix the cause.
- No em dashes or en dashes anywhere: code, UI text, tests, commit messages, docs or chat. Use a comma, colon, full stop, brackets or a plain hyphen. Ranges in words: "1 to 5".
- Never use these words anywhere: seamless, robust, leverage, elevate, delve, streamline, comprehensive, cutting-edge. No emoji anywhere.
- TypeScript strict, no `any`. Prefer inferred types; type function signatures and exported models.
- Components, pages and hooks are arrow consts with named exports: `export const QuizCard = ({ quiz, onOpen }: QuizCardProps) => {`. No `React.FC`, no default exports, no `import React`.
- One folder per component or page: `QuizCard/index.tsx` holds the component, `QuizCard/types.ts` holds `export interface QuizCardProps`.
- `interface` for objects, `type` for unions and derived types, no `I` prefix. `onX` for callback props, `handleX` for local handlers. `loading`, `isX`, `canX`, `showX`, `hasX` for booleans. UPPER_SNAKE only for real constants.
- Relative imports, no path aliases, no barrel files, no `utils.ts` dumping ground.
- Prettier: single quotes, semicolons, no trailing commas, 120 columns, `arrowParens: 'avoid'`.
- Files stay under 300 lines (blank lines and comments not counted; `quizService.ts` up to 450; tests have no limit). ESLint `max-lines` enforces it in `npm run lint`. When a page gets close, split its parts into components in their own folders rather than trimming code to fit.
- Keep it simple: no abstractions for later, no wrapper components that only pass props through, no defensive code for states the types rule out, `useMemo` and `useCallback` only where they fix a real problem, no `console.log`, no commented-out code.
- Install only what a step needs, with `--save-exact`, on the versions in PLAN.md section 4 (or the ones already in `package.json`). Keep `package.json` honest. Run `npx knip@5.88.1` at the end of each phase.
- Import everything from `react-router`, never `react-router/dom`.
- Every route goes inside the `RootLayout` route in `src/app/router.tsx`. It starts each new page at the top (`ScrollRestoration`, keyed by path) and moves focus to the page's `h1` after navigation. Every page renders exactly one `h1` and a `<title>` ("Page name - Quizwise"). Don't add per-page scroll or focus code for navigation.
- Reuse the shared building blocks instead of writing new ones: `PaginatedList` for long lists (page numbers on desktop, infinite scroll with a "Show more" button on phones, page in the URL), `useDebouncedSearch` for search boxes, `SearchableSelect` for a select that needs search, `MessageCard` for full-page messages (not found, admins only, ended attempts) and `EmptyState` for empty lists and searches with no results.
- Only `quizService` imports the data store. Pages and components call `quizService` through hooks, never directly. ESLint enforces both.
- Not in scope: image-based answer options and internationalisation. Don't add them or code that prepares for them.

## Styling

- Mantine first: Mantine components and their props, plus style props for spacing, size and colour, including responsive values (`px={{ base: 16, sm: 24 }}`).
- Add a `Component.module.css` next to the component only when Mantine props cannot express it: `:hover` and `:focus` states, `aria-*` or `data-*` selectors, nesting, complex media queries or `z-index`. Use Mantine CSS variables and the theme tokens (`var(--surface)`, `var(--accent-soft)`), never hard-coded colours.
- Never set the same CSS property in both a style prop and the component's CSS module. Mantine applies non-responsive style props inline, so the CSS rule silently loses. For a value that changes by screen size, use a responsive prop (`px={{ base: 8, sm: 14 }}`). CSS modules only add what props can't express.
- No inline `style={{}}` except for values computed at runtime. No `sx` or `@mantine/emotion`.
- UI: warm near-white background, one blue accent, one orange warning colour, radii from 5 to 10 px, no gradients, 44 px touch targets. Copy is short and plain. No decorative icons, except the agreed ones: navigation icons shown with a text label (the mobile tab bar), the soft icon tiles in `MessageCard` and `EmptyState`, and the keyboard hint.
- Loading skeletons match the size and layout of the real content at each breakpoint, so nothing jumps when data arrives.

## Tests

- Test names are plain sentences about behaviour. Query by role and label, not `data-testid`. Only tests that check real behaviour.

## Boundaries

- Stay inside this folder. Never delete, move or edit `docs/` or `ReactJS_Assignment_Quiz_Platform.pdf`, and never delete or move `PLAN.md`.
- Never handle credentials, log in to or deploy to any service.
- Ask before downloading a browser for Playwright.

## Hooks in .claude/settings.json

These catch mistakes; they don't replace following the rules above.

- Before a shell command: blocks Git commands, access to `.git`, deleting or overwriting `PLAN.md`, `docs/` or the PDF, and `npm install <package>` without `--save-exact`.
- Before a file write: blocks writes inside `.git`, `docs/` or the PDF, and new text with an em or en dash (also as an HTML entity or a `\u` escape).
- After a file write: formats the file with Prettier, then reports comments in script, `.css` and `.html` files so they can be removed. After a change to `package.json`, a `tsconfig` or the ESLint config, or after an `npm install`, it reminds you to restart the TS and ESLint servers.
