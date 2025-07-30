'use server';
/**
 * @fileOverview An AI agent that helps implement features for the BeatTime app.
 *
 * - implementFeature - A function that analyzes a feature request and suggests code changes.
 * - ImplementFeatureInput - The input type for the implementFeature function.
 * - ImplementFeatureOutput - The return type for the implementFeature function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// We'll keep these schemas simple for now and can expand them later.
const ImplementFeatureInputSchema = z.object({
  featureDescription: z.string().describe('A description of the feature to be implemented. This can be a line from the tasks.md file.'),
  existingCode: z.string().describe('A string containing the contents of relevant existing files.'),
  productRequirements: z.string().describe('The full text of the Product Requirements Document (docs/prd.md).'),
});
export type ImplementFeatureInput = z.infer<typeof ImplementFeatureInputSchema>;

const ImplementFeatureOutputSchema = z.object({
  explanation: z.string().describe('A step-by-step explanation of the proposed changes.'),
  codeChanges: z.array(z.object({
    filePath: z.string().describe('The full path of the file to be changed.'),
    newContent: z.string().describe('The complete new content of the file.'),
  })).describe('An array of files and their new content.'),
});
export type ImplementFeatureOutput = z.infer<typeof ImplementFeatureOutputSchema>;

const featureImplementerPrompt = ai.definePrompt({
    name: 'featureImplementerPrompt',
    input: {schema: ImplementFeatureInputSchema},
    output: {schema: ImplementFeatureOutputSchema},
    prompt: `You are an expert Next.js and Firebase developer. Your task is to implement features for a web application called "BeatTime".

You will be given a feature description, the content of relevant existing code files, and the product requirements document (PRD).

Your goal is to provide a complete and correct implementation plan. Respond with a clear explanation and the full, updated code for each file that needs to be modified.

Here is the Product Requirements Document for context:
\`\`\`md
{{{productRequirements}}}
\`\`\`

Here is the feature to implement:
"{{{featureDescription}}}"

Here is the existing code you may need to modify:
\`\`\`
{{{existingCode}}}
\`\`\`

Based on all this information, generate the implementation plan.`,
});

export async function implementFeature(input: ImplementFeatureInput): Promise<ImplementFeatureOutput> {
  const {output} = await featureImplementerPrompt(input);
  return output!;
}
