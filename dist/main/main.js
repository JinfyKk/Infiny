"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = require("path");
const child_process_1 = require("child_process");
const fs_1 = require("fs");
let mainWindow = null;
const claudeManager = {
    process: null,
    currentProject: '',
    currentModel: 'claude-fable-5',
    currentEffort: 'high',
    webSearchEnabled: false
};
const PROJECTS_DIR = (0, path_1.join)(electron_1.app.getPath('userData'), 'projects');
const CONFIG_FILE = (0, path_1.join)(electron_1.app.getPath('userData'), 'config.json');
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        webPreferences: {
            preload: (0, path_1.join)(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        },
        titleBarStyle: 'hidden',
        trafficLightPosition: { x: 12, y: 12 },
        backgroundColor: '#0d0d0d',
        show: false
    });
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile((0, path_1.join)(__dirname, '../dist/index.html'));
    }
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
function initApp() {
    if (!(0, fs_1.existsSync)(PROJECTS_DIR)) {
        (0, fs_1.mkdirSync)(PROJECTS_DIR, { recursive: true });
    }
    if (!(0, fs_1.existsSync)(CONFIG_FILE)) {
        (0, fs_1.writeFileSync)(CONFIG_FILE, JSON.stringify({ projects: [], lastProject: '' }));
    }
}
function getProjects() {
    try {
        const config = JSON.parse((0, fs_1.readFileSync)(CONFIG_FILE, 'utf-8'));
        return config.projects || [];
    }
    catch {
        return [];
    }
}
function saveProjects(projects) {
    const config = JSON.parse((0, fs_1.readFileSync)(CONFIG_FILE, 'utf-8'));
    config.projects = projects;
    (0, fs_1.writeFileSync)(CONFIG_FILE, JSON.stringify(config, null, 2));
}
function getProjectPath(projectName) {
    return (0, path_1.join)(PROJECTS_DIR, `${projectName}.json`);
}
function loadProject(projectName) {
    const path = getProjectPath(projectName);
    if (!(0, fs_1.existsSync)(path))
        return null;
    try {
        return JSON.parse((0, fs_1.readFileSync)(path, 'utf-8'));
    }
    catch {
        return null;
    }
}
function saveProject(project) {
    const path = getProjectPath(project.name);
    (0, fs_1.writeFileSync)(path, JSON.stringify(project, null, 2));
    const projects = getProjects();
    const existingIndex = projects.findIndex(p => p.name === project.name);
    if (existingIndex >= 0) {
        projects[existingIndex] = { ...project, history: project.history.slice(-100) };
    }
    else {
        projects.push({ ...project, history: project.history.slice(-100) });
    }
    saveProjects(projects);
}
function startClaudeProcess(projectPath, model, effort, webSearch) {
    if (claudeManager.process) {
        claudeManager.process.kill();
    }
    const args = ['--model', model, '--effort', effort];
    if (webSearch)
        args.push('--web-search');
    const claudeProcess = (0, child_process_1.spawn)('claude', args, {
        cwd: projectPath,
        env: { ...process.env, CLAUDE_CODE_IDE: 'infiny' }
    });
    claudeProcess.stdout?.on('data', (data) => {
        mainWindow?.webContents.send('claude-output', data.toString());
    });
    claudeProcess.stderr?.on('data', (data) => {
        mainWindow?.webContents.send('claude-error', data.toString());
    });
    claudeProcess.on('close', (code) => {
        mainWindow?.webContents.send('claude-exit', code);
        claudeManager.process = null;
    });
    claudeManager.process = claudeProcess;
    claudeManager.currentProject = projectPath;
    claudeManager.currentModel = model;
    claudeManager.currentEffort = effort;
    claudeManager.webSearchEnabled = webSearch;
    return claudeProcess;
}
function sendToClaude(input, images) {
    if (!claudeManager.process)
        return false;
    const message = images && images.length > 0
        ? JSON.stringify({ type: 'user', content: [{ type: 'text', text: input }, ...images.map(img => ({ type: 'image', source: { type: 'base64', data: img } }))] })
        : input;
    claudeManager.process.stdin?.write(message + '\n');
    return true;
}
function stopClaude() {
    if (claudeManager.process) {
        claudeManager.process.kill('SIGINT');
        claudeManager.process = null;
    }
}
// IPC Handlers
electron_1.ipcMain.handle('get-projects', () => getProjects());
electron_1.ipcMain.handle('create-project', async (_, name, path) => {
    const projects = getProjects();
    if (projects.some(p => p.name === name)) {
        throw new Error('Projeto já existe');
    }
    const project = {
        path,
        name,
        lastOpened: Date.now(),
        history: [],
        summary: '',
        importantInfo: ''
    };
    saveProject(project);
    return project;
});
electron_1.ipcMain.handle('select-folder', async () => {
    const result = await electron_1.dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });
    return result.filePaths[0];
});
electron_1.ipcMain.handle('load-project', (_, name) => {
    const project = loadProject(name);
    if (project) {
        project.lastOpened = Date.now();
        saveProject(project);
    }
    return project;
});
electron_1.ipcMain.handle('save-project', (_, project) => {
    saveProject(project);
});
electron_1.ipcMain.handle('delete-project', (_, name) => {
    const projects = getProjects().filter(p => p.name !== name);
    saveProjects(projects);
    const path = getProjectPath(name);
    if ((0, fs_1.existsSync)(path)) {
        require('fs').unlinkSync(path);
    }
});
electron_1.ipcMain.handle('start-claude', (_, projectPath, model, effort, webSearch) => {
    startClaudeProcess(projectPath, model, effort, webSearch);
});
electron_1.ipcMain.handle('send-to-claude', (_, input, images) => {
    return sendToClaude(input, images);
});
electron_1.ipcMain.handle('stop-claude', () => {
    stopClaude();
});
electron_1.ipcMain.handle('get-config', () => ({
    model: claudeManager.currentModel,
    effort: claudeManager.currentEffort,
    webSearch: claudeManager.webSearchEnabled
}));
electron_1.ipcMain.handle('save-config', (_, config) => {
    if (config.model)
        claudeManager.currentModel = config.model;
    if (config.effort)
        claudeManager.currentEffort = config.effort;
    if (config.webSearch !== undefined)
        claudeManager.webSearchEnabled = config.webSearch;
});
electron_1.ipcMain.handle('open-file', async (_, path) => {
    await electron_1.shell.openPath(path);
});
electron_1.ipcMain.handle('get-file-info', (_, path) => {
    try {
        const stats = (0, fs_1.statSync)(path);
        return { name: path.split(/[/\\]/).pop(), size: stats.size, modified: stats.mtime };
    }
    catch {
        return null;
    }
});
electron_1.app.whenReady().then(() => {
    initApp();
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
electron_1.app.on('before-quit', () => {
    stopClaude();
});
//# sourceMappingURL=main.js.map