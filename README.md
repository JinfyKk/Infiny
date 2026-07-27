# Infiny

Uma interface desktop moderna para o Claude Code — menos terminal, mais produtividade.

[![Electron](https://img.shields.io/badge/Electron-29-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Platform](https://img.shields.io/badge/Platform-Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white)](#)

O Infiny é uma aplicação desktop que envolve o Claude Code em uma interface visual organizada: gerencie projetos, converse com a IA, acompanhe arquivos gerados e ajuste modelo/effort sem sair de uma janela só.

[Funcionalidades](#funcionalidades) · [Início rápido](#início-rápido) · [Providers](#providers-suportados) · [Arquitetura](#arquitetura) · [Scripts](#scripts-disponíveis) · [Roadmap](#roadmap)

<img width="1920" height="1080" alt="Infiny-imagem pro-github1" src="https://github.com/user-attachments/assets/3a5b3a61-aaef-4fea-aa38-4d2442ec8cd1" />

## Funcionalidades

- 💬 **Chat integrado** com o Claude Code, com streaming de respostas em tempo real
- 📁 **Gerenciamento de projetos** — abra, organize e alterne entre diferentes pastas de trabalho
- 🧠 **Histórico de conversas** por projeto, incluindo chats independentes (sem projeto vinculado)
- 🤖 **Seletor de modelo** — escolha entre os modelos disponíveis no provider ativo
- ⚙️ **Controle de effort** (nível de raciocínio) direto pela interface
- 🔀 **Múltiplos providers** — alterne entre o Claude Code oficial e providers alternativos
- 🖼️ **Envio de imagens** como contexto adicional nas mensagens
- 📄 **Painel de arquivos** com preview dos arquivos gerados/alterados durante a sessão
- 🎨 **Temas customizáveis** e uma interface inspirada em produtos de IA populares
- ⌨️ **Atalhos de teclado** para navegação rápida
- 🚀 **Onboarding guiado** e splash screen com verificação de saúde do provider ao abrir o app

<img width="1920" height="1080" alt="Infiny-imagem pro-github2" src="https://github.com/user-attachments/assets/a299b987-02b4-49ab-b9db-caae702fc359" />

## Início rápido

### Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior
- [Claude Code](https://docs.claude.com/en/docs/claude-code) instalado e autenticado (ou outro provider compatível configurado — veja [Providers suportados](#providers-suportados))
- Windows (build de instalador atualmente configurado apenas para `nsis`/Windows)

### Instalação

Clone o repositório:

```bash
git clone https://github.com/JinfyKk/Infiny.git
cd Infiny
```

Instale as dependências:

```bash
npm install
```

Rode em modo de desenvolvimento (renderer + main process + Electron, tudo junto):

```bash
npm run dev
```

### Build de produção

Gerar os bundles otimizados (renderer + main process):

```bash
npm run build
```

Rodar a versão buildada:

```bash
npm start
```

Gerar o instalador Windows (`.exe`, via `electron-builder`):

```bash
npx electron-builder
```

## Providers suportados

O Infiny não fala diretamente com nenhum modelo — ele delega toda a comunicação para um **provider**, que sabe como iniciar e conversar com o CLI correspondente. Isso é escolhido e configurado direto pela interface (seletor de provider).

| Provider | O que é | Configuração |
|---|---|---|
| **Claude Code** | O CLI oficial da Anthropic, usado diretamente | Requer o [Claude Code](https://docs.claude.com/en/docs/claude-code) instalado e autenticado na máquina |
| **Free Claude Code** | Um provider alternativo que fala com um proxy local compatível | Requer os binários do proxy instalados separadamente — veja o projeto [free-claude-code](https://github.com/Alishahryar1/free-claude-code) para instruções de setup |

> O objetivo do Infiny é ser a camada visual — a lógica de autenticação e modelos de cada provider é responsabilidade do CLI/proxy por trás dele.

## Arquitetura

Visão geral de como as peças se conectam:

```
Renderer (React + Zustand)  ──IPC──▶  Main process (Electron)  ──stdio──▶  CLI do provider
      ChatArea / Store                  ProviderManager                    (claude / fcc-claude)
                                              │
                                        ProcessManager
                                     (spawn, health check,
                                      restart, stdin/stdout)
```

- **Renderer**: React + TypeScript + Zustand, responsável pela UI e pelo estado da aplicação. Roda isolado do Node — não tem acesso a `process`, `fs`, etc.
- **Main process**: Electron + Node, expõe uma API via `contextBridge`/`preload.ts` e gerencia o ciclo de vida dos processos filhos.
- **Providers**: cada provider (`src/providers/claude`, `src/providers/freeClaude`) implementa uma interface comum (`Provider.ts`) para iniciar, parar, enviar mensagens e reportar saúde do processo subjacente.
- **ProcessManager**: camada genérica de spawn/monitoramento de processos (health checks configuráveis, auto-restart, streaming de stdout/stderr).

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Roda renderer (Vite), main process (`tsc --watch`) e Electron juntos, com hot-reload |
| `npm run dev:renderer` | Só o Vite dev server |
| `npm run dev:main` | Só a compilação do main process em modo watch |
| `npm run build` | Build completo de produção (renderer + main) |
| `npm run build:renderer` | Build apenas do renderer (Vite) |
| `npm run build:main` | Build apenas do main process (TypeScript) |
| `npm start` | Roda a versão já buildada (`dist/`) |

## Roadmap

Este projeto está em desenvolvimento contínuo. Melhorias planejadas:

- [ ] Integração com Git
- [ ] Sistema melhorado de navegação e gerenciamento de arquivos
- [ ] Suporte para múltiplas conversas ativas simultaneamente
- [ ] Sistema de plugins
- [ ] Mais opções de personalização da interface
- [ ] Atualizações automáticas (`electron-updater`)

## Objetivo do projeto

O Infiny não foi criado para substituir o Claude Code. A proposta é oferecer uma camada visual que melhore a usabilidade, a organização e a produtividade, sem abrir mão do poder da ferramenta original.

## Links do projeto

- [Reportar bugs ou sugerir funcionalidades](https://github.com/JinfyKk/Infiny/issues)
- [Repositório](https://github.com/JinfyKk/Infiny)

## Licença

Este projeto ainda não possui uma licença definida. Se pretende distribuí-lo publicamente, considere adicionar um arquivo `LICENSE` (por exemplo, [MIT](https://opensource.org/licenses/MIT)).
