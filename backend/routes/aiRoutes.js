// backend/routes/aiRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post("/ask", protect, async (req, res) => {
  try {
    const { message, context } = req.body;

    const systemInstruction = `
      You are "Money Mentor", a friendly, encouraging financial advisor. 
      Keep answers short, simple, engaging, and use emojis. Do not use complex financial jargon.
      Focus on good habits: saving, tracking spending, and avoiding impulse buys.
      
      User Context:
      Income: ৳${context.income}. Total spent: ৳${context.totalSpent}. 
      Folders: ${context.folders}. 
      Goals: ${context.goals}.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: message,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ reply: response.text });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "Failed to generate AI response." });
  }
});

module.exports = router;