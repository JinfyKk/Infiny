#!/bin/bash
# Auto-generated msg-filter for git filter-branch

case "$1" in
  *"Initial commit"* )
    echo "chore: initial commit"
    ;;
  *"Add gitignore and remove node_modules"* )
    echo "chore: add .gitignore and remove node_modules"
    ;;
  *"Remove node_modules"* )
    echo "chore: remove node_modules from history"
    ;;
  *"docs: README completo com docs de uso, arquitetura, scripts e contribuição

- Adiciona documentação completa do projeto
- Explica arquitetura, scripts, atalhos, requisitos
- Inclui seção de contribuição e licença MIT"* )
    echo "docs: add comprehensive README with usage, architecture, scripts and contributing guide"
    ;;
  *"docs: atualiza rodapé do README para 'Feito com 🎵 e 😫'

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"* )
    echo "docs: update README footer with attribution"
    ;;
  *"README"* )
    echo "docs: update README"
    ;;
  *"README"* )
    echo "docs: update README"
    ;;
  *"README"* )
    echo "docs: update README"
    ;;
  *"README

Removed unnecessary text about terminal commands."* )
    echo "docs: update README"
    ;;
  *"README"* )
    echo "docs: update README"
    ;;
  *"README"* )
    echo "docs: update README"
    ;;
  *"CLAUDE

Refine project guidelines for clarity and conciseness."* )
    echo "docs: add CLAUDE.md with project instructions"
    ;;
  *"README"* )
    echo "docs: update README"
    ;;
  *"README"* )
    echo "docs: update README"
    ;;
  *"feat: implement 6-theme design system with Framer Motion animations

- Add 6-theme system (pampas, dark-premium, tech-blue, natural-green, monochrome, futuristic) with CSS custom properties
- Implement ThemeProvider with Zustand persistence and instant theme switching
- Create ThemeSelector with animated dropdown and theme previews
- Add Framer Motion animations across all components:
  - Sidebar: slide panel, staggered project/chat lists, hover/tap feedback
  - ChatArea: staggered message entrance, typing indicator
  - FilesPanel: slide animation with spring physics
  - ModelSelector/EffortSelector/ThemeSelector: spring dropdowns, staggered items
  - Toast/ConfirmDialog: entrance/exit animations
  - App: staggered header entrance
- Refactor tailwind.config.js with semantic color aliases using CSS variables
- Simplify index.css with direct CSS variable usage
- Add native folder picker via Electron IPC (selectFolder)
- Add Toast notifications and ConfirmDialog components
- Update components to use design tokens instead of hardcoded classes
- Respect prefers-reduced-motion for accessibility"* )
    echo "feat: implement 6-theme design system with Framer Motion animations"
    ;;
  *"fix: corrige inicialização do Free Claude Code e comunicação IPC

- src/providers/freeClaude/FreeClaudeProvider.ts: adiciona findFccServerExecutable() para resolver caminho do fcc-server.exe no Windows (.local/bin, AppData, USERPROFILE) e Linux, evita fcc-server.cmd hardcoded
- src/main/process/ProcessManager.ts: handleFatalSpawnError() já trata ENOENT/EACCES/ENOEXEC corretamente (remove processo e config de restart, não tenta reiniciar)
- src/main/preload.ts: expõe ElectronAPI com eventos que espelham EXATAMENTE o main.ts (process-started, process-stopped, process-error, process-output, process-restarting, process-status)
- src/components/SplashScreen.tsx: atualiza handlers para usar novo formato de eventos do preload (onProcessStatus, onProcessError, onProcessStopped, onProcessRestarting) com mapeamento processName->stepId"* )
    echo "fix: correct Free Claude Code initialization and IPC communication"
    ;;
  *"fix: corrige pipeline de mensagens Free Claude e adiciona instrumentação completa

- ALTERAÇÃO 1: sendToActiveProvider() em main.ts agora delega exclusivamente para activeProvider.send() (removido write manual no ProcessManager)
- ALTERAÇÃO 2: writeToProcess() em ProcessManager.ts adicionado logs completos (warn com detalhes de falha, log com bytes enviados)
- ALTERAÇÃO 3: buildClaudeCommand() em FreeClaudeProvider.ts corrigido useShell para detectar .cmd corretamente com caminho absoluto
- ALTERAÇÃO 4: Env vars seguem wrapper oficial free-claude-code (ANTHROPIC_BASE_URL sem /v1, ANTHROPIC_AUTH_TOKEN usa config ou 'freecc', adicionado CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=1)
- ALTERAÇÃO 5: Removido restart automático onFailure no healthcheck do fcc-server que conflitava com waitForServerHealthy()
- ALTERAÇÃO 6: Instrumentação completa do pipeline com logs em todos os pontos (Renderer, IPC, main.ts, ProviderManager, FreeClaudeProvider, ProcessManager, parseStreamJson, handleProviderOutput)
- ALTERAÇÃO 7: parseStreamJson melhorado com logs detalhados para diagnosticar eventos descartados

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"* )
    echo "fix: correct Free Claude message pipeline and add comprehensive instrumentation"
    ;;
  *"fix: corrige erros TypeScript e contratos IPC

- Corrige preload.ts: expõe ElectronAPI com tipos corretos para eventos do ProcessManager e ProviderManager
- Adiciona método shutdown() ao ProcessManager para limpeza graceful
- Atualiza ChatArea.tsx para usar getProviderModels (alias getAvailableModels)
- Corrige global.d.ts para importar ElectronAPI do preload
- Adiciona interface ModelOption exportada em modelMapping.ts
- Corrige re-exports em process/index.ts com export type"* )
    echo "fix: correct TypeScript errors and IPC contracts"
    ;;
  *"instrumentation: add comprehensive pipeline logging for debugging fcc-server/Claude CLI flow

- src/main/main.ts: Added detailed logging to ProcessManager events, initializeActiveProvider, sendToActiveProvider, and IPC handlers
- src/main/preload.ts: Added logging to all IPC invoke calls and event listeners
- src/providers/freeClaude/FreeClaudeProvider.ts: Enhanced logging in spawnFccServer, spawnClaudeCli, setupProcessManagerListeners, handleProviderOutput, send, parseStreamJson
- src/main/process/ProcessManager.ts: Enhanced writeToProcess logging with success/failure details, process close event logging
- src/store/infinyStore.ts: Added pipeline logging to sendToProvider and Electron listeners
- src/components/ChatArea.tsx: Added logging to handleSend method

This instrumentation enables full traceability from:
Renderer -> IPC -> main.ts -> ProviderManager -> FreeClaudeProvider -> ProcessManager -> Claude CLI
and back through stdout -> parseStreamJson -> IPC -> Renderer"* )
    echo "instrumentation: add comprehensive pipeline logging for fcc-server/Claude CLI flow debugging"
    ;;
  *"fix: corrige FreeClaudeProvider para iniciar fcc-server como no free-claude-code original

- Remove argumentos CLI inventados (--provider, --port, --host, --api-key)
- Configura fcc-server via env vars corretas (OPENROUTER_API_KEY, etc.)
- Mapeia provedores para env vars corretas (conforme provider_catalog.py)
- Adiciona ANTHROPIC_AUTH_TOKEN=freecc (padrão do wrapper oficial)
- Adiciona CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=1
- Fix health check: NÃO aceita 404 como sucesso (apenas 2xx)
- Remove auto-restart conflitante do fcc-server
- Melhora logs: stdout/stderr/exit code/motivo do encerramento
- Corrige useShell no Windows: usa .endsWith('.cmd') em vez de igualdade"* )
    echo "fix: correct FreeClaudeProvider to start fcc-server as in free-claude-code original"
    ;;
  *"feat: adiciona evento provider-ready para liberar UI após inicialização completa

- Provider.ts: adiciona onReady() à interface AIProvider e ProviderManager
- FreeClaudeProvider.ts: emite readyCallback após fcc-server saudável e Claude CLI spawnado
- ClaudeProvider.ts: implementa onReady() (noop para compatibilidade)
- main.ts: encaminha provider-ready para renderer via IPC
- preload.ts: expõe onProviderReady listener
- SplashScreen.tsx: consome provider-ready para completar step 'connect'"* )
    echo "feat: add provider-ready event to unlock UI after full initialization"
    ;;
  *"build: atualiza build com novo hash do bundle"* )
    echo "build: update build with new bundle hash"
    ;;
  *"fix: adiciona --print ao FreeClaudeProvider para habilitar stream-json no Windows"* )
    echo "fix: add --print flag to FreeClaudeProvider to enable stream-json on Windows"
    ;;
  *"feat: adiciona evento provider-healthy para liberar UI após fcc-server saudável

- FreeClaudeProvider: adiciona Authorization header (Bearer freecc) nos health checks do fcc-server (/health e /v1/models)
- FreeClaudeProvider: adiciona callback healthyCallback disparado após waitForServerHealthy()
- preload.ts: expõe onProviderHealthy via IPC 'provider-healthy'
- main.ts: registra onHealthy callback no FreeClaudeProvider que emite 'provider-healthy' para renderer
- SplashScreen.tsx: adiciona listener para 'provider-healthy' que marca step 'health' como completed

Fix: health checks falhavam com 401 por falta de Authorization header, travando UI em 'Verificando saúde do servidor'"* )
    echo "feat: add provider-healthy event to unlock UI after healthy fcc-server"
    ;;
  *"build: atualiza build com novo hash do bundle"* )
    echo "build: update build with new bundle hash"
    ;;
  *"refactor: reescreve ProcessManager como gerenciador genérico de processos

- Move ProcessManager para preload.ts como classe genérica EventEmitter
- Adiciona health checks, restart policy e cache de parâmetros de spawn
- Adiciona cache de status no main process para resolver race condition
- Adiciona IPC getProcessStatusSnapshot para sincronizar estado no mount
- Atualiza SplashScreen para consultar snapshot ao montar
- Atualiza build (dist/index.html com novo hash do bundle)"* )
    echo "refactor: rewrite ProcessManager as generic process manager"
    ;;
  *"refactor: substitui ProcessManager por electronAPI no script de preload"* )
    echo "refactor: replace ProcessManager with electronAPI in preload script"
    ;;
  *"feat: define NVIDIA como provedor gratuito padrão e adiciona mapeamento de modelos para NVIDIA NIM"* )
    echo "feat: set NVIDIA as default free provider and add NVIDIA NIM model mapping"
    ;;
  *"fix: unifica default freeProvider, corrige effort mismatch e adiciona lock anti-race

- Adiciona constante DEFAULT_FREE_PROVIDER='nvidia' compartilhada entre start() e spawnFccServer() para eliminar mismatch ('nvidia' vs 'openrouter')
- Expande getSupportedEfforts() para \['low', 'medium', 'high'\] compatível com Claude CLI oficial
- Altera default effort de 'high' para 'low' em main.ts e store/infinyStore.ts
- Adiciona _startStopLock mutex em FreeClaudeProvider para evitar start/stop concorrentes
- Garante que lock seja liberado em try/finally em start() e stop()"* )
    echo "fix: unify default freeProvider, correct effort mismatch and add anti-race lock"
    ;;
  *"fix: corrige BUG C (troca automática de projeto) e adiciona logging completo BUG A

- Corrigido BUG C: Sidebar agora chama loadProject() ao selecionar projeto, persistindo lastOpened e lastProject no config.json
- Corrigido load-project handler para atualizar config.lastProject
- Adicionado buffer de stdout/stderr completo no ProcessManager para debug de exit code 1 (BUG A)
- Log completo de stdout/stderr agora impresso quando processo termina com código não-zero
- Substituído _startStopLock por fila de promises (_opQueue) no FreeClaudeProvider (BUG B - commit anterior)"* )
    echo "fix: fix BUG C (auto project switch) and add complete BUG A logging"
    ;;
  *"fix: corrige BUG C (troca automática de projeto) e adiciona logging completo BUG A

- Corrige BUG C: troca automática de projeto
- Adiciona logging completo para BUG A
- Unifica default freeProvider
- Corrige effort mismatch
- Adiciona lock anti-race
- Define NVIDIA como provedor gratuito padrão
- Adiciona mapeamento de modelos para NVIDIA NIM
- Refatora: substitui ProcessManager por electronAPI no preload
- Refatora ProcessManager como gerenciador genérico de processos"* )
    echo "fix: fix BUG C (auto project switch) and add complete BUG A logging"
    ;;
  *"fix: evita auto-restart incorreto ao parar processos (BUG C)

Causa: ProcessManager registrava dois handlers 'close' para o mesmo processo:
1. Em spawn(): .on('close') -> handleProcessExit -> maybeAutoRestart
2. Em stop(): .once('close') -> handleProcessExit -> maybeAutoRestart

Ao chamar stop(), ambos disparavam. O primeiro consumia a flag
intentionalStops (evitando restart), mas o segundo via a flag já consumida
e disparava auto-restart indesejado (process-restarting attempt 1).

Correção: o handler .once('close') em stop() agora apenas resolve a Promise,
sem chamar handleProcessExit novamente. O handler do spawn() já cuida do
cleanup e da lógica de restart."* )
    echo "fix: prevent incorrect auto-restart when stopping processes (BUG C)"
    ;;
  *"fix: fix deadlock in ProcessManager when restarting processes (BUG C)

fix: remove duplicate auto-restart logic in FreeClaudeProvider (BUG A)

- ProcessManager: fixed deadlock when restarting process with same name after
  intentional stop. The process Map wasn't cleaned on exit, leaving stale entry
  whose child process already fired 'close' event. New spawn() would hang
  waiting on that stale child's 'close' event which never fires again.
  Fixed by checking child.exitCode/signalCode before awaiting.

- FreeClaudeProvider: removed duplicate onFailure health check callback that
  was restarting processes independently of ProcessManager's managed restart
  logic (configureRestart/maybeAutoRestart). This duplicate restart ignored
  intentionalStops and caused BUG A (auto-switching project on restart).

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"* )
    echo "fix: fix deadlock in ProcessManager when restarting processes (BUG C)"
    ;;
  *"refactor: integração nativa com Free Claude Code (FCC)

- FreeClaudeProvider: remove model mapping, buildClaudeCommand, buildFccServerEnv, NVIDIA logic
  Mantém apenas orquestração: spawn fcc-server -> health check -> spawn fcc-claude
  Usa fcc-claude launcher oficial com args compatíveis com Claude Code
  Modelos usam nomes Anthropic puros (claude-fable-5, etc.)

- FCCServerManager: simplificado para spawn fcc-server sem args/env de configuração
  Remove FCC_PROVIDER, FCC_API_KEY, FCC_MODEL_MAPPING env vars
  fcc-server lê configuração de ~/.config/fcc/.env automaticamente
  Health check usa apenas 2xx como sucesso

- FreeClaudeConfig: remove freeProvider, apiKey, modelMapping, fccServerArgs
  Adiciona ModelOption type e getModelOptionsForProvider compatível
  Mantém SUPPORTED_ANTHROPIC_MODELS, ANTHROPIC_MODEL_ALIASES para UI

- Remove modelMapping.ts (lógica de resolução de modelos duplicada do FCC)
- Atualiza exports em index.ts e main/process/index.ts

ProcessManager mantido genérico sem conhecer FCC/Claude/providers"* )
    echo "refactor: native integration with Free Claude Code (FCC)"
    ;;
  *"feat: implement Turtly themes + fix model/effort selectors + remove artificial session msg

- Fix BUG 1: ModelSelector fallback now correctly uses 'claude-fable-5' matching store default
- Fix BUG 2: EffortSelector already has all options (low, medium, high, max, xhigh, ultracode) and propagates correctly
- Fix BUG 3: Both providers filter out system/init messages (no artificial '\[Sessão iniciada\]' message)
- Add Turtly Light (default) and Turtly Forest themes with correct color palettes
- Add accent tokens to all 8 themes (turtly-light, turtly-forest, pampas, dark-premium, tech-blue, natural-green, monochrome, futuristic)
- Theme persistence via localStorage in ThemeProvider
- Update ThemeTokens interface to include accent tokens"* )
    echo "feat: implement Turtly themes + fix model/effort selectors + remove artificial session message"
    ;;
  *"fix: corrige BUG 3 (Themes) e BUG 4 (Session messages)

Correções implementadas:

BUG 3 (Themes):
- ThemeProvider agora usa Zustand store como fonte de verdade para o tema
- Adicionado estado de hidratação para evitar mismatch SSR/cliente
- Sincronização bidirecional com store (updateSettings persiste via zustand persist middleware)
- Removido código duplicado de persistência manual no localStorage
- Uso consistente de applyThemeToDOM do module themes.ts

BUG 4 (Session messages não renderizam):
- Adicionado loadChatsForProject no store para carregar histórico do main process
- setCurrentProject agora carrega chats automaticamente ao trocar de projeto
- Conversão do formato de histórico flat do main process para chats estruturados
- Mantém chats locais existentes se já existirem para o projeto
- Novo MainProjectConfig interface para tipagem do projeto do main process"* )
    echo "fix: fix BUG 3 (Themes) and BUG 4 (Session messages)"
    ;;
  *"fix: corrige bugs de estado e implementa temas Turtly

- Fix BUG 1: Dropdown click-outside handler no ThemeSelector (chat area não fechava dropdowns)
- Fix BUG 2: Remove duplicação de mensagem durante streaming (removido providerOutput extra do ChatArea)
- Fix BUG 3: IA pensando infinitamente - adicionado responseCompleteCallback no provider e listener IPC onProviderResponseComplete
- Fix BUG 4: Tela 'Bem-vindo ao Infiny' persistia - loadChatsForProject agora usa store para obter nome do projeto
- Fix Model Selector: MODELS constant agora mapeia corretamente para IDs Anthropic (claude-fable-5, claude-opus-5, claude-sonnet-5, claude-haiku-5)
- Fix Effort Selector: adicionado 'ultracode' aos efforts suportados
- Implementado tema Turtly Light (#F5F3EA bg, #6FAF6A primary) e Turtly Forest (#1D1C1C bg, #008000 primary) com todos 107 tokens CSS
- Adicionado onResponseComplete à interface AIProvider e implementado em FreeClaudeProvider e ClaudeProvider
- Corrigido erros TypeScript: imports não utilizados, variáveis não declaradas, métodos faltando"* )
    echo "fix: fix state bugs and implement Turtly themes"
    ;;
  *"fix: corrige 4 bugs críticos (BUG 1-4)

BUG 1: Dropdown portals renderizados em (0,0) em vez de abaixo do trigger
- Dropdown.tsx, ProviderSelector.tsx, ThemeSelector.tsx: adicionado portalPosition state e updatePortalPosition callback usando getBoundingClientRect()
- Aplicado estilo top/left dinâmico no portal

BUG 2: Mensagens vazavam entre chats devido a estado global de streaming
BUG 3: isProviderRunning global afetava todos os chats
- infinyStore.ts: adicionado isGenerating ao Chat interface, removido isProviderRunning/providerOutput globais
- Adicionado isChatGenerating/setChatGenerating selectors por chat
- Atualizado sendToProvider/stopProvider/event listeners para trabalhar por chatId
- Preload.ts e main.ts: IPC atualizado para incluir chatId em send-to-provider/stop-provider
- Provider.ts, FreeClaudeProvider.ts, ClaudeProvider.ts: send() aceita chatId
- ChatArea.tsx: usa isChatGenerating por chat

BUG 4: Welcome screen aparecia incorretamente ao trocar projetos sem chats
- infinyStore.ts: loadChatsForProject agora auto-cria chat vazio quando projeto não tem histórico

Arquivos modificados:
- src/components/ui/Dropdown.tsx (portal positioning fix)
- src/components/ProviderSelector.tsx (portal fix + per-chat state)
- src/theme/ThemeSelector.tsx (portal fix)
- src/store/infinyStore.ts (per-chat streaming state + auto-create chat)
- src/main/preload.ts (IPC chatId support)
- src/main/main.ts (IPC chatId routing + currentStreamingChatId tracking)
- src/providers/Provider.ts (AIProvider interface + chatId)
- src/providers/freeClaude/FreeClaudeProvider.ts (chatId support)
- src/providers/claude/ClaudeProvider.ts (chatId support)
- src/components/ChatArea.tsx (per-chat isGenerating)
- package.json, package-lock.json (dependencies)"* )
    echo "fix: fix 4 critical bugs (BUG 1-4)"
    ;;
  *"fix: corrige loop infinito de 'pensando' e tela branca nos dropdowns

- isGenerating agora é resetado para false ao carregar chats do storage (não persiste estado de geração)
- Dropdown base (ModelSelector, EffortSelector) devem funcionar corretamente com portalPosition"* )
    echo "fix: fix infinite "thinking" loop and white screen in dropdowns"
    ;;
  *"feat: implement independent chats + fix dropdown positioning + chat auto-selection

- Fix dropdown positioning with useDropdownPosition hook (handles resize, scroll, sidebar toggle)
- Fix chat auto-selection when clicking project in sidebar
- Add independent chats feature ('Chats Gerais' section):
  \* INDEPENDENT_PROJECT_ID constant
  \* addIndependentChat action in store
  \* Auto-name from first user message (ChatGPT style)
  \* 'Novo chat independente' button in sidebar
  \* Visual distinction with MessageSquare icon
  \* Rename/delete support for independent chats
- Clean up debug logs (BUG1, BUG2, BUG3, BUG4)
- Update removeProject to preserve independent chats"* )
    echo "feat: implement independent chats + fix dropdown positioning + chat auto-selection"
    ;;
  *"feat: implementar algoritmo de posicionamento arquitetural para dropdowns com clamp real

- Nova função utilitária calculateDropdownPosition em src/lib/dropdownPosition.ts
  - Trata viewport como bounding box físico
  - Clamp horizontal: max(MARGIN, min(left, viewportWidth - dropdownWidth - MARGIN))
  - Clamp vertical: impede overflow do topo e base da janela
  - Flip automático (bottom ↔ top) baseado no espaço disponível
  - Limita maxHeight dinamicamente quando dropdown não cabe na altura disponível
  - Retorna { left, top, placement, maxHeight, width }

- Hook useDropdownPosition atualizado para usar a função pura
  - Conecta dropdownRef para medir dimensões reais do dropdown renderizado
  - Recalcula em resize, scroll e ResizeObserver (sidebar toggle)

- Dropdown.tsx e ThemeSelector.tsx atualizados
  - Usam dropdownRef para medição real
  - Rotacionam ícone chevron baseado no placement (top/bottom)
  - Aplicam maxHeight dinâmico calculado pelo algoritmo

Todos os dropdowns portalizados (ThemeSelector, ModelSelector, EffortSelector, ProviderSelector) agora permanecem 100% dentro da janela."* )
    echo "feat: implement architectural dropdown positioning algorithm with real clamp"
    ;;
  *"refactor: implementa arquitetura singleton para fcc-server

- ProcessManager: adiciona método isHealthy() para verificar saúde de processo via health check com retries
- FreeClaudeProvider: implementa ensureFccServerRunning() que reutiliza servidor existente se saudável
- FreeClaudeProvider: start() torna-se idempotente - detecta mudanças (model/effort/projectPath) e reinicia APENAS fcc-claude quando necessário
- FreeClaudeProvider: adiciona restartClaudeCli() para reiniciar apenas o launcher
- ProviderManager: setActiveProvider() não para provider atual se mesmo provider (mesmo projectPath ou config diferente) - delega ao provider.start() idempotente

Logs esperados agora:
\[FCC\] Existing healthy server found
\[FCC\] Reusing existing server
\[FCC\] Skip spawn

Nunca mais: Started server process... ERROR 10048 durante troca de projeto"* )
    echo "refactor: implement singleton architecture for fcc-server"
    ;;
  *"feat: unificar arquitetura de positioning de dropdowns — uma única fonte de verdade

- Nova função pura calculateDropdownPosition em src/lib/dropdownPosition.ts
  - Clamp horizontal: max(MARGIN, min(left, viewportWidth - dropdownWidth - MARGIN))
  - Clamp vertical: impede overflow topo/base
  - Flip automático (bottom ↔ top) baseado em espaço disponível
  - Limita maxHeight dinamicamente quando dropdown não cabe
  - Retorna { left, top, placement, maxHeight, width }

- Hook useDropdownPosition atualizado para usar a função pura + dropdownRef para medição real

- Componentes migrados:
  - Dropdown.tsx (base): usa hook + conecta dropdownRef + rotaciona chevron por placement
  - ThemeSelector.tsx: usa hook + conecta dropdownRef
  - ProviderSelector.tsx: REESCRITO para usar Dropdown component (removido código duplicado: getBoundingClientRect, portalPosition state, updatePortalPosition, logs BUG1)
  - ModelSelector.tsx: já usava Dropdown ✓
  - EffortSelector.tsx: já usava Dropdown ✓

- ConfirmDialog.tsx: mantém createPortal (é modal, não dropdown)

TODOS dropdowns portalizados (ThemeSelector, ModelSelector, ProviderSelector, EffortSelector) agora usam calculateDropdownPosition como única fonte de verdade."* )
    echo "feat: unify dropdown positioning architecture - single source of truth"
    ;;
  *"fix: corrigir 4 bugs críticos no Infiny

BUG 1: Model/Effort/Provider selectors não atualizavam UI
- Refatorados para seguir padrão ThemeSelector (local state + sync store)
- Estado local para feedback imediato, depois persistência via updateSettings

BUG 2: Tela 'Bem-vindo ao Infiny' ficava presa
- Corrigida condição em ChatArea: apenas !currentChat (chats independentes não têm projeto)

BUG 3: Ícones inconsistentes
- Selectors usam padrão consistente: w-4 h-4 itens, w-8 h-8 container trigger
- Lucide React em todo projeto com stroke 2 padrão

BUG 4: Headers duplicados no topo
- Removido header duplicado de App.tsx (mantido o de ChatArea.tsx com seletores completos)"* )
    echo "fix: fix 4 critical bugs in Infiny"
    ;;
  *"fix: adicionar _setupElectronListeners() no App.tsx - conecta eventos IPC do main process ao renderer

O método _setupElectronListeners estava definido no store infinystore.ts mas nunca era chamado em lugar nenhum. Isso causava a falha silenciosa onde:
- Respostas do Claude apareciam nos logs do backend (ProcessManager, FreeClaudeProvider, ProviderManager)
- Mas NÃO chegavam ao ChatArea porque os listeners IPC (onProviderOutput, onProviderResponseComplete, etc.) nunca eram registrados

A correção adiciona um useEffect no AppContent que:
1. Chama _setupElectronListeners() no mount
2. Chama _cleanupElectronListeners() no unmount

Isso completa o pipeline: FreeClaudeProvider → ProviderManager → main.ts (sendToRenderer) → preload.ts (contextBridge) → infinyStore (_setupElectronListeners) → ChatArea (UI update)"* )
    echo "fix: add _setupElectronListeners() in App.tsx - connect main process IPC events to renderer"
    ;;
  *"fix: implement fcc-server singleton with race condition protection

- Add _fccServerInitPromise lock to ensureFccServerRunning() to prevent concurrent spawns
- If initialization in progress, concurrent calls await the same Promise
- Promise created BEFORE spawn to catch race condition window
- Promise cleared in finally block (success or failure)
- Add detailed logging: \[FCC LOCK\] acquire/waiting/release, \[FCC SINGLETON\] reusing/spawning
- Clear lock in stop() to allow fresh initialization after provider restart
- TypeScript compiles without errors in FreeClaudeProvider.ts"* )
    echo "fix: implement fcc-server singleton with race condition protection"
    ;;
  *"instrument: adicionar logs forenses \[SEND 01-34\] e \[END 01-09\] no pipeline de mensagens

Instrumentação completa do pipeline de envio de mensagens para diagnóstico forense:
- ChatArea.tsx: \[SEND 01-04\] handleSend, addMessage, sendToProvider
- infinyStore.ts: \[SEND 04-06, 29-31\] sendToProvider, _setupElectronListeners, \[END 06,08\] response handling
- preload.ts: \[SEND 06,16,29\] electronAPI methods, createListener
- main.ts: \[SEND 14,17-19,28\] setupProviderListeners, sendToActiveProvider, sendToRenderer
- Provider.ts: \[SEND 19,27\] ProviderManager.send, setupProviderListeners, \[END 03\] onReady/onResponseComplete
- FreeClaudeProvider.ts: \[SEND 20-21,25-26\] send, handleProviderOutput, parseStreamJson, \[END 01-02\] result handling
- ProcessManager.ts: \[SEND 21,24\] writeToProcess, stdout process-output emission
- Message.tsx: \[SEND 33\] render com isStreaming

Cada log inclui: timestamp, thread (main/renderer), chatId, providerId, model, projectPath, parâmetros e conteúdo.
Build compila sem erros TypeScript."* )
    echo "instrument: add forensic logs [SEND 01-34] and [END 01-09] in message pipeline"
    ;;
  *"fix: permitir chats independentes sem projeto + corrigir parser de stream do FreeClaudeProvider"* )
    echo "fix: allow independent chats without project + fix FreeClaudeProvider stream parser"
    ;;
  *"feat: suporte a chats independentes + fix dropdown positioning + fix provider listener cleanup

- ChatArea: exibe 'Chat Independente' quando não há projeto selecionado
- Dropdown (ui/Dropdown, ModelSelector, ProviderSelector, EffortSelector, ThemeSelector): refatorado posicionamento para usar left/top em vez de portalPosition
- ProviderManager: removido cleanupProviderListeners() no onExit callback - causava perda de callbacks (data/ready/responseComplete) quando fcc-claude reiniciava por mudança de projeto/model/effort. Limpeza real só ocorre em stop() (troca de provider)."* )
    echo "feat: support independent chats + fix dropdown positioning + fix provider listener cleanup"
    ;;
  *"README"* )
    echo "docs: update README"
    ;;
  *"README"* )
    echo "docs: update README"
    ;;
  *"feat: add typing indicator animation + fix independent chat home directory resolution

- Add Framer Motion typing indicator animation while streaming messages
- Fix ModelSelector to show placeholder when no model selected
- Add provider property to ModelSelector option type
- Add IPC handler (get-home-dir) to resolve user home directory from main process
- Fix independent chat working directory resolution via main process IPC (renderer lacks process.env)
- Update dist build output"* )
    echo "feat: add typing indicator animation + fix independent chat home directory resolution"
    ;;
  * )
    cat
    ;;
esac
