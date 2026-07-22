# Infiny ✨

> **Uma GUI linda e intuitiva pro Claude Code** — sua nova BFF pra codar com IA no desktop 🤝

---

⚠️ **Projeto em desenvolvimento ativo — pode ter bugs. Use por sua conta e risco, e abra uma issue se algo quebrar!** 🐛

---

## 🚀 O que é isso?

O **Infiny** é uma interface desktop moderna (Electron + React) que abraça o **Claude Code** num visual liquid glass *dark mode* de cair o queixo. Nada de terminal feio — agora você tem chat bonito, painel de arquivos, seletor de modelo, controle de *effort* e muito mais. Tudo persistido localmente, zero nuvem, 100% seu. 🔒

---

## ✨ Features que brilham

| Feature | Status | Detalhes |
|---------|--------|----------|
| 💬 **Chat completo** | ✅ | Markdown, syntax highlighting, cópia de código, streaming visual |
| 🧠 **Modelos Claude** | ✅ | Fable 5, Opus 4.8, Sonnet 5, Haiku 4.5 — troca na hora |
| ⚡ **Effort control** | ✅ | Low → XHigh, você manda |
| 🖼️ **Upload de imagens** | ✅ | Drag & drop, paste (Ctrl+V), file picker — PNG, JPG, WebP |
| 📁 **Arquivos gerados** | ✅ | Preview, download, abrir no editor, revelar na pasta |
| 📂 **Projetos & histórico** | ✅ | Vários projetos, histórico persistente, busca integrada |
| 🌐 **Web Search toggle** | ✅ | Liga/desliga busca na web num clique |
| 🧠 **Memória entre chats** | ✅ | Resumo + info importante salva por projeto |

---

## 🛠️ Stack tecnológica

- ⚡ **Electron** — Desktop framework
- ⚛️ **React 18** + **TypeScript** — UI tipada e performática
- 🏎️ **Vite** — Build instantâneo + HMR
- 🎨 **Tailwind CSS** — Estilos utilitários + design system *liquid glass*
- 🐻 **Zustand** — State management simples e leve
- 💾 **electron-store** — Persistência local (zero DB, zero nuvem)
- 📝 **react-markdown** + **rehype-highlight** — Render rica de código

---

## 📁 Estrutura do projeto

```
infiny/
├── src/
│   ├── main/
│   │   ├── index.ts      # Electron main process 🖥️
│   │   └── preload.ts    # IPC bridge segura 🔗
│   ├── components/
│   │   ├── ui/           # Botões, Inputs, Selects, Dropdowns...
│   │   ├── Sidebar.tsx   # Projetos & chats 📋
│   │   ├── ChatArea.tsx  # Onde a mágica acontece ✨
│   │   ├── Message.tsx   # Bolhas de mensagem bonitinhas 💬
│   │   ├── FilesPanel.tsx # Painel lateral de arquivos 📎
│   │   ├── ModelSelector.tsx
│   │   └── EffortSelector.tsx
│   ├── store/
│   │   └── infinyStore.ts # Zustand + persist 🧠
│   ├── lib/utils.ts      # Helpers úteis 🛠️
│   ├── App.tsx           # Root component 🌳
│   ├── main.tsx          # Entry point React ⚛️
│   └── index.css         # Tailwind + custom liquid glass 🎨
├── index.html
├── package.json
├── tsconfig.json (+ node/main)
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

---

## ▶️ Como rodar

### Dev mode (hot reload 🔥)

```bash
# 1. Instala as deps
npm install

# 2. Sobe o Vite + Electron junto
npm run dev
```

### Build de produção 📦

```bash
# Build completo (renderer + main)
npm run build

# Preview do build
npm run preview
```

### Scripts úteis

| Script | O que faz |
|--------|-----------|
| `npm run dev` | Dev server completo (Vite + Electron) 🚀 |
| `npm run dev:renderer` | Só o Vite (pra testar no browser) 🌐 |
| `npm run dev:main` | Watch mode do main process 👀 |
| `npm run build` | Build production-ready 📦 |
| `npm run build:renderer` | Build só frontend |
| `npm run build:main` | Compila main (tsc) |
| `npm run start` | Roda o app buildado ▶️ |
| `npm run lint` | ESLint pra manter limpo ✨ |

---

## 🔌 Como funciona a integração

1. **Você escolhe/cria um projeto** (qualquer pasta do seu PC) 📂
2. **Infiny sobe o `claude` como subprocesso** na pasta do projeto com os flags certos (`--model`, `--effort`, `--web-search`) ⚙️
3. **Mensagens vão via stdin**, respostas vêm via stdout/stderr 📥📤
4. **Arquivos criados** são detectados e aparecem no painel lateral automaticamente 🎯
5. **Tudo persiste local** via `electron-store` — seus dados, suas regras 🔐

---

## 💾 Onde ficam seus dados

| OS | Pasta |
|----|-------|
| Windows | `%APPDATA%\infiny-data` |
| macOS | `~/Library/Application Support/infiny-data` |
| Linux | `~/.config/infiny-data` |

> **Spoiler:** É só um JSON. Pode abrir, editar, backup, mandar pro amigo — é seu! 🤷‍♂️

---

## ✅ Requisitos

- Node.js **18+** 📦
- **Claude Code CLI** instalado e no `PATH` 🤖
- Windows 10+, macOS 10.15+, ou Linux 🐧

---

## 🤝 Contribuindo

Achou um bug? Tem uma ideia massa? **Abre uma issue ou manda PR!** Toda ajuda é bem-vinda 💚

```bash
# Fork -> Clone -> Branch -> Code -> Commit -> Push -> PR
```

---

## ⚖️ Licença

**MIT** — faz o que quiser, só não me processa se der ruim 😉

---

<div align="center">

**Feito com 🎵 e 😫**

⭐ **Deixa uma star se curtiu!** Ajuda muito 💖

</div>