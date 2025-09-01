import dotenv from "dotenv";
import { HumanMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { SystemMessage } from "@langchain/core/messages";
import { llm } from "../config/llm";
import { MESSAGES } from '../config/constants';
import { consultDentixSpecialistTool, consultCredintegralSpecialistTool, consultVidaDeudorSpecialistTool, consultBienestarSpecialistTool, consultAutosSpecialistTool, searchDentixClientTool, extractPhoneNumberTool, registerDentixClientTool, sendPaymentLinkEmailTool, confirmAndUpdateClientDataTool, sendVidaDeudorActivationEmailTool, showVidaDeudorClientDataTool, updateVidaDeudorClientDataTool } from "../tools/tools";
import { END } from "@langchain/langgraph";
dotenv.config();
const luciaServiceAgent = createReactAgent({
    llm,
    tools: [
        consultDentixSpecialistTool,
        consultCredintegralSpecialistTool,
        consultVidaDeudorSpecialistTool,
        consultBienestarSpecialistTool, // <-- Nueva herramienta para Bienestar Plus
        consultAutosSpecialistTool, // <-- Nueva herramienta para seguros de autos
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
});
export const luciaServiceNode = async (state, config) => {
    console.log("🕵️  [DEBUG] Estado recibido en luciaServiceNode:", JSON.stringify(state, null, 2));
    const phoneNumber = config?.configurable?.phone_number;
    // Identificación del cliente basada en el número de teléfono del remitente
    // SOLO se hace en el primer mensaje (cuando no está identificado)
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
                    greeting = `CLIENTE IDENTIFICADO - PRIMER MENSAJE ÚNICAMENTE: ${clientInfo.name} ya está registrado y tiene derecho a la asistencia Vida Deudor ${productInfo} con nosotros.

DATOS DEL CLIENTE (SOLO PARA PRIMERA INTERACCIÓN):
- Nombre: ${clientInfo.name}
- Teléfono: ${phoneNumber}
- Servicio: ${clientInfo.service}
- Producto: ${clientInfo.product || 'No especificado'}

INSTRUCCIONES PARA EL PRIMER SALUDO ÚNICAMENTE:

1. **SALUDO PERSONALIZADO:** Salúdalo por su nombre de manera cálida (SOLO EN ESTE PRIMER MENSAJE)
2. **BENEFICIO ESPECIAL CON PRODUCTO:** Infórmale que ${productInfo} con nosotros, tiene derecho a la asistencia Vida Deudor (SOLO EN ESTE PRIMER MENSAJE)
3. **IMPORTANTE:** Si tiene 'product', usa el nombre EXACTO del producto (${clientInfo.product}) en tu respuesta, NO uses palabras genéricas (SOLO EN ESTE PRIMER MENSAJE)
4. **TERMINOLOGÍA:** SIEMPRE usa "asistencia Vida Deudor" NO "seguro Vida Deudor"
5. **MENSAJE INICIAL:** Menciona que tiene derecho a activar este beneficio y describe brevemente los servicios incluidos (teleconsulta, telenutrición, telepsicología, descuentos en farmacias) sin mencionar meses gratis
6. **PRECIO ESPECIAL:** Solo si pregunta específicamente por precio, entonces menciona los 3 meses gratis
7. **PROCESO DE ACTIVACIÓN INMEDIATA:** Si menciona "quiero activar", "activar", "proceder", "adquirir" - usa INMEDIATAMENTE showVidaDeudorClientDataTool con el número ${phoneNumber} (NO preguntes nada más)

IMPORTANTE: En mensajes posteriores de esta misma conversación, NO repitas su nombre ni el producto constantemente. Manténte natural y directo sin mencionar información personal repetitivamente.

TONO: Personalizado y beneficioso en el primer mensaje, natural y directo en mensajes siguientes.`;
                }
                else {
                    // Cliente existente con otros servicios
                    greeting = `CLIENTE IDENTIFICADO - PRIMER MENSAJE: El cliente ha sido identificado (${phoneNumber}): ${JSON.stringify(clientInfo)}. Salúdalo por su nombre (${clientInfo.name}) en este primer mensaje y procede a consultar al especialista adecuado. En mensajes posteriores, mantente natural sin repetir constantemente su información personal.`;
                }
                state.messages.push(new HumanMessage({ content: greeting, name: "system-notification" }));
                state.isClientIdentified = true; // Marcar como identificado
            }
            else {
                // Cliente NO encontrado - Usuario nuevo
                const newClientMessage = `Este es un USUARIO NUEVO (número ${phoneNumber} no registrado en la base de datos). Procede con el saludo estándar y ofrece los seguros disponibles según las opciones configuradas en el prompt.`;
                state.messages.push(new HumanMessage({ content: newClientMessage, name: "system-notification" }));
                state.isClientIdentified = false; // Marcar como NO identificado
            }
        }
        catch (error) {
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
