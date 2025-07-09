import dotenv from "dotenv";
import { ChatOpenAI } from "@langchain/openai";

dotenv.config();

export const llm = new ChatOpenAI({
    temperature: 0,
    model: "gpt-4o",
    apiKey: process.env.OPENAI_API_KEY,
  });