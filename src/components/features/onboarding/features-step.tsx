'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TourAiLogo } from '@/components/icons/logo';

const features = [
  'Personalized AI Trip Planner',
  'AI Tour Guide to Answer Queries',
  'Adverse Event / Realtime Happenings Assist in Trip',
  'Group Collaboration with Conversational Memory',
  'Voice Enabled Interactions',
  'Long term trip plans organize',
];

type FeaturesStepProps = {
  onNext: () => void;
};

export function FeaturesStep({ onNext }: FeaturesStepProps) {
  const [visibleFeatures, setVisibleFeatures] = useState(0);

  useEffect(() => {
    const featureTimers: NodeJS.Timeout[] = [];

    features.forEach((_, index) => {
      const timer = setTimeout(() => {
        setVisibleFeatures(index + 1);
      }, (index + 1) * 700); // Stagger the appearance
      featureTimers.push(timer);
    });

    const nextStepTimer = setTimeout(() => {
      onNext();
    }, (features.length + 2) * 700); // Move to next step after all features are shown + pause

    return () => {
      featureTimers.forEach(clearTimeout);
      clearTimeout(nextStepTimer);
    };
  }, [onNext]);

  return (
    <div className="flex flex-col h-full justify-between p-8">
      <div>
        <div className="text-center mb-10">
          <div className="mx-auto mb-4 w-fit">
            <TourAiLogo className="w-12 h-12" />
          </div>
          <h1 className="text-2xl font-bold font-headline">TripGPT</h1>
        </div>

        <div className="space-y-4">
          <ul className="space-y-4">
            {features.map((feature, index) => (
              <li
                key={index}
                className={cn(
                  'transition-opacity duration-1000 ease-in flex items-center gap-3',
                  index < visibleFeatures ? 'opacity-100' : 'opacity-0'
                )}
              >
                <CheckCircle className="w-6 h-6 text-primary shrink-0" />
                <p className="text-base text-foreground">{feature}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* Skip button removed */}
    </div>
  );
}
