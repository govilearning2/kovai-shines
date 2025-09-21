
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ClarificationStep } from './clarification-step';
import { RecommendationsStep } from './recommendations-step';
import { extractTripDetails } from '@/ai/flows/extract-trip-details';
import { recommendRelevantPlaces } from '@/ai/flows/recommend-relevant-places';
import type { Place, TripDetails, UserData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { Loader2, Bot, User } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { ChatInterface } from './chat-interface';
import { mockItineraryResponse } from '@/lib/mock-itinerary';

type PlannerStep = 'chat' | 'clarification' | 'recommendations';

type Message = {
  id: string;
  sender: 'user' | 'bot';
  content: string | React.ReactNode;
};

const defaultTripDetails: TripDetails = {
  tripDescription: '',
  destination: '',
  interests: '',
  budget: 'Mid-range',
  travelDates: '',
  tripType: 'Family',
  adults: 1,
  kids: 0,
  kidAges: '',
  modeOfTravel: '',
};

const initialBotMessage = (
    <div>
        <p>Hello! I'm your AI travel assistant. Let's plan your next adventure!</p>
        <br />
        <p>To get started, please provide the following details:</p>
        <ul className="list-disc pl-5">
            <li>Destination (e.g., 'Kanyakumari')</li>
            <li>Number of people (e.g., '2 adults, 1 kid')</li>
            <li>Travel dates (e.g., 'Dec 25 to Dec 28')</li>
            <li>Mode of travel (e.g., 'Car')</li>
            <li>Trip type (e.g., 'Family vacation')</li>
        </ul>
        <br />
        <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> You can provide all the details in a single message.
        </p>
    </div>
);


export function TourPlanner({ initialPrompt }: { initialPrompt?: string }) {
  const [step, setStep] = useState<PlannerStep>('chat');
  const [tripDetails, setTripDetails] = useState<TripDetails | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');

  const addMessage = useCallback((sender: 'user' | 'bot', content: string | React.ReactNode) => {
    setMessages(prev => [...prev, { id: uuidv4(), sender, content }]);
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (initialPrompt) {
      if (mode === 'form') {
        handleFormModeStart(initialPrompt);
      } else {
        handleSendMessage(initialPrompt);
      }
    } else if (messages.length === 0 && mode !== 'form') {
      setStep('chat');
      addMessage('bot', initialBotMessage);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt, mode]);


  const handleSendMessage = useCallback(async (description: string) => {
    setStep('chat');
    addMessage('user', description);
    setIsLoading(true);

    try {
      const extractedDetails = await extractTripDetails({ tripDescription: description });
      const fullDetails: TripDetails = {
        tripDescription: description,
        ...extractedDetails,
      };
      setTripDetails(fullDetails);
      addMessage('bot', <ClarificationStep tripDetails={fullDetails} onNext={(details) => handleClarificationSubmit(details, fullDetails)} isLoading={isLoading} />);

    } catch (error) {
      console.error('Failed to process trip details:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not process your request. Please fill in the details manually.',
      });
      const tempDetails: TripDetails = {...defaultTripDetails, tripDescription: description};
      setTripDetails(tempDetails);
      addMessage('bot', <ClarificationStep tripDetails={tempDetails} onNext={(details) => handleClarificationSubmit(details, tempDetails)} isLoading={isLoading} />);
    } finally {
      setIsLoading(false);
    }
  }, [toast, addMessage, isLoading]);
  
  const handleFormModeStart = useCallback(async (description: string) => {
    setIsLoading(true);
    
    try {
      const extractedDetails = await extractTripDetails({ tripDescription: description });
      const fullDetails: TripDetails = {
        tripDescription: description,
        ...extractedDetails,
      };
      setTripDetails(fullDetails);
      setStep('clarification');

    } catch (error) {
      console.error('Failed to process trip details in form mode:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not process your request. Please fill in the details manually.',
      });
       const tempDetails: TripDetails = {...defaultTripDetails, tripDescription: description};
      setTripDetails(tempDetails);
      setStep('clarification');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);


 const handleRecommendationsSubmit = useCallback(async (selectedPlaces: Place[]) => {
    setIsLoading(true);
    if(mode !== 'form') {
        addMessage('bot', `Great! Generating an itinerary with ${selectedPlaces.length} places.`);
    }

    if (!tripDetails) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Trip details are missing. Please go back and fill them out.',
        });
        setIsLoading(false);
        return;
    }
    
    try {
        const result = mockItineraryResponse;

        if (result.is_itinery_reponse && result.itinerary.days) {
          const itineraryData = {
            ...result.itinerary,
            advisories: result.itinerary.advisories || ["No advisories available."],
            estimatedTotalCost: result.itinerary.estimatedTotalCost || "Not available."
          };
            
          localStorage.setItem('generatedItinerary', JSON.stringify(itineraryData));

            const tripDataToStore = {
              destination: tripDetails.destination,
              travelDates: tripDetails.travelDates,
              adults: tripDetails.adults,
              kids: tripDetails.kids,
            }
            localStorage.setItem('tripDetails', JSON.stringify(tripDataToStore));

            if(mode !== 'form') {
                addMessage('bot', "Your itinerary is ready! Redirecting you now...");
            }
            router.push('/itinerary');

        } else {
             throw new Error('Failed to generate itinerary from mock data.');
        }

    } catch (error) {
        console.error('Failed to generate itinerary:', error);
        const errorMessage = error instanceof Error ? error.message : 'Could not generate itinerary. Please try again.';
        toast({
            variant: 'destructive',
            title: 'Error',
            description: errorMessage,
        });
        if(mode !== 'form') {
            addMessage('bot', `Sorry, I couldn't generate the itinerary. ${errorMessage}`);
        }
    } finally {
        setIsLoading(false);
    }
}, [tripDetails, router, toast, addMessage, mode]);

const handleClarificationSubmit = useCallback(async (clarifiedDetails: Omit<TripDetails, 'tripDescription'>, originalDetails: TripDetails) => {
    setIsLoading(true);
    setPlaces([]);

    if (mode !== 'form') {
        setMessages(prev => {
            const newMessages = [...prev.slice(0, -1)];
            newMessages.push({
                id: uuidv4(),
                sender: 'bot',
                content: "Thanks for confirming! Searching for the best places for your trip..."
            });
            return newMessages;
        });
    }

    try {
        const storedUserData = localStorage.getItem('userData');
        if (!storedUserData) {
            throw new Error("User data not found in local storage.");
        }
        const userData: UserData = JSON.parse(storedUserData);
        if (!userData.user_phone_no) {
             throw new Error("User phone number not found.");
        }

        // 1. Create Session
        const sessionResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/create-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userData.user_phone_no,
                reasoning_engine_app_name: "7085873053946609664",
                google_project_id: "kovai-shines-472309",
                google_project_location: "us-central1"
            }),
        });

        const sessionData = await sessionResponse.json();

        if (sessionData.status !== 'true' || !sessionData.session_id) {
            throw new Error(sessionData.message || 'Failed to create a session.');
        }

        const newSessionId = sessionData.session_id;
        const updatedUserData = { ...userData, session_id: newSessionId };
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
        
        // 2. Query for Places
        const queryParts = [
            `Trip Destination: ${clarifiedDetails.destination}`,
            `Travel Dates: ${clarifiedDetails.travelDates}`,
            `Budget: ${clarifiedDetails.budget}`,
            `Trip Type: ${clarifiedDetails.tripType}`,
            `Interests: ${clarifiedDetails.interests}`,
            `Number of Travelers: ${clarifiedDetails.adults} Adults, ${clarifiedDetails.kids} Children`,
            `Mode of Travel: ${clarifiedDetails.modeOfTravel}`,
            `Please suggest places to visit based on these confirmed details. Proceed directly to place_analyst agent and suggestions without asking for confirmation or any message proceed with displaying the placess list array as response`
        ];
        const query = queryParts.join('; ');

        const placesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/query-agent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: updatedUserData.user_phone_no,
                session_id: newSessionId,
                query: query,
                reasoning_engine_app_url: "projects/1081352890794/locations/us-central1/reasoningEngines/7085873053946609664",
                type_of_api_call: "places"
            }),
        });

        const placesData = await placesResponse.json();

        if (placesData.status !== 'true' || !placesData.places_array || placesData.places_array.length === 0) {
            throw new Error(placesData.message || 'No places found for your criteria.');
        }

        const placesWithIds: Place[] = placesData.places_array.map((place: any) => ({
            id: uuidv4(),
            name: place.place_name || 'Unnamed Place',
            description: place.description || 'No description available.',
            type: place.address || 'Attraction',
            imageUrl: place.place_image_url || `https://picsum.photos/seed/${uuidv4()}/600/400`,
            googleStars: place.rating || 4.0,
            imageHint: place.address || 'place',
        }));
        
        setPlaces(placesWithIds);
        const fullDetails = { ...originalDetails, ...clarifiedDetails };
        setTripDetails(fullDetails);
        setStep('recommendations');

    } catch (error) {
        console.error('Failed during trip planning:', error);
        
        // Fallback to Genkit
        toast({
          title: 'Using Fallback',
          description: 'Could not connect to the planning service. Using an alternative to find places.',
        });

        try {
            const recommendedPlacesResult = await recommendRelevantPlaces(clarifiedDetails);
            
            if (!recommendedPlacesResult || recommendedPlacesResult.length === 0) {
                 throw new Error('Fallback also failed: No places were found for your criteria.');
            }

            const placesWithIds: Place[] = recommendedPlacesResult.map((place: any) => ({
                id: uuidv4(), ...place
            }));
            
            setPlaces(placesWithIds);
            const fullDetails = { ...originalDetails, ...clarifiedDetails };
            setTripDetails(fullDetails);
            setStep('recommendations');
        } catch (fallbackError) {
            console.error('Fallback failed:', fallbackError);
            const errorMessage = fallbackError instanceof Error ? fallbackError.message : 'An unexpected error occurred.';
            toast({ variant: 'destructive', title: 'Error', description: errorMessage });
            if (mode !== 'form') {
                addMessage('bot', `Sorry, I couldn't find any places for your trip. Please try again later.`);
            }
        }
    } finally {
        setIsLoading(false);
    }
}, [toast, addMessage, mode]);


  const renderStep = () => {
    if (mode === 'form') {
        if (!tripDetails) {
            return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        }
        if (step === 'clarification') {
            return (
                <div className="container py-8">
                    <ClarificationStep tripDetails={tripDetails} onNext={(details) => handleClarificationSubmit(details, tripDetails)} isLoading={isLoading} />
                </div>
            )
        }
        if (step === 'recommendations') {
            return (
                <RecommendationsStep
                    places={places}
                    destination={tripDetails?.destination || ''}
                    onNext={handleRecommendationsSubmit}
                    isLoading={isLoading}
                    onBack={() => setStep('clarification')}
                />
            );
        }
    }


    switch (step) {
      case 'chat':
         return (
          <div className="flex flex-col h-full">
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                  {msg.sender === 'bot' && <div className="p-1.5 rounded-full bg-primary/10"><Bot className="w-5 h-5 text-primary shrink-0" /></div>}
                  <div className={`rounded-lg p-3 max-w-[85%] whitespace-pre-wrap text-sm ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                     {typeof msg.content === 'string' ? <div>{msg.content}</div> : msg.content}
                  </div>
                  {msg.sender === 'user' && <div className="p-1.5 rounded-full bg-muted"><User className="w-5 h-5 text-muted-foreground shrink-0" /></div>}
                </div>
              ))}
              {isLoading && messages.at(-1)?.sender === 'user' && (
                 <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-full bg-primary/10"><Bot className="w-5 h-5 text-primary shrink-0" /></div>
                    <div className="rounded-lg p-3 bg-muted">
                        <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                 </div>
              )}
            </div>
            <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] bg-background/80 backdrop-blur-sm p-4 border-t">
              <ChatInterface onSendMessage={handleSendMessage} isLoading={isLoading} />
            </div>
          </div>
        );

      case 'recommendations':
        if (!tripDetails) return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
        return (
          <RecommendationsStep
            places={places}
            destination={tripDetails.destination}
            onNext={handleRecommendationsSubmit}
            isLoading={isLoading}
            onBack={() => setStep('chat')}
          />
        );
      default:
         return (
             <div className="flex flex-col h-full">
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                  {msg.sender === 'bot' && <div className="p-1.5 rounded-full bg-primary/10"><Bot className="w-5 h-5 text-primary shrink-0" /></div>}
                  <div className={`rounded-lg p-3 max-w-[85%] whitespace-pre-wrap text-sm ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                     {typeof msg.content === 'string' ? <div>{msg.content}</div> : msg.content}
                  </div>
                  {msg.sender === 'user' && <div className="p-1.5 rounded-full bg-muted"><User className="w-5 h-5 text-muted-foreground shrink-0" /></div>}
                </div>
              ))}
            </div>
            <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] bg-background/80 backdrop-blur-sm p-4 border-t">
              <ChatInterface onSendMessage={handleSendMessage} isLoading={isLoading} />
            </div>
          </div>
         )
    }
  };
  
  const getHeaderTitle = () => {
    if (step === 'recommendations' && tripDetails?.destination) {
      return `Places in ${tripDetails.destination}`;
    }
    if(mode === 'form' || step === 'clarification'){
        return 'Confirm Your Trip';
    }
    return 'Plan Your Trip';
  };

  return (
    <div className="flex flex-col h-full">
      <AppHeader title={getHeaderTitle()} />
      <div className="flex-1 overflow-y-auto">{renderStep()}</div>
    </div>
  );
}
