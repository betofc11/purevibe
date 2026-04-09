import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const analyzeNutritionPlan = async (base64Data: string, mimeType: string) => {
  const prompt = `
    Analiza este plan nutricional o imagen de comida. 
    Extrae los macronutrientes (proteínas, carbohidratos, grasas) y las calorías totales.
    Si es un plan nutricional, extrae los objetivos diarios.
    Si es una foto de comida, identifica los ingredientes y estima los macros.
    Responde en formato JSON.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: prompt },
          { inlineData: { data: base64Data, mimeType } }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Nombre del plato o plan" },
          calories: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          carbs: { type: Type.NUMBER },
          fats: { type: Type.NUMBER },
          ingredients: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING } 
          },
          advice: { type: Type.STRING, description: "Consejo nutricional basado en el análisis" }
        },
        required: ["name", "calories", "protein", "carbs", "fats"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const getVibeAdvice = async (dailyMacros: any, goals: any, bodyMetrics?: any) => {
  const remaining = {
    protein: Math.max(0, goals.protein - dailyMacros.protein),
    carbs: Math.max(0, goals.carbs - dailyMacros.carbs),
    fats: Math.max(0, goals.fats - dailyMacros.fats),
    calories: Math.max(0, goals.calories - dailyMacros.calories)
  };

  const prompt = `
    Basado en los macros de hoy: ${JSON.stringify(dailyMacros)}
    Objetivos diarios: ${JSON.stringify(goals)}
    Macros restantes: ${JSON.stringify(remaining)}
    Métricas corporales: ${JSON.stringify(bodyMetrics || 'No disponibles')}
    
    Proporciona un consejo corto (máximo 2 frases) y motivador al estilo "PureVibe" (fresco, directo, energético, un poco rebelde pero enfocado).
    Dile exactamente qué le falta consumir para llegar a su meta de hoy de forma natural.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text;
};
