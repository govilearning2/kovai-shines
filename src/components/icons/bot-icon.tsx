import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BotIcon({ className }: { className?: string }) {
  return <Bot className={cn('w-6 h-6', className)} />;
}
