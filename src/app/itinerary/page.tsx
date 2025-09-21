
'use client';

import { AppHeader } from '@/components/layout/app-header';
import { Timeline } from '@/components/features/tour-planning/timeline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, FilePen, CheckCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect, useMemo, useState } from 'react';

type ItineraryDay = {
    day: number;
    date: string;
    schedule: any[];
    theme?: string;
};

type ItineraryData = {
    days: ItineraryDay[];
    advisories: string[];
    estimatedTotalCost: string;
};

export default function ItineraryPage() {
    const router = useRouter();
    const [itineraryData, setItineraryData] = useState<ItineraryData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedData = localStorage.getItem('generatedItinerary');
        if (storedData) {
            try {
                const parsedData = JSON.parse(storedData);
                setItineraryData(parsedData);
            } catch (error) {
                console.error("Failed to parse itinerary data", error);
            }
        }
        setIsLoading(false);
    }, []);


    if (isLoading) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center p-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading your itinerary...</p>
            </div>
        );
    }
    
    if (!itineraryData || !itineraryData.days || itineraryData.days.length === 0) {
        return (
             <div className="flex h-full flex-col items-center justify-center gap-4 text-center p-4">
                <p className="text-destructive">Could not load itinerary. Please plan your trip again.</p>
                <Button onClick={() => router.push('/plan')}>Start Over</Button>
            </div>
        )
    }

  return (
    <>
      <AppHeader title="Your Hampi Trip" />
      <div className="container py-8">
        <div className="space-y-8">
            {itineraryData.days.length > 0 ? (
                <Tabs defaultValue={`day-${itineraryData.days[0].day}`} className="w-full">
                <TabsList className={`grid w-full grid-cols-${itineraryData.days.length < 5 ? itineraryData.days.length : 4}`}>
                    {itineraryData.days.map(day => (
                        <TabsTrigger key={`trigger-day-${day.day}`} value={`day-${day.day}`} className="capitalize">Day {day.day}</TabsTrigger>
                    ))}
                </TabsList>
                 {itineraryData.days.map(day => (
                    <TabsContent key={`content-day-${day.day}`} value={`day-${day.day}`}>
                        <Timeline schedule={day.schedule} dayInfo={`Day ${day.day}: ${day.theme || day.date}`} />
                    </TabsContent>
                ))}
                </Tabs>
            ) : null
            }

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-headline">Estimated Total Cost</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{itineraryData.estimatedTotalCost || 'Not available'}</p>
                    <p className="text-sm text-muted-foreground">For your group, excluding personal expenses.</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-headline flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                        Advisory for your trip
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                        {itineraryData.advisories && itineraryData.advisories.map((advisory, index) => (
                            <li key={index}>{advisory}</li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            <div className="flex items-center gap-4">
                <Button variant="outline" className="w-full" size="lg" onClick={() => router.push('/plan')}>
                    <FilePen className="w-4 h-4 mr-2" />
                    Revise My Plan
                </Button>
                <Button className="w-full" size="lg" onClick={() => router.push('/hotel-selection')}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Proceed
                </Button>
            </div>
        </div>
      </div>
    </>
  );
}
