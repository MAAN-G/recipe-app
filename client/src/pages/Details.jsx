import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Heart, Youtube, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { getMealById } from '@/lib/api';
import { isFavorite, saveFavorite, removeFavorite, getFavorite } from '@/features/favorites/db';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Full recipe detail page.
 * Parses TheMealDB's numbered ingredient/measure fields into a clean list.
 * Shows: image, metadata badges, ingredients, instructions, YouTube link.
 * Offline: if the meal was favorited, it's already in IndexedDB and viewable.
 */
export default function Details() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [favorited, setFavorited] = useState(false);
  // Holds a meal loaded from IndexedDB when the network is unavailable
  const [offlineMeal, setOfflineMeal] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['meal', id],
    queryFn: () => getMealById(id),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // When the network query fails, try loading the full meal from IndexedDB
  useEffect(() => {
    if (isError) {
      getFavorite(id).then((saved) => {
        if (saved) setOfflineMeal(saved);
      });
    }
  }, [isError, id]);

  const meal = data?.meals?.[0] ?? offlineMeal;

  // Sync favorite state once meal data is available
  useEffect(() => {
    if (meal) isFavorite(meal.idMeal).then(setFavorited);
  }, [meal]);

  async function handleToggleFavorite() {
    if (!meal) return;
    try {
      if (favorited) {
        await removeFavorite(meal.idMeal);
        setFavorited(false);
        toast.success(`Removed from favorites`);
      } else {
        await saveFavorite(meal);
        setFavorited(true);
        toast.success(`Saved to favorites — viewable offline!`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not update favorites');
    }
  }

  /**
   * TheMealDB stores ingredients as strIngredient1…strIngredient20.
   * This helper zips them with their matching strMeasure values.
   */
  function getIngredients(meal) {
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ingredient && ingredient.trim()) {
        ingredients.push({ ingredient: ingredient.trim(), measure: (measure || '').trim() });
      }
    }
    return ingredients;
  }

  // ---------- Loading state ----------
  if (isLoading) {
    return (
      <main id="main-content" className="container py-8">
        <Skeleton className="h-8 w-32 mb-6" aria-hidden="true" />
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-xl" aria-hidden="true" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" aria-hidden="true" />
            <Skeleton className="h-4 w-1/2" aria-hidden="true" />
            <Skeleton className="h-48 w-full" aria-hidden="true" />
          </div>
        </div>
        <p className="sr-only" aria-live="polite">Loading recipe…</p>
      </main>
    );
  }

  // ---------- Error / not found state ----------
  // Only show error if network failed AND no IndexedDB fallback is available
  if ((isError && !offlineMeal) || (!isLoading && !meal)) {
    return (
      <main id="main-content" className="container py-8">
        <div role="alert" className="flex flex-col items-center py-24 gap-4 text-center">
          <span className="text-5xl" aria-hidden="true">😕</span>
          <h1 className="text-xl font-semibold">Recipe not found</h1>
          <p className="text-muted-foreground text-sm">
            This recipe might not be available offline. Try visiting it when connected.
          </p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
            Go Back
          </Button>
        </div>
      </main>
    );
  }

  const ingredients = getIngredients(meal);
  const tags = meal.strTags ? meal.strTags.split(',').map((t) => t.trim()).filter(Boolean) : [];

  return (
    <main id="main-content" className="container py-8 space-y-8 animate-fade-in">
      {/* Back navigation */}
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back
      </Button>

      <article aria-label={`Recipe for ${meal.strMeal}`}>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Meal image */}
          <div className="relative">
            <img
              src={meal.strMealThumb}
              alt={`${meal.strMeal} — finished dish`}
              className="w-full aspect-square object-cover rounded-xl shadow-md"
            />
          </div>

          {/* Meta & ingredients */}
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl md:text-3xl font-bold leading-tight">{meal.strMeal}</h1>
              <Button
                variant="outline"
                size="icon"
                onClick={handleToggleFavorite}
                aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
                aria-pressed={favorited}
                className="shrink-0"
              >
                <Heart
                  className={`h-5 w-5 transition-colors ${favorited ? 'fill-red-500 text-red-500' : ''}`}
                  aria-hidden="true"
                />
              </Button>
            </div>

            {/* Metadata badges */}
            <div className="flex flex-wrap gap-2">
              {meal.strCategory && <Badge>{meal.strCategory}</Badge>}
              {meal.strArea && <Badge variant="secondary">{meal.strArea}</Badge>}
              {tags.map((tag) => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>

            {/* Ingredients */}
            <section aria-label="Ingredients">
              <h2 className="font-semibold text-lg mb-3">Ingredients</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {ingredients.map(({ ingredient, measure }, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2 text-sm py-1 border-b border-border last:border-0"
                  >
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0" aria-hidden="true" />
                    <span className="font-medium">{ingredient}</span>
                    {measure && <span className="text-muted-foreground ml-auto">{measure}</span>}
                  </li>
                ))}
              </ul>
            </section>

            {/* External links */}
            <div className="flex gap-3 flex-wrap">
              {meal.strYoutube && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={meal.strYoutube}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Watch ${meal.strMeal} on YouTube`}
                    className="gap-2"
                  >
                    <Youtube className="h-4 w-4 text-red-500" aria-hidden="true" />
                    Watch on YouTube
                  </a>
                </Button>
              )}
              {meal.strSource && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={meal.strSource}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Original source for ${meal.strMeal}`}
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    Source
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <section aria-label="Instructions" className="mt-8">
          <h2 className="font-semibold text-xl mb-4">Instructions</h2>
          <div className="prose dark:prose-invert max-w-none">
            {meal.strInstructions
              .split(/\r?\n/)
              .filter((line) => line.trim())
              .map((para, idx) => (
                <p key={idx} className="text-sm leading-relaxed text-muted-foreground mb-3">
                  {para}
                </p>
              ))}
          </div>
        </section>
      </article>
    </main>
  );
}
