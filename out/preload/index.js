import { createRequire } from "node:module";
// -- CommonJS Shims --
import __cjs_mod__ from "node:module";
import.meta.filename;
const __dirname = import.meta.dirname;
__cjs_mod__.createRequire(import.meta.url);
//#region \0rolldown/runtime.js
var __commonJSMin = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __require = /* @__PURE__ */ createRequire(import.meta.url);
//#endregion
//#region electron/preload/index.ts
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
/**
* Expose APIs to renderer via contextBridge
*/
import_electron.contextBridge.exposeInMainWorld("electronAPI", {
	window: {
		minimize: () => import_electron.ipcRenderer.invoke("window:minimize"),
		maximize: () => import_electron.ipcRenderer.invoke("window:maximize"),
		close: () => import_electron.ipcRenderer.invoke("window:close")
	},
	app: {
		getVersion: () => import_electron.ipcRenderer.invoke("app:getVersion"),
		getName: () => import_electron.ipcRenderer.invoke("app:getName"),
		getPlatform: () => import_electron.ipcRenderer.invoke("app:getPlatform")
	},
	project: {
		create: (config) => import_electron.ipcRenderer.invoke("project:create", config),
		open: (path) => import_electron.ipcRenderer.invoke("project:open", path),
		save: (data) => import_electron.ipcRenderer.invoke("project:save", data),
		saveAs: (data, path) => import_electron.ipcRenderer.invoke("project:saveAs", data, path),
		getRecent: () => import_electron.ipcRenderer.invoke("project:getRecent")
	},
	fs: {
		selectFile: (filters) => import_electron.ipcRenderer.invoke("fs:selectFile", filters),
		selectDirectory: () => import_electron.ipcRenderer.invoke("fs:selectDirectory"),
		readTextFile: (path) => import_electron.ipcRenderer.invoke("fs:readTextFile", path),
		writeTextFile: (path, content) => import_electron.ipcRenderer.invoke("fs:writeTextFile", path, content)
	}
});
//#endregion
export {};
