"use strict";
/**
 * Free Claude Code Provider - Export Barrel
 *
 * Provider que usa free-claude-code (fcc-server proxy) para acessar
 * modelos via provedores gratuitos (OpenRouter, Groq, Ollama, etc.)
 * mantendo a interface idêntica ao ClaudeProvider oficial.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModelOptionsForProvider = exports.isModelSupported = exports.resolveFreeClaudeModelId = exports.getFreeClaudeModelDescription = exports.getFreeClaudeModelLabel = exports.getFreeClaudeSupportedModels = exports.getDefaultModelMapping = exports.DEFAULT_MODEL_MAPPING_GROQ = exports.DEFAULT_MODEL_MAPPING_OPENROUTER = exports.ANTHROPIC_MODEL_ALIASES = exports.DEFAULT_FREE_CLAUDE_CONFIG = exports.FCCServerManager = exports.createFreeClaudeProvider = exports.FreeClaudeProvider = void 0;
var FreeClaudeProvider_1 = require("./FreeClaudeProvider");
Object.defineProperty(exports, "FreeClaudeProvider", { enumerable: true, get: function () { return FreeClaudeProvider_1.FreeClaudeProvider; } });
Object.defineProperty(exports, "createFreeClaudeProvider", { enumerable: true, get: function () { return FreeClaudeProvider_1.createFreeClaudeProvider; } });
var fccServerManager_1 = require("./fccServerManager");
Object.defineProperty(exports, "FCCServerManager", { enumerable: true, get: function () { return fccServerManager_1.FCCServerManager; } });
// Valores (funções, constantes)
var FreeClaudeConfig_1 = require("./FreeClaudeConfig");
Object.defineProperty(exports, "DEFAULT_FREE_CLAUDE_CONFIG", { enumerable: true, get: function () { return FreeClaudeConfig_1.DEFAULT_FREE_CLAUDE_CONFIG; } });
Object.defineProperty(exports, "ANTHROPIC_MODEL_ALIASES", { enumerable: true, get: function () { return FreeClaudeConfig_1.ANTHROPIC_MODEL_ALIASES; } });
Object.defineProperty(exports, "DEFAULT_MODEL_MAPPING_OPENROUTER", { enumerable: true, get: function () { return FreeClaudeConfig_1.DEFAULT_MODEL_MAPPING_OPENROUTER; } });
Object.defineProperty(exports, "DEFAULT_MODEL_MAPPING_GROQ", { enumerable: true, get: function () { return FreeClaudeConfig_1.DEFAULT_MODEL_MAPPING_GROQ; } });
Object.defineProperty(exports, "getDefaultModelMapping", { enumerable: true, get: function () { return FreeClaudeConfig_1.getDefaultModelMapping; } });
// Re-exports de modelMapping
var modelMapping_1 = require("./modelMapping");
Object.defineProperty(exports, "getFreeClaudeSupportedModels", { enumerable: true, get: function () { return modelMapping_1.getSupportedModelsForProvider; } });
Object.defineProperty(exports, "getFreeClaudeModelLabel", { enumerable: true, get: function () { return modelMapping_1.getModelLabel; } });
Object.defineProperty(exports, "getFreeClaudeModelDescription", { enumerable: true, get: function () { return modelMapping_1.getModelDescription; } });
Object.defineProperty(exports, "resolveFreeClaudeModelId", { enumerable: true, get: function () { return modelMapping_1.resolveModelId; } });
Object.defineProperty(exports, "isModelSupported", { enumerable: true, get: function () { return modelMapping_1.isModelSupported; } });
Object.defineProperty(exports, "getModelOptionsForProvider", { enumerable: true, get: function () { return modelMapping_1.getModelOptionsForProvider; } });
//# sourceMappingURL=index.js.map