'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/recommend-relevant-places.ts';
import '@/ai/flows/extract-trip-details.ts';
import '@/ai/flows/generate-itinerary.ts';
import '@/ai/flows/get-trip-start-info.ts';
