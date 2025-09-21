
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TourAiLogo } from '@/components/icons/logo';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

type OtpScreenProps = {
  onNext: () => void;
};

export function OtpScreen({ onNext }: OtpScreenProps) {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleVerify = async () => {
    setIsLoading(true);
    try {
      const storedUserData = localStorage.getItem('userData');
      if (!storedUserData) {
        throw new Error('User data not found. Please log in again.');
      }
      const userData = JSON.parse(storedUserData);
      const userId = userData.user_id;

      if (!userId) {
        throw new Error('User ID not found. Please log in again.');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/verify-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: String(userId), // Ensure user_id is a string as per payload example
            otp: otp,
          }),
        }
      );

      const data = await response.json();

      if (data.status === 'true') {
        const {
          user_favorites,
          user_id,
          user_interests,
          user_name,
          user_phone_no,
        } = data;
        const updatedUserData = {
          user_favorites,
          user_id,
          user_interests,
          user_name,
          user_phone_no,
        };
        localStorage.setItem('userData', JSON.stringify(updatedUserData));

        toast({
          title: 'Success',
          description: data.message || 'You have been successfully logged in.',
        });
        
        setTimeout(() => {
            onNext();
        }, 1000);

      } else {
        throw new Error(data.message || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
       toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-6">
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 w-fit">
          <TourAiLogo className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-bold font-headline">Enter OTP</h1>
        <p className="text-muted-foreground">
          A 6-digit code has been sent to your mobile number.
        </p>
      </div>

      <div className="space-y-4 flex-1 pt-8">
        <Input
          type="tel"
          placeholder="Enter 6-digit OTP"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          disabled={isLoading}
          className="text-center text-lg tracking-[0.5em]"
        />
        <Button
          className="w-full"
          size="lg"
          onClick={handleVerify}
          disabled={isLoading || otp.length !== 6}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Verify
        </Button>
         <div className="text-center">
            <Button variant="link">Resend OTP</Button>
          </div>
      </div>
    </div>
  );
}
