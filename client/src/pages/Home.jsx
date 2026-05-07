import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChefHat } from 'lucide-react';
import { searchMeals, getCategories, filterByCategory, cacheImagesInSW } from '@/lib/api';
import MealCard from '@/components/MealCard';
import MealCardSkeleton from '@/components/MealCardSkeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const SKELETON_COUNT = 8;

/**
 * Home page — shows:
 * 1. Browsable category chips (from /api/categories)
 * 2. Search results when ?q= param is present
 * 3. Category-filtered meals when a chip is selected
 * 4. A friendly landing prompt when nothing is selected/searched
 */
export default function Home() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Reset category filter when a new search query comes in
  useEffect(() => {
    if (query) setSelectedCategory(null);
  }, [query]);

  // Fetch categories — Stale-While-Revalidate (long staleTime, cached by server)
  const { data: categoryData, isLoading: catLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 10 * 60 * 1000,
  });

  // Search results — only fetched when a query exists
  const {
    data: searchData,
    isLoading: searchLoading,
    isError: searchError,
  } = useQuery({
    queryKey: ['search', query],
    queryFn: () => searchMeals(query),
    enabled: !!query,
    staleTime: 2 * 60 * 1000,
  });

  // Category filter results — only fetched when a category chip is selected
  const {
    data: filterData,
    isLoading: filterLoading,
    isError: filterError,
  } = useQuery({
    queryKey: ['filter', selectedCategory],
    queryFn: () => filterByCategory(selectedCategory),
    enabled: !!selectedCategory,
    staleTime: 5 * 60 * 1000,
  });

  // Cache all visible thumbnails in the SW whenever a result set arrives
  useEffect(() => {
    const meals = filterData?.meals || searchData?.meals || [];
    if (meals.length) {
      cacheImagesInSW(meals.map((m) => m.strMealThumb).filter(Boolean));
    }
  }, [filterData, searchData]);

  // Cache category chip thumbnails once the category list loads
  useEffect(() => {
    const cats = categoryData?.categories || [];
    if (cats.length) {
      cacheImagesInSW(cats.map((c) => c.strCategoryThumb).filter(Boolean));
    }
  }, [categoryData]);

  const categories = categoryData?.categories || [];
  const isLoading = searchLoading || filterLoading;
  const isError = searchError || filterError;

  let meals = [];
  if (query) meals = searchData?.meals || [];
  else if (selectedCategory) meals = filterData?.meals || [];

  const showLanding = !query && !selectedCategory;
  const showEmpty = !isLoading && !isError && !showLanding && meals.length === 0;

  return (
    <main id="main-content" className="container py-8 space-y-8">

      {/* Category Chips */}
      <section aria-label="Browse by category">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Browse Categories
        </h2>
        {catLoading ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-7 w-20 animate-pulse rounded-full bg-muted" aria-hidden="true" />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2" role="list" aria-label="Meal categories">
            {categories.map((cat) => (
              <button
                key={cat.idCategory}
                role="listitem"
                onClick={() => setSelectedCategory(
                  selectedCategory === cat.strCategory ? null : cat.strCategory
                )}
                aria-pressed={selectedCategory === cat.strCategory}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                  ${selectedCategory === cat.strCategory
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-border hover:bg-accent'
                  }`}
              >
                <img
                  src={cat.strCategoryThumb}
                  alt=""
                  aria-hidden="true"
                  className="h-4 w-4 rounded-full object-cover"
                />
                {cat.strCategory}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Results header */}
      {(query || selectedCategory) && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {query ? `Results for "${query}"` : `Category: ${selectedCategory}`}
          </h2>
          {(query || selectedCategory) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className={query ? 'hidden' : ''}
            >
              Clear
            </Button>
          )}
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
          aria-label="Loading recipes…"
          aria-busy="true"
        >
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <MealCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div role="alert" className="flex flex-col items-center py-16 gap-3 text-center">
          <span className="text-4xl" aria-hidden="true">⚠️</span>
          <p className="font-medium">Failed to load recipes. Please try again.</p>
        </div>
      )}

      {/* Meal grid */}
      {!isLoading && !isError && meals.length > 0 && (
        <section aria-label="Recipe results">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {meals.map((meal) => (
              <MealCard key={meal.idMeal} meal={meal} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {showEmpty && (
        <div className="flex flex-col items-center py-20 gap-3 text-center" role="status">
          <span className="text-5xl" aria-hidden="true">🍽️</span>
          <p className="text-lg font-medium">No recipes found</p>
          <p className="text-muted-foreground text-sm">Try a different search term or category</p>
        </div>
      )}

      {/* Landing hero when nothing is searched/selected */}
      {showLanding && (
        <div className="flex flex-col items-center py-20 gap-4 text-center">
          <ChefHat className="h-16 w-16 text-primary" aria-hidden="true" />
          <h1 className="text-3xl font-bold">Welcome to RecipeBox</h1>
          <p className="text-muted-foreground max-w-md">
            Search for your favourite dishes or pick a category above to start exploring thousands of recipes from around the world.
          </p>
        </div>
      )}
    </main>
  );
}
