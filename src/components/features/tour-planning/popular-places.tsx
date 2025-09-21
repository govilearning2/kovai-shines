
'use client';
import Image from 'next/image';
import Link from 'next/link';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { popularPlaces } from '@/lib/placeholder-data';

export function PopularPlaces() {
  return (
    <div className="px-4">
      <h2 className="text-lg font-bold mb-4 font-headline">Popular Destinations</h2>
      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {popularPlaces.map((place) => (
            <CarouselItem key={place.id} className="basis-1/2 md:basis-1/3">
              <Link
                href={`/plan?prompt=${encodeURIComponent(
                  `Plan a ${place.days} day trip to ${place.name}`
                )}&mode=form`}
                passHref
              >
                <Card className="overflow-hidden transition-all hover:scale-[1.02] hover:shadow-lg">
                  <CardContent className="p-0">
                    <div className="relative h-48 w-full">
                      <Image
                        src={place.imageUrl}
                        alt={place.name}
                        fill
                        className="object-cover"
                        data-ai-hint={place.imageHint}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                    <div className="absolute bottom-0 p-3 w-full">
                      <h3 className="font-semibold text-white truncate text-sm">
                        {place.name}
                      </h3>
                      <div className="flex justify-between items-center text-white/90 text-xs mt-1">
                        <span>
                          {place.days}D / {place.nights}N
                        </span>
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

    