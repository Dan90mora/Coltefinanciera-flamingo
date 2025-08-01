import dotenv from "dotenv";
import { HumanMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { SystemMessage } from "@langchain/core/messages";
import { AgentState } from "./agentState";
import { llm } from "../config/llm";
import { MESSAGES } from '../config/constants';
import { consultDentixSpecialistTool, consultCredintegralSpecialistTool, consultVidaDeudorSpecialistTool, consultBienestarSpecialistTool, consultInsuranceSpecialistTool, searchDentixClientTool, extractPhoneNumberTool, registerDentixClientTool, sendPaymentLinkEmailTool, confirmAndUpdateClientDataTool } from "../tools/tools";
import { END } from "@langchain/langgraph";

dotenv.config();

const luciaServiceAgent = createReactAgent({
    llm,
    tools: [
        consultDentixSpecialistTool,
        consultCredintegralSpecialistTool,
        consultVidaDeudorSpecialistTool,
        consultBienestarSpecialistTool, // <-- Nueva herramienta para Bienestar Plus
        consultInsuranceSpecialistTool,
        searchDentixClientTool,
        extractPhoneNumberTool,
        registerDentixClientTool, // <-- Agregamos la herramienta de registro
        sendPaymentLinkEmailTool,
        confirmAndUpdateClientDataTool // <-- Nueva herramienta para confirmar/actualizar datos
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
          // Cliente existente encontrado
          const clientInfo = JSON.parse(clientInfoString);
          
          let greeting;
          if (clientInfo.service === 'vidadeudor') {
            // Cliente existente con vida deudor: ser estratégico y consultivo
            greeting = `CLIENTE IDENTIFICADO - VIDA DEUDOR: ${clientInfo.name} ya está registrado con interés en el seguro de Vida Deudor. 

INSTRUCCIONES ESTRATÉGICAS INTELIGENTES:

**CASO 1 - Si el cliente dice EXPLÍCITAMENTE que quiere COMPRAR/ADQUIRIR:**
- Palabras clave: "quiero comprar", "procede con la compra", "adquirir", "contratar", "YA", "procede", "finalizar compra"
- ACCIÓN: Procede INMEDIATAMENTE a confirmar sus datos usando confirm_and_update_client_data
- NO preguntes más información, NO seas consultiva
- Ve directo a: "Para proceder con tu compra, necesito confirmar tus datos..."

**CASO 2 - Si el cliente pide información general:**
- Salúdalo por su nombre de manera cálida y personalizada
- Reconoce que ya mostró interés en el seguro de Vida Deudor previamente
- NO brindes toda la información de una vez
- Pregúntale específicamente QUÉ información necesita hoy sobre el seguro
- Sé consultiva: haz que EL CLIENTE te diga qué quiere saber
- Una vez que especifique su necesidad, brinda información precisa

OBJETIVO: Si quiere comprar → confirma datos. Si quiere información → sé estratégica y consultiva.`;
          } else {
            // Cliente existente con otros servicios
            greeting = `El cliente ha sido identificado a partir de su número de teléfono (${phoneNumber}): ${JSON.stringify(clientInfo)}. Salúdalo por su nombre (${clientInfo.name}) y, como tiene el servicio '${clientInfo.service}', procede a consultar al especialista adecuado.`;
          }
          
          state.messages.push(new HumanMessage({ content: greeting, name: "system-notification" }));
          state.isClientIdentified = true; // Marcar como identificado
        } else {
          // Cliente NO encontrado - Usuario nuevo
          const newClientMessage = `Este es un USUARIO NUEVO (número ${phoneNumber} no registrado en la base de datos). Cuando ofrezcas opciones de seguros, incluye también el seguro de Asistencia Vida Deudor junto con los demás seguros disponibles.`;
          
          state.messages.push(new HumanMessage({ content: newClientMessage, name: "system-notification" }));
          state.isClientIdentified = false; // Marcar como NO identificado
        }
      } catch (error) {
        console.error("Error durante el reconocimiento del cliente:", error);
        // En caso de error, tratar como usuario nuevo
        const errorClientMessage = `Error al verificar cliente. Tratar como USUARIO NUEVO e incluir seguro de Asistencia Vida Deudor en las opciones.`;
        state.messages.push(new HumanMessage({ content: errorClientMessage, name: "system-notification" }));
        state.isClientIdentified = false;
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
