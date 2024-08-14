const vscode = acquireVsCodeApi();

function sendMessage(command) {
    vscode.postMessage({ command });
}