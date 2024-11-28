# Code DjVu

A Visual Studio Code extension for viewing DjVu files directly in the editor.

## Features

- View DjVu files directly in VS Code
- Navigate through pages using Previous/Next buttons
- Clean and modern UI that integrates with VS Code's theme
- Support for multi-page DjVu documents

## Installation

1. Install the extension from the VS Code marketplace
2. Restart VS Code

## Usage

There are several ways to open a DjVu file:

1. **Direct Opening**: Right-click on a .djvu file in the VS Code explorer and select "Open With..." > "DjVu Viewer"
2. **Command Palette**: 
   - Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
   - Type "Open in DjVu Viewer" and select the command
   - Choose your DjVu file from the file picker

## Navigation

- Use the "Previous" and "Next" buttons to navigate through pages
- The current page number and total pages are displayed in the toolbar

## Development

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- Visual Studio Code

### Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/code-djvu.git
cd code-djvu
```

2. Install dependencies
```bash
npm install
```

3. Build the extension
```bash
npm run compile
```

4. Launch the extension in debug mode:
   - Press F5 in VS Code
   - This will open a new VS Code window with the extension loaded

### Updating djvu.js

1. Download latest [Prebuilt(older browsers)](https://djvu.js.org/assets/dist/djvu.js)
2. Extract the ZIP file
3. Overwrite ./lib/* with the extracted directories

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [DjVu.js](https://djvu.js.org/) - The JavaScript DjVu decoder library used in this project
