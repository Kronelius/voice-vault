# Voice Vault CMS — Architecture

## Purpose

Voice Vault CMS manages AI-generated content for a voice-cloning writing system. It connects to an existing Supabase PostgreSQL database containing writing samples, voice chunks (RAG retrieval units), voice profiles (LLM configuration), and generated content.

This is Phase 1 of a larger system. Future phases include auth (Supabase Auth), content generation pipeline (Anthropic API), and multi-user SaaS capabilities.

## Folder Structure

```
voice-vault-cms/
├── src/
│   ├── main.jsx              # App entry point (React + Router + Theme)
│   ├── App.jsx               # Route definitions
│   ├── index.css             # Tailwind imports + CSS custom properties
│   ├── lib/
│   │   ├── supabase.js       # Supabase client singleton
│   │   ├── readability.js    # Client-side readability analysis engine
│   │   └── constants.js      # Enum values, color maps, formatters
│   ├── hooks/
│   │   ├── useSupabase.js    # Generic data fetching/mutation hooks
│   │   └── useTheme.jsx      # Dark mode context provider + hook
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.jsx # Main layout shell (sidebar + content)
│   │   │   └── Sidebar.jsx   # Navigation sidebar
│   │   └── ui/
│   │       ├── Badge.jsx     # Colored tag/badge component
│   │       ├── MetricIndicator.jsx  # Readability metric with pass/fail
│   │       └── Spinner.jsx   # Loading spinner
│   └── pages/
│       ├── ContentList.jsx   # Content manager list view
│       ├── ContentEditor.jsx # Markdown editor + readability dashboard
│       ├── VoiceChunks.jsx   # Voice chunk browser + inline editor
│       ├── WritingSamples.jsx # Writing samples list + detail panel
│       └── VoiceProfile.jsx  # Voice profile editor
├── .env.example              # Environment variable template
├── vercel.json               # Vercel SPA routing config
├── ARCHITECTURE.md           # This file
└── README.md                 # Setup instructions
```

## Supabase Table Relationships

```
voice_profiles (1)
    └── generated_content (many) via voice_profile_id
            └── seo_metadata (1) via content_id

writing_samples (1)
    └── voice_chunks (many) via source_sample_id

generated_content.voice_chunks_used[] → voice_chunks.id (array of UUIDs)
```

## Enum Values

| Enum | Values |
|------|--------|
| `audience_type` | sellers, investors, academic, general, professional |
| `tone_type` | analytical, empathetic, educational, persuasive |
| `quality_type` | strong, usable, weak |
| `sample_type` | college_paper, blog_post, email, linkedin_post, other |
| `signature_move` | rhetorical_question, perhaps_emphasis, define_before_build, i_believe, systemic_connector |
| `content_status` | draft, review, approved, published, archived |

## Design System

### Colors

| Token | Light | Dark |
|-------|-------|------|
| Background | `#FAFAF7` | `#1C1915` |
| Surface | `#F5F4F0` | `#252220` |
| Card | `#FFFFFF` | `#2A2725` |
| Border | `#E2E0DA` | `#3D3A36` |
| Accent (warm amber) | `#9E6B3A` | `#C48A52` |
| Secondary (slate blue) | `#3D5A80` | — |
| Success | `#4A7C59` | — |
| Error | `#7C4A4A` | — |

### Fonts

- **Headings/UI**: DM Sans (600-700 weight)
- **Body text**: Source Sans 3 (400-500 weight)
- **Code/metadata**: IBM Plex Mono (400-500 weight)

### Tag Color Mappings

Defined in `src/lib/constants.js`. Each enum value has a consistent color across the app:

- **Status**: draft=amber, review=blue, approved=green, published=blue, archived=gray
- **Tone**: analytical=blue, empathetic=plum, educational=green, persuasive=amber
- **Audience**: sellers=amber, investors=blue, academic=plum, general=gray, professional=green
- **Signature moves**: Each has a unique color (blue, plum, green, amber, royal blue)
- **Quality**: strong=green, usable=amber, weak=red

### Component Patterns

- Cards: `rounded-lg border border-[var(--border)] bg-[var(--bg-card)]`
- Inputs: `rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-sm`
- Primary button: `bg-[var(--accent)] text-white rounded-md hover:opacity-90`
- Section headers: `text-sm font-semibold uppercase tracking-wide`

## Readability Algorithm

Implemented client-side in `src/lib/readability.js`. Runs debounced (500ms) as the user types.

### Flesch-Kincaid Grade Level
```
FK Grade = 0.39 × (words / sentences) + 11.8 × (syllables / words) − 15.59
```

### Flesch Reading Ease
```
Reading Ease = 206.835 − 1.015 × (words / sentences) − 84.6 × (syllables / words)
```

### Syllable Counting
Uses the vowel-cluster method: count groups of consecutive vowels (aeiouy), subtract silent terminal 'e' (unless preceded by 'l'), minimum 1 syllable per word.

### Contraction Rate
Counts contracted forms (don't, isn't, etc.) vs uncontracted equivalents (do not, is not, etc.):
```
Rate = contracted / (contracted + uncontracted) × 100
```

### Complex Word Percentage
Words with 3+ syllables as a percentage of total words.

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| No auth | Single-user prototype; Supabase Auth will be added in Phase 2 |
| RLS off | Prototype phase; will be enabled with auth |
| @uiw/react-md-editor | Lightweight, good React 19 support, built-in split preview |
| Client-side readability | No server round-trips needed; instant feedback while typing |
| CSS custom properties for theming | Works with Tailwind while supporting runtime dark mode toggle |
| Supabase JS client directly | No API server needed; all queries go through the client library with PostgREST |

## Future Extensions (Phase 2+)

1. **Authentication**: Supabase Auth with RLS policies on all tables
2. **Content Generation**: Anthropic API integration with voice profile + RAG chunks
3. **Version History**: Diff view for content revisions
4. **WordPress Integration**: Publishing pipeline
5. **Multi-tenant SaaS**: Multiple companies, each with their own voice profiles
