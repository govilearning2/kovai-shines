
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Users, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/tour', label: 'Home', icon: Home },
  { href: '/tour/my-trips', label: 'My Trips', icon: Briefcase },
  { href: '/tour/group-tours', label: 'Group Tours', icon: Users },
  { href: '/tour/explore', label: 'Explore', icon: Compass },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-10 w-full border-t bg-background">
      <div className="flex justify-around h-16">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 w-full text-sm font-medium transition-colors',
              pathname === item.href
                ? 'text-primary'
                : 'text-muted-foreground hover:text-primary'
            )}
          >
            <item.icon className="h-6 w-6" />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
