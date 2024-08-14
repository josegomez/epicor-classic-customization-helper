// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { spawn, spawnSync } from "child_process";
import path from "path";
import fs from "fs";
import { CustomizationConfig } from "./models/customization.model";
import { CustomViewProvider } from "./vebviews/CustomViewProvider";
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated

  context.subscriptions.push(
	vscode.window.registerWebviewViewProvider('epiUsersCustomViewPanel', new CustomViewProvider(context.extensionUri))
	);

  const config = vscode.workspace.getConfiguration(
    "epicor-classic-customization-helper"
  );

  // Retrieve individual settings using their respective keys
  const customizationPath = config.get<string>("customizationPath");
  const clientInstallFolder = config.get<string>("clientInstallFolder");
  const dnspyPath = config.get<string>("dnspylocation");
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "epicor-classic-customization-helper.opencustomization",
    async () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      await OpenCustomization(customizationPath, clientInstallFolder);
    }
  );

  context.subscriptions.push(disposable);

  let disposableUpdate = vscode.commands.registerCommand(
    "epicor-classic-customization-helper.update",
    async () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      await InvokeHelper(customizationPath, clientInstallFolder, "Update");
    }
  );

  context.subscriptions.push(disposableUpdate);

  let disposableDownload = vscode.commands.registerCommand(
    "epicor-classic-customization-helper.download",
    async () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      await InvokeHelper(customizationPath, clientInstallFolder, "Download");
    }
  );
  context.subscriptions.push(disposableDownload);

  let disposableToolBox = vscode.commands.registerCommand(
    "epicor-classic-customization-helper.toolbox",
    async () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      await InvokeHelper(customizationPath, clientInstallFolder, "Toolbox", dnspyPath);
    }
  );
  context.subscriptions.push(disposableToolBox);


  let openSettingsDisposable = vscode.commands.registerCommand('epicor-classic-customization-helper.settings', () => {
    vscode.commands.executeCommand('workbench.action.openSettings', 'epicor-classic-customization-helper');
});

  context.subscriptions.push(openSettingsDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

async function InvokeHelper(
  customizationPath: string | undefined,
  clientInstallFolder: string | undefined,
  action: string,
  dnspyPath: string=''
) {
  const pathToExe = path.join(clientInstallFolder!, "CustomizationEditor.exe");

  if (!vscode.workspace.workspaceFolders) {
    vscode.window.showInformationMessage(
      "No workspace or folder is currently open."
    );
    return;
  }

  // Define the file path relative to the first workspace folder
  const filePath = path.join(
    vscode.workspace.workspaceFolders[0].uri.fsPath,
    "CustomizationInfo.json"
  );
  if (fs.existsSync(filePath)) {
    let customizationConfigFile = fs.readFileSync(filePath, "utf8");
    let dyn = JSON.parse(customizationConfigFile) as CustomizationConfig;
    let args = buildArgs(
      dyn,
      customizationPath,
      clientInstallFolder,
      action,
      dnspyPath
    );
    console.log("Path to exe:", pathToExe);
    console.log("Args:", args);
    const process = spawnSync(pathToExe, args, {
      cwd: clientInstallFolder,
      shell: true,
    });
    console.log("Process:", process);
    if (process.error) {
      console.error("Error:", process.error);
    }
    if (process.stdout) {
      console.log("Stdout:", process.stdout.toString());
    }
    if (process.stderr) {
      console.error("Stderr:", process.stderr.toString());
    }
  } else {
    vscode.window.showInformationMessage(
      "CustomizationInfo.json file does not exist in the workspace folder."
    );
    return;
  }
}
async function OpenCustomization(
  customizationPath: string | undefined,
  clientInstallFolder: string | undefined
) {
  const pathToExe = path.join(clientInstallFolder!, "CustomizationEditor.exe");
  const args = [
    `-f "${clientInstallFolder}"`,
    `-r "${customizationPath}"`,
    `-a Add`,
  ]; // Add arguments if any

  console.log("Path to exe:", pathToExe);
  console.log("Args:", args);
  const process = spawnSync(pathToExe, args, {
    cwd: clientInstallFolder,
    shell: true,
  });
  console.log("Process:", process);
  if (process.error) {
    console.error("Error:", process.error);
  }
  if (process.stdout) {
    console.log("Stdout:", process.stdout.toString());
    let filePath = process.stdout.toString().split(`\r\n`)[0];
    const folderPathParsed = filePath.split(`\\`).join(`/`);
    // Updated Uri.parse to Uri.file
    const folderUri = vscode.Uri.file(folderPathParsed);
    if (fs.existsSync(folderPathParsed)) {
      await vscode.commands.executeCommand("vscode.openFolder", folderUri, false);
    } else {
      vscode.window.showErrorMessage("No Customization was downloaded.");
    }
  }
  if (process.stderr) {
    console.error("Stderr:", process.stderr.toString());
  }
}


function buildArgs(
  dyn: CustomizationConfig,
  customizationPath: string | undefined,
  clientInstallFolder: string | undefined,
  action: string,
  dnspyPath: string = ''
): string[] {
  let args = [];

  // Add each argument separately to the array
  args.push("-c", `"${dyn.ConfigFile}"`);
  args.push("-u", `"${dyn.Username || "~"}"`);
  args.push("-p", `"${dyn.Password}"`);
  args.push("-t", `"${dyn.ProductType}"`);
  args.push("-l", `"${dyn.LayerType}"`);
  args.push("-k", `"${dyn.Key1}"`);
  args.push("-m", `"${dyn.Key2}"`);
  args.push("-n", `"${dyn.Key3 || "~"}"`);
  args.push("-g", `"${dyn.CSGCode || "~"}"`);
  args.push("-f", `"${clientInstallFolder}"`);
  args.push("-o", `"${dyn.Company || "~"}"`);
  args.push("-r", `"${dyn.Folder}"`);
  args.push("-j", `"${dyn.ProjectFolder}"`);
  args.push("-e", `"${dyn.Encrypted}"`);
  args.push("-v", `"${dyn.Version}"`);
  args.push("-a", `"${action}"`);
  if(dnspyPath){
    args.push("-y", `"${dnspyPath}"`);
  }
  args.push("-d", `"${dyn.DLLLocation}"`);

  return args;
}
