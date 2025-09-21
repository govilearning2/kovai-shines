
'use client';

import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const upcomingTrips = [
    {
        id: 'trip-1',
        name: 'Kanyakumari Adventure',
        dates: 'Dec 25, 2024 - Dec 28, 2024',
        imageUrl: 'https://picsum.photos/seed/kanyakumari-trip/400/300',
        imageHint: 'Kanyakumari sunset',
        status: 'Upcoming'
    }
];

const pastTrips = [
    {
        id: 'trip-2',
        name: 'Goa Getaway',
        dates: 'Jan 15, 2024 - Jan 18, 2024',
        imageUrl: 'https://picsum.photos/seed/goa-past-trip/400/300',
        imageHint: 'Goa beach party',
        status: 'Completed'
    }
];

const TripCard = ({ trip, onStart, onViewItinerary }: { trip: typeof upcomingTrips[0], onStart: (id: string) => void, onViewItinerary: (id: string) => void }) => {
  return (
    <Card className="overflow-hidden">
      <div className="relative h-40 w-full">
        <Image
          src={trip.imageUrl}
          alt={trip.name}
          fill
          className="object-cover"
          data-ai-hint={trip.imageHint}
        />
        <div className="absolute top-2 right-2">
            <Badge variant={trip.status === 'Upcoming' ? 'default' : 'secondary'}>{trip.status}</Badge>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-headline font-bold text-lg truncate">{trip.name}</h3>
        <p className="text-sm text-muted-foreground">{trip.dates}</p>
        <div className="mt-4 flex gap-2">
            {trip.status === 'Upcoming' ? (
                <>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => onViewItinerary(trip.id)}>View Itinerary</Button>
                    <Button size="sm" className="w-full" onClick={() => onStart(trip.id)}>Start Trip</Button>
                </>
            ) : (
                <Button variant="outline" size="sm" className="w-full">View Memories</Button>
            )}
        </div>
      </CardContent>
    </Card>
  );
};


export default function MyTripsPage() {
  const router = useRouter();

  const handleStartTrip = (tripId: string) => {
    router.push(`/trip-start?tripId=${tripId}`);
  };

  const handleViewItinerary = (tripId: string) => {
    router.push('/itinerary');
  };

  return (
    <>
      <AppHeader title="My Trips" />
      <div className="container py-8 space-y-8">
        <section>
          <h2 className="text-xl font-bold font-headline mb-4">Upcoming Trips</h2>
          <div className="space-y-4">
            {upcomingTrips.map(trip => <TripCard key={trip.id} trip={trip} onStart={handleStartTrip} onViewItinerary={handleViewItinerary}/>)}
          </div>
        </section>

        <section>
          <h2 className="text-xl font_bold font-headline mb-4">Past Trips</h2>
           <div className="space-y-4">
            {pastTrips.map(trip => <TripCard key={trip.id} trip={trip} onStart={handleStartTrip} onViewItinerary={handleViewItinerary}/>)}
          </div>
        </section>
      </div>
    </>
  );
}
