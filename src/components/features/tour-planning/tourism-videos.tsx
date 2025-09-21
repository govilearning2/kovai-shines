'use client';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { tourismVideos } from '@/lib/placeholder-data';
import Image from 'next/image';
import Link from 'next/link';
import { PlayCircle } from 'lucide-react';

export function TourismVideos() {
  return (
    <div className="px-4">
      <h2 className="text-lg font-bold mb-4 font-headline">Tourism Spotlight</h2>
      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {tourismVideos.map((video) => (
            <CarouselItem key={video.id} className="basis-4/5">
                <Card className="overflow-hidden">
                    <CardHeader>
                    <CardTitle className="text-base truncate">{video.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Link href={`https://www.youtube.com/watch?v=${video.embedId}`} target="_blank" rel="noopener noreferrer" className="block relative group">
                            <div className="aspect-video relative">
                                <Image
                                    src={`https://img.youtube.com/vi/${video.embedId}/hqdefault.jpg`}
                                    alt={video.title}
                                    fill
                                    className="object-cover rounded-md transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                    <PlayCircle className="w-12 h-12 text-white/80 group-hover:text-white transition-colors" />
                                </div>
                            </div>
                        </Link>
                    </CardContent>
                </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="ml-12" />
        <CarouselNext className="mr-12" />
      </Carousel>
    </div>
  );
}
