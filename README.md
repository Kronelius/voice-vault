# Voice Vault CMS

A full-stack content management web application for managing AI-generated blog content, voice writing samples, and voice profile configuration. Built with React + Vite, connected to a Supabase PostgreSQL backend.

## Setup on a New Computer (Step by Step)

### Prerequisites — install these first if you don't have them

1. **Node.js** — Download and install from https://nodejs.org (pick the LTS version). This also installs `npm`.
2. **Git** — Download and install from https://git-scm.com/downloads

To check if they're already installed, open a terminal (Command Prompt, PowerShell, or Terminal) and run:
```
node --version
git --version
```
If both show version numbers, you're good.

### Clone the project

Open a terminal and run these commands one at a time:

```bash
cd ~/Documents
git clone https://github.com/Kronelius/voice-vault.git
cd voice-vault
```

This downloads the entire project to a `voice-vault` folder in your Documents.

### Set up the environment file

The app needs a `.env` file to connect to Supabase. Create it by copying the example:

**On Mac/Linux:**
```bash
cp .env.example .env
```

**On Windows (Command Prompt):**
```bash
copy .env.example .env
```

Then open `.env` in any text editor and replace the placeholder values with the real credentials:
```
VITE_SUPABASE_URL=https://itknwemcotpwoxbtncxs.supabase.co
VITE_SUPABASE_ANON_KEY=<your anon key — check your Supabase dashboard or ask Daniel>
```

The `.env` file is gitignored (never uploaded to GitHub) so you need to create it on each computer.

### Install and run

```bash
npm install
npm run dev
```

After a few seconds you'll see output like:
```
  VITE v8.x.x  ready in 300ms

  ➜  Local:   http://localhost:5173/
```

Open that URL in your browser. You should see the Voice Vault CMS with your data loaded.

### Pulling updates from another computer

If you (or Claude Code) made changes on a different machine and pushed them to GitHub, pull them down:

```bash
cd ~/Documents/voice-vault
git pull
npm install
npm run dev
```

Always run `npm install` after pulling — new dependencies may have been added.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (hot-reloading) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

## Tech Stack

- **Frontend**: React 19 + Vite 8
- **Styling**: Tailwind CSS 4
- **Backend**: Supabase (PostgreSQL + JS client)
- **Markdown**: @uiw/react-md-editor
- **Routing**: React Router v7

## Features

- **Content Manager** — List, create, edit blog posts with status workflow
- **Content Editor** — Markdown editor with live preview and real-time readability dashboard (FK Grade, Reading Ease, contraction rate, etc.)
- **Voice Chunks** — Browse and edit tagged RAG retrieval chunks with filtering and search
- **Writing Samples** — View source documents and edit metadata
- **Voice Profile** — Edit the voice DNA configuration including system prompt, vocabulary, tone spectrum, and reading level targets
- **Dark Mode** — System preference detection with manual toggle

## Deployment

Configured for Vercel deployment. Also works on Replit with minimal adjustment.

## Troubleshooting

- **`npm: command not found`** — Node.js isn't installed or isn't in your PATH. Reinstall from https://nodejs.org and restart your terminal.
- **`git: command not found`** — Git isn't installed. Get it from https://git-scm.com/downloads.
- **App loads but shows no data** — Check your `.env` file has the correct Supabase URL and anon key. The file must be in the project root (same folder as `package.json`).
- **Port 5173 already in use** — Another dev server is running. Close it, or run `npm run dev -- --port 3000` to use a different port.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed technical documentation.
