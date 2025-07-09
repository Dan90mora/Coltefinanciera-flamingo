"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.llm = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const openai_1 = require("@langchain/openai");
dotenv_1.default.config();
exports.llm = new openai_1.ChatOpenAI({
    temperature: 0,
    model: "gpt-4o",
    apiKey: process.env.OPENAI_API_KEY,
});
