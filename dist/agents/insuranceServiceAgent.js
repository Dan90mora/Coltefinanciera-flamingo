import dotenv from "dotenv";
import { HumanMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { SystemMessage } from "@langchain/core/messages";
// import { getInsuranceInfoTool } from "../tools/tools";
import { llm } from "../config/llm";
import { MESSAGES } from '../config/constants';
dotenv.config();
const insuranceServiceAgent = createReactAgent({
    llm,
    tools: [ /* getInsuranceInfoTool */],
    stateModifier: new SystemMessage(MESSAGES.SYSTEM_INSURANCE_PROMPT)
});
export const insuranceServiceNode = async (state, config) => {
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
