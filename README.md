# Kal'site Frontend

Web application for **Kal'site** (multipurpose Arknights web platform for mini-games, Operator data, and future community tools/trackers), built with **Next.js (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Zustand**.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Styling**: Tailwind CSS v4 + `next-themes` (dark/light emerald Kal'tsit theme, `JetBrains Mono`)
- **State & Networking**: Zustand, Axios (credentialed session cookies), Native Browser WebSocket client
- **Icons**: `lucide-react`

---

## Routes & Features

| Route | Description |
| --- | --- |
| `/` | Landing page |
| `/games` | Multi-game hub (`Guess Who Am I` + upcoming slots) |
| `/guess-who-am-i` | Live public/private room browser |
| `/guess-who-am-i/new` | Create room form with rarity/class filters, lives, timer, and question limits |
| `/guess-who-am-i/[code]` | Real-time Lobby (color picker, live host settings, ready check), Game Table (desktop & mobile switcher, separated Player/Spectator chat, autocomplete guessing), and Results screen (rematch / back to lobby) |
| `/how-to-play` | Interactive guide with playable mini-turn demo, step switcher, and FAQ |
| `/operators` | Searchable & filterable Arknights Operator Index (sorted by release order / A–Z) |
| `/operators/[slug]` | Individual Operator dossier with faction emblem and traits |
| `/login` | Discord OAuth2 sign-in and local dev codename login |

---

## Project Structure

```text
kalsite-frontend/
├── public/
│   └── kaltsit-e1.png             # Brand icon & favicon
├── src/
│   ├── app/
│   │   ├── (public)/              # Landing, Games, How to Play, Operators, Login
│   │   ├── (app)/                 # Authenticated Guess Who Am I room pages
│   │   ├── layout.tsx             # Root layout, JetBrains Mono font, theme provider
│   │   └── globals.css            # Emerald/jade CSS variables & dark variant
│   ├── components/                # TopBar, Button, OperatorCard, ThemeToggle
│   ├── features/
│   │   ├── rooms/                 # RoomBrowser, CreateRoomForm
│   │   ├── lobby/                 # LobbyView (color picker, host settings, ready check)
│   │   └── game/                  # GameTable, ClueChatPanel, OperatorAutocomplete, ResultsView
│   ├── lib/                       # Axios client, WebSocket client, types, constants
│   └── stores/                    # Zustand auth & room stores
├── next.config.ts                 # Rewrites /uploads/:path* to backend API
├── Dockerfile
├── docker-compose.yaml
└── .env.example
```

---

## Environment Variables

Next.js embeds `NEXT_PUBLIC_*` variables at **build time** (and uses `NEXT_PUBLIC_API_URL` at runtime for server-side fetches and `/uploads/*` rewrites).

| Variable | Default | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000` | Public backend HTTP base URL |
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:5000/ws` | Public backend WebSocket URL (`wss://...` in production) |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Public frontend URL (metadata, sitemap, robots) |
| `NEXT_PUBLIC_SYSTEM_NAME` | `ZOOT` | System announcer label displayed in UI/guide |
| `API_SECRET_KEY` | `kalsite-dev-api-secret-...` | Server-only API key sent by Next.js Server Components (`x-api-key`, never exposed to browser) |
| `API_INTERNAL_URL` | *(empty)* | Optional internal backend URL for Next.js SSR inside Docker (e.g. `http://kalsite-backend:5000`) |

---

## Local Development

```bash
# 1. Install dependencies
bun install

# 2. Copy env file for local Next.js dev
cp .env.example .env.local

# 3. Start Next.js dev server (http://localhost:3000)
bun run dev
```

### Scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Start Next.js dev server on port `3000` |
| `bun run build` | Build production Next.js bundle |
| `bun run start` | Run production Next.js server on port `3000` |
| `bun run typecheck` | Run TypeScript check (`tsc --noEmit`) |

---

## Docker & Cloudflare Tunnel Deployment

This service attaches to the external `cloudflared_tunnel` Docker network.

### 1. Ensure the external network exists

```bash
docker network create cloudflared_tunnel
```

### 2. Create `.env` in `kalsite-frontend/`

Docker Compose reads `.env` for both build `args` and runtime `env_file`:

```env
NEXT_PUBLIC_API_URL=https://api.kalsite.yourdomain.com
NEXT_PUBLIC_WS_URL=wss://api.kalsite.yourdomain.com/ws
NEXT_PUBLIC_SITE_URL=https://kalsite.yourdomain.com
NEXT_PUBLIC_SYSTEM_NAME=ZOOT
```

> **Important:** Because `NEXT_PUBLIC_*` values are baked into the client bundle during `next build`, rebuild the image (`docker compose up -d --build`) whenever you change them.

### 3. Build & start

```bash
docker compose up -d --build
```

### 4. Cloudflare Tunnel routing

Point your web hostname (e.g. `kalsite.yourdomain.com`) in Cloudflare Zero Trust to:

```text
http://kalsite-frontend:3000
```

Using subdomains under the same root domain (e.g. `kalsite.yourdomain.com` + `api.kalsite.yourdomain.com`) keeps session cookies working reliably across HTTP and WebSocket requests.
