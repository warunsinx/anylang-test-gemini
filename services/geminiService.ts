import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Article } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const articleSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "The title of the article in the target language.",
    },
    content: {
      type: Type.STRING,
      description: "A 5-minute reading article (approx 500-700 words) in the target language.",
    },
    vocabulary: {
      type: Type.ARRAY,
      description: "A list of exactly 10 distinct, useful vocabulary words extracted from the article.",
      items: {
        type: Type.OBJECT,
        properties: {
          term: {
            type: Type.STRING,
            description: "The word or phrase in the target language.",
          },
          definition: {
            type: Type.STRING,
            description: "The definition in the user's native language.",
          },
          pronunciation: {
            type: Type.STRING,
            description: "Phonetic pronunciation guide (IPA or simple phonetic).",
          },
          contextSentence: {
            type: Type.STRING,
            description: "A short sentence using the word in context (in target language).",
          },
        },
        required: ["term", "definition", "pronunciation", "contextSentence"],
      },
    },
  },
  required: ["title", "content", "vocabulary"],
};

export const generateArticle = async (
  targetLang: string,
  nativeLang: string,
  topic: string = "general culture"
): Promise<Article> => {
  const prompt = `
    You are an expert language teacher.
    Write a 5-minute reading article in ${targetLang} about "${topic}".
    The article should be engaging, educational, and suitable for an intermediate learner.
    
    After writing the article, select 10 key vocabulary words from it.
    Provide definitions for these words in ${nativeLang}.
    
    Ensure the JSON response is strictly valid.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: articleSchema,
        temperature: 0.7,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini.");
    }

    const rawData = JSON.parse(text);
    
    // Hydrate with IDs and metadata
    const article: Article = {
      id: crypto.randomUUID(),
      title: rawData.title,
      content: rawData.content,
      language: targetLang,
      status: 'new',
      createdAt: Date.now(),
      vocabulary: rawData.vocabulary.map((v: any) => ({
        ...v,
        id: crypto.randomUUID()
      }))
    };

    return article;
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw new Error("Failed to generate article. Please try again.");
  }
};