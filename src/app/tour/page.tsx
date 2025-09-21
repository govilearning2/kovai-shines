
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CategoryIcons } from '@/components/features/tour-planning/category-icons';
import { PopularPlaces } from '@/components/features/tour-planning/popular-places';
import { RecommendedPlaces } from '@/components/features/tour-planning/recommended-places';
import { Search } from '@/components/features/tour-planning/search';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TourismVideos } from '@/components/features/tour-planning/tourism-videos';
import { Palmtree } from 'lucide-react';
import { Chatbot } from '@/components/features/tour-planning/chatbot';

export default function TourPage() {
  const [userName, setUserName] = useState('Guest');
  const [userPhone, setUserPhone] = useState('');
  const router = useRouter();

  useEffect(() => {
    // This code runs only on the client, after the component has mounted
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      try {
        const userData = JSON.parse(storedUserData);
        if (userData.user_name) {
          setUserName(userData.user_name);
        }
        if (userData.user_phone_no) {
            setUserPhone(userData.user_phone_no);
        }
      } catch (error) {
        console.error("Failed to parse user data from localStorage", error);
      }
    }
  }, []); // Empty dependency array ensures this runs once on mount

  const handleLogout = () => {
    localStorage.removeItem('userData');
    router.push('/');
  };

  return (
    <>
      <div className="flex h-full flex-col">
        <div className="p-4 space-y-6">
          <div className="flex justify-between items-center">
            <div className="text-left">
              <h1 className="text-xl font-bold font-headline">Welcome, {userName}!</h1>
              <p className="text-muted-foreground">
                Where would you like to go today?
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://picsum.photos/seed/${userName}/100/100`} alt={userName} data-ai-hint="person portrait" />
                    <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">My Account</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userPhone || 'No phone number'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Search onSearchClick={() => router.push('/plan')} />
        </div>
        <div className="flex-1 space-y-8 py-4">
          <RecommendedPlaces />
          <CategoryIcons />
          <PopularPlaces />
          <TourismVideos />
        </div>
      </div>
      <Chatbot />
    </>
  );
}
