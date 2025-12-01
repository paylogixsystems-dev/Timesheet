import { GoogleGenAI, Type } from "@google/genai";
import { AIParseResult } from "../types";

// Helper to get the API client
const getAiClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found. Please set the API_KEY environment variable.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const parseNaturalLanguageTimesheet = async (text: string, referenceDate?: string): Promise<AIParseResult> => {
  const ai = getAiClient();
  const dateContext = referenceDate ? `Assume the context is the month starting ${referenceDate}.` : "Assume the context is the current month.";

  const prompt = `
    Extract timesheet entries from the following text. 
    ${dateContext}
    Map specific dates or relative days (like "Monday", "the 5th") to YYYY-MM-DD format.
    Detect if the user was absent, sick, or on leave. Set status accordingly.
    Text: "${text}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            entries: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING, description: "YYYY-MM-DD format" },
                  hours: { type: Type.NUMBER },
                  project: { type: Type.STRING },
                  description: { type: Type.STRING },
                  status: { 
                    type: Type.STRING, 
                    enum: ['PRESENT', 'ABSENT', 'SICK_LEAVE', 'CASUAL_LEAVE', 'HOLIDAY'],
                    description: "Attendance status" 
                  },
                  remarks: { type: Type.STRING, description: "Any additional notes or reasons for absence" }
                },
                required: ["date", "hours", "project", "description", "status"]
              }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AIParseResult;
    }
    return { entries: [] };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};