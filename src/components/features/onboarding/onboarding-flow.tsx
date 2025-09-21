'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InterestSelector } from './interest-selector';
import { WelcomeStep } from './welcome-step';
import { LanguageSelector } from './language-selector';
import { LoginScreen } from './login-screen';
import { LocationSelector } from './location-selector';
import { OtpScreen } from './otp-screen';
import { FeaturesStep } from './features-step';
import { Loader2 } from 'lucide-react';

type OnboardingStep =
  | 'welcome'
  | 'features'
  | 'language'
  | 'login'
  | 'otp'
  | 'interests'
  | 'locations';

type OnboardingFlowProps = {
  onComplete: () => void;
};

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // This code runs only on the client, after the component has mounted
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      // If user data exists, onboarding is considered complete
      onComplete();
    } else {
      // Otherwise, start the onboarding flow
      setCheckingAuth(false);
    }
  }, [onComplete]);

  const handleWelcomeNext = () => {
    setStep('features');
  };
  
  const handleFeaturesNext = () => {
    setStep('language');
  };

  const handleLanguageNext = () => {
    setStep('login');
  };

  const handleLoginNext = () => {
    setStep('otp');
  };

  const handleOtpNext = () => {
    setStep('interests');
  };

  const handleInterestsNext = () => {
    setStep('locations');
  };

  if (checkingAuth) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading your experience...</p>
      </div>
    );
  }

  const renderStep = () => {
    switch (step) {
      case 'welcome':
        return <WelcomeStep onNext={handleWelcomeNext} />;
      case 'features':
        return <FeaturesStep onNext={handleFeaturesNext} />;
      case 'language':
        return <LanguageSelector onNext={handleLanguageNext} />;
      case 'login':
        return <LoginScreen onNext={handleLoginNext} />;
      case 'otp':
        return <OtpScreen onNext={handleOtpNext} />;
      case 'interests':
        return <InterestSelector onNext={handleInterestsNext} />;
      case 'locations':
        return <LocationSelector onNext={onComplete} />;
      default:
        return <WelcomeStep onNext={handleWelcomeNext} />;
    }
  };

  return (
    <div className="h-full">
      <div key={step} className="h-full animate-fade-in duration-500 ease-in-out">
        {renderStep()}
      </div>
    </div>
  );
}
