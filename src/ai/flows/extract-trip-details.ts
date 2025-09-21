'use server';
/**
 * @fileOverview Extracts structured trip details from a user's free-text description.
 *
 * - extractTripDetails - A function that takes a user's trip description and returns structured data.
 * - ExtractTripDetailsInput - The input type for the extractTripDetails function.
 * - ExtractTripDetailsOutput - The return type for the extractTripDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractTripDetailsInputSchema = z.object({
  tripDescription: z
    .string()
    .describe('A free-text description of the desired trip.'),
});
export type ExtractTripDetailsInput = z.infer<typeof ExtractTripDetailsInputSchema>;


const ExtractTripDetailsOutputSchema = z.object({
    destination: z.string().describe("The primary destination of the trip. Infer from the user's description. Leave empty if not specified."),
    interests: z.string().describe("A comma-separated list of interests. Infer from the user's description. Leave empty if not specified."),
    budget: z.string().describe("The budget for the trip (e.g., 'budget-friendly', 'mid-range', 'luxury'). Infer from the user's description. Default to 'Mid-range' if not specified."),
    travelDates: z.string().describe("The dates of travel. Infer from the user's description. Leave empty if not specified."),
    tripType: z.string().describe("The type of trip (e.g., 'Family', 'Friends', 'Couples', 'Solo'). Infer from the user's description. Default to 'Family' if not specified."),
    adults: z.coerce.number().describe("The number of adults traveling. Infer from the user's description. Default to 1 if not specified."),
    kids: z.coerce.number().describe("The number of kids traveling. Infer from the user's description. Default to 0 if not specified."),
    kidAges: z.string().describe("The comma-separated ages of kids traveling. Infer from the user's description. Default to '' if not specified."),
    modeOfTravel: z.string().describe("The primary mode of travel. Infer from the user's description. Leave empty if not specified."),
});
export type ExtractTripDetailsOutput = z.infer<typeof ExtractTripDetailsOutputSchema>;

export async function extractTripDetails(
  input: ExtractTripDetailsInput
): Promise<ExtractTripDetailsOutput> {
  return extractTripDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractTripDetailsPrompt',
  input: {schema: ExtractTripDetailsInputSchema},
  output: {schema: ExtractTripDetailsOutputSchema},
  prompt: `You are an expert at extracting structured information from user queries. Based on the user's trip description, extract the following details. If a detail is not mentioned, use a sensible default or leave the field empty. Do not make up information.

Trip Description: {{{tripDescription}}}

Extract the destination, interests, budget, travel dates, trip type, number of adults, number of kids, ages of kids, and mode of travel.
`,
});

const extractTripDetailsFlow = ai.defineFlow(
  {
    name: 'extractTripDetailsFlow',
    inputSchema: ExtractTripDetailsInputSchema,
    outputSchema: ExtractTripDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
