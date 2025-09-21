'use server';
/**
 * @fileOverview Generates a day-by-day itinerary for a trip.
 *
 * - generateItinerary - A function that creates an itinerary from trip details and selected places.
 * - GenerateItineraryInput - The input type for the generateItinerary function.
 * - GenerateItineraryOutput - The return type for the generateItinerary function.
 */

import {ai} from '@/ai/genkit';
import type {Place, TripDetails} from '@/lib/types';
import {z} from 'genkit';

const GenerateItineraryInputSchema = z.object({
  tripDetails: z.object({
    destination: z.string(),
    travelDates: z.string(),
    tripType: z.string(),
    adults: z.coerce.number(),
    kids: z.coerce.number(),
    interests: z.string(),
  }),
  places: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      type: z.string(),
    })
  ),
});
export type GenerateItineraryInput = z.infer<
  typeof GenerateItineraryInputSchema
>;

const GenerateItineraryOutputSchema = z.object({
    itinerary: z.string().describe("A detailed, day-by-day itinerary as a single string. Use markdown format with '>' for day titles and '--' for events, including timestamps. Also include estimated costs where appropriate, like for meals."),
    advisories: z.array(z.string()).describe("A list of 3-5 important advisory notes for the trip."),
    estimatedTotalCost: z.string().describe("A string representing the estimated total cost for the trip, formatted like '₹ 20,000'."),
});
export type GenerateItineraryOutput = z.infer<
  typeof GenerateItineraryOutputSchema
>;

export async function generateItinerary(
  input: GenerateItineraryInput
): Promise<GenerateItineraryOutput> {
  return generateItineraryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateItineraryPrompt',
  input: {schema: GenerateItineraryInputSchema},
  output: {schema: GenerateItineraryOutputSchema},
  prompt: `You are an expert travel planner. Your task is to create a detailed, day-by-day itinerary based on the user's trip details and their selected list of places.

- Structure the itinerary clearly with headings for each day (e.g., "> Day 1: Arrival and Exploration").
- For each day, list activities with specific times (e.g., "-- 09:00 AM -- Visit [Place Name]").
- Group places logically based on their location and type to minimize travel time. Ensure all selected places are included.
- Add meal suggestions (breakfast, lunch, dinner) with estimated costs, like "(Cost: Rs. 800 for two)".
- Generate a list of 3-5 crucial travel advisories.
- Provide an estimated total cost for the entire trip.

User's Trip Details:
- Destination: {{{tripDetails.destination}}}
- Travel Dates: {{{tripDetails.travelDates}}}
- Trip Type: {{{tripDetails.tripType}}}
- Travelers: {{{tripDetails.adults}}} Adults, {{{tripDetails.kids}}} Kids
- Interests: {{{tripDetails.interests}}}

Selected Places to Include:
{{#each places}}
- {{name}} ({{type}}): {{description}}
{{/each}}

Produce the output in JSON format.
`,
});

const generateItineraryFlow = ai.defineFlow(
  {
    name: 'generateItineraryFlow',
    inputSchema: GenerateItineraryInputSchema,
    outputSchema: GenerateItineraryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
