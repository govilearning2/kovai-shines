import { useEffect } from 'react';
import { TourAiLogo } from '@/components/icons/logo';

type WelcomeStepProps = {
  onNext: () => void;
};

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onNext();
    }, 2500); // Slightly longer for the animation

    return () => clearTimeout(timer);
  }, [onNext]);

  return (
    <div className="flex flex-col h-full items-center justify-center text-center p-12 overflow-hidden">
      <div className="relative animate-fade-in [animation-duration:1s]">
        <TourAiLogo className="w-24 h-24 animate-pulse [animation-duration:2s]" />
      </div>

      <div className="mt-8 space-y-2 animate-fade-in [animation-delay:500ms] [animation-duration:1s]">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Welcome to TripGPT
        </h1>
        <p className="text-muted-foreground">
          Your personal AI trip planner.
        </p>
      </div>
    </div>
  );
}
