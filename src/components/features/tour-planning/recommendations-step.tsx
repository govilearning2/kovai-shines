
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import type { Place } from '@/lib/types';
import { PlaceCard } from './place-card';
import { Loader2, Frown, ArrowLeft, CheckCircle } from 'lucide-react';

type RecommendationsStepProps = {
  places: Place[];
  destination: string;
  onNext: (selectedPlaces: Place[]) => void;
  isLoading: boolean;
  onBack: () => void;
};

export function RecommendationsStep({
  places,
  destination,
  onNext,
  isLoading,
  onBack,
}: RecommendationsStepProps) {
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<Set<string>>(new Set());

  const allSelected = useMemo(
    () => places.length > 0 && selectedPlaceIds.size === places.length,
    [selectedPlaceIds, places.length]
  );

  const handleToggleSelect = (placeId: string) => {
    setSelectedPlaceIds((prev) => {
      const newSelectedIds = new Set(prev);
      if (newSelectedIds.has(placeId)) {
        newSelectedIds.delete(placeId);
      } else {
        newSelectedIds.add(placeId);
      }
      return newSelectedIds;
    });
  };

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedPlaceIds(new Set());
    } else {
      setSelectedPlaceIds(new Set(places.map((p) => p.id)));
    }
  };

  const handleGenerateItinerary = () => {
    const selectedPlaces = places.filter((p) => selectedPlaceIds.has(p.id));
    onNext(selectedPlaces);
  };
  
  if (places.length === 0 && !isLoading) {
    return (
        <div className="container flex flex-col items-center justify-center text-center py-16 h-full">
            <Frown className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold font-headline mb-2">No Places Found</h2>
            <p className="text-muted-foreground mb-6">
                Sorry, we couldn't find any recommendations for your trip. Please try adjusting your criteria.
            </p>
            <Button onClick={onBack}>Go Back & Edit</Button>
        </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
        <div className="container py-8 flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
                <h2 className="text-lg font-bold font-headline">Top Recommendations</h2>
                <p className="text-sm text-muted-foreground">Select places you'd like to visit.</p>
            </div>
            <Button variant="outline" onClick={handleSelectAll}>
              {allSelected ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto pb-24">
            {isLoading && places.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center p-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">Finding the best spots...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {places.map((place) => (
                        <PlaceCard
                        key={place.id}
                        place={place}
                        isSelected={selectedPlaceIds.has(place.id)}
                        onToggleSelect={handleToggleSelect}
                        />
                    ))}
                </div>
            )}
          </div>
        </div>
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] bg-background/80 backdrop-blur-sm p-4 border-t">
            <div className="grid grid-cols-3 gap-2 items-center">
              <Button variant="outline" size="lg" onClick={onBack} disabled={isLoading}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                size="lg"
                className="w-full col-span-2"
                disabled={isLoading || selectedPlaceIds.size === 0}
                onClick={handleGenerateItinerary}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {`Generate Itinerary (${selectedPlaceIds.size})`}
                  </>
                )}
              </Button>
            </div>
            {selectedPlaceIds.size === 0 && !isLoading && (
              <p className="text-xs text-muted-foreground mt-2 text-center col-span-3">
                Select at least one place to continue.
              </p>
            )}
        </div>
    </div>
  );
}
