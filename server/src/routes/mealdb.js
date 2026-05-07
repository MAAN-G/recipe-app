import { Router } from 'express';
import fetch from 'node-fetch';

const router = Router();

// Read base URL and API key from environment — never sent to the client
const API_BASE = process.env.MEALDB_API_BASE || 'https://www.themealdb.com/api/json/v1';
const API_KEY = process.env.MEALDB_API_KEY || '1';

// In-memory TTL cache to reduce upstream calls for stable data (categories)
const cache = new Map(); // key → { data, expiresAt }
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Returns cached value if still valid, otherwise undefined.
 * @param {string} key
 */
function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return entry.data;
}

/**
 * Stores a value in the in-memory cache with a TTL.
 * @param {string} key
 * @param {unknown} data
 */
function setCache(key, data) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

/**
 * Fetches a TheMealDB endpoint and returns parsed JSON.
 * Throws a structured error if the upstream call fails.
 * @param {string} path  e.g. "search.php?s=chicken"
 */
async function mealdbFetch(path) {
  const url = `${API_BASE}/${API_KEY}/${path}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = new Error(`TheMealDB responded with ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// GET /api/search?q=chicken
// ---------------------------------------------------------------------------
router.get('/search', async (req, res, next) => {
  try {
    const q = (req.query.q || '').toString().trim();
    if (!q) return res.json({ meals: null });

    const data = await mealdbFetch(`search.php?s=${encodeURIComponent(q)}`);

    // Short cache for search results (2 min) to handle back-navigation nicely
    res.setHeader('Cache-Control', 'public, max-age=120');
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/meal/:id
// ---------------------------------------------------------------------------
router.get('/meal/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await mealdbFetch(`lookup.php?i=${encodeURIComponent(id)}`);

    // Cache individual meals for 5 minutes
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/categories
// Uses in-memory TTL cache to avoid hammering TheMealDB for this stable list
// ---------------------------------------------------------------------------
router.get('/categories', async (req, res, next) => {
  try {
    const cacheKey = 'categories';
    const cached = getCache(cacheKey);

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', 'public, max-age=600');
      return res.json(cached);
    }

    const data = await mealdbFetch('categories.php');
    setCache(cacheKey, data);

    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', 'public, max-age=600');
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/filter?c=Seafood
// ---------------------------------------------------------------------------
router.get('/filter', async (req, res, next) => {
  try {
    const c = (req.query.c || '').toString().trim();
    if (!c) return res.status(400).json({ error: 'Category parameter c is required' });

    // Cache category filter results for 5 minutes
    const cacheKey = `filter:${c}`;
    const cached = getCache(cacheKey);

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', 'public, max-age=300');
      return res.json(cached);
    }

    const data = await mealdbFetch(`filter.php?c=${encodeURIComponent(c)}`);
    setCache(cacheKey, data);

    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/random
// ---------------------------------------------------------------------------
router.get('/random', async (req, res, next) => {
  try {
    const data = await mealdbFetch('random.php');
    // No cache for random
    res.setHeader('Cache-Control', 'no-store');
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
