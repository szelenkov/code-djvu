import * as vscode from 'vscode';
import * as path from 'path';

export class DjVuViewerProvider implements vscode.CustomReadonlyEditorProvider {
    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new DjVuViewerProvider(context);
        const providerRegistration = vscode.window.registerCustomEditorProvider(
            DjVuViewerProvider.viewType,
            provider
        );
        return providerRegistration;
    }

    private static readonly viewType = 'djvuViewer';

    constructor(
        private readonly context: vscode.ExtensionContext
    ) {}

    async openCustomDocument(
        uri: vscode.Uri,
        openContext: vscode.CustomDocumentOpenContext,
        token: vscode.CancellationToken
    ): Promise<vscode.CustomDocument> {
        return { uri, dispose: () => {} };
    }

    async resolveCustomEditor(
        document: vscode.CustomDocument,
        webviewPanel: vscode.WebviewPanel,
        token: vscode.CancellationToken
    ): Promise<void> {
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(this.context.extensionPath, 'lib')),
                vscode.Uri.file(path.join(this.context.extensionPath, 'media'))
            ]
        };

        const djvuJsUri = webviewPanel.webview.asWebviewUri(
            vscode.Uri.file(path.join(this.context.extensionPath, 'lib', 'djvu.js'))
        );

        const htmlContent = this.getHtmlContent(webviewPanel.webview, document.uri, djvuJsUri);
        webviewPanel.webview.html = htmlContent;

        // Handle messages from the webview
        webviewPanel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'error':
                        vscode.window.showErrorMessage(message.text);
                        return;
                }
            },
            undefined,
            this.context.subscriptions
        );
    }

    private getHtmlContent(
        webview: vscode.Webview,
        fileUri: vscode.Uri,
        djvuJsUri: vscode.Uri
    ): string {
        const documentPath = webview.asWebviewUri(fileUri);

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>DjVu Viewer</title>
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        width: 100vw;
                        height: 100vh;
                        display: flex;
                        flex-direction: column;
                    }
                    #toolbar {
                        padding: 8px;
                        background: var(--vscode-editor-background);
                        border-bottom: 1px solid var(--vscode-panel-border);
                    }
                    #viewer {
                        flex: 1;
                        background: var(--vscode-editor-background);
                    }
                    .toolbar-button {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 4px 8px;
                        cursor: pointer;
                        margin-right: 4px;
                    }
                    .toolbar-button:hover {
                        background: var(--vscode-button-hoverBackground);
                    }
                </style>
            </head>
            <body>
                <div id="toolbar">
                    <button class="toolbar-button" id="prev">Previous</button>
                    <button class="toolbar-button" id="next">Next</button>
                    <span id="page-info"></span>
                </div>
                <div id="viewer"></div>
                <script src="${djvuJsUri}"></script>
                <script>
                    const vscode = acquireVsCodeApi();
                    let djvuDocument;
                    let currentPage = 0;

                    async function loadDocument() {
                        try {
                            const response = await fetch('${documentPath}');
                            const arrayBuffer = await response.arrayBuffer();
                            djvuDocument = new DjVu.Document(arrayBuffer);
                            
                            const pageCount = djvuDocument.pages.length;
                            document.getElementById('page-info').textContent = 
                                \`Page \${currentPage + 1} of \${pageCount}\`;
                            
                            renderCurrentPage();
                        } catch (error) {
                            vscode.postMessage({
                                command: 'error',
                                text: 'Error loading DjVu file: ' + error.message
                            });
                        }
                    }

                    async function renderCurrentPage() {
                        if (!djvuDocument) return;
                        
                        const viewer = document.getElementById('viewer');
                        viewer.innerHTML = '';
                        
                        try {
                            const page = await djvuDocument.pages[currentPage].getImage();
                            const canvas = document.createElement('canvas');
                            canvas.width = page.width;
                            canvas.height = page.height;
                            
                            const ctx = canvas.getContext('2d');
                            ctx.putImageData(page, 0, 0);
                            
                            viewer.appendChild(canvas);
                            
                            document.getElementById('page-info').textContent = 
                                \`Page \${currentPage + 1} of \${djvuDocument.pages.length}\`;
                        } catch (error) {
                            vscode.postMessage({
                                command: 'error',
                                text: 'Error rendering page: ' + error.message
                            });
                        }
                    }

                    document.getElementById('prev').addEventListener('click', () => {
                        if (currentPage > 0) {
                            currentPage--;
                            renderCurrentPage();
                        }
                    });

                    document.getElementById('next').addEventListener('click', () => {
                        if (djvuDocument && currentPage < djvuDocument.pages.length - 1) {
                            currentPage++;
                            renderCurrentPage();
                        }
                    });

                    loadDocument();
                </script>
            </body>
            </html>
        `;
    }
}
