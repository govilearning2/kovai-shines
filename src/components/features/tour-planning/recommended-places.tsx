
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { recommendedPlaces } from '@/lib/placeholder-data';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

export function RecommendedPlaces() {
  return (
    <div className="px-4">
      <h2 className="text-lg font-bold mb-4 font-headline">Recommended for You</h2>
      <Carousel
        opts={{
          align: 'start',
        }}
        className="w-full"
      >
        <CarouselContent>
          {recommendedPlaces.map((place) => (
            <CarouselItem key={place.id} className="basis-4/5">
              <Link
                href={`/plan?prompt=${encodeURIComponent(
                  `Plan a ${place.days} day trip to ${place.name}`
                )}&mode=form`}
                passHref
              >
                <Card className="overflow-hidden w-full transition-all hover:scale-[1.02] hover:shadow-lg">
                  <CardContent className="p-0">
                    <div className="relative h-56 w-full">
                      <Image
                        src={place.imageUrl}
                        alt={place.name}
                        fill
                        className="object-cover"
                        data-ai-hint={place.imageHint}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                    <div className="absolute bottom-0 p-4 w-full">
                      <h3 className="text-lg font-semibold text-white truncate">
                        {place.name}
                      </h3>
                      <div className="flex justify-between items-center text-white/90 text-sm mt-1">
                        <span>{place.days}D / {place.nights}N</span>
                        <span>₹{place.price}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="ml-12" />
        <CarouselNext className="mr-12" />
      </Carousel>
    </div>
  );
}

    