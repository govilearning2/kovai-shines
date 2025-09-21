
'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

type AppHeaderProps = {
  title?: string;
};

export function AppHeader({ title = 'TripGPT' }: AppHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/60 backdrop-blur-sm">
      <div className="container flex h-14 items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          aria-label="Go back"
          className="-ml-4"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <span className="font-bold font-headline truncate max-w-[200px]">
          {title}
        </span>
      </div>
    </header>
  );
}
