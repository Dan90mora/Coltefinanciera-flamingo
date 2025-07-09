import dotenv from "dotenv";
import { HumanMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { SystemMessage } from "@langchain/core/messages";
import { AgentState } from "./agentState";
import { llm } from "../config/llm";
import { MESSAGES } from '../config/constants';
import { consultDentixSpecialistTool, consultCredintegralSpecialistTool, consultInsuranceSpecialistTool, searchDentixClientTool, extractPhoneNumberTool, registerDentixClientTool, sendPaymentLinkEmailTool } from "../tools/tools";
import { END } from "@langchain/langgraph";

dotenv.config();

const luciaServiceAgent = createReactAgent({
    llm,
    tools: [
        consultDentixSpecialistTool,
        consultCredintegralSpecialistTool,
        consultInsuranceSpecialistTool,
        searchDentixClientTool,
        extractPhoneNumberTool,
        registerDentixClientTool, // <-- Agregamos la herramienta de registro
        sendPaymentLinkEmailTool
    ],
    stateModifier: new SystemMessage(MESSAGES.SYSTEM_LUCIA_SUPERVISOR_PROMPT)
})
  
export const luciaServiceNode = async (
    state: typeof AgentState.State,
    config?: RunnableConfig,
  ) => {
    console.log("🕵️  [DEBUG] Estado recibido en luciaServiceNode:", JSON.stringify(state, null, 2));
    const phoneNumber = config?.configurable?.phone_number;

    // Identificación del cliente basada en el número de teléfono del remitente
    if (phoneNumber && !state.isClientIdentified) {
      try {
        const clientInfoString = await searchDentixClientTool.invoke({ phoneNumber });
        if (clientInfoString && clientInfoString !== 'No se encontró un cliente con ese número.') {
          // Parsear la información del cliente para acceder a sus propiedades
          const clientInfo = JSON.parse(clientInfoString);
          
          const greeting = `El cliente ha sido identificado a partir de su número de teléfono (${phoneNumber}): ${JSON.stringify(clientInfo)}. Salúdalo por su nombre (${clientInfo.name}) y, como tiene el servicio '${clientInfo.service}', procede a consultar al especialista adecuado.`;
          
          state.messages.push(new HumanMessage({ content: greeting, name: "system-notification" }));
          state.isClientIdentified = true; // Marcar como identificado
        }
      } catch (error) {
        console.error("Error durante el reconocimiento del cliente:", error);
      }
    }

    const result = await luciaServiceAgent.invoke(state, config);
    const newLastMessage = result.messages[result.messages.length - 1];

    if (typeof newLastMessage.content === 'string') {
      console.log(`💬 Lucia responde: ${newLastMessage.content.substring(0, 100)}...`);
    }

    // Lucia siempre termina la conversación después de responder
    // El cliente necesitará enviar un nuevo mensaje para continuar
    return {
      messages: [
        new HumanMessage({
          content: newLastMessage.content,
          name: "LuciaService"
        }),
      ],
      next: END, // Lucia siempre termina y espera nueva entrada del usuario
    };
};

// luciaServiceNode es un nodo que procesa mensajes para Lucia.
// Lucia maneja toda la conversación, consulta a especialistas internamente cuando necesita información específica,
// y responde al cliente como la única asesora experta en todos los tipos de seguros.
