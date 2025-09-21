
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TourPlanner } from '@/components/features/tour-planning/tour-planner';

function TourPlannerWrapper() {
  const searchParams = useSearchParams();
  const prompt = searchParams.get('prompt');

  return <TourPlanner initialPrompt={prompt || ''} />;
}

export default function PlanPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TourPlannerWrapper />
    </Suspense>
  );
}
