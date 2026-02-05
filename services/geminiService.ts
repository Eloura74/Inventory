import { GoogleGenAI } from "@google/genai";
import { InventoryItem, StockMovement } from "../types";

const GEMINI_API_KEY = process.env.API_KEY || ''; // In a real app, handle missing key gracefully

// Helper to sanitize data for the prompt (reduce token usage)
const formatInventoryForPrompt = (inventory: InventoryItem[]) => {
  return inventory.map(i => ({
    name: i.name,
    stock: i.currentStock,
    min: i.minStockThreshold,
    status: i.status,
    category: i.category
  }));
};

const formatMovementsForPrompt = (movements: StockMovement[]) => {
  return movements.slice(0, 20).map(m => ({
    type: m.type,
    qty: m.quantity,
    date: m.createdAt,
    note: m.note
  }));
};

export const analyzeInventory = async (
  query: string, 
  inventory: InventoryItem[], 
  recentMovements: StockMovement[]
): Promise<string> => {
  if (!GEMINI_API_KEY) {
    return "API Key is missing. Please configure the environment variable.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    const contextData = {
      inventorySummary: formatInventoryForPrompt(inventory),
      recentActivity: formatMovementsForPrompt(recentMovements)
    };

    const prompt = `
      You are an expert Inventory Manager Assistant for an audiovisual equipment rental company.
      
      Current Inventory Status (JSON):
      ${JSON.stringify(contextData.inventorySummary)}

      Recent Movements (Last 20):
      ${JSON.stringify(contextData.recentActivity)}

      User Query: "${query}"

      Analyze the data above to answer the user's query. 
      - If asking about low stock, identify items where stock < min.
      - If asking about trends, look at recent movements.
      - Be concise, professional, and actionable.
      - Format your response in Markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Speed over deep thought for this
      }
    });

    return response.text || "I couldn't generate an analysis at this time.";

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error while analyzing your inventory.";
  }
};
