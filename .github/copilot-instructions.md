# Copilot Instructions for code-djvu

This is a VS Code extension that displays DJVU (Document View) files in the editor. The extension is built with TypeScript, Webpack, and Mocha testing.

## Build, Test, and Lint

### Compile the extension
```bash
npm run compile
```
Bundles TypeScript source via Webpack into `dist/extension.js`. Use during development to verify syntax errors.

### Watch mode (recommended for development)
```bash
npm run watch
```
Continuously recompiles on file changes. Keeps the bundled output fresh without manual rebuilds.

### Run a single test
```bash
npm run pretest && npm run test
```
The `pretest` script compiles both tests and source, lints, then `test` runs Mocha test suite in `out/test/runTest.js`.

### Run linter only
```bash
npm run lint
```
Runs ESLint on `src/` directory. See `.eslintrc.json` for rules (naming conventions, semicolons, equality checks).

### Production build
```bash
npm run package
```
Creates a production bundle with minification and hidden source maps for extension publishing.

## Architecture

**Key concepts:**
- **Extension activation**: Registers the DJVU custom editor provider and the Hello World command contributed by `package.json`.
- **Lifecycle**: The `activate()` function registers disposables; `deactivate()` runs on extension shutdown.
- **Custom editor**: `DjvuCustomEditorProvider` opens `.djvu` files in a read-only webview and transfers document bytes to the viewer.
- **Bundling**: Webpack entry point is `src/extension.ts`, output goes to `dist/extension.js`. VSCode excludes `vscode` module from bundling (listed in `externals`).

**Project structure:**
- `src/extension.ts` — Main extension entry point with activate/deactivate hooks
- `src/djvuCustomEditor.ts` — Read-only custom editor provider and webview UI
- `media/djvu.js` — Vendored DjVu.js browser bundle
- `src/test/` — Mocha test suite (currently minimal boilerplate)
- `dist/` — Bundled output (generated, not committed)
- `out/` — Compiled tests (generated, not committed)

**DJVU.js integration:**
The extension uses the official [DjVu.js](https://djvu.js.org/) browser bundle in
`media/djvu.js`. The custom editor creates a `DjVu.Worker`, loads the document
bytes, and renders page PNGs inside the webview. The bundle is distributed under
GNU GPL v2; its license is included in `media/DJVUJS-GPL-2.0.txt`.

## Key Conventions

1. **TypeScript strict mode enabled**: `tsconfig.json` has `"strict": true`. All code must be type-safe with no implicit `any`.

2. **ESLint rules**:
   - `@typescript-eslint/naming-convention` (warn) — Use camelCase for variables/functions
   - `@typescript-eslint/semi` (warn) — Semicolons required at statement ends
   - `eqeqeq` (warn) — Use `===` and `!==` instead of `==` and `!=`
   - `no-throw-literal` (warn) — Throw Error objects, not strings

3. **Webpack config**: 
   - Target is Node.js (VSCode extension runtime)
   - ts-loader handles TypeScript → JavaScript
   - Source maps enabled for debugging (`nosources-source-map`)
   - Logs infrastructure details during builds

4. **Test setup**: Tests run via VSCode's test electron environment (`@vscode/test-electron`). Tests import the extension module and VSCode APIs to simulate the real runtime.

5. **VS Code API patterns**:
   - Use `vscode.commands.registerCommand()` to define command handlers
   - Register disposables in `context.subscriptions` for cleanup on deactivation
   - Use `vscode.window` methods for user-facing messages/prompts

## Important Notes

- The viewer is read-only and currently renders one page at a time.
- The build process generates `*.vsix` files (VS Code extension packages) suitable for publishing to the extension marketplace.
- Generated directories (`dist/`, `out/`, `.vscode-test/`) are excluded from git. Always run `npm run compile` after cloning to regenerate them.
