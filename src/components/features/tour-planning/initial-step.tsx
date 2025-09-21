
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

type InitialStepProps = {
  onNext: (description: string) => void;
  isLoading: boolean;
  initialPrompt?: string;
};

export function InitialStep({ onNext, isLoading, initialPrompt }: InitialStepProps) {
  const [description, setDescription] = useState(initialPrompt || '');

  return (
    <div className="container py-8 h-full flex flex-col">
        <div className="text-center mb-8">
          <h1 className="font-headline text-2xl font-bold">Let's Plan Your Next Adventure!</h1>
          <p className="text-muted-foreground mt-2">
            Tell us about your dream trip. The more details you provide, the better we can tailor your itinerary.
          </p>
        </div>
        
        <div className="flex-1 flex flex-col">
            <Textarea
                placeholder="e.g., A relaxing weekend getaway to the mountains with my partner, focused on hiking and good food."
                className="flex-1 text-base"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            />
        </div>

        <div className="mt-8">
          <Button
            className="w-full"
            size="lg"
            onClick={() => onNext(description)}
            disabled={isLoading || !description}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Start Planning
          </Button>
        </div>
    </div>
  );
}
