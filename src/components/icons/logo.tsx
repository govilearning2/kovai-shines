import { Compass } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TourAiLogo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center bg-primary text-primary-foreground w-16 h-16 rounded-full shadow-lg', className)}>
      <Compass className="w-8 h-8" />
    </div>
  );
}
