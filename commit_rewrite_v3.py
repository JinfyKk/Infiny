"""
Commit message rewrite callback for git-filter-repo
importable as: commit_rewrite_v3:rewrite_commit
"""

import re

# Patterns: (regex for first line, new professional message)
PATTERNS = [
    # Initial commits
    (r'^Initial commit$', 'chore: initial commit'),
    (r'^Add gitignore and remove node_modules', 'chore: add .gitignore and remove node_modules from history'),
    (r'^Remove node_modules', 'chore: remove node_modules from history'),

    # README updates (various Portuguese/English patterns)
    (r'^docs: README completo', 'docs: add comprehensive README with usage architecture scripts and contributing guide'),
    (r'^docs: atualiza rodap', 'docs: update README footer with attribution'),
    (r'^docs: CLAUDE', 'docs: add CLAUDE.md with project instructions'),
    (r'^(docs: )?README', 'docs: update README'),
    (r'^CLAUDE', 'docs: add CLAUDE.md with project instructions'),

    # 6-theme design system
    (r'^feat: implement 6-theme design system', 'feat: implement 6-theme design system with Framer Motion animations'),

    # Free Claude / IPC
    (r'^fix: corrige inicializa', 'fix: correct Free Claude Code initialization and IPC communication'),
    (r'^fix: corrige pipeline', 'fix: correct Free Claude message pipeline and add comprehensive instrumentation'),
    (r'^fix: corrige erros TypeScript', 'fix: correct TypeScript errors and IPC contracts'),
    (r'^instrumentation: add comprehensive pipeline logging', 'instrument: add comprehensive pipeline logging for fcc-server/Claude CLI flow debugging'),
    (r'^fix: corrige FreeClaudeProvider para iniciar', 'fix: correct FreeClaudeProvider to start fcc-server as in free-claude-code original'),
    (r'^feat: adiciona evento provider-ready', 'feat: add provider-ready event to unlock UI after full initialization'),
    (r'^build: atualiza build', 'build: update build with new bundle hash'),
    (r'^fix: adiciona --print', 'fix: add --print flag to FreeClaudeProvider to enable stream-json on Windows'),
    (r'^feat: adiciona evento provider-healthy', 'feat: add provider-healthy event to unlock UI after healthy fcc-server'),
    (r'^refactor: reescreve ProcessManager', 'refactor: rewrite ProcessManager as generic process manager'),
    (r'^refactor: substitui ProcessManager', 'refactor: replace ProcessManager with electronAPI in preload script'),
    (r'^feat: define NVIDIA', 'feat: set NVIDIA as default free provider and add NVIDIA NIM model mapping'),
    (r'^fix: unifica default freeProvider', 'fix: unify default freeProvider correct effort mismatch and add anti-race lock'),

    # BUG C
    (r'^fix: corrige BUG C', 'fix: fix BUG C (auto project switch) and add complete BUG A logging'),
    (r'^fix: evita auto-restart incorreto', 'fix: prevent incorrect auto-restart when stopping processes (BUG C)'),
    (r'^fix: fix deadlock in ProcessManager', 'fix: fix deadlock in ProcessManager when restarting processes (BUG C)'),

    # FCC Integration
    (r'^refactor: integra', 'refactor: native integration with Free Claude Code (FCC)'),

    # Turtly / Bugs
    (r'^feat: implement Turtly themes', 'feat: implement Turtly themes + fix model/effort selectors + remove artificial session message'),
    (r'^fix: corrige BUG 3', 'fix: fix BUG 3 (Themes) and BUG 4 (Session messages)'),
    (r'^fix: corrige bugs de estado', 'fix: fix state bugs and implement Turtly themes'),
    (r'^fix: corrige 4 bugs cr.ticos \(BUG 1-4\)', 'fix: fix 4 critical bugs (BUG 1-4)'),
    (r'^fix: corrige loop infinito', 'fix: fix infinite thinking loop and white screen in dropdowns'),

    # Independent chats / Dropdown
    (r'^feat: implement independent chats', 'feat: implement independent chats + fix dropdown positioning + chat auto-selection'),
    (r'^feat: implementar algoritmo de posicionamento arquitetural', 'feat: implement architectural dropdown positioning algorithm with real clamp'),
    (r'^refactor: implementa arquitetura singleton para fcc-server', 'refactor: implement singleton architecture for fcc-server'),
    (r'^feat: unificar arquitetura de positioning', 'feat: unify dropdown positioning architecture - single source of truth'),
    (r'^fix: corrigir 4 bugs cr.ticos no Infiny', 'fix: fix 4 critical bugs in Infiny'),
    (r'^fix: adicionar _setupElectronListeners', 'fix: add _setupElectronListeners() in App.tsx - connect main process IPC events to renderer'),
    (r'^fix: implement fcc-server singleton', 'fix: implement fcc-server singleton with race condition protection'),
    (r'^instrument: adicionar logs forenses', 'instrument: add forensic logs [SEND 01-34] and [END 01-09] in message pipeline'),
    (r'^fix: permitir chats independentes sem projeto', 'fix: allow independent chats without project + fix FreeClaudeProvider stream parser'),
    (r'^feat: suporte a chats independentes', 'feat: support independent chats + fix dropdown positioning + fix provider listener cleanup'),

    # Already English - just standardize the recent one
    (r'^feat: add typing indicator animation', 'feat: add typing indicator animation + fix independent chat home directory resolution'),
]


def rewrite_commit(commit):
    """git-filter-repo commit callback - modifies commit.message in place"""
    original = commit.message.decode('utf-8')
    first_line = original.split('\n')[0].strip()

    for pattern, new_msg in PATTERNS:
        if re.match(pattern, first_line, re.IGNORECASE):
            commit.message = new_msg.encode('utf-8')
            return

    # Keep original if no pattern matches (leave as-is)