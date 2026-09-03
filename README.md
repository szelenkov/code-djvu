# code-djvu

A Visual Studio Code extension for viewing DJVU documents.

> **Status:** The project is currently a work in progress. The extension scaffold is
> in place, but the DJVU viewer is not yet implemented. The only available command
> at present is **Hello World**.

## Requirements

- Visual Studio Code 1.135.0 or newer
- Node.js and npm for building from source

## Development

1. Clone the repository and install dependencies:

   ```bash
   npm install
   ```

2. Compile the extension:

   ```bash
   npm run compile
   ```

3. Open the project in VS Code and press `F5` to launch an Extension Development
   Host window.

Useful commands:

| Command | Description |
| --- | --- |
| `npm run compile` | Build `dist/extension.js` |
| `npm run watch` | Rebuild automatically when source files change |
| `npm run lint` | Lint the TypeScript source |
| `npm run pretest && npm run test` | Compile, lint, and run the test suite |
| `npm run package` | Create a production bundle |

The extension entry point is `src/extension.ts`. Generated build output is written
to `dist/` and `out/` and is not committed.

## Contributing

Bug reports and pull requests are welcome. Keep changes focused, use the existing
TypeScript and ESLint conventions, and update the changelog when user-visible
behavior changes.

## Change log

See [CHANGELOG.md](CHANGELOG.md).

## License

See [LICENSE](./LICENSE).

**Enjoy!*
