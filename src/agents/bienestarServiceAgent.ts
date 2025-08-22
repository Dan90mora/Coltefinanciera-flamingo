import dotenv from "dotenv";
import { HumanMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { SystemMessage } from "@langchain/core/messages";
import { AgentState } from "./agentState";
import { consultBienestarSpecialistTool } from "../tools/tools";
import { llm } from "../config/llm";
import { MESSAGES } from '../config/constants';

dotenv.config();

export const bienestarServiceAgent = createReactAgent({
  llm,
  tools: [ consultBienestarSpecialistTool ],
  stateModifier: new SystemMessage(MESSAGES.SYSTEM_BIENESTAR_PLUS_PROMPT)
})
  
export const bienestarServiceNode = async (
  state: typeof AgentState.State,
  config?: RunnableConfig,
) => {
  const result = await bienestarServiceAgent.invoke(state, config);
  const lastMessage = result.messages[result.messages.length - 1];
  return {
    messages: [
      new HumanMessage({ content: lastMessage.content, name: "BienestarService" }),
    ],
    next: "supervisor",
  };
};

// bienestarServiceNode es un nodo que procesa mensajes para el agente de servicio de Bienestar Plus.
// El nodo invoca el agente de servicio de Bienestar Plus con el estado actual y la configuración proporcionada.
// Luego, devuelve la respuesta del agente de servicio de Bienestar Plus como un mensaje humano.
// El mensaje humano contiene el contenido de la respuesta y el nombre del agente que envió el mensaje.
