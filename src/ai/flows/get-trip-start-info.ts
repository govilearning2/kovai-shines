'use server';
/**
 * @fileOverview Gets real-time information for the start of a trip.
 *
 * - getTripStartInfo - A function that provides a summary of climate, traffic, and toll costs.
 * - GetTripStartInfoInput - The input type for the getTripStartInfo function.
 * - GetTripStartInfoOutput - The return type for the getTripStartInfo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetTripStartInfoInputSchema = z.object({
  startLocation: z.string().describe('The starting point of the trip.'),
  firstDestination: z.string().describe('The first major destination or stop in the itinerary.'),
});
export type GetTripStartInfoInput = z.infer<typeof GetTripStartInfoInputSchema>;


const GetTripStartInfoOutputSchema = z.object({
    climateSummary: z.string().describe("A brief summary of the current weather and climate conditions for the route."),
    trafficSummary: z.string().describe("A summary of the current traffic conditions, including any major delays or congestion."),
    approximateTollCost: z.string().describe("An estimated cost for tolls for the trip to the first destination, formatted like '₹ 300 - ₹ 400'."),
});
export type GetTripStartInfoOutput = z.infer<typeof GetTripStartInfoOutputSchema>;

export async function getTripStartInfo(
  input: GetTripStartInfoInput
): Promise<GetTripStartInfoOutput> {
  return getTripStartInfoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getTripStartInfoPrompt',
  input: {schema: GetTripStartInfoInputSchema},
  output: {schema: GetTripStartInfoOutputSchema},
  prompt: `You are a real-time travel assistant. For a trip starting now from {{{startLocation}}} to {{{firstDestination}}}, provide a concise summary of the following:

1.  **Climate:** Current weather conditions and forecast for the next few hours.
2.  **Traffic:** Current traffic situation, mentioning any significant congestion or clear roads.
3.  **Tolls:** An approximate total cost for toll gates along this route.

Please provide realistic, current information as if you were accessing live data.
`,
});

const getTripStartInfoFlow = ai.defineFlow(
  {
    name: 'getTripStartInfoFlow',
    inputSchema: GetTripStartInfoInputSchema,
    outputSchema: GetTripStartInfoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
