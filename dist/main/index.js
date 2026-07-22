"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = require("path");
const fs_1 = require("fs");
const electron_store_1 = __importDefault(require("electron-store"));
const store = new electron_store_1.default({
    name: 'infiny-data',
    defaults: {
        projects: [],
        chats: [],
        settings: {
            model: 'claude-fable-5',
            effort: 'high',
            webSearch: false,
        }
    }
});
let mainWindow = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 600,
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#0f0f0f',
            symbolColor: '#ffffff',
            height: 40
        },
        webPreferences: {
            preload: (0, path_1.join)(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false
        },
        backgroundColor: '#0f0f0f',
        show: false
    });
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile((0, path_1.join)(__dirname, '../index.html'));
    }
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
electron_1.app.whenReady().then(() => {
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
// IPC Handlers
electron_1.ipcMain.handle('get-projects', () => {
    const projects = store.get('projects', []);
    return projects;
});
electron_1.ipcMain.handle('add-project', (_event, name, path) => {
    const projects = store.get('projects', []);
    if (!projects.some((p) => p.path === path)) {
        const newProject = { id: `${Date.now()}`, name, path, lastOpened: Date.now() };
        projects.push(newProject);
        store.set('projects', projects);
    }
    return projects;
});
electron_1.ipcMain.handle('remove-project', (_event, id) => {
    const projects = store.get('projects', []);
    const filtered = projects.filter((p) => p.id !== id);
    store.set('projects', filtered);
    return filtered;
});
electron_1.ipcMain.handle('get-chats', (_event, projectPath) => {
    const chats = store.get('chats', []);
    if (projectPath) {
        return chats.filter((c) => c.projectPath === projectPath);
    }
    return chats;
});
electron_1.ipcMain.handle('save-chat', (_event, chat) => {
    const chats = store.get('chats', []);
    const existingIndex = chats.findIndex((c) => c.id === chat.id);
    if (existingIndex >= 0) {
        chats[existingIndex] = chat;
    }
    else {
        chats.push(chat);
    }
    store.set('chats', chats);
    return chat;
});
electron_1.ipcMain.handle('delete-chat', (_event, chatId) => {
    const chats = store.get('chats', []);
    const filtered = chats.filter((c) => c.id !== chatId);
    store.set('chats', filtered);
    return filtered;
});
electron_1.ipcMain.handle('get-settings', () => store.get('settings', {
    model: 'claude-fable-5',
    effort: 'high',
    webSearch: false,
}));
electron_1.ipcMain.handle('update-settings', (_event, settings) => {
    const current = store.get('settings', {
        model: 'claude-fable-5',
        effort: 'high',
        webSearch: false,
    });
    store.set('settings', { ...current, ...settings });
    return store.get('settings');
});
electron_1.ipcMain.handle('select-folder', async () => {
    const result = await electron_1.dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        title: 'Selecionar pasta do projeto'
    });
    if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
    }
    return null;
});
electron_1.ipcMain.handle('read-file', (_event, filePath) => {
    try {
        if ((0, fs_1.existsSync)(filePath)) {
            const stats = (0, fs_1.statSync)(filePath);
            const content = (0, fs_1.readFileSync)(filePath, 'utf-8');
            return { success: true, content, size: stats.size, name: filePath.split(/[\\/]/).pop() };
        }
        return { success: false, error: 'Arquivo não encontrado' };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('write-file', (_event, filePath, content) => {
    try {
        const dir = filePath.substring(0, filePath.lastIndexOf('/'));
        if (!(0, fs_1.existsSync)(dir)) {
            (0, fs_1.mkdirSync)(dir, { recursive: true });
        }
        (0, fs_1.writeFileSync)(filePath, content, 'utf-8');
        return { success: true };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('list-files', (_event, dirPath) => {
    try {
        if (!(0, fs_1.existsSync)(dirPath))
            return [];
        const files = (0, fs_1.readdirSync)(dirPath);
        return files.map(file => {
            const fullPath = (0, path_1.join)(dirPath, file);
            const stats = (0, fs_1.statSync)(fullPath);
            return {
                name: file,
                path: fullPath,
                isDirectory: stats.isDirectory(),
                size: stats.size,
                modified: stats.mtimeMs
            };
        });
    }
    catch {
        return [];
    }
});
electron_1.ipcMain.handle('open-external', (_event, url) => electron_1.shell.openExternal(url));
electron_1.ipcMain.handle('show-item-in-folder', (_event, path) => electron_1.shell.showItemInFolder(path));
// Window controls
electron_1.ipcMain.on('window-minimize', () => mainWindow?.minimize());
electron_1.ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized())
        mainWindow.unmaximize();
    else
        mainWindow?.maximize();
});
electron_1.ipcMain.on('window-close', () => mainWindow?.close());
// Claude Code integration
let claudeProcess = null;
electron_1.ipcMain.handle('send-to-claude', async (_event, _chatId, message, _images = []) => {
    // Esta integração será implementada posteriormente
    // Por ora, apenas simula uma resposta
    mainWindow?.webContents.send('claude-output', 'Claude Code integration coming soon...\n');
    mainWindow?.webContents.send('claude-output', `\n> ${message}\n\n`);
    mainWindow?.webContents.send('claude-exit', 0);
    return { success: true };
});
electron_1.ipcMain.handle('stop-claude', () => {
    if (claudeProcess) {
        claudeProcess.kill();
        claudeProcess = null;
        return { success: true };
    }
    return { success: false, error: 'Nenhum processo rodando' };
});
//# sourceMappingURL=index.js.map