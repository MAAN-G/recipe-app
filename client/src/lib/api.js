/**
 * Thin proxy client — every request goes through /api/* (our Express server).
 * TheMealDB is never contacted directly from the browser.
 */

const BASE = '/api';

/**
 * Generic fetch wrapper with structured error handling.
 * @param {string} path
 * @returns {Promise<any>}
 */
async function apiFetch(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const err = new Error(`API error ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/**
 * Sends a list of image URLs to the Service Worker to be proactively cached.
 * Safe to call even if the SW is not registered — it silently no-ops.
 * @param {string[]} urls
 */
export function cacheImagesInSW(urls) {
  if (!navigator.serviceWorker?.controller || !urls?.length) return;
  navigator.serviceWorker.controller.postMessage({
    type: 'CACHE_IMAGES',
    urls: urls.filter(Boolean),
  });
}

/** Search meals by name. Returns { meals: Meal[] | null } */
export const searchMeals = (query) =>
  apiFetch(`/search?q=${encodeURIComponent(query)}`);

/** Fetch a single meal by ID. Returns { meals: [Meal] | null } */
export const getMealById = (id) => apiFetch(`/meal/${id}`);

/** Fetch all categories. Returns { categories: Category[] } */
export const getCategories = () => apiFetch('/categories');

/** Filter meals by category name. Returns { meals: FilteredMeal[] | null } */
export const filterByCategory = (category) =>
  apiFetch(`/filter?c=${encodeURIComponent(category)}`);

/** Fetch a random meal. Returns { meals: [Meal] } */
export const getRandomMeal = () => apiFetch('/random');
