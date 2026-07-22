# Infiny

Interface desktop moderna para Claude Code. Uma GUI bonita e intuitiva que funciona como camada visual sobre o Claude Code existente.

## Funcionalidades

- **Chat funcionando** - Interface de conversa completa com markdown e syntax highlighting
- **Integração com Claude Code** - Executa o Claude Code como subprocesso
- **Escolha de modelos** - Fable 5, Opus 4.8, Sonnet 5, Haiku 4.5
- **Controle de effort** - Low, Medium, High, Max, XHigh
- **Upload de imagens** - Drag & drop, paste, anexar (PNG, JPG, WebP)
- **Arquivos gerados** - Visualização, download, abrir, localizar
- **Projetos e histórico** - Gerenciar múltiplos projetos com histórico persistente
- **Busca na Web** - Toggle para ativar web search
- **Memória entre chats** - Resumo e informações importantes salvas localmente

## Tecnologias

- **Electron** - Desktop app framework
- **React 18** + **TypeScript** - UI framework
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **electron-store** - Persistência local
- **react-markdown** + **rehype-highlight** - Renderização de markdown

## Estrutura do Projeto

```
infiny/
├── src/
│   ├── main/
│   │   ├── index.ts      # Electron main process
│   │   └── preload.ts    # Preload script (IPC bridge)
│   ├── components/
│   │   ├── ui/           # Componentes base (Button, Input, Select, etc)
│   │   ├── Sidebar.tsx   # Barra lateral (projetos, chats)
│   │   ├── ChatArea.tsx  # Área central de chat
│   │   ├── Message.tsx   # Componente de mensagem
│   │   ├── FilesPanel.tsx # Painel de arquivos gerados
│   │   ├── ModelSelector.tsx
│   │   └── EffortSelector.tsx
│   ├── store/
│   │   └── infinyStore.ts # Zustand store com persistência
│   ├── lib/
│   │   └── utils.ts      # Utilitários
│   ├── App.tsx           # Componente principal
│   ├── main.tsx          # Entry point React
│   └── index.css         # Tailwind + estilos customizados
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.main.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

## Como executar

### Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar em modo dev (Vite + Electron)
npm run dev
```

### Build de produção

```bash
# Build completo
npm run build

# Preview do build
npm run preview
```

## Scripts disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia Vite dev server + Electron com hot reload |
| `npm run dev:renderer` | Apenas Vite dev server |
| `npm run dev:main` | Compila main process em watch mode |
| `npm run build` | Build de produção (renderer + main) |
| `npm run build:renderer` | Build apenas do frontend (Vite) |
| `npm run build:main` | Build apenas do main process (tsc) |
| `npm run preview` | Preview do build de produção |
| `npm run start` | Inicia app buildado |
| `npm run lint` | ESLint |

## Como funciona a integração com Claude Code

O app usa o `electron-store` para persistência local (não precisa de banco de dados) e executa o CLI do Claude Code como subprocesso:

1. Usuário seleciona/cria um projeto (pasta)
2. Ao iniciar chat, o app executa `claude --model <model> --effort <effort>` no diretório do projeto
3. Mensagens são enviadas via stdin do processo
4. Respostas vêm via stdout/stderr
5. Arquivos gerados são detectados e exibidos no painel lateral

## Atalhos de teclado

| Atalho | Ação |
|--------|------|
| `Enter` | Enviar mensagem |
| `Shift + Enter` | Nova linha |
| `Ctrl/Cmd + K` | Command palette (planejado) |

## Configuração

As configurações são salvas automaticamente em:
- Windows: `%APPDATA%\infiny-data`
- macOS: `~/Library/Application Support/infiny-data`
- Linux: `~/.config/infiny-data`

## Requisitos

- Node.js 18+
- Claude Code CLI instalado e no PATH
- Windows 10+, macOS 10.15+, ou Linux

## Licença

MIT