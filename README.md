# DeskFlow AI

DeskFlow AI is a Windows desktop IT service desk and workflow automation application. This Phase 1 foundation uses Tauri 2, React, TypeScript, Vite, Tailwind CSS, shadcn/ui, and Lucide icons.

The current build is intentionally frontend-only and uses fictional ticket data. It does not connect to Supabase, authenticate users, create tickets, or call an AI service. Future AI features are limited to administrative workflow automation and must never perform technical diagnosis, troubleshooting, or remediation.

## Phase 1 features

- Native Tauri 2 desktop shell sized for 1280 × 800 with a 1024 × 720 minimum
- Cloud Blue light and dark themes with local preference persistence
- Collapsible 240 px / 68 px administrator sidebar
- Working navigation to clearly identified placeholder pages
- 64 px topbar with functional notification navigation and account context
- Dashboard ticket statistics and a searchable recent-ticket table
- Accessible status labels that do not rely on color alone
- Reusable typed React components and centralized design tokens
- Branded Windows application icons

## Prerequisites

- Windows 10 or 11 with Microsoft Edge WebView2
- Node.js 20 or newer
- Rust stable with the MSVC toolchain
- Visual Studio C++ Build Tools with **Desktop development with C++**

The Tauri prerequisites are documented at <https://v2.tauri.app/start/prerequisites/>.

## Install

Open PowerShell in the project root:

```powershell
cd "C:\Users\jozza galang\Desktop\Coding Projects\DeskFlowAI"
npm install
```

## Run the desktop application

```powershell
npm run tauri dev
```

The first native run downloads and compiles Rust crates, so it takes longer than later launches.

## Frontend-only preview

```powershell
npm run dev
```

Open `http://127.0.0.1:1420` if a browser does not open automatically.

## Validate

```powershell
npm test
npm run typecheck
npm run build
```

## Project structure

```text
DeskFlowAI/
├── public/                    # DeskFlow brand mark
├── src/
│   ├── components/
│   │   ├── dashboard/         # Statistic cards and recent-ticket table
│   │   ├── layout/            # Sidebar and topbar
│   │   ├── shared/            # Cross-feature components such as status badges
│   │   └── ui/                # shadcn/ui components
│   ├── data/                  # Navigation definitions and fictional tickets
│   ├── hooks/                 # Persistent theme state
│   ├── pages/                 # Dashboard and Phase 1 placeholders
│   ├── types/                 # Shared TypeScript domain types
│   ├── App.tsx                # Application routing and shell state
│   └── index.css              # Tailwind entry and Cloud Blue design tokens
├── src-tauri/
│   ├── capabilities/          # Minimal desktop permissions
│   ├── icons/                 # Generated application icons
│   ├── src/                   # Minimal Rust application entry point
│   ├── Cargo.toml
│   └── tauri.conf.json        # Window and build configuration
├── components.json            # shadcn/ui configuration
├── package.json
└── vite.config.ts
```

## Security boundary

Never commit credentials, Supabase service-role keys, or privileged tokens. Future cloud work must use HTTPS, user-scoped Supabase Auth, PostgreSQL Row Level Security, and trusted backend functions for privileged operations. The desktop application may eventually contain only the public Supabase URL and anonymous client key.

## Next milestone

Phase 2 should define the Supabase schema, Row Level Security policies, authentication states, and a typed service layer before implementing live ticket creation or management.

