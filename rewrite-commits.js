#!/usr/bin/env node

/**
 * Script para reescrever todas as mensagens de commit do histórico com mensagens profissionais
 * Usa git filter-branch --msg-filter para reescrever o histórico completo
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Mapeamento de commits antigos (hash curto + mensagem parcial) -> nova mensagem profissional
const COMMIT_MAP = new Map([
  // Commits iniciais
  ['1c11fce8', 'chore: initial commit'],
  ['fb0ca396', 'chore: add .gitignore and remove node_modules'],
  ['9143c862', 'chore: remove node_modules from history'],

  // README docs (consolidar em commits únicos profissionais)
  ['2338cd01', 'docs: add comprehensive README with usage, architecture, scripts and contributing guide'],
  ['40d9981a', 'docs: update README footer with attribution'],
  ['6c605b6f', 'docs: update README'],
  ['f79701ef', 'docs: update README'],
  ['357000f9', 'docs: update README'],
  ['7037a38a', 'docs: update README'],
  ['912ac144', 'docs: update README'],
  ['f4875e0c', 'docs: update README'],

  // CLAUDE.md
  ['f8555711', 'docs: add CLAUDE.md with project instructions'],
  ['71e5315e', 'docs: update README'],
  ['ea9a6ec3', 'docs: update README'],

  // Design system
  ['d79742af', 'feat: implement 6-theme design system with Framer Motion animations'],

  // Free Claude Code / IPC / Provider fixes
  ['2fe62c3a', 'fix: correct Free Claude Code initialization and IPC communication'],
  ['58158d95', 'fix: correct Free Claude message pipeline and add comprehensive instrumentation'],
  ['cd017296', 'fix: correct TypeScript errors and IPC contracts'],
  ['930acece', 'instrumentation: add comprehensive pipeline logging for fcc-server/Claude CLI flow debugging'],
  ['f7a61e49', 'fix: correct FreeClaudeProvider to start fcc-server as in free-claude-code original'],
  ['4cb321e1', 'feat: add provider-ready event to unlock UI after full initialization'],
  ['aaf4979b', 'build: update build with new bundle hash'],
  ['dec7c0d6', 'fix: add --print flag to FreeClaudeProvider to enable stream-json on Windows'],
  ['85b1c7be', 'feat: add provider-healthy event to unlock UI after healthy fcc-server'],
  ['8f4d7d15', 'build: update build with new bundle hash'],

  // Refactors ProcessManager
  ['e416d50a', 'refactor: rewrite ProcessManager as generic process manager'],
  ['b4b3c3d8', 'refactor: replace ProcessManager with electronAPI in preload script'],

  // NVIDIA / Free Provider
  ['a05f8109', 'feat: set NVIDIA as default free provider and add NVIDIA NIM model mapping'],
  ['77feb44b', 'fix: unify default freeProvider, correct effort mismatch and add anti-race lock'],

  // BUG C - Auto project switch
  ['ec651da1', 'fix: fix BUG C (auto project switch) and add complete BUG A logging'],
  ['1c02f0b7', 'fix: fix BUG C (auto project switch) and add complete BUG A logging'],
  ['4ec59100', 'fix: prevent incorrect auto-restart when stopping processes (BUG C)'],
  ['1f716e55', 'fix: fix deadlock in ProcessManager when restarting processes (BUG C)'],

  // FCC Integration
  ['ca229cd1', 'refactor: native integration with Free Claude Code (FCC)'],

  // Turtly themes / Bugs 3,4
  ['79a653b2', 'feat: implement Turtly themes + fix model/effort selectors + remove artificial session message'],
  ['bb6ffbdd', 'fix: fix BUG 3 (Themes) and BUG 4 (Session messages)'],
  ['7c71bc72', 'fix: fix state bugs and implement Turtly themes'],
  ['28f21ef1', 'fix: fix 4 critical bugs (BUG 1-4)'],
  ['65a0dfee', 'fix: fix infinite "thinking" loop and white screen in dropdowns'],

  // Independent chats / Dropdown positioning
  ['823e8e5f', 'feat: implement independent chats + fix dropdown positioning + chat auto-selection'],
  ['d503d926', 'feat: implement architectural dropdown positioning algorithm with real clamp'],
  ['e1aca46a', 'refactor: implement singleton architecture for fcc-server'],
  ['bb5ff090', 'feat: unify dropdown positioning architecture - single source of truth'],
  ['6e232d01', 'fix: fix 4 critical bugs in Infiny'],
  ['c7c37945', 'fix: add _setupElectronListeners() in App.tsx - connect main process IPC events to renderer'],
  ['cf5b8435', 'fix: implement fcc-server singleton with race condition protection'],
  ['af1009db', 'instrument: add forensic logs [SEND 01-34] and [END 01-09] in message pipeline'],
  ['4e083e03', 'fix: allow independent chats without project + fix FreeClaudeProvider stream parser'],
  ['a3604589', 'feat: support independent chats + fix dropdown positioning + fix provider listener cleanup'],
  ['13f818c4', 'docs: update README'],
  ['46f3268b', 'docs: update README'],
  ['cf9bd3e8', 'feat: add typing indicator animation + fix independent chat home directory resolution'],
]);

// Função para gerar o script msg-filter
function generateMsgFilterScript() {
  let script = '#!/bin/bash\n';
  script += '# Auto-generated msg-filter for git filter-branch\n\n';
  script += 'case "$1" in\n';

  for (const [hash, newMsg] of COMMIT_MAP) {
    // Pegar a mensagem original para fazer o match
    try {
      const originalMsg = execSync(`git log --format=%B -n 1 ${hash}`, { encoding: 'utf8' }).trim();
      // Escape para bash case
      const escaped = originalMsg.replace(/[\[\]*?|]/g, '\\$&').replace(/"/g, '\\"');
      script += `  *"${escaped}"* )\n`;
      script += `    echo "${newMsg}"\n`;
      script += `    ;;\n`;
    } catch (e) {
      console.warn(`Could not get original message for ${hash}: ${e.message}`);
    }
  }

  script += '  * )\n';
  script += '    cat\n';
  script += '    ;;\n';
  script += 'esac\n';

  return script;
}

// Gerar e salvar o script
const msgFilterScript = generateMsgFilterScript();
fs.writeFileSync(path.join(__dirname, 'msg-filter.sh'), msgFilterScript);
console.log('Generated msg-filter.sh');
console.log('Run: git filter-branch --msg-filter "$(cat msg-filter.sh)" -- --all');
console.log('⚠️  WARNING: This rewrites ALL history. Make a backup first!');