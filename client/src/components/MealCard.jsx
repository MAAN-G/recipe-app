import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { isFavorite, saveFavorite, removeFavorite } from '@/features/favorites/db';

/**
 * Reusable recipe card shown in search results and category grids.
 * Handles its own favorite toggle state backed by IndexedDB.
 *
 * @param {{ meal: object, onFavoriteChange?: () => void }} props
 */
export default function MealCard({ meal, onFavoriteChange }) {
  const [favorited, setFavorited] = useState(false);

  // Check IndexedDB on mount to set initial heart state
  useEffect(() => {
    isFavorite(meal.idMeal).then(setFavorited);
  }, [meal.idMeal]);

  async function handleToggleFavorite(e) {
    // Prevent the card's Link from navigating when clicking the heart button
    e.preventDefault();
    e.stopPropagation();
    try {
      if (favorited) {
        await removeFavorite(meal.idMeal);
        setFavorited(false);
        toast.success(`Removed "${meal.strMeal}" from favorites`);
      } else {
        await saveFavorite(meal);
        setFavorited(true);
        toast.success(`Saved "${meal.strMeal}" to favorites`);
      }
      onFavoriteChange?.();
    } catch (err) {
      console.error(err);
      toast.error('Could not update favorites');
    }
  }

  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-ring animate-fade-in">
      {/* Favorite button — sits above the link in DOM order, absolutely positioned */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggleFavorite}
        aria-label={favorited ? `Remove ${meal.strMeal} from favorites` : `Add ${meal.strMeal} to favorites`}
        aria-pressed={favorited}
        className="absolute top-2 right-2 z-10 bg-background/70 backdrop-blur-sm hover:bg-background/90 transition-colors"
      >
        <Heart
          className={`h-5 w-5 transition-colors ${favorited ? 'fill-red-500 text-red-500' : 'text-foreground'}`}
          aria-hidden="true"
        />
      </Button>

      <Link
        to={`/meal/${meal.idMeal}`}
        className="block focus-visible:outline-none"
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

        <CardContent className="p-4">
          <h3 className="font-semibold text-base leading-snug line-clamp-2 mb-2">
            {meal.strMeal}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {meal.strCategory && (
              <Badge variant="secondary" className="text-xs">{meal.strCategory}</Badge>
            )}
            {meal.strArea && (
              <Badge variant="outline" className="text-xs">{meal.strArea}</Badge>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
