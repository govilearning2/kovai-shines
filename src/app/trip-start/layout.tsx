
export default function TripStartLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full">
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
