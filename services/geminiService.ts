import { GoogleGenAI, Type, Modality } from "@google/genai";
import { DiscoveryTextResponse } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Step 1: Identify the location and generate kid-friendly facts
 */
export const generateLocationInfo = async (lat: number, lng: number): Promise<DiscoveryTextResponse> => {
  const modelId = "gemini-2.5-flash";
  
  const prompt = `
    I am a 4-year-old child exploring the Earth. I just pointed to this location: Latitude ${lat}, Longitude ${lng}.
    
    1. Identify where this is (Country, Ocean, or specific Region).
    2. Pick ONE cute native animal, plant, or famous landmark from there.
    3. Write a very short, exciting description (max 20 words) suitable for a preschooler.
    4. Write one "Did you know?" fun fact (max 15 words).
    
    Return strictly JSON.
  `;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          placeName: { type: Type.STRING, description: "Name of the place/country" },
          animalName: { type: Type.STRING, description: "Name of the animal or plant" },
          description: { type: Type.STRING, description: "Simple exciting description for a toddler" },
          funFact: { type: Type.STRING, description: "A simple fun fact" },
        },
        required: ["placeName", "animalName", "description", "funFact"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No text response from Gemini");
  
  return JSON.parse(text) as DiscoveryTextResponse;
};

/**
 * Step 2: Generate a cute cartoon image of the subject
 */
export const generateKidImage = async (subject: string, location: string): Promise<string> => {
  const modelId = "gemini-2.5-flash-image"; 
  
  const prompt = `A cute, 3D rendered Pixar-style cartoon of a ${subject} in the ${location}. Bright colors, soft lighting, happy expression. High quality, distinct features, centered composition.`;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: {
      parts: [{ text: prompt }],
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  // Extract base64 image from response
  const part = response.candidates?.[0]?.content?.parts?.[0];
  if (part && part.inlineData && part.inlineData.data) {
    return `data:image/png;base64,${part.inlineData.data}`;
  }
  
  throw new Error("Failed to generate image");
};

/**
 * Step 3: Generate Audio (Text-to-Speech)
 */
export const generateVoiceNarration = async (text: string): Promise<string> => {
  const modelId = "gemini-2.5-flash-preview-tts";
  
  const response = await ai.models.generateContent({
    model: modelId,
    contents: { parts: [{ text }] },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          // 'Puck' is often a good, somewhat playful voice
          prebuiltVoiceConfig: { voiceName: 'Puck' },
        },
      },
    },
  });

  // The API returns raw PCM data in base64
  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  
  if (!base64Audio) {
    throw new Error("Failed to generate audio");
  }
  
  return base64Audio;
};
