import dotenv from "dotenv";
import { ChatOpenAI } from "@langchain/openai";

dotenv.config();

export const llm = new ChatOpenAI({
    temperature: 0,
    model: "gpt-4.1",
    apiKey: process.env.OPENAI_API_KEY,
    topP: 1,
    maxTokens: 300, // Limitar tokens para respuestas más concisas
  });