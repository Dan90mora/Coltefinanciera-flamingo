import dotenv from "dotenv";
import { HumanMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { SystemMessage } from "@langchain/core/messages";
import { AgentState } from "./agentState";
import { llm } from "../config/llm";
import { MESSAGES } from '../config/constants';
import { consultDentixSpecialistTool, consultCredintegralSpecialistTool, consultVidaDeudorSpecialistTool, consultBienestarSpecialistTool, consultInsuranceSpecialistTool, searchDentixClientTool, extractPhoneNumberTool, registerDentixClientTool, sendPaymentLinkEmailTool, confirmAndUpdateClientDataTool, sendVidaDeudorActivationEmailTool, showVidaDeudorClientDataTool, updateVidaDeudorClientDataTool } from "../tools/tools";
import { END } from "@langchain/langgraph";

dotenv.config();

const luciaServiceAgent = createReactAgent({
    llm,
    tools: [
        consultDentixSpecialistTool,
        consultCredintegralSpecialistTool,
        consultVidaDeudorSpecialistTool,
        consultBienestarSpecialistTool, // <-- Nueva herramienta para Bienestar Plus
        //consultInsuranceSpecialistTool,
        searchDentixClientTool,
        extractPhoneNumberTool,
        registerDentixClientTool, // <-- Agregamos la herramienta de registro
        sendPaymentLinkEmailTool,
        confirmAndUpdateClientDataTool, // <-- Nueva herramienta para confirmar/actualizar datos
        sendVidaDeudorActivationEmailTool, // <-- Nueva herramienta para activación de vida deudor
        showVidaDeudorClientDataTool, // <-- Nueva herramienta para mostrar datos de vida deudor
        updateVidaDeudorClientDataTool // <-- Nueva herramienta para actualizar datos de vida deudor
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
            // Cliente existente con vida deudor: informar sobre beneficio especial
            const productInfo = clientInfo.product ? `por haber adquirido tu ${clientInfo.product}` : 'por ser cliente y tener un servicio/crédito';
            
            greeting = `CLIENTE IDENTIFICADO - VIDA DEUDOR CON BENEFICIO ESPECIAL: ${clientInfo.name} ya está registrado y tiene derecho a la asistencia Vida Deudor ${productInfo} con nosotros.

DATOS DEL CLIENTE:
- Nombre: ${clientInfo.name}
- Teléfono: ${phoneNumber}
- Servicio: ${clientInfo.service}
- Producto: ${clientInfo.product || 'No especificado'}

INSTRUCCIONES ESPECÍFICAS:

1. **SALUDO PERSONALIZADO:** Salúdalo por su nombre de manera cálida
2. **BENEFICIO ESPECIAL CON PRODUCTO:** Infórmale que ${productInfo} con nosotros, tiene derecho a la asistencia Vida Deudor
3. **IMPORTANTE:** Si tiene 'product', usa el nombre EXACTO del producto (${clientInfo.product}) en tu respuesta, NO uses palabras genéricas
4. **TERMINOLOGÍA:** SIEMPRE usa "asistencia Vida Deudor" NO "seguro Vida Deudor" 
5. **MENSAJE INICIAL:** Menciona que tiene derecho a activar este beneficio y describe brevemente los servicios incluidos (teleconsulta, telenutrición, telepsicología, descuentos en farmacias) sin mencionar meses gratis
6. **PRECIO ESPECIAL:** Solo si pregunta específicamente por precio, entonces menciona los 3 meses gratis
7. **PROCESO DE ACTIVACIÓN INMEDIATA:** Si menciona "quiero activar", "activar", "proceder", "adquirir" - usa INMEDIATAMENTE showVidaDeudorClientDataTool con el número ${phoneNumber} (NO preguntes nada más)

TONO: Personalizado, beneficioso, destacando que es un cliente especial con ventajas exclusivas por su producto específico.`;
          } else {
            // Cliente existente con otros servicios
            greeting = `El cliente ha sido identificado a partir de su número de teléfono (${phoneNumber}): ${JSON.stringify(clientInfo)}. Salúdalo por su nombre (${clientInfo.name}) y, como tiene el servicio '${clientInfo.service}', procede a consultar al especialista adecuado.`;
          }
          
          state.messages.push(new HumanMessage({ content: greeting, name: "system-notification" }));
          state.isClientIdentified = true; // Marcar como identificado
        } else {
          // Cliente NO encontrado - Usuario nuevo
          const newClientMessage = `Este es un USUARIO NUEVO (número ${phoneNumber} no registrado en la base de datos). Procede con el saludo estándar y ofrece los seguros disponibles según las opciones configuradas en el prompt.`;
          
          state.messages.push(new HumanMessage({ content: newClientMessage, name: "system-notification" }));
          state.isClientIdentified = false; // Marcar como NO identificado
        }
      } catch (error) {
        console.error("Error durante el reconocimiento del cliente:", error);
        // En caso de error, tratar como usuario nuevo
        const errorClientMessage = `Error al verificar cliente. Tratar como USUARIO NUEVO y proceder con opciones estándar de seguros.`;
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

export { luciaServiceAgent };
