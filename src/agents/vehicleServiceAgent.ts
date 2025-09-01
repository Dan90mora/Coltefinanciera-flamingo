import dotenv from "dotenv";
import { HumanMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { SystemMessage } from "@langchain/core/messages";
import { AgentState } from "./agentState";
import { searchAutosDocumentsTool } from "../tools/tools";
import { llm } from "../config/llm";
import { MESSAGES } from '../config/constants';

dotenv.config();

const vehicleServiceAgent = createReactAgent({
    llm,
    tools: [ searchAutosDocumentsTool ],
    stateModifier: new SystemMessage(MESSAGES.SYSTEM_VEHICLE_PROMPT)
})

export const vehicleServiceNode = async (
    state: typeof AgentState.State,
    config?: RunnableConfig,
  ) => {
    const result = await vehicleServiceAgent.invoke(state, config);
    const lastMessage = result.messages[result.messages.length - 1];
    return {
      messages: [
        new HumanMessage({ content: lastMessage.content, name: "VehicleService" }),
      ],
      next: "supervisor",
    };
};

// vehicleServiceNode es un nodo que procesa mensajes para el agente de servicio de seguros vehiculares.
// El nodo invoca el agente de servicio de autos con el estado actual y la configuración proporcionada.
// Luego, devuelve la respuesta del agente de servicio de autos como un mensaje humano.
// El mensaje humano contiene el contenido de la respuesta y el nombre del agente que envió el mensaje.

export { vehicleServiceAgent };
