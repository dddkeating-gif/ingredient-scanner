import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image');
    
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json({ error: "Server missing API Key" }, { status: 500 });
    }

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64Data = Buffer.from(bytes).toString('base64');
    
    const cleanKey = process.env.GOOGLE_API_KEY.trim();
    const genAI = new GoogleGenerativeAI(cleanKey);
    
    // FIXED: Using 'gemini-1.5-flash' (Clean alias). 
    // This is the correct Vision model for Free Tier API users.
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" } 
    });

    const prompt = `
      Analyze this image of a product ingredient list.
      1. Identify the product context (e.g., shampoo, snack, cleaner).
      2. Extract ingredients and return a JSON array where each object has:
         - "name": Common name.
         - "purpose": 2-4 word function.
         - "analysis": Concise benefit/risk summary relevant to the product context.
         - "history": Optional 1 sentence interesting fact.
      RETURN ONLY THE JSON ARRAY.
    `;

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: file.type || "image/jpeg",
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    return NextResponse.json(JSON.parse(text));

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    
    // If Flash fails, we try the older Vision model as a fallback
    if (error.message.includes("404")) {
        return NextResponse.json({ error: "Model 404. Try Redeploying to clear cache." }, { status: 500 });
    }
    
    return NextResponse.json({ error: "Analysis failed. Try a clear photo." }, { status: 500 });
  }
}