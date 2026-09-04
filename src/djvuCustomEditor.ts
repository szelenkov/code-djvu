import * as vscode from 'vscode';

class DjvuDocument implements vscode.CustomDocument {
	public constructor(public readonly uri: vscode.Uri) {}

	public dispose(): void {}
}

export class DjvuCustomEditorProvider implements vscode.CustomReadonlyEditorProvider<DjvuDocument> {
	public static register(context: vscode.ExtensionContext): vscode.Disposable {
		return vscode.window.registerCustomEditorProvider(
			'code-djvu.viewer',
			new DjvuCustomEditorProvider(context),
			{
				supportsMultipleEditorsPerDocument: false
			}
		);
	}

	private constructor(private readonly context: vscode.ExtensionContext) {}

	public openCustomDocument(uri: vscode.Uri): DjvuDocument {
		return new DjvuDocument(uri);
	}

	public async resolveCustomEditor(
		document: DjvuDocument,
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken
	): Promise<void> {
		const webview = webviewPanel.webview;
		webview.options = {
			enableScripts: true,
			localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'media')]
		};
		webview.html = this.getWebviewContent(webview);

		webview.onDidReceiveMessage(async message => {
			if (message.type !== 'ready') {
				return;
			}

			try {
				const bytes = await vscode.workspace.fs.readFile(document.uri);
				await webview.postMessage({ type: 'load', bytes });
			} catch (error) {
				const reason = error instanceof Error ? error.message : String(error);
				await webview.postMessage({ type: 'error', message: `Unable to open DJVU file: ${reason}` });
			}
		});
	}

	private getWebviewContent(webview: vscode.Webview): string {
		const nonce = getNonce();
		const libraryUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.context.extensionUri, 'media', 'djvu.js')
		);

		return `<!doctype html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta
		http-equiv="Content-Security-Policy"
		content="default-src 'none'; img-src ${webview.cspSource} blob: data:; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}';"
	>
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>DJVU Viewer</title>
	<style nonce="${nonce}">
		:root { color-scheme: light dark; }
		body { margin: 0; display: flex; flex-direction: column; height: 100vh; font-family: sans-serif; }
		.toolbar { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; border-bottom: 1px solid var(--vscode-panel-border); }
		button, input { font: inherit; }
		.page-number { width: 4rem; }
		.status { margin-left: auto; opacity: 0.8; }
		.viewer { flex: 1; overflow: auto; display: flex; justify-content: center; padding: 1rem; }
		.page { max-width: none; height: auto; align-self: flex-start; box-shadow: 0 1px 5px #0006; }
		.message { margin: auto; text-align: center; white-space: pre-wrap; }
	</style>
</head>
<body>
	<div class="toolbar">
		<button id="previous" type="button" disabled>Previous</button>
		<input id="page-number" class="page-number" type="number" min="1" value="1" disabled>
		<span id="page-count">of 0</span>
		<button id="next" type="button" disabled>Next</button>
		<label>Zoom <input id="zoom" type="range" min="25" max="300" value="100" disabled></label>
		<span id="status" class="status">Loading...</span>
	</div>
	<div id="viewer" class="viewer">
		<div id="message" class="message">Preparing DJVU viewer...</div>
		<img id="page" class="page" alt="DJVU page" hidden>
	</div>
	<script src="${libraryUri}" nonce="${nonce}"></script>
	<script nonce="${nonce}">
		const vscode = acquireVsCodeApi();
		const pageImage = document.getElementById('page');
		const message = document.getElementById('message');
		const status = document.getElementById('status');
		const pageNumber = document.getElementById('page-number');
		const pageCount = document.getElementById('page-count');
		const previous = document.getElementById('previous');
		const next = document.getElementById('next');
		const zoom = document.getElementById('zoom');
		let worker;
		let currentPage = 1;
		let totalPages = 0;
		let currentUrl;

		function setControls(enabled) {
			pageNumber.disabled = !enabled;
			previous.disabled = !enabled;
			next.disabled = !enabled;
			zoom.disabled = !enabled;
		}

		function showError(error) {
			setControls(false);
			pageImage.hidden = true;
			message.hidden = false;
			message.textContent = error;
			status.textContent = 'Error';
		}

		async function renderPage(number) {
			currentPage = Math.max(1, Math.min(totalPages, number));
			pageNumber.value = currentPage;
			previous.disabled = currentPage === 1;
			next.disabled = currentPage === totalPages;
			status.textContent = 'Rendering...';

			if (currentUrl) {
				worker.revokeObjectURL(currentUrl);
				currentUrl = undefined;
			}

			const pageTask = worker.doc.getPage(currentPage);
			const [png, text] = await worker.run(
				pageTask.createPngObjectUrl(),
				pageTask.getText()
			);
			currentUrl = png.url;
			pageImage.src = currentUrl;
			pageImage.style.width = (png.width * Number(zoom.value) / 100) + 'px';
			pageImage.hidden = false;
			message.hidden = true;
			status.textContent = text ? 'Text available' : 'Rendered';
		}

		async function loadDocument(bytes) {
			try {
				worker = new DjVu.Worker();
				await worker.createDocument(new Uint8Array(bytes).buffer);
				[totalPages] = await worker.run(worker.doc.getPagesQuantity());
				pageCount.textContent = 'of ' + totalPages;
				setControls(totalPages > 0);
				if (totalPages === 0) {
					throw new Error('The DJVU document contains no pages.');
				}
				await renderPage(1);
			} catch (error) {
				showError('Unable to render DJVU document: ' + (error.message || error));
			}
		}

		previous.addEventListener('click', () => renderPage(currentPage - 1).catch(error => showError(error.message)));
		next.addEventListener('click', () => renderPage(currentPage + 1).catch(error => showError(error.message)));
		pageNumber.addEventListener('change', () => renderPage(Number(pageNumber.value)).catch(error => showError(error.message)));
		zoom.addEventListener('input', () => {
			if (pageImage.src) {
				pageImage.style.width = (pageImage.naturalWidth * Number(zoom.value) / 100) + 'px';
			}
		});
		window.addEventListener('message', event => {
			if (event.data.type === 'load') {
				loadDocument(event.data.bytes);
			} else if (event.data.type === 'error') {
				showError(event.data.message);
			}
		});
		vscode.postMessage({ type: 'ready' });
	</script>
</body>
</html>`;
	}
}

function getNonce(): string {
	const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let nonce = '';
	for (let index = 0; index < 32; index++) {
		nonce += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
	}
	return nonce;
}
