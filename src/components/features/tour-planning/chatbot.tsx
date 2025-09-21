
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BotIcon } from '@/components/icons/bot-icon';

export function Chatbot() {
  const router = useRouter();

  return (
    <Button
      className="absolute bottom-20 right-4 h-16 w-16 rounded-full bg-primary shadow-lg hover:bg-primary/90 flex items-center justify-center"
      onClick={() => router.push('/plan')}
    >
      <BotIcon className="w-8 h-8 text-primary-foreground" />
      <span className="sr-only">Open Planner</span>
    </Button>
  );
}
