import { createRequire } from "node:module";
import { join } from "node:path";
// -- CommonJS Shims --
import __cjs_mod__ from "node:module";
import.meta.filename;
const __dirname = import.meta.dirname;
__cjs_mod__.createRequire(import.meta.url);
//#region \0rolldown/runtime.js
var __commonJSMin = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __require = /* @__PURE__ */ createRequire(import.meta.url);
//#endregion
//#region electron/main/index.ts
var import_electron = (/* @__PURE__ */ __commonJSMin(((exports, module) => {
	var fs = __require("fs");
	var path = __require("path");
	var pathFile = path.join(__dirname, "path.txt");
	function getElectronPath() {
		let executablePath;
		if (fs.existsSync(pathFile)) executablePath = fs.readFileSync(pathFile, "utf-8");
		if (process.env.ELECTRON_OVERRIDE_DIST_PATH) return path.join(process.env.ELECTRON_OVERRIDE_DIST_PATH, executablePath || "electron");
		if (executablePath) return path.join(__dirname, "dist", executablePath);
		else throw new Error("Electron failed to install correctly, please delete node_modules/electron and try installing again");
	}
	module.exports = getElectronPath();
})))();
var mainWindow = null;
/**
* Create the main application window
*/
function createWindow() {
	mainWindow = new import_electron.BrowserWindow({
		width: 1400,
		height: 900,
		minWidth: 1200,
		minHeight: 700,
		backgroundColor: "#1e1e1e",
		show: false,
		titleBarStyle: "default",
		webPreferences: {
			preload: join(__dirname, "../preload/index.js"),
			sandbox: false,
			contextIsolation: true,
			nodeIntegration: false
		}
	});
	if (process.env.VITE_DEV_SERVER_URL) {
		mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
		mainWindow.webContents.openDevTools();
	} else mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
	mainWindow.once("ready-to-show", () => {
		mainWindow?.show();
	});
	mainWindow.on("closed", () => {
		mainWindow = null;
	});
}
/**
* Initialize IPC handlers
*/
function initializeIpc() {
	import_electron.ipcMain.handle("window:minimize", () => {
		mainWindow?.minimize();
	});
	import_electron.ipcMain.handle("window:maximize", () => {
		if (mainWindow?.isMaximized()) mainWindow.unmaximize();
		else mainWindow?.maximize();
	});
	import_electron.ipcMain.handle("window:close", () => {
		mainWindow?.close();
	});
	import_electron.ipcMain.handle("app:getVersion", () => {
		return import_electron.app.getVersion();
	});
	import_electron.ipcMain.handle("app:getName", () => {
		return import_electron.app.getName();
	});
	import_electron.ipcMain.handle("app:getPlatform", () => {
		return process.platform;
	});
}
/**
* Application lifecycle handlers
*/
import_electron.app.whenReady().then(() => {
	initializeIpc();
	createWindow();
	import_electron.app.on("activate", () => {
		if (import_electron.BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});
import_electron.app.on("window-all-closed", () => {
	if (process.platform !== "darwin") import_electron.app.quit();
});
import_electron.app.on("web-contents-created", (_event, contents) => {
	contents.on("new-window", (event, navigationUrl) => {
		event.preventDefault();
	});
});
//#endregion
export {};
