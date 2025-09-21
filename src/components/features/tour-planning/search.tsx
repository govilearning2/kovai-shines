
'use client';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mic, SearchIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

type SearchProps = {
  onSearchClick: () => void;
}

export function Search({ onSearchClick }: SearchProps) {
  const router = useRouter();
  
  return (
    <div className="relative">
      <div 
        className="flex items-center w-full h-12 rounded-md border border-input bg-background pl-10 pr-24 cursor-pointer"
        onClick={onSearchClick}
      >
        <SearchIcon className="h-5 w-5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <span className="text-muted-foreground text-sm">Search Destination or Packages</span>
      </div>
      <div className="absolute inset-y-0 right-0 flex items-center pr-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onSearchClick();
          }}
          aria-label="Voice Search"
          className="hover:bg-transparent"
        >
          <Mic className="h-5 w-5 text-muted-foreground" />
        </Button>
        <Button
          className="ml-2"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onSearchClick();
          }}
          aria-label="Search"
        >
          <SearchIcon className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
