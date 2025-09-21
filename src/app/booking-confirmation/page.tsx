
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Hotel, Car, Utensils, IndianRupee, Calendar, Users, Fuel, Ticket, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Timeline } from '@/components/features/tour-planning/timeline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { TripDetails } from '@/lib/types';


// Define types for selected items
type SelectedHotel = {
    name: string;
    price: number;
    imageUrl: string;
};

type SelectedCar = {
    name: string;
    price: number;
    imageUrl: string;
};

type TripDetailsForSummary = Pick<TripDetails, 'travelDates' | 'adults' | 'kids' | 'destination'>;

const itineraryDay1 = `
> Day 1: Arrival and Local Sightseeing
-- 08:00 AM -- Start your trip from Madurai to Kanyakumari
-- 12:00 PM -- Check in
-- 04:00 PM -- Visit Vivekananda Rock Memorial
-- 06:00 PM -- Watch the sunset at Kanyakumari Beach
-- 07:30 PM -- Visit the Bhagavathy Amman Temple
-- 09:00 PM -- Dinner at a local restaurant
`;

const itineraryDay2 = `
> Day 2: Sunrise and Departure
-- 06:00 AM -- Watch the sunrise at Kanyakumari Beach
-- 08:00 AM -- Visit Thiruvalluvar Statue
-- 09:00 AM -- Visit the Gandhi Memorial Mandapam
-- 10:00 AM -- Enjoy local sea food at The Seashore restaurant (Cost: Rs. 800 for two)
-- 01:00 PM -- Depart from Kanyakumari
`;

export default function BookingConfirmationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedHotel, setSelectedHotel] = useState<SelectedHotel | null>(null);
  const [selectedCar, setSelectedCar] = useState<SelectedCar | null>(null);
  const [tripDetails, setTripDetails] = useState<TripDetailsForSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const hotelData = localStorage.getItem('selectedHotel');
    const carData = localStorage.getItem('selectedCar');
    const tripData = localStorage.getItem('tripDetails');
    
    if (hotelData) {
      setSelectedHotel(JSON.parse(hotelData));
    }
    if (carData) {
      setSelectedCar(JSON.parse(carData));
    }
    if (tripData) {
      setTripDetails(JSON.parse(tripData));
    }
    setIsLoading(false);
  }, []);

  const handleConfirmAndPay = () => {
    toast({
      title: 'Booking Confirmed!',
      description: 'Your trip has been booked successfully. Redirecting to homepage...',
    });
    // Clear storage after booking
    localStorage.removeItem('selectedHotel');
    localStorage.removeItem('selectedCar');
    localStorage.removeItem('tripDetails');
    setTimeout(() => {
      router.push('/tour');
    }, 2000);
  };
  
  if (isLoading) {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-4 text-center p-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your summary...</p>
        </div>
    );
  }

  if (!selectedHotel || !selectedCar || !tripDetails) {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-4 text-center p-4">
            <p className="text-destructive">Could not load trip details. Please start over.</p>
            <Button onClick={() => router.push('/plan')}>Start Over</Button>
        </div>
    )
  }

  const numberOfAdults = tripDetails.adults || 2;
  const otherExpenses = 800 * numberOfAdults / 2; // Original is for two
  const fuelCost = 2000;
  const entranceFees = 500 * numberOfAdults;
  const permitFees = 200 * numberOfAdults;
  const tourPackageCost = 12000;
  const platformFee = 150 * numberOfAdults;
  const totalCost = selectedHotel.price + selectedCar.price + otherExpenses + fuelCost + entranceFees + permitFees + tourPackageCost + platformFee;


  return (
    <>
      <AppHeader title="Booking Confirmation" />
      <div className="container py-8 flex flex-col h-full">
        <div className="flex-1 overflow-y-auto pb-24">
            <div className="space-y-6">
                <Tabs defaultValue="day-1" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="day-1">Day 1</TabsTrigger>
                    <TabsTrigger value="day-2">Day 2</TabsTrigger>
                  </TabsList>
                  <TabsContent value="day-1">
                    <Timeline itinerary={itineraryDay1} />
                  </TabsContent>
                  <TabsContent value="day-2">
                    <Timeline itinerary={itineraryDay2} />
                  </TabsContent>
                </Tabs>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-lg flex items-center gap-2">
                           Trip Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <p className="text-muted-foreground flex items-center gap-2"><Calendar className="w-4 h-4"/> Journey Dates</p>
                            <p className="font-medium">{tripDetails.travelDates}</p>
                        </div>
                         <div className="flex justify-between items-center text-sm">
                            <p className="text-muted-foreground flex items-center gap-2"><Users className="w-4 h-4"/> No. of Persons</p>
                            <p className="font-medium">{tripDetails.adults} Adults, {tripDetails.kids} Kids</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-lg flex items-center gap-2">
                           <Hotel className="w-5 h-5 text-primary" /> Your Stay
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex gap-4 items-center">
                        <Image src={selectedHotel.imageUrl} alt={selectedHotel.name} width={80} height={80} className="rounded-lg object-cover" />
                        <div>
                            <p className="font-semibold">{selectedHotel.name}</p>
                            <p className="text-sm text-muted-foreground">₹{selectedHotel.price.toLocaleString()} for 2 days</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-lg flex items-center gap-2">
                           <Car className="w-5 h-5 text-primary" /> Your Transport
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex gap-4 items-center">
                        <Image src={selectedCar.imageUrl} alt={selectedCar.name} width={80} height={80} className="rounded-lg object-cover" />
                        <div>
                            <p className="font-semibold">{selectedCar.name}</p>
                            <p className="text-sm text-muted-foreground">₹{selectedCar.price.toLocaleString()} for the trip</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-lg">Cost Breakdown (for {numberOfAdults} people)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                            <p className="text-muted-foreground flex items-center gap-2"><Hotel className="w-4 h-4"/> Accommodation</p>
                            <p>₹{selectedHotel.price.toLocaleString()}</p>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-muted-foreground flex items-center gap-2"><Car className="w-4 h-4"/> Transportation</p>
                            <p>₹{selectedCar.price.toLocaleString()}</p>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-muted-foreground flex items-center gap-2"><Fuel className="w-4 h-4"/> Fuel (est.)</p>
                            <p>₹{fuelCost.toLocaleString()}</p>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-muted-foreground flex items-center gap-2"><Ticket className="w-4 h-4"/> Entrance Fees (est.)</p>
                            <p>₹{entranceFees.toLocaleString()}</p>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-muted-foreground flex items-center gap-2"><Ticket className="w-4 h-4"/> Permit Fees (est.)</p>
                            <p>₹{permitFees.toLocaleString()}</p>
                        </div>
                         <div className="flex justify-between items-center">
                            <p className="text-muted-foreground flex items-center gap-2"><Package className="w-4 h-4"/> Tour Package Cost</p>
                            <p>₹{tourPackageCost.toLocaleString()}</p>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-muted-foreground flex items-center gap-2"><Utensils className="w-4 h-4"/> Food & Other (est.)</p>
                            <p>₹{otherExpenses.toLocaleString()}</p>
                        </div>
                         <div className="flex justify-between items-center">
                            <p className="text-muted-foreground flex items-center gap-2"><IndianRupee className="w-4 h-4"/> Platform Fee & Taxes</p>
                            <p>₹{platformFee.toLocaleString()}</p>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center font-bold text-lg">
                            <p>Total Estimated Cost</p>
                            <p>₹{totalCost.toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] bg-background/80 backdrop-blur-sm p-4 border-t">
            <Button
            size="lg"
            className="w-full"
            onClick={handleConfirmAndPay}
            >
            <CheckCircle className="w-4 h-4 mr-2" />
            Confirm & Pay
            </Button>
        </div>
      </div>
    </>
  );
}
