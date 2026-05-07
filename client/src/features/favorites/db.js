/**
 * IndexedDB helpers for offline-persistent favorites.
 * Uses the `idb` wrapper for a clean Promise-based API.
 *
 * Database: recipebox-db  (version 1)
 * Object store: favorites  (keyPath: idMeal)
 */
import { openDB } from 'idb';
import { cacheImagesInSW } from '@/lib/api';

const DB_NAME = 'recipebox-db';
const DB_VERSION = 1;
const STORE = 'favorites';

/**
 * Opens (or upgrades) the IndexedDB database.
 * Called lazily so the DB is only created when first used.
 */
function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        // idMeal is the natural primary key supplied by TheMealDB
        db.createObjectStore(STORE, { keyPath: 'idMeal' });
      }
    },
  });
}

/**
 * Saves a meal object to favorites.
 * If a favorite with the same idMeal already exists it will be overwritten.
 * @param {object} meal  Full meal object from the API
 */
export async function saveFavorite(meal) {
  const db = await getDb();
  // Store the full meal so it's viewable offline without any network request
  await db.put(STORE, { ...meal, savedAt: Date.now() });
  // Proactively cache the thumbnail in the SW so the image loads offline too
  if (meal.strMealThumb) {
    cacheImagesInSW([meal.strMealThumb]);
  }
}

/**
 * Removes a favorite by meal ID.
 * @param {string} idMeal
 */
export async function removeFavorite(idMeal) {
  const db = await getDb();
  await db.delete(STORE, idMeal);
}

/**
 * Returns a single favorite by ID, or undefined if not saved.
 * @param {string} idMeal
 * @returns {Promise<object|undefined>}
 */
export async function getFavorite(idMeal) {
  const db = await getDb();
  return db.get(STORE, idMeal);
}

/**
 * Returns all saved favorites, sorted by most-recently saved first.
 * @returns {Promise<object[]>}
 */
export async function getAllFavorites() {
  const db = await getDb();
  const all = await db.getAll(STORE);
  return all.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
}

/**
 * Returns true if a meal is already saved as a favorite.
 * @param {string} idMeal
 * @returns {Promise<boolean>}
 */
export async function isFavorite(idMeal) {
  const entry = await getFavorite(idMeal);
  return entry !== undefined;
}
