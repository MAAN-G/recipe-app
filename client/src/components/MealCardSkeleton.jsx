import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

/** Placeholder shown while a meal card is loading. */
export default function MealCardSkeleton() {
  return (
    <Card className="overflow-hidden" aria-hidden="true">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </CardContent>
    </Card>
  );
}
