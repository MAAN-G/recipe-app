import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, SortAsc, SortDesc } from 'lucide-react';
import { toast } from 'sonner';
import { getAllFavorites, removeFavorite } from '@/features/favorites/db';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

/**
 * Favorites page — fully functional offline.
 * All data comes from IndexedDB, no network required.
 *
 * Features:
 * - View all saved recipes
 * - Filter by title
 * - Sort newest/oldest
 * - Remove individual favorites
 */
export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [filter, setFilter] = useState('');
  const [sortAsc, setSortAsc] = useState(false); // newest first by default
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    const data = await getAllFavorites();
    setFavorites(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  async function handleRemove(meal) {
    try {
      await removeFavorite(meal.idMeal);
      toast.success(`Removed "${meal.strMeal}"`);
      loadFavorites();
    } catch (err) {
      console.error(err);
      toast.error('Could not remove favorite');
    }
  }

  // Client-side filter and sort (all data is local, no network needed)
  const displayed = favorites
    .filter((m) =>
      !filter || m.strMeal.toLowerCase().includes(filter.toLowerCase())
    )
    .sort((a, b) =>
      sortAsc
        ? (a.savedAt || 0) - (b.savedAt || 0)
        : (b.savedAt || 0) - (a.savedAt || 0)
    );

  return (
    <main id="main-content" className="container py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="h-6 w-6 text-red-500" aria-hidden="true" />
            Saved Favorites
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {favorites.length} recipe{favorites.length !== 1 ? 's' : ''} saved — available offline
          </p>
        </div>

        {/* Filter + Sort controls */}
        {favorites.length > 0 && (
          <div className="flex items-center gap-2">
            <Input
              type="search"
              placeholder="Filter favorites…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-48"
              aria-label="Filter saved favorites"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortAsc((s) => !s)}
              aria-label={sortAsc ? 'Sort newest first' : 'Sort oldest first'}
              title={sortAsc ? 'Oldest first — click for newest' : 'Newest first — click for oldest'}
            >
              {sortAsc ? (
                <SortAsc className="h-4 w-4" aria-hidden="true" />
              ) : (
                <SortDesc className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
          aria-busy="true"
          aria-label="Loading favorites…"
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-muted aspect-[4/3] animate-pulse" aria-hidden="true" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && favorites.length === 0 && (
        <div className="flex flex-col items-center py-24 gap-4 text-center" role="status">
          <Heart className="h-16 w-16 text-muted-foreground/40" aria-hidden="true" />
          <h2 className="text-xl font-semibold">No favorites yet</h2>
          <p className="text-muted-foreground text-sm max-w-xs">
            Browse recipes and tap the heart icon to save them for offline access.
          </p>
          <Button asChild>
            <Link to="/">Explore Recipes</Link>
          </Button>
        </div>
      )}

      {/* Filter — no match */}
      {!loading && favorites.length > 0 && displayed.length === 0 && (
        <div role="status" className="text-center py-12 text-muted-foreground">
          No favorites match &ldquo;{filter}&rdquo;
        </div>
      )}

      {/* Favorites grid */}
      {!loading && displayed.length > 0 && (
        <section aria-label="Saved recipes">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {displayed.map((meal) => (
              <article
                key={meal.idMeal}
                className="group relative rounded-lg border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow animate-fade-in"
              >
                <Link
                  to={`/meal/${meal.idMeal}`}
                  className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`View recipe for ${meal.strMeal}`}
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={meal.strMealThumb}
                      alt={`${meal.strMeal} dish`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-1.5">
                      {meal.strMeal}
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {meal.strCategory && (
                        <Badge variant="secondary" className="text-xs">{meal.strCategory}</Badge>
                      )}
                      {meal.strArea && (
                        <Badge variant="outline" className="text-xs">{meal.strArea}</Badge>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Remove button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(meal)}
                  aria-label={`Remove ${meal.strMeal} from favorites`}
                  className="absolute top-2 right-2 bg-background/70 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
