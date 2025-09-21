
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Mic, Send } from 'lucide-react';

type ChatInterfaceProps = {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
};

export function ChatInterface({ onSendMessage, isLoading }: ChatInterfaceProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSend();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Input
          type="text"
          placeholder="e.g., A trip to Kanyakumari with family..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          className="h-12 pr-12"
        />
        <Button variant="ghost" size="icon" disabled={isLoading} aria-label="Use Microphone" className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10">
          <Mic className="h-5 w-5" />
        </Button>
      </div>
      <Button onClick={handleSend} disabled={isLoading || !message.trim()} size="icon" aria-label="Send Message" className="h-12 w-12 shrink-0">
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Send className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
}
