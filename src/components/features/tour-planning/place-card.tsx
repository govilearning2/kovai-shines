
'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import type { Place } from '@/lib/types';
import { cn } from '@/lib/utils';

type PlaceCardProps = {
  place: Place;
  isSelected: boolean;
  onToggleSelect: (placeId: string) => void;
};

export function PlaceCard({ place, isSelected, onToggleSelect }: PlaceCardProps) {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <CardHeader className="p-0 relative">
        <div className="relative h-48 w-full">
          <Image
            src={place.imageUrl}
            alt={place.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            data-ai-hint={place.imageHint}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/50 text-white px-2 py-1 rounded-md">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-bold">{place.googleStars}</span>
        </div>
         <div className="absolute bottom-2 right-2">
            <Button
              variant={isSelected ? 'default' : 'secondary'}
              size="sm"
              onClick={() => onToggleSelect(place.id)}
            >
              {isSelected ? 'Selected' : 'Interested'}
            </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="font-headline text-lg mb-1 truncate">{place.name}</CardTitle>
        <p className="text-xs text-muted-foreground mb-2 truncate">{place.type}</p>
        <p className="text-sm text-muted-foreground line-clamp-2 h-[2.5rem]">
          {place.description}
        </p>
      </CardContent>
    </Card>
  );
}
