# Voice Vault CMS

A full-stack content management web application for managing AI-generated blog content, voice writing samples, and voice profile configuration. Built with React + Vite, connected to a Supabase PostgreSQL backend.

## Quick Start

```bash
npm install
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
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

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed documentation.
