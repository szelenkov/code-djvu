# code-djvu

Display djvu in VSCode.

## Contribute

### Upgrade djvu.js

1. Download latest [Pre-built (older browsers)](https://djvu.js.org/assets/dist/djvu.js).
2. Extract the ZIP file.
3. Overwrite ./lib/* by extracted directories.
   - If lib/web/viewer.html has changes, apply these changes to HTML template at djvuPreview.ts.
4. To not use sample djvu.
   - Remove sample djvu.
   - Remove code about using sample djvu from lib/web/viewer.js.

    ```js
    defaultUrl: {
      value: "",
      kind: OptionKind.VIEWER
    },
    ```

## Change log

See [CHANGELOG.md](CHANGELOG.md).

## License

Please see [LICENSE](./LICENSE)

**Enjoy!**
