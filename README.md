# 🧠 SMMAA - Social Media Marketing AI Agent
## Intelligent Content Generation for Funebra Brașov

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green)](https://supabase.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.0-purple)](https://ai.google.dev/)

---

## 🎯 Overview

SMMAA is a specialized multi-agent AI system for generating culturally-sensitive social media content for Romanian funeral services. Unlike generic ChatGPT wrappers, SMMAA features:

- **🧠 5-Agent Pipeline**: Researcher → Strategist → Writer → Editor → Optimizer
- **📚 Persistent Memory**: Learns from every interaction and feedback
- **🇷🇴 Romanian Excellence**: Proper diacritics, Orthodox traditions, cultural calendar
- **🎭 3 Content Variants**: Safe, Creative, Emotional approaches
- **📊 Engagement Prediction**: AI-powered scoring for each post
- **🖼️ Vision Analysis**: Understands uploaded images to generate context-aware content

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/Dzaved/smmaa.git
cd smmaa

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and use password: `funebra2026`

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   USER INPUT                         │
│  Platform + Post Type + Tone + Custom Prompt + Media │
└─────────────────────┬───────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────┐
│                  ORCHESTRATOR                        │
│           Coordinates all agents                     │
└───┬─────┬─────┬─────┬─────┬─────────────────────────┘
    ▼     ▼     ▼     ▼     ▼
  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐
  │🔍│ │🎯│ │✍️│ │📝│ │📊│
  │Res│ │Str│ │Wri│ │Edi│ │Opt│
  └───┘ └───┘ └───┘ └───┘ └───┘
    │     │     │     │     │
    └─────┴─────┴─────┴─────┘
                │
    ┌───────────▼───────────┐
    │   SUPABASE DATABASE   │
    │ Knowledge │ Calendar  │
    │ History   │ Patterns  │
    └───────────────────────┘
```

---

## 🤖 The 5 Agents

| Agent | Role | Temperature |
|-------|------|-------------|
| **🔍 Researcher** | Gathers context from knowledge base, calendar, history | 0.2 |
| **🎯 Strategist** | Plans approach using Cialdini principles + grief psychology | 0.4 |
| **✍️ Writer** | Creates 3 distinct variants (safe/creative/emotional) | 0.3-0.9 |
| **📝 Editor** | Quality checks grammar, sensitivity, brand voice | 0.1 |
| **📊 Optimizer** | Generates hashtags, predicts engagement, suggests timing | 0.5 |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx           # Login page
│   ├── dashboard/         # Main content generation
│   └── history/           # Post history viewer
├── components/
│   ├── AIThinking.tsx     # Progress animation
│   ├── VariantCards.tsx   # 3-variant output display
│   ├── MediaUpload.tsx    # Drag & drop upload
│   └── WordCountSelector/ # Short/Medium/Long
├── lib/
│   ├── brain/
│   │   ├── orchestrator.ts    # Pipeline coordinator
│   │   ├── base-agent.ts      # Agent base class
│   │   ├── types.ts           # TypeScript interfaces
│   │   ├── intelligence.ts    # Engagement prediction
│   │   ├── vision.ts          # Gemini Vision integration
│   │   └── agents/
│   │       ├── researcher.ts
│   │       ├── strategist.ts
│   │       ├── writer.ts
│   │       ├── editor.ts
│   │       └── optimizer.ts
│   ├── supabase.ts        # Database client
│   ├── data.ts            # Data access layer
│   └── actions.ts         # Server actions
└── docs/
    ├── BRAIN_ARCHITECTURE.md
    ├── AGENT_IMPLEMENTATION_GUIDE.md
    ├── AGENT_RULES.md
    ├── MASTER_BRAIN_KNOWLEDGE.md
    ├── PSYCHOLOGY_PERSUASION_MASTERY.md
    └── ROMANIAN_CALENDAR.md
```

---

## 🔧 Environment Variables

Create `.env.local` with:

```env
# Required
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional
PASSWORD=funebra2026
```

---

## 🗄️ Database Schema

### Tables in Supabase:

| Table | Purpose |
|-------|---------|
| `knowledge_base` | Company info, services, FAQs |
| `calendar_events` | Romanian holidays and memorial days |
| `post_history` | All generated content + ratings |
| `brand_voice` | Voice guidelines and preferences |
| `content_patterns` | Learned successful patterns |

---

## ✨ Features

### Content Generation
- ✅ 3 variants per request (safe, creative, emotional)
- ✅ Platform-specific optimization (Facebook, Instagram, TikTok)
- ✅ Word count control (short/medium/long)
- ✅ Media upload with AI vision analysis
- ✅ Engagement prediction scoring

### Intelligence
- ✅ RAG with semantic search
- ✅ Romanian cultural calendar awareness
- ✅ Cialdini persuasion principles
- ✅ Grief psychology integration
- ✅ Brand voice enforcement

### User Features
- ✅ Copy to clipboard
- ✅ Save favorites
- ✅ Mark as used
- ✅ 5-star rating system
- ✅ Post history with filters

---

## 📚 Documentation

Detailed documentation in `/docs`:

- **BRAIN_ARCHITECTURE.md** - System overview and agent roles
- **AGENT_IMPLEMENTATION_GUIDE.md** - Technical implementation details
- **AGENT_RULES.md** - Hard rules and output formats
- **MASTER_BRAIN_KNOWLEDGE.md** - Competitive analysis and psychology
- **PSYCHOLOGY_PERSUASION_MASTERY.md** - Cialdini + grief framework
- **ROMANIAN_CALENDAR.md** - Cultural events database

---

## 🚀 Deployment

Deployed on Vercel with automatic GitHub integration.

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## 📄 License

Private project for Funebra Brașov.

---

## 👥 Author

Built with ❤️ for ethical funeral marketing in Romania.

---

*Last Updated: 2026-01-29*
