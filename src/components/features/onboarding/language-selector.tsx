'use client';
import { useState } from 'react';
import { TourAiLogo } from '@/components/icons/logo';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const languages = [
  { id: 'hi', name: 'हिन्दी' },
  { id: 'en', name: 'English' },
  { id: 'ta', name: 'தமிழ்' },
  { id: 'te', name: 'తెలుగు' },
  { id: 'mr', name: 'मराठी' },
  { id: 'bn', name: 'বাংলা' },
  { id: 'gu', name: 'ગુજરાતી' },
  { id: 'kn', name: 'ಕನ್ನಡ' },
];

type LanguageSelectorProps = {
  onNext: () => void;
};

export function LanguageSelector({ onNext }: LanguageSelectorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  const handleSelect = (langId: string) => {
      setSelectedLanguage(langId);
      // Here you would save the user's language preference
      console.log('Selected language:', langId);
      // Short delay to show selection, then move to next
      setTimeout(() => {
        onNext();
      }, 300);
  }

  return (
    <div className="flex flex-col h-full p-6">
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 w-fit">
          <TourAiLogo className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-bold font-headline">Which language do you prefer?</h1>
        <p className="text-muted-foreground">
          Select your preferred language.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1">
        {languages.map((lang) => (
          <button
            key={lang.id}
            onClick={() => handleSelect(lang.id)}
            className={cn(
              'flex items-center justify-center rounded-lg border-2 p-4 transition-colors',
              selectedLanguage === lang.id
                ? 'border-primary bg-primary/10'
                : 'border-border bg-card'
            )}
            disabled={!!selectedLanguage}
          >
            <span className="font-medium text-center">{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
