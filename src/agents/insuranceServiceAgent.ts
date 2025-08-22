import dotenv from "dotenv";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { SystemMessage } from "@langchain/core/messages";
import { AgentState } from "./agentState.js";
// import { getInsuranceInfoTool } from "../tools/tools.js";
import { llm } from "../config/llm.js";
import { MESSAGES } from '../config/constants.js';

dotenv.config();

const insuranceServiceAgent = createReactAgent({
    llm,
    tools: [  ],
    stateModifier: new SystemMessage(MESSAGES.SYSTEM_INSURANCE_PROMPT)
})
  
export const insuranceServiceNode = async (
    state: typeof AgentState.State,
    config?: RunnableConfig,
  ) => {
    const result = await insuranceServiceAgent.invoke(state, config);
    const lastMessage = result.messages[result.messages.length - 1];
    return {
      messages: [
        new HumanMessage({ content: lastMessage.content, name: "InsuranceService" }),
      ],
      next: "supervisor",
    };
};

// insuranceServiceNode es un nodo que procesa mensajes para el agente de servicio de seguros.
// El nodo invoca el agente de servicio de seguros con el estado actual y la configuración proporcionada.
// Luego, devuelve la respuesta del agente de servicio de seguros como un mensaje humano.
// El mensaje humano contiene el contenido de la respuesta y el nombre del agente que envió el mensaje.
