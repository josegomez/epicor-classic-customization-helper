import * as vscode from "vscode";
export class CustomViewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        token: vscode.CancellationToken
    ): void {
        console.log('resolveWebviewView');
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true
        };

        webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.command) {
                case 'opencustomization':
                    vscode.commands.executeCommand('epicor-classic-customization-helper.opencustomization');
                    break;
                case 'update':
                    vscode.commands.executeCommand('epicor-classic-customization-helper.update');
                    break;
                case 'download':
                    vscode.commands.executeCommand('epicor-classic-customization-helper.download');
                    break;
                case 'toolbox':
                    vscode.commands.executeCommand('epicor-classic-customization-helper.toolbox');
                    break;
                case 'settings':
                    vscode.commands.executeCommand('epicor-classic-customization-helper.settings');
                    break;
            }
        });
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        // Local path to main script run in the webview
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

        // Use a nonce to only allow a specific script to be run
        const nonce = getNonce();
        const logoUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'Epiuser.svg'));

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: 'Segoe UI', sans-serif;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin: 0;
                    padding: 20px;
                    background-color: var(--vscode-editor-background); /* Adjusts to theme background */
                    color: var(--vscode-editor-foreground); /* Adjusts to theme text color */
                }
                img.logo {
                    width: 100px; /* Adjust based on your logo's dimensions */
                    margin-bottom: 20px;
                }
                button {
                    width: 200px; /* Ensures all buttons are the same width */
                    background-color: var(--vscode-button-background); /* Theme button background */
                    color: var(--vscode-button-foreground); /* Theme button text */
                    border: none;
                    padding: 10px;
                    margin: 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 16px;
                }
                button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
            </style>
        </head>
        <body>
            <img src="${logoUri}" alt="Logo" class="logo">
            <button onclick="sendMessage('opencustomization')">Open Customization</button>
            <button onclick="sendMessage('update')">Update</button>
            <button onclick="sendMessage('download')">Download</button>
            <button onclick="sendMessage('toolbox')">Toolbox</button>
            <button onclick="sendMessage('settings')">Settings</button>
            <script>
                const vscode = acquireVsCodeApi();
                function sendMessage(command) {
                    vscode.postMessage({ command: command });
                }
            </script>
        </body>
        </html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}