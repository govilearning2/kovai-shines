
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Zap, Clock, MapPin, Cloud, TrafficCone, IndianRupee, ArrowRight } from 'lucide-react';
import { getTripStartInfo } from '@/ai/flows/get-trip-start-info';
import type { GetTripStartInfoOutput } from '@/ai/flows/get-trip-start-info';
import { Button } from '@/components/ui/button';

function TripStartContent() {
    const searchParams = useSearchParams();
    const tripId = searchParams.get('tripId');
    const [startTime, setStartTime] = useState('');
    const [tripInfo, setTripInfo] = useState<GetTripStartInfoOutput | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Hardcoded for now, would be fetched based on tripId
    const tripDetails = {
        startLocation: 'Madurai',
        firstDestination: 'Vivekananda Rock Memorial, Kanyakumari'
    };

    useEffect(() => {
        setStartTime(new Date().toLocaleTimeString());

        const fetchTripInfo = async () => {
            try {
                const info = await getTripStartInfo({
                    startLocation: tripDetails.startLocation,
                    firstDestination: tripDetails.firstDestination
                });
                setTripInfo(info);
            } catch (err) {
                console.error("Failed to get trip start info:", err);
                setError("Sorry, we couldn't fetch live trip details. Please try again in a moment.");
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchTripInfo();
    }, [tripDetails.startLocation, tripDetails.firstDestination]);

    return (
        <div className="flex-1 flex flex-col">
            <AppHeader title="Your Trip Has Started!" />
            <div className="flex-1 overflow-y-auto pb-24">
                <div className="container py-8 space-y-6 text-center">
                    <div className="flex justify-center">
                        <Zap className="w-16 h-16 text-green-500 animate-pulse" />
                    </div>
                    <h1 className="text-2xl font-bold font-headline">Congratulations!</h1>
                    <p className="text-muted-foreground">
                        Your Kanyakumari adventure has officially begun.
                    </p>

                    <Card className="text-left">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-primary" />
                                Trip Started
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-lg font-semibold">{startTime}</p>
                            <p className="text-sm text-muted-foreground">You are on your way to your first destination:</p>
                            <p className="font-medium flex items-center gap-2 mt-2">
                                <MapPin className="w-4 h-4" />
                                {tripDetails.firstDestination}
                            </p>
                        </CardContent>
                    </Card>

                    {isLoading && (
                        <div className="flex flex-col items-center justify-center gap-4 py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-muted-foreground">Fetching live trip details...</p>
                        </div>
                    )}

                    {error && (
                        <Card className="bg-destructive/10 border-destructive text-destructive-foreground">
                            <CardContent className="p-4">
                                <p>{error}</p>
                            </CardContent>
                        </Card>
                    )}

                    {tripInfo && (
                        <div className="space-y-4 text-left">
                             <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg font-headline flex items-center gap-2">
                                        <Cloud className="w-5 h-5 text-blue-400" />
                                        Climate Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{tripInfo.climateSummary}</p>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg font-headline flex items-center gap-2">
                                        <TrafficCone className="w-5 h-5 text-orange-400" />
                                        Traffic Conditions
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{tripInfo.trafficSummary}</p>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg font-headline flex items-center gap-2">
                                        <IndianRupee className="w-5 h-5 text-green-500" />
                                        Estimated Toll Cost
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-lg font-bold">{tripInfo.approximateTollCost}</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
             <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] bg-background/80 backdrop-blur-sm p-4 border-t">
                <Button
                    size="lg"
                    className="w-full"
                    onClick={() => { /* Placeholder for next spot logic */ }}
                >
                    Next Spot
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        </div>
    );
}

export default function TripStartPage() {
    return (
        <Suspense fallback={
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center p-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading Trip Details...</p>
            </div>
        }>
            <TripStartContent />
        </Suspense>
    )
}
