
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Mountain,
  Waves,
  Castle,
  Utensils,
  Bike,
  Sun,
  Palette,
  Landmark,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TourAiLogo } from '@/components/icons/logo';
import { useToast } from '@/hooks/use-toast';

const interests = [
  { id: 'hiking', label: 'Hiking', icon: Mountain },
  { id: 'beach', label: 'Beach', icon: Waves },
  { id: 'history', label: 'History', icon: Castle },
  { id: 'food', label: 'Food', icon: Utensils },
  { id: 'cycling', label: 'Cycling', icon: Bike },
  { id: 'relaxation', label: 'Relaxing', icon: Sun },
  { id: 'art', label: 'Art', icon: Palette },
  { id: 'cities', label: 'Cities', icon: Landmark },
];

type InterestSelectorProps = {
  onNext: () => void;
};

export function InterestSelector({ onNext }: InterestSelectorProps) {
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const toggleInterest = (interestId: string) => {
    setSelectedInterests((prev) => {
      const newInterests = new Set(prev);
      if (newInterests.has(interestId)) {
        newInterests.delete(interestId);
      } else {
        newInterests.add(interestId);
      }
      return newInterests;
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

      const interestsString = Array.from(selectedInterests).join(',');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/update-interests`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: String(userId),
            user_interest: interestsString,
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
        throw new Error(data.message || 'Failed to update interests.');
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
        <h1 className="text-2xl font-bold font-headline">What are your interests?</h1>
        <p className="text-muted-foreground">
          Select at least 3 to personalize your experience.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1">
        {interests.map((interest) => (
          <button
            key={interest.id}
            onClick={() => toggleInterest(interest.label)}
            className={cn(
              'flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 transition-colors',
              selectedInterests.has(interest.label)
                ? 'border-primary bg-primary/10'
                : 'border-border bg-card'
            )}
            disabled={isLoading}
          >
            <interest.icon
              className={cn(
                'w-8 h-8',
                selectedInterests.has(interest.label)
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            />
            <span className="font-medium">
              {interest.label}
            </span>
          </button>
        ))}
      </div>
      <div className="mt-8 space-y-2">
        <Button
          className="w-full"
          size="lg"
          onClick={handleContinue}
          disabled={selectedInterests.size < 3 || isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Continue
        </Button>
        <Button variant="link" className="w-full" onClick={onNext} disabled={isLoading}>
          Skip
        </Button>
      </div>
    </div>
  );
}
