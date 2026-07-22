"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Projects
    getProjects: () => electron_1.ipcRenderer.invoke('get-projects'),
    addProject: (name, path) => electron_1.ipcRenderer.invoke('add-project', name, path),
    removeProject: (id) => electron_1.ipcRenderer.invoke('remove-project', id),
    selectFolder: () => electron_1.ipcRenderer.invoke('select-folder'),
    // Chats
    getChats: (projectPath) => electron_1.ipcRenderer.invoke('get-chats', projectPath),
    saveChat: (chat) => electron_1.ipcRenderer.invoke('save-chat', chat),
    deleteChat: (chatId) => electron_1.ipcRenderer.invoke('delete-chat', chatId),
    // Settings
    getSettings: () => electron_1.ipcRenderer.invoke('get-settings'),
    updateSettings: (settings) => electron_1.ipcRenderer.invoke('update-settings', settings),
    // Files
    readFile: (path) => electron_1.ipcRenderer.invoke('read-file', path),
    writeFile: (path, content) => electron_1.ipcRenderer.invoke('write-file', path, content),
    listFiles: (dirPath) => electron_1.ipcRenderer.invoke('list-files', dirPath),
    openFile: (path) => electron_1.ipcRenderer.invoke('open-external', path),
    showItemInFolder: (path) => electron_1.ipcRenderer.invoke('show-item-in-folder', path),
    // Window controls
    windowMinimize: () => electron_1.ipcRenderer.send('window-minimize'),
    windowMaximize: () => electron_1.ipcRenderer.send('window-maximize'),
    windowClose: () => electron_1.ipcRenderer.send('window-close'),
    // Claude events
    sendToClaude: (chatId, message, images) => electron_1.ipcRenderer.invoke('send-to-claude', chatId, message, images),
    stopClaude: () => electron_1.ipcRenderer.invoke('stop-claude'),
    onClaudeOutput: (callback) => {
        const listener = (_event, data) => callback(data);
        electron_1.ipcRenderer.on('claude-output', listener);
        return () => electron_1.ipcRenderer.off('claude-output', listener);
    },
    onClaudeError: (callback) => {
        const listener = (_event, data) => callback(data);
        electron_1.ipcRenderer.on('claude-error', listener);
        return () => electron_1.ipcRenderer.off('claude-error', listener);
    },
    onClaudeExit: (callback) => {
        const listener = (_event, code) => callback(code);
        electron_1.ipcRenderer.on('claude-exit', listener);
        return () => electron_1.ipcRenderer.off('claude-exit', listener);
    },
});
//# sourceMappingURL=preload.js.map