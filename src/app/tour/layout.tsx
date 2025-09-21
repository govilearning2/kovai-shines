import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';

export default function TourLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <main className="flex-1 overflow-y-auto">{children}</main>
      <MobileBottomNav />
    </div>
  );
}
