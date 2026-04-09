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
          name: { type: Type.STRING },
          calories: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          carbs: { type: Type.NUMBER },
          fats: { type: Type.NUMBER },
          ingredients: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING } 
          },
          advice: { type: Type.STRING }
        },
        required: ["name", "calories", "protein", "carbs", "fats"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const analyzeFoodImage = async (base64Data: string, mimeType: string) => {
  const prompt = `
    Analiza esta imagen de comida. Identifica el plato y los ingredientes visibles con una cantidad aproximada.
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
          name: { type: Type.STRING },
          ingredients: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                quantity: { type: Type.NUMBER },
                unit: { type: Type.STRING }
              },
              required: ["name", "quantity", "unit"]
            } 
          }
        },
        required: ["name", "ingredients"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const calculateMacrosFromIngredients = async (ingredients: any[]) => {
  const prompt = `
    Calcula los macronutrientes totales y calorías para la siguiente lista de ingredientes:
    ${JSON.stringify(ingredients)}
    Responde en formato JSON.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          calories: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          carbs: { type: Type.NUMBER },
          fats: { type: Type.NUMBER }
        },
        required: ["calories", "protein", "carbs", "fats"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const analyzeBodyComposition = async (base64Data: string, mimeType: string) => {
  const prompt = `
    Analiza este documento o imagen de composición corporal.
    Extrae el peso, porcentaje de grasa corporal y masa muscular.
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
          weight: { type: Type.NUMBER },
          bodyFat: { type: Type.NUMBER },
          muscleMass: { type: Type.NUMBER }
        }
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
