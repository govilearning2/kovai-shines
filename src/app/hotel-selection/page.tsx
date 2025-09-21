
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const hotels = [
  {
    id: 'hotel-1',
    name: 'The Seashore Hotel',
    rating: 4.5,
    price: 5500,
    imageUrl: 'https://picsum.photos/seed/seashore-hotel/600/400',
    imageHint: 'modern hotel exterior',
  },
  {
    id: 'hotel-2',
    name: 'Hotel Singaar International',
    rating: 4.2,
    price: 4800,
    imageUrl: 'https://picsum.photos/seed/singaar-hotel/600/400',
    imageHint: 'luxury hotel lobby',
  },
  {
    id: 'hotel-3',
    name: 'Sparsa Resort',
    rating: 4.8,
    price: 7200,
    imageUrl: 'https://picsum.photos/seed/sparsa-resort/600/400',
    imageHint: 'resort swimming pool',
  },
  {
    id: 'hotel-4',
    name: 'Gopinivas Grand Hotel',
    rating: 4.0,
    price: 3500,
    imageUrl: 'https://picsum.photos/seed/gopinivas-hotel/600/400',
    imageHint: 'hotel room interior',
  },
];

export default function HotelSelectionPage() {
  const router = useRouter();
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);

  const handleProceed = () => {
    if (selectedHotelId) {
      const selectedHotel = hotels.find(hotel => hotel.id === selectedHotelId);
      if (selectedHotel) {
        localStorage.setItem('selectedHotel', JSON.stringify(selectedHotel));
      }
      router.push('/transport-selection');
    }
  };

  return (
    <>
      <AppHeader title="Select Your Hotel" />
      <div className="container py-8 flex flex-col h-full">
        <div className="flex-1 overflow-y-auto pb-24">
          <div className="grid grid-cols-1 gap-6">
            {hotels.map((hotel) => (
              <Card
                key={hotel.id}
                className={cn(
                  'overflow-hidden transition-all duration-300 cursor-pointer',
                  selectedHotelId === hotel.id
                    ? 'border-primary ring-2 ring-primary'
                    : 'border-border'
                )}
                onClick={() => setSelectedHotelId(hotel.id)}
              >
                <CardHeader className="p-0 relative">
                  <div className="relative h-48 w-full">
                    <Image
                      src={hotel.imageUrl}
                      alt={hotel.name}
                      fill
                      className="object-cover"
                      data-ai-hint={hotel.imageHint}
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <CardTitle className="font-headline text-lg mb-1 truncate">{hotel.name}</CardTitle>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span>{hotel.rating}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between items-center">
                    <div>
                        <p className="text-xl font-bold">₹{hotel.price.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">for 2 days</p>
                    </div>
                    <Button variant={selectedHotelId === hotel.id ? 'default' : 'outline'} size="sm">
                      {selectedHotelId === hotel.id ? 'Selected' : 'Select'}
                    </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] bg-background/80 backdrop-blur-sm p-4 border-t">
            <Button
            size="lg"
            className="w-full"
            disabled={!selectedHotelId}
            onClick={handleProceed}
            >
            <CheckCircle className="w-4 h-4 mr-2" />
            Continue
            </Button>
        </div>
      </div>
    </>
  );
}
