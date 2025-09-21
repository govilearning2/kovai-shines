
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TourAiLogo } from '@/components/icons/logo';
import { useToast } from '@/hooks/use-toast';

const indianSpots = [
  { id: 'taj-mahal', name: 'Taj Mahal, Agra', image: 'taj-mahal', imageHint: 'Taj Mahal' },
  { id: 'jaipur', name: 'Jaipur, Rajasthan', image: 'jaipur-palace', imageHint: 'Hawa Mahal' },
  { id: 'kerala-backwaters', name: 'Kerala Backwaters', image: 'kerala-backwaters', imageHint: 'kerala backwaters' },
  { id: 'goa-beaches', name: 'Beaches of Goa', image: 'goa-beach', imageHint: 'Goa beach' },
  { id: 'varanasi', name: 'Varanasi, Uttar Pradesh', image: 'varanasi-ghat', imageHint: 'Varanasi ghat' },
  { id: 'ladakh', name: 'Leh-Ladakh', image: 'ladakh-monastery', imageHint: 'Ladakh monastery' },
];

const internationalSpots = [
  { id: 'paris', name: 'Paris, France', image: 'eiffel-tower', imageHint: 'Eiffel Tower' },
  { id: 'rome', name: 'Rome, Italy', image: 'colosseum-rome', imageHint: 'Colosseum' },
  { id: 'kyoto', name: 'Kyoto, Japan', image: 'kyoto-shrine', imageHint: 'Kyoto shrine' },
  { id: 'new-york', name: 'New York, USA', image: 'new-york-city', imageHint: 'New York city' },
  { id: 'cairo', name: 'Cairo, Egypt', image: 'egypt-pyramids', imageHint: 'Egypt pyramids' },
  { id: 'bali', name: 'Bali, Indonesia', image: 'bali-temple', imageHint: 'Bali temple' },
];

type LocationCardProps = {
  spot: { id: string; name: string; image: string; imageHint: string };
  isSelected: boolean;
  onToggle: (id: string, name: string) => void;
  disabled?: boolean;
};

function LocationCard({ spot, isSelected, onToggle, disabled }: LocationCardProps) {
  return (
    <Card
      className={cn("overflow-hidden relative", !disabled && "cursor-pointer")}
      onClick={() => !disabled && onToggle(spot.id, spot.name)}
    >
      <div className="relative h-40 w-full">
        <Image
          src={`https://picsum.photos/seed/${spot.image}/400/300`}
          alt={spot.name}
          fill
          className="object-cover"
          data-ai-hint={spot.imageHint}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent" />
        <CardContent className="p-3 absolute top-0 w-full">
            <h3 className="font-semibold text-white truncate">{spot.name}</h3>
        </CardContent>
        <div className="absolute bottom-2 right-2">
            <Button
              variant={isSelected ? 'default' : 'secondary'}
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (!disabled) onToggle(spot.id, spot.name)
              }}
              disabled={disabled}
            >
              {isSelected ? 'Selected' : 'Interested'}
            </Button>
        </div>
      </div>
    </Card>
  );
}

type LocationSelectorProps = {
    onNext: () => void;
};

export function LocationSelector({ onNext }: LocationSelectorProps) {
  const [favorites, setFavorites] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const toggleFavorite = (spotId: string, spotName: string) => {
    setFavorites((prev) => {
      const newFavorites = new Map(prev);
      if (newFavorites.has(spotId)) {
        newFavorites.delete(spotId);
      } else {
        newFavorites.set(spotId, spotName);
      }
      return newFavorites;
    });
  };
  
  const handleContinue = async () => {
    setIsLoading(true);
    try {
      const storedUserData = localStorage.getItem('userData');
      if (!storedUserData) {
        throw new Error('User data not found. Please log in again.');
      }
      const userData = JSON.parse(storedUserData);
      const userId = userData.user_id;

      if (!userId) {
        throw new Error('User ID not found. Please log in again.');
      }

      const favoritesString = Array.from(favorites.values()).join(',');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/update-favorites`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: String(userId),
            user_favorites: favoritesString,
          }),
        }
      );

      const data = await response.json();

      if (data.status === 'true') {
        const {
          user_favorites,
          user_id,
          user_interests,
          user_name,
          user_phone_no,
        } = data;
        const updatedUserData = {
          user_favorites,
          user_id,
          user_interests,
          user_name,
          user_phone_no,
        };
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
        onNext();
      } else {
        throw new Error(data.message || 'Failed to update favorites.');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred.';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-6">
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 w-fit">
            <TourAiLogo className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-bold font-headline">Where do you want to go?</h1>
        <p className="text-muted-foreground">
          Select your favorite spots to help us customize your trips.
        </p>
      </div>

      <Tabs defaultValue="indian" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="indian">India</TabsTrigger>
          <TabsTrigger value="international">International</TabsTrigger>
        </TabsList>
        <TabsContent value="indian" className="flex-1 overflow-y-auto mt-4">
          <div className="grid grid-cols-1 gap-4">
            {indianSpots.map((spot) => (
              <LocationCard
                key={spot.id}
                spot={spot}
                isSelected={favorites.has(spot.id)}
                onToggle={toggleFavorite}
                disabled={isLoading}
              />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="international" className="flex-1 overflow-y-auto mt-4">
          <div className="grid grid-cols-1 gap-4">
            {internationalSpots.map((spot) => (
              <LocationCard
                key={spot.id}
                spot={spot}
                isSelected={favorites.has(spot.id)}
                onToggle={toggleFavorite}
                disabled={isLoading}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
      <div className="mt-8 space-y-2">
        <Button
          className="w-full"
          size="lg"
          onClick={handleContinue}
          disabled={isLoading || favorites.size === 0}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Finish
        </Button>
        <Button variant="link" className="w-full" onClick={onNext} disabled={isLoading}>
          Skip
        </Button>
      </div>
    </div>
  );
}
