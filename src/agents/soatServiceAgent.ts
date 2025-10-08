import dotenv from "dotenv";
import { HumanMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { SystemMessage } from "@langchain/core/messages";
import { AgentState } from "./agentState.js";
import { llm } from "../config/llm.js";
import { MESSAGES } from '../config/constants.js';
import { consultSoatSpecialistTool, searchDentixClientTool, extractPhoneNumberTool, registerDentixClientTool, sendPaymentLinkEmailTool } from "../tools/tools.js";
import { END } from "@langchain/langgraph";

dotenv.config();

const soatServiceAgent = createReactAgent({
    llm,
    tools: [
        consultSoatSpecialistTool, // <-- Nueva herramienta para SOAT
        searchDentixClientTool,
        extractPhoneNumberTool,
        registerDentixClientTool,
        sendPaymentLinkEmailTool
    ],
    stateModifier: new SystemMessage(MESSAGES.SYSTEM_SOAT_PROMPT)
})
  
export const soatServiceNode = async (
    state: typeof AgentState.State,
    config?: RunnableConfig,
  ) => {
    console.log("🛡️ [DEBUG] Estado recibido en soatServiceNode:", JSON.stringify(state, null, 2));
    
    const result = await soatServiceAgent.invoke(state, config);
    const newLastMessage = result.messages[result.messages.length - 1];

    if (typeof newLastMessage.content === 'string') {
      console.log(`🛡️ SOAT Specialist responde: ${newLastMessage.content.substring(0, 100)}...`);
    }

    // El agente SOAT termina la conversación después de responder
    return {
      messages: [
        new HumanMessage({
          content: newLastMessage.content,
          name: "SoatService"
        }),
      ],
      next: END, // El agente SOAT siempre termina y espera nueva entrada del usuario
    };
};

// soatServiceNode es un nodo que procesa mensajes para el especialista SOAT.
// Este agente maneja consultas específicas sobre seguros SOAT, utiliza la tabla soat_documents
// para proporcionar información especializada y responde con personalidad vendedora.

export { soatServiceAgent };
