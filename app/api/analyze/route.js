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
    
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    
    // FIXED: Changed model to 'gemini-1.5-flash-001' (Stable version)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-001",
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
    return NextResponse.json({ error: "Failed to analyze image" }, { status: 500 });
  }
}