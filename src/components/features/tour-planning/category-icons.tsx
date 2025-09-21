'use client';

import {
  Waves,
  Mountain,
  Snowflake,
  Church,
  Castle,
  Building,
  Users,
  GlassWater,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const categories = [
  { label: 'Beach', icon: Waves },
  { label: 'Mountains', icon: Mountain },
  { label: 'Snow Fall', icon: Snowflake },
  { label: 'Pilgrimage', icon: Church },
  { label: 'Fort', icon: Castle },
  { label: 'Monuments', icon: Building },
  { label: 'Couples', icon: Users },
  { label: 'Party', icon: GlassWater },
];

export function CategoryIcons() {
  return (
    <div className="px-4">
      <h2 className="text-lg font-bold mb-4 font-headline">Explore by Category</h2>
      <div className="grid grid-cols-4 gap-4">
        {categories.map((category) => (
          <button
            key={category.label}
            className={cn(
              'flex flex-col items-center justify-center gap-2 rounded-lg border p-3 transition-colors bg-card hover:bg-primary/10'
            )}
          >
            <category.icon className="w-7 h-7 text-primary" />
            <span className="text-xs font-medium text-center">
              {category.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
