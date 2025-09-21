
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TourAiLogo } from '@/components/icons/logo';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

type LoginScreenProps = {
  onNext: () => void;
};

export function LoginScreen({ onNext }: LoginScreenProps) {
  const [userName, setUserName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleContinue = async () => {
    // const curlCommand = `curl -X POST '${process.env.NEXT_PUBLIC_API_BASE_URL}/create-update-user' -H 'Content-Type: application/json' -d '{"user_name":"${userName}","phone_no":"${phoneNumber}"}'`;
    // console.log("API Call as cURL:", curlCommand);
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/create-update-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_name: userName,
            phone_no: phoneNumber,
          }),
        }
      );

      const data = await response.json();

      console.log(data);

      if (data.status === 'true') {
        const {
          user_favorites,
          user_id,
          user_interests,
          user_name,
          user_phone_no,
          session_id
        } = data;
        const userData = {
          user_favorites,
          user_id,
          user_interests,
          user_name,
          user_phone_no,
          session_id
        };
        localStorage.setItem('userData', JSON.stringify(userData));
        
        toast({
          title: 'OTP Sent',
          description: `An OTP has been sent to your mobile number. It is ${data.otp}`,
        });
        onNext();
      } else {
        throw new Error(data.message || 'Failed to send OTP.');
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
        <h1 className="text-2xl font-bold font-headline">Login</h1>
        <p className="text-muted-foreground">
          Enter your details to get started.
        </p>
      </div>

      <div className="space-y-4 flex-1 pt-8">
        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Your name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            disabled={isLoading}
          />
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md border bg-gray-100">+91</div>
            <Input
              type="tel"
              placeholder="Your mobile number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <Button
            className="w-full"
            size="lg"
            onClick={handleContinue}
            disabled={isLoading || !phoneNumber || !userName}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Get OTP
          </Button>
        </div>
      </div>
    </div>
  );
}
