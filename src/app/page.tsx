'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingFlow } from '@/components/features/onboarding/onboarding-flow';

export default function Home() {
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const router = useRouter();

  const handleOnboardingComplete = () => {
    setOnboardingComplete(true);
    router.push('/tour');
  };

  return (
    <div className="flex flex-col h-full">
      <OnboardingFlow onComplete={handleOnboardingComplete} />
    </div>
  );
}
