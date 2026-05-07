# RecipeBox 🍳

A production-ready **Progressive Web App** for browsing, searching, and saving recipes from [TheMealDB](https://www.themealdb.com/).

Built with **React + Vite + Tailwind + shadcn/ui** on the front-end, and a **Node.js/Express** proxy server that hides the API key from the client.

---

## Features

- 🔍 **Search** recipes by name
- 📂 **Browse** by category with one-click filtering
- 📖 **Full recipe details** — ingredients, instructions, YouTube link, source
- ❤️ **Favorites** — save/remove with IndexedDB, works 100% offline
- 📴 **Offline support** — SW caches app shell, API responses, and images
- 📲 **Installable PWA** — manifest, service worker, standalone display
- 🌙 **Dark/Light theme** toggle, persisted to `localStorage`
- 💀 **Skeleton loaders**, error boundaries, empty states
- ♿ **Accessible** — skip links, ARIA, keyboard navigation, alt text

---

## Tech Stack

| Layer | Technology |
|---|---|
| Front-end | React 18, Vite, React Router v6 |
| Styling | Tailwind CSS v3, shadcn/ui components |
| Data fetching | TanStack Query (React Query v5) |
| Offline storage | IndexedDB via `idb` |
| Notifications | Sonner (toast) |
| Icons | Lucide React |
| Back-end | Node.js, Express 4 |
| Security | Helmet, CORS, env vars |
| Performance | Compression, in-memory TTL cache |
| PWA | Manual Service Worker (no Workbox) |

---

## Project Structure

```
recipe-app/
├── server/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── index.js          # Express app entry
│       └── routes/
│           └── mealdb.js     # Proxy routes + in-memory cache
│
└── client/
    ├── index.html
    ├── vite.config.js        # Vite + /api proxy to :3001
    ├── tailwind.config.cjs
    ├── postcss.config.cjs
    ├── package.json
    ├── public/
    │   ├── sw.js             # Manual service worker
    │   ├── manifest.webmanifest
    │   ├── offline.html      # Offline fallback page
    │   └── icons/            # PWA icons (replace for production)
    └── src/
        ├── main.jsx          # Entry — registers SW
        ├── App.jsx           # Router + Toaster + ErrorBoundary
        ├── styles/globals.css
        ├── lib/
        │   ├── api.js        # /api/* proxy client
        │   ├── queryClient.js
        │   └── utils.js      # cn() helper
        ├── features/
        │   └── favorites/
        │       └── db.js     # IndexedDB CRUD helpers
        ├── hooks/
        │   └── useOffline.js # Online/offline detection + toast
        ├── components/
        │   ├── Header.jsx
        │   ├── MealCard.jsx
        │   ├── MealCardSkeleton.jsx
        │   ├── ErrorBoundary.jsx
        │   └── ui/           # shadcn/ui components
        │       ├── button.jsx
        │       ├── card.jsx
        │       ├── input.jsx
        │       ├── badge.jsx
        │       ├── skeleton.jsx
        │       └── dialog.jsx
        └── pages/
            ├── Home.jsx      # Search + categories + results grid
            ├── Details.jsx   # Full recipe view + favorite toggle
            └── Favorites.jsx # Offline-first favorites grid
```

---

## Setup & Running Locally

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### 1. Server

```bash
cd server
cp .env.example .env   # edit if needed (defaults work for dev)
npm install
npm run dev            # starts on http://localhost:3001
```

### 2. Client

```bash
cd client
npm install
npm run dev            # starts on http://localhost:5173
```

> Vite proxies all `/api/*` requests to `:3001` automatically during development.

### 3. Open the app

Navigate to **http://localhost:5173**

---

## Environment Variables

### `server/.env`

| Variable | Default | Description |
|---|---|---|
| `MEALDB_API_BASE` | `https://www.themealdb.com/api/json/v1` | TheMealDB base URL |
| `MEALDB_API_KEY` | `1` | API key (use `1` for free tier) |
| `PORT` | `3001` | Express server port |
| `CLIENT_ORIGIN` | *(unset)* | Allowed CORS origin in production |

The API key is **never** sent to the client — it lives only in the server process.

---

## API Routes (server)

| Route | Upstream | Strategy |
|---|---|---|
| `GET /api/search?q=` | `search.php?s=` | Pass-through, 2 min cache header |
| `GET /api/meal/:id` | `lookup.php?i=` | Pass-through, 5 min cache header |
| `GET /api/categories` | `categories.php` | In-memory TTL 10 min + cache header |
| `GET /api/filter?c=` | `filter.php?c=` | In-memory TTL 5 min + cache header |
| `GET /api/random` | `random.php` | No cache |
| `GET /health` | — | Health check |

---

## PWA Details

### Service Worker (`public/sw.js`)

The SW is fully manual (no Workbox) with three runtime strategies:

| Request type | Strategy | Rationale |
|---|---|---|
| HTML navigations | **Network-First** → `/` → `/offline.html` | Always try fresh shell |
| `/api/categories` | **Stale-While-Revalidate** | Stable data, speed matters |
| `/api/search`, `/api/meal/*`, `/api/filter` | **Network-First + cache fallback** | Fresh data preferred; offline fallback |
| TheMealDB images | **Stale-While-Revalidate** | Images rarely change |
| Static assets (JS/CSS) | **Cache-First** | Versioned at build time |

### Changing caching strategies

Edit the `fetch` listener in `public/sw.js`. Each strategy is an isolated `async function` — swap them per route by changing which function is called in the `event.respondWith(...)` block.

After any SW change, **bump `CACHE_VERSION`** at the top of the file to force cache invalidation on the next visit.

### Testing offline mode

1. Open DevTools → **Application → Service Workers** → verify registered
2. Check **Offline** checkbox in DevTools Network tab
3. Reload — you should see the cached app shell or `/offline.html`
4. Navigate to `/favorites` — saved recipes load from IndexedDB without network

### Installing the PWA

Chrome/Edge desktop: look for the install icon in the address bar.  
Android: "Add to Home Screen" from the browser menu.  
iOS Safari: Share → "Add to Home Screen".

---

## Offline Favorites

Favorites are stored in **IndexedDB** (`recipebox-db`, store `favorites`):

- **Full meal objects** are saved (not just IDs) so the detail page works offline
- Utility functions: `saveFavorite`, `removeFavorite`, `getFavorite`, `getAllFavorites`, `isFavorite`
- Located in `src/features/favorites/db.js`

---

## Deployment

### Server → Render.com (or Railway)

1. Set environment variables in the Render dashboard
2. Build command: *(none — Node.js)*
3. Start command: `node src/index.js`
4. Set `CLIENT_ORIGIN` to your Netlify/Vercel URL

### Client → Netlify / Vercel

1. Build command: `npm run build`
2. Publish directory: `dist`
3. Set `VITE_API_BASE` if you want to override the proxy URL in production
4. Add a `_redirects` file (Netlify) or `vercel.json` for SPA routing:

**Netlify** (`client/public/_redirects`):
```
/*    /index.html   200
```

**Vercel** (`client/vercel.json`):
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

> In production the Vite proxy is gone — point your client's fetch base URL to the deployed server URL via an environment variable, and update `CORS` origins on the server accordingly.

---

## Post-Generation Checklist

- [ ] Replace `public/icons/icon-192.png` and `icon-512.png` with real artwork
- [ ] Update `manifest.webmanifest` `theme_color` / `background_color` if branding changes
- [ ] Set `CLIENT_ORIGIN` on the server in production
- [ ] Point the client at the production server URL (update `vite.config.js` proxy or add env var)
- [ ] Bump `CACHE_VERSION` in `public/sw.js` after any SW logic changes
- [ ] Run Lighthouse PWA audit and address any remaining gaps
