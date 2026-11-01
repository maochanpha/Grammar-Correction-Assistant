# PorPor AGC — Grammar Correction Assistant

> A modern, responsive, AI-powered writing assistance platform that detects and corrects grammar mistakes, spelling typos, punctuation errors, sentence flow issues, and adjusts writing tones with context-aware linguistic explanations.

---

## 1. Project Overview

**PorPor AGC** is built as a production-ready SaaS application designed to help students, working professionals, and everyday writers refine their prose while preserving their original voice and factual content.

### Key Capabilities
- **AI Grammar Correction**: Detects and fixes subject-verb disagreement, verb tenses, missing articles, awkward prepositions, typos, and syntax errors.
- **10 Writing Modes**:
  1. *Grammar Fix* (minimal edits, strictly preserves style)
  2. *Improve Writing* (enhances clarity and flow)
  3. *Professional* (workplace & business-ready)
  4. *Casual* (conversational everyday English)
  5. *Formal* (executive & diplomatic register)
  6. *Simplify* (plain English accessibility)
  7. *Shorten* (eliminates redundancy and fluff)
  8. *Expand* (descriptive depth without fabricating facts)
  9. *Academic* (rigorous scholarly vocabulary)
  10. *Friendly* (warm, empathetic, and polite)
- **Interactive Suggestion Cards**: Clickable highlights categorized by Grammar (Red), Spelling (Amber), Punctuation (Sky Blue), Clarity (Purple), and Style (Emerald). Allows accepting or dismissing individual suggestions with automated offset recalculation.
- **Two Explanation Depths**:
  - *Simple*: Concise 1–2 sentence editorial summary.
  - *Detailed*: Complete grammar rule rationale and linguistic tips.
- **Sentence Rewriting Assistant**: Select any sentence and generate up to 3 tailored alternatives across 8 tones (*Professional*, *Polite*, *Confident*, *Natural*, *Shorter*, *Clearer*, *Friendly*, *Formal*).
- **Writing Quality & Readability Insights**:
  - Real-time word, character, and sentence counts.
  - Estimated reading time (200 wpm standard).
  - Documented Flesch Reading Ease score and grade level benchmark.
  - Heuristic overall quality indicator and contextual editorial tips.
- **Ask AI Writing Assistant**: Slide-over chat drawer with document context toggle and quick prompts for grammar inquiries.
- **Language Variant Support**: American English (`en-US`) vs. British English (`en-GB`).
- **User Accounts & Document History**: Secure authentication with password hashing (`bcryptjs`) and signed JWT sessions (`jose`). Search, sort, rename, edit, and delete saved documents.
- **Dashboard**: Real analytics (total documents, corrected words, sessions count) calculated from stored data.

---

## 2. Technology Stack

- **Framework**: Next.js 16 with App Router & Turbopack
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS & Modern Design System (Deep Indigo Blue `#4f46e5`, Refined Purple `#7c3aed`, Light/Dark Mode)
- **Icons**: Lucide Icons
- **Database & ORM**: Prisma ORM with SQLite (zero-config local dev) / PostgreSQL ready
- **Authentication**: Custom secure JWT HTTP-Only cookies with `jose` and `bcryptjs`
- **Validation**: Zod schema validation
- **AI Integration**: Official `@google/generative-ai` SDK (Gemini 2.5 Flash / 1.5 Flash) with fallback mock provider for offline/demo operation
- **Testing**: Vitest automated unit & integration test suite

---

## 3. Project Structure

```
├── prisma/
│   └── schema.prisma         # Prisma ORM models (User, Document, Session, Suggestion, Preferences, Usage)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/         # Register, Login, Logout, Me, Account management
│   │   │   ├── correct/      # Core AI Grammar Correction endpoint
│   │   │   ├── rewrite/      # Sentence Rewriting endpoint
│   │   │   ├── chat/         # Ask AI Writing Assistant chat endpoint
│   │   │   ├── documents/    # Document CRUD & history endpoints
│   │   │   ├── preferences/  # User preferences endpoint
│   │   │   └── dashboard/    # Real analytics aggregation endpoint
│   │   ├── auth/             # Sign In and Sign Up pages
│   │   ├── editor/           # Writing Studio page
│   │   ├── documents/        # My Documents page
│   │   ├── dashboard/        # Analytics & Overview dashboard
│   │   ├── settings/         # Writing defaults, appearance & privacy settings
│   │   ├── globals.css       # Tailwind CSS tokens, highlights, and animations
│   │   ├── layout.tsx        # Root layout with Theme and Auth providers
│   │   └── page.tsx          # High-converting landing page with live demo
│   ├── components/
│   │   ├── Navbar.tsx        # Responsive navigation bar with theme & user controls
│   │   ├── WritingEditor.tsx # Split-panel writing studio
│   │   ├── SuggestionCard.tsx# Interactive card for individual error suggestions
│   │   ├── SentenceRewriterModal.tsx # Tone adaptation modal
│   │   ├── WritingInsightsPanel.tsx  # Flesch readability & quality meters
│   │   ├── AskAIChatDrawer.tsx       # Slide-over AI chat assistant
│   │   └── DiffViewer.tsx    # Word-level difference comparison viewer
│   ├── context/
│   │   ├── AuthContext.tsx   # Client authentication state & methods
│   │   └── ThemeContext.tsx  # Dark / Light / System theme provider
│   └── lib/
│       ├── ai/
│       │   ├── types.ts            # Type definitions for modes, categories, results
│       │   ├── prompts.ts          # Prompt engineering with anti-jailbreak defenses
│       │   ├── text-analysis.ts    # Flesch Reading Ease & quality scoring heuristics
│       │   ├── offset-validator.ts # Offset repair & sequential suggestion replacer
│       │   ├── gemini-provider.ts  # Google Generative AI integration
│       │   ├── mock-provider.ts    # Fallback intelligence provider
│       │   └── provider.ts         # Unified AI service interface
│       ├── auth/
│       │   └── session.ts    # JWT token signing, verification & password hashing
│       ├── prisma.ts         # Prisma Client singleton
│       └── rate-limiter.ts   # In-memory sliding window rate limiter
└── tests/
    ├── ai-modes-and-schemas.test.ts # AI modes, prompt generation & mock tests
    ├── auth-and-permissions.test.ts # Password hashing & JWT verification tests
    ├── offset-validator.test.ts     # Offset verification & sequential replacer tests
    ├── rate-limiter.test.ts         # Guest vs user rate limit tests
    └── text-analysis.test.ts        # Word count, syllable & readability tests
```

---

## 4. Setup & Local Development

### Prerequisites
- Node.js 18+ (tested on Node v24)
- npm 9+

### 1. Clone & Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env`:
```env
# Database (SQLite is configured by default for instant zero-config local run)
DATABASE_URL="file:./dev.db"

# Google Gemini API Key (Sign up at https://aistudio.google.com/)
# If empty, the application automatically uses the built-in intelligent demo engine!
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-2.5-flash"

# Session JWT Secret (minimum 32 characters)
JWT_SECRET="grammar_correction_assistant_dev_secret_key_2026_xyz123"

NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Initialize Database
Sync Prisma models and generate the Prisma Client:
```bash
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Running Automated Tests

Run the full Vitest suite (18 tests):
```bash
npm test
```

To run in watch mode:
```bash
npx vitest
```

---

## 6. Switching to PostgreSQL (Optional)

To connect to a PostgreSQL database (e.g., Neon, Supabase, or local Postgres):
1. In `prisma/schema.prisma`, update the datasource:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. In `.env`, provide your PostgreSQL connection string:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/grammar_assistant?schema=public"
   ```
3. Run `npx prisma db push` to synchronize the schema.

---

## 7. Production Build

To create an optimized production build:
```bash
npm run build
npm run start
```

---

## 8. Security & Privacy Architecture

- **Server-Side AI Requests**: API keys are strictly kept on the server and never exposed to the client bundle.
- **Content-as-Data Principle**: System prompts explicitly instruct the AI to treat input strictly as passive text to edit, neutralizing prompt injection attempts.
- **Private Writing**: Submitted text is processed ephemerally. Documents are stored only when an authenticated user explicitly saves them.
- **Data Deletion**: Users have full autonomy to clear document history or permanently delete their account and all associated data.
