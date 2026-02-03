import { GoogleGenAI } from "@google/genai";
import { HousekeepingTask } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateReportSummary = async (tasks: HousekeepingTask[], period: string): Promise<string> => {
  if (tasks.length === 0) return "No data available to analyze.";

  const taskSummary = tasks.map(t => 
    `- [${t.date}] ${t.area}: ${t.jobDescription} (${t.status}) - ${t.assignee}`
  ).join('\n');

  const prompt = `
    You are a Housekeeping Executive Manager. Analyze the following housekeeping report data for the ${period} period.
    
    Data:
    ${taskSummary}

    Please provide a professional summary formatted in Markdown including:
    1. Overall Completion Rate.
    2. Key Areas of Concern (Pending/In Progress tasks).
    3. Performance Note for Assignees.
    4. A brief recommendation for the next schedule.
    
    Keep it concise and professional.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to AI service. Please check your API Key.";
  }
};