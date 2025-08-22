import dotenv from "dotenv";
import { HumanMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { SystemMessage } from "@langchain/core/messages";
import { AgentState } from "./agentState.js";
import { consultVidaDeudorSpecialistTool } from "../tools/tools.js";
import { llm } from "../config/llm.js";
import { MESSAGES } from '../config/constants.js';

dotenv.config();

const vidaDeudorServiceAgent = createReactAgent({
  llm,
  tools: [ consultVidaDeudorSpecialistTool ],
  stateModifier: new SystemMessage(MESSAGES.SYSTEM_VIDA_DEUDOR_PROMPT)
})
  
export const vidaDeudorServiceNode = async (
  state: typeof AgentState.State,
  config?: RunnableConfig,
) => {
  const result = await vidaDeudorServiceAgent.invoke(state, config);
  const lastMessage = result.messages[result.messages.length - 1];
  return {
    messages: [
      new HumanMessage({ content: lastMessage.content, name: "VidaDeudorService" }),
    ],
    next: "supervisor",
  };
};

// vidaDeudorServiceNode es un nodo que procesa mensajes para el agente de servicio de Vida Deudor.
// El nodo invoca el agente de servicio de Vida Deudor con el estado actual y la configuración proporcionada.
// Luego, devuelve la respuesta del agente de servicio de Vida Deudor como un mensaje humano.
// El mensaje humano contiene el contenido de la respuesta y el nombre del agente que envió el mensaje.
