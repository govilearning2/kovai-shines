
import React from 'react';
import {
  Car,
  CircleDollarSign,
  Hotel,
  MapPin,
  Palmtree,
  Plane,
  Train,
  UtensilsCrossed,
  Building,
  Bed,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type ItineraryItem = {
  type: 'main' | 'day' | 'sub' | 'text' | 'cost';
  title: string;
  time?: string;
  level: number;
};

const getIcon = (title: string, type: string) => {
  const lowerTitle = title.toLowerCase();
  if (type === 'cost') return <CircleDollarSign className="h-5 w-5 text-primary" />;
  if (lowerTitle.includes('train') || lowerTitle.includes('express'))
    return <Train className="h-5 w-5 text-primary" />;
  if (lowerTitle.includes('flight') || lowerTitle.includes('departure') || lowerTitle.includes('arrive'))
    return <Plane className="h-5 w-5 text-primary" />;
  if (lowerTitle.includes('hotel') || lowerTitle.includes('check in') || lowerTitle.includes('check out') || lowerTitle.includes('accommodation') || lowerTitle.includes('resort'))
    return <Hotel className="h-5 w-5 text-primary" />;
  if (lowerTitle.includes('cab') || lowerTitle.includes('car'))
    return <Car className="h-5 w-5 text-primary" />;
  if (lowerTitle.includes('temple') || lowerTitle.includes('church') || lowerTitle.includes('memorial') || lowerTitle.includes('statue') || lowerTitle.includes('dam') || lowerTitle.includes('mahal') || lowerTitle.includes('palace') || lowerTitle.includes('fort'))
    return <Building className="h-5 w-5 text-primary" />;
  if (lowerTitle.includes('eat') || lowerTitle.includes('food') || lowerTitle.includes('restaurant') || lowerTitle.includes('breakfast') || lowerTitle.includes('lunch') || lowerTitle.includes('dinner'))
    return <UtensilsCrossed className="h-5 w-5 text-primary" />;
  if (lowerTitle.includes('visit') || lowerTitle.includes('beach') || lowerTitle.includes('sun set') || lowerTitle.includes('sunrise') || lowerTitle.includes('museum') || lowerTitle.includes('explore') || lowerTitle.includes('relax') || lowerTitle.includes('leisure') || lowerTitle.includes('viewpoint'))
    return <Palmtree className="h-5 w-5 text-primary" />;
  return <MapPin className="h-5 w-5 text-primary" />;
};

const TimelineItem = ({ item }: { item: ItineraryItem }) => {
  const { type, title, time, level } = item;
  const icon = getIcon(title, type);

  const [mainTitle, ...details] = title.split('\n');
  
  const costMatch = title.match(/\(Cost: (.*?)\)/);
  const locationMatch = title.match(/Location: (.*)/);
  const accommodationMatch = title.match(/Suggested Accommodations:\n((?:- .*\n?)*)/);
  const restaurantMatch = title.match(/Suggested Restaurants:\n((?:- .*\n?)*)/);

  const renderSuggestions = (suggestions: string, icon: React.ReactNode) => {
    if (!suggestions) return null;
    return (
      <ul className="mt-2 space-y-1">
        {suggestions.trim().split('\n').map((item, index) => (
          <li key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
              {icon}
              <span>{item.replace('- ', '')}</span>
          </li>
        ))}
      </ul>
    );
  };


  if (type === 'day') {
    return (
      <h3 className="font-headline text-xl mt-6 mb-2 pt-4 border-t">{title}</h3>
    );
  }

  return (
    <div className="relative pl-8 py-4">
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2"></div>
      
      {time && (
         <div className="absolute left-0 top-4 w-12 text-center">
            <div className="text-xs font-semibold bg-muted text-muted-foreground rounded-md px-1 py-0.5">
                {time.replace(/ (AM|PM)$/, '')}
            </div>
            <div className="text-xs text-muted-foreground">
                {time.endsWith('AM') ? 'AM' : 'PM'}
            </div>
        </div>
      )}

      <div className="absolute left-4 top-5 bg-background p-0.5 rounded-full -translate-x-1/2">
        <div className="h-4 w-4 rounded-full border-2 border-primary bg-background" />
      </div>

      <div className="flex items-start gap-4 ml-12">
        <div className="mt-1">{icon}</div>
        <div className="flex-1 pt-1">
            <p className="text-sm font-medium">{mainTitle.replace(/^--\s*(--)?\s*/, '')}</p>
            {details.length > 0 && (
                <div className="text-sm text-muted-foreground mt-1 space-y-1">
                    {details.map((line, index) => {
                        if (line.startsWith('(Cost:') || line.startsWith('Location:') || line.startsWith('Suggested')) return null;
                        return <p key={index} className="whitespace-pre-wrap">{line}</p>
                    })}
                </div>
            )}
            {costMatch && (
                <div className="flex items-center gap-2 text-xs text-green-600 mt-2">
                    <CircleDollarSign className="w-3 h-3" />
                    <span>{costMatch[1]}</span>
                </div>
            )}
            {locationMatch && (
                 <div className="flex items-start gap-2 text-xs text-muted-foreground mt-2">
                    <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>{locationMatch[1]}</span>
                </div>
            )}
            {accommodationMatch && renderSuggestions(accommodationMatch[1], <Bed className="w-3 h-3 shrink-0" />)}
            {restaurantMatch && renderSuggestions(restaurantMatch[1], <UtensilsCrossed className="w-3 h-3 shrink-0" />)}
        </div>
      </div>
    </div>
  );
};

export const Timeline = ({ itinerary }: { itinerary: string }) => {
    const parsedItems = React.useMemo((): ItineraryItem[] => {
      if (!itinerary) return [];
  
      const lines = itinerary.split('\n').filter(line => line.trim());
      
      const dayMatch = lines[0]?.match(/^>\s*Day\s*\d+:\s*(.*)/);
      const dayTitle = dayMatch ? dayMatch[0] : null;

      const items: ItineraryItem[] = [];
      let currentEvent: { title: string[]; time?: string } | null = null;
  
      function pushCurrentEvent() {
        if (currentEvent) {
          items.push({
            type: 'sub',
            level: 2,
            title: currentEvent.title.join('\n').trim(),
            time: currentEvent.time,
          });
          currentEvent = null;
        }
      }
      
      const scheduleLines = dayTitle ? lines.slice(1) : lines;
      const eventRegex = /^--\s*((\d{1,2}:\d{2}\s*(?:AM|PM))\s*--)?\s*(.*)/;
  
      for (const line of scheduleLines) {
        if (eventRegex.test(line)) {
            pushCurrentEvent();
            const eventMatch = line.match(eventRegex);
            if (eventMatch) {
                 currentEvent = { title: [eventMatch[3]], time: eventMatch[2] };
            }
        } else if (currentEvent) {
          currentEvent.title.push(line);
        }
      }
      pushCurrentEvent();

      if (dayTitle) {
          return [ { type: 'day', level: 1, title: dayTitle.replace(/>\s*/, '') }, ...items];
      }
  
      return items;
    }, [itinerary]);
  
    return (
      <Card className="w-full">
        <CardContent className="p-2">
          {parsedItems.length > 0 ? (
             parsedItems.map((item, index) => (
              <TimelineItem key={index} item={item} />
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">No schedule available for this day.</div>
          )}
        </CardContent>
      </Card>
    );
  };
