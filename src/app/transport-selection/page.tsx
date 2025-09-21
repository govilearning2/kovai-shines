
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Briefcase, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const cars = [
  {
    id: 'car-1',
    name: 'Maruti Suzuki Swift',
    type: 'Hatchback',
    seats: 5,
    luggage: 2,
    price: 3500,
    imageUrl: 'https://picsum.photos/seed/swift-car/600/400',
    imageHint: 'white hatchback car',
  },
  {
    id: 'car-2',
    name: 'Hyundai Creta',
    type: 'SUV',
    seats: 5,
    luggage: 3,
    price: 5000,
    imageUrl: 'https://picsum.photos/seed/creta-car/600/400',
    imageHint: 'white suv car',
  },
  {
    id: 'car-3',
    name: 'Toyota Innova Crysta',
    type: 'MPV',
    seats: 7,
    luggage: 4,
    price: 7500,
    imageUrl: 'https://picsum.photos/seed/innova-car/600/400',
    imageHint: 'white mpv car',
  },
];

export default function TransportSelectionPage() {
  const router = useRouter();
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);

  const handleFinish = () => {
    if (selectedCarId) {
        const selectedCar = cars.find(car => car.id === selectedCarId);
        if (selectedCar) {
            localStorage.setItem('selectedCar', JSON.stringify(selectedCar));
        }
        router.push('/booking-confirmation');
    }
  };

  return (
    <>
      <AppHeader title="Select Your Transport" />
      <div className="container py-8 flex flex-col h-full">
        <div className="flex-1 overflow-y-auto pb-24">
          <div className="grid grid-cols-1 gap-6">
            {cars.map((car) => (
              <Card
                key={car.id}
                className={cn(
                  'overflow-hidden transition-all duration-300 cursor-pointer',
                  selectedCarId === car.id
                    ? 'border-primary ring-2 ring-primary'
                    : 'border-border'
                )}
                onClick={() => setSelectedCarId(car.id)}
              >
                <CardHeader className="p-0 relative">
                  <div className="relative h-48 w-full">
                    <Image
                      src={car.imageUrl}
                      alt={car.name}
                      fill
                      className="object-cover"
                      data-ai-hint={car.imageHint}
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <CardTitle className="font-headline text-lg mb-1 truncate">{car.name}</CardTitle>
                  <div className="flex items-center gap-4 text-muted-foreground text-sm">
                    <span className="font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">{car.type}</span>
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{car.seats} Seats</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      <span>{car.luggage} Bags</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between items-center">
                    <div>
                        <p className="text-xl font-bold">₹{car.price.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">for the trip</p>
                    </div>
                    <Button variant={selectedCarId === car.id ? 'default' : 'outline'} size="sm">
                      {selectedCarId === car.id ? 'Selected' : 'Select'}
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
            disabled={!selectedCarId}
            onClick={handleFinish}
            >
            <CheckCircle className="w-4 h-4 mr-2" />
            Finish Booking
            </Button>
        </div>
      </div>
    </>
  );
}
