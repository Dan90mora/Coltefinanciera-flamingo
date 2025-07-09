import dotenv from "dotenv";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { SystemMessage } from "@langchain/core/messages";
import { AgentState } from "./agentState";
import { consultCredintegralSpecialistTool } from "../tools/tools";
import { llm } from "../config/llm";
import { MESSAGES } from '../config/constants';

dotenv.config();

const credintegralServiceAgent = createReactAgent({
  llm,
  tools: [ consultCredintegralSpecialistTool ],
  stateModifier: new SystemMessage(MESSAGES.SYSTEM_CREDINTEGRAL_PROMPT)
})
  
export const credintegralServiceNode = async (
  state: typeof AgentState.State,
  config?: RunnableConfig,
) => {
  const result = await credintegralServiceAgent.invoke(state, config);
  const lastMessage = result.messages[result.messages.length - 1];
  return {
    messages: [
      new HumanMessage({ content: lastMessage.content, name: "CredintegralService" }),
    ],
    next: "supervisor",
  };
};

// credintegralServiceNode es un nodo que procesa mensajes para el agente de servicio de Credintegral.
// El nodo invoca el agente de servicio de Credintegral con el estado actual y la configuración proporcionada.
// Luego, devuelve la respuesta del agente de servicio de Credintegral como un mensaje humano.
// El mensaje humano contiene el contenido de la respuesta y el nombre del agente que envió el mensaje.