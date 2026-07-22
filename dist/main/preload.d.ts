interface ElectronAPI {
    getProjects: () => Promise<Array<{
        id: string;
        name: string;
        path: string;
        lastOpened: number;
    }>>;
    addProject: (name: string, path: string) => Promise<Array<{
        id: string;
        name: string;
        path: string;
        lastOpened: number;
    }>>;
    removeProject: (id: string) => Promise<Array<{
        id: string;
        name: string;
        path: string;
        lastOpened: number;
    }>>;
    selectFolder: () => Promise<string | null>;
    getChats: (projectPath?: string) => Promise<any[]>;
    saveChat: (chat: any) => Promise<any>;
    deleteChat: (chatId: string) => Promise<any[]>;
    getSettings: () => Promise<{
        model: string;
        effort: string;
        webSearch: boolean;
    }>;
    updateSettings: (settings: any) => Promise<{
        model: string;
        effort: string;
        webSearch: boolean;
    }>;
    readFile: (path: string) => Promise<{
        success: boolean;
        content?: string;
        size?: number;
        name?: string;
        error?: string;
    }>;
    writeFile: (path: string, content: string) => Promise<{
        success: boolean;
        error?: string;
    }>;
    listFiles: (dirPath: string) => Promise<Array<{
        name: string;
        path: string;
        isDirectory: boolean;
        size: number;
        modified: number;
    }>>;
    openFile: (path: string) => Promise<void>;
    showItemInFolder: (path: string) => Promise<void>;
    windowMinimize: () => void;
    windowMaximize: () => void;
    windowClose: () => void;
    sendToClaude: (chatId: string, message: string, images?: string[]) => Promise<{
        success: boolean;
        error?: string;
    }>;
    stopClaude: () => Promise<{
        success: boolean;
        error?: string;
    }>;
    onClaudeOutput: (callback: (data: string) => void) => () => void;
    onClaudeError: (callback: (data: string) => void) => () => void;
    onClaudeExit: (callback: (code: number) => void) => () => void;
}
export type { ElectronAPI };
//# sourceMappingURL=preload.d.ts.map