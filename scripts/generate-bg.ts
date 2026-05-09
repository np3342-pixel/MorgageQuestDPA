import { GoogleGenAI } from "@google/genai";
import fs from "fs/promises";
import path from "path";

async function generateImage() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  console.log("Generating image...");
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: 'A professional, modern, and subtle background image for a real estate and mortgage lending web application. The theme includes modern homes, buyers, and lenders. It should have a dark, sleek, and minimalist aesthetic suitable for a glassmorphism UI overlay. High quality, architectural, abstract elements, deep blue and slate tones.',
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9",
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const base64EncodeString = part.inlineData.data;
      const buffer = Buffer.from(base64EncodeString, 'base64');
      await fs.mkdir(path.join(process.cwd(), 'public'), { recursive: true });
      await fs.writeFile(path.join(process.cwd(), 'public', 'hero-bg.jpg'), buffer);
      console.log("Image saved to public/hero-bg.jpg");
      return;
    }
  }
  console.log("No image found in response");
}

generateImage().catch(console.error);
