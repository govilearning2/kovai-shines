'use server';

/**
 * @fileOverview A flow to recommend relevant places to visit, restaurants, and hotels based on user preferences and budget constraints.
 *
 * - recommendRelevantPlaces - A function that handles the recommendation process.
 * - RecommendRelevantPlacesInput - The input type for the recommendRelevantPlaces function.
 * - RecommendRelevantPlacesOutput - The return type for the recommendRelevantPlaces function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendRelevantPlacesInputSchema = z.object({
  destination: z.string().describe('The destination city or area for the trip.'),
  interests: z.string().describe('A description of the user\u2019s interests, such as \"historical sites\", \"beaches\", or \"local cuisine\".'),
  budget: z.string().describe('The user\u2019s budget constraints, such as \"budget-friendly\", \"mid-range\", or \"luxury\".'),
  travelDates: z.string().describe('The dates of travel for the trip.'),
  tripType: z.string().describe("The type of trip (e.g., 'Family', 'Friends', 'Couples', 'Solo')."),
  adults: z.coerce.number().describe('The number of adults traveling.'),
  kids: z.coerce.number().describe('The number of kids traveling.'),
  kidAges: z.string().describe('The comma-separated ages of kids traveling.'),
});
export type RecommendRelevantPlacesInput = z.infer<typeof RecommendRelevantPlacesInputSchema>;

const PlaceSchema = z.object({
  name: z.string().describe('The name of the place.'),
  description: z.string().describe('A short description of the place.'),
  type: z.string().describe('The type of place (e.g., restaurant, hotel, tourist spot).'),
  imageUrl: z.string().describe('A URL to an image of the place.'),
  googleStars: z.number().describe('The rating of the place according to Google stars.'),
  imageHint: z.string().describe('One or two keywords for a relevant image search query.'),
});

const RecommendRelevantPlacesOutputSchema = z.array(PlaceSchema).describe('A list of recommended places with their details.');
export type RecommendRelevantPlacesOutput = z.infer<typeof RecommendRelevantPlacesOutputSchema>;

export async function recommendRelevantPlaces(input: RecommendRelevantPlacesInput): Promise<RecommendRelevantPlacesOutput> {
  return recommendRelevantPlacesFlow(input);
}

const recommendRelevantPlacesPrompt = ai.definePrompt({
  name: 'recommendRelevantPlacesPrompt',
  input: {schema: RecommendRelevantPlacesInputSchema},
  output: {schema: RecommendRelevantPlacesOutputSchema},
  prompt: `You are an expert travel assistant. Given the user's preferences, suggest relevant places to visit, restaurants, and hotels in the destination city.

  Consider the user's interests, budget constraints, trip type, travel dates, and group composition (adults and kids ages) to provide personalized recommendations.

  Return an array of the top 10 places that match the user's criteria. For each place, include the name, description, type, image URL, and Google stars rating.

  For the 'imageUrl', you must use a placeholder image from 'https://picsum.photos/seed/<seed>/600/400' where '<seed>' is a unique string for each place.

  User Preferences:
  - Destination: {{{destination}}}
  - Interests: {{{interests}}}
  - Budget: {{{budget}}}
  - Travel Dates: {{{travelDates}}}
  - Trip Type: {{{tripType}}}
  - Adults: {{{adults}}}
  - Number of Kids: {{{kids}}}
  - Kids Ages: {{{kidAges}}}

  Make sure to return all 10 places, even if you have to make some assumptions to complete the list.
  Ensure that each place has realistic values for each field.
  Output in JSON format.
  `,
});

const recommendRelevantPlacesFlow = ai.defineFlow(
  {
    name: 'recommendRelevantPlacesFlow',
    inputSchema: RecommendRelevantPlacesInputSchema,
    outputSchema: RecommendRelevantPlacesOutputSchema,
  },
  async input => {
    const {output} = await recommendRelevantPlacesPrompt(input);
    return output!;
  }
);
