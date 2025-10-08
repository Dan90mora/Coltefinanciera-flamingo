import dotenv from "dotenv";
import { HumanMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { SystemMessage } from "@langchain/core/messages";
import { AgentState } from "./agentState.js";
import { llm } from "../config/llm.js";
import { MESSAGES } from '../config/constants.js';
import { consultDentixSpecialistTool, consultCredintegralSpecialistTool, consultVidaDeudorSpecialistTool, consultBienestarSpecialistTool, consultAutosSpecialistTool, consultSoatSpecialistTool, searchDentixClientTool, extractPhoneNumberTool, registerDentixClientTool, sendPaymentLinkEmailTool, confirmAndUpdateClientDataTool, sendVidaDeudorActivationEmailTool, showVidaDeudorClientDataTool, updateVidaDeudorClientDataTool, sendVehicleQuoteEmailTool } from "../tools/tools.js";
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
        consultSoatSpecialistTool, // <-- Nueva herramienta para seguros SOAT
        //consultInsuranceSpecialistTool,
        searchDentixClientTool,
        extractPhoneNumberTool,
        registerDentixClientTool, // <-- Agregamos la herramienta de registro
        sendPaymentLinkEmailTool,
        confirmAndUpdateClientDataTool, // <-- Nueva herramienta para confirmar/actualizar datos
        sendVidaDeudorActivationEmailTool, // <-- Nueva herramienta para activación de vida deudor
        showVidaDeudorClientDataTool, // <-- Nueva herramienta para mostrar datos de vida deudor
        updateVidaDeudorClientDataTool, // <-- Nueva herramienta para actualizar datos de vida deudor
        sendVehicleQuoteEmailTool // <-- Nueva herramienta para enviar cotización de seguros de autos
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
    // SOLO se hace en el primer mensaje (cuando no está identificado)
    if (phoneNumber && !state.isClientIdentified) {
      try {
        const clientInfoString = await searchDentixClientTool.invoke({ phoneNumber });
        if (clientInfoString && clientInfoString !== 'No se encontró un cliente con ese número.') {
          // Cliente existente encontrado
          const clientInfo = JSON.parse(clientInfoString);
          
          let greeting;
          if (clientInfo.service === 'autos') {
            // ✅ INICIALIZAR vehicleInsuranceData con datos del cliente identificado
            if (!state.vehicleInsuranceData) {
              state.vehicleInsuranceData = {
                fullName: clientInfo.name,
                cedula: clientInfo.document_id || null, // ✅ ASIGNAR CÉDULA DESDE BD
                birthDate: null,
                phone: phoneNumber,
                vehicleBrand: null,
                vehicleModel: null,
                vehicleYear: null,
                vehiclePlate: null,
                vehicleCity: null
              };
              console.log('🔍 [LUCIA] Cliente de autos identificado, inicializando vehicleInsuranceData:', state.vehicleInsuranceData);
            }
            
            // Cliente existente con seguros de autos: activar modo especialista en autos
            greeting = `CLIENTE IDENTIFICADO - PRIMER MENSAJE ÚNICAMENTE: Hola ${clientInfo.name}, veo que estás interesado en todo lo que tiene que ver con seguros de autos y estoy aquí para ayudarte con todas las dudas que tengas.

DATOS DEL CLIENTE (SOLO PARA PRIMERA INTERACCIÓN):
- Nombre: ${clientInfo.name}
- Teléfono: ${phoneNumber}
- Servicio: ${clientInfo.service}
- Producto: ${clientInfo.product || 'No especificado'}
${clientInfo.document_id ? `- Cédula: ${clientInfo.document_id}` : ''}

INSTRUCCIONES PARA EL PRIMER SALUDO ÚNICAMENTE:

1. **SALUDO PERSONALIZADO:** Salúdalo por su nombre de manera cálida (SOLO EN ESTE PRIMER MENSAJE)
2. **ESPECIALISTA EN AUTOS:** Identifícate como especialista en seguros de autos de Coltefinanciera
3. **ATENCIÓN PERSONALIZADA:** Menciona que ves su interés en seguros de autos y estás aquí para ayudarle con todas sus dudas sobre seguros vehiculares
4. **ACTIVACIÓN AUTOMÁTICA:** Para CUALQUIER consulta relacionada con seguros de autos, usa INMEDIATAMENTE la herramienta 'consult_autos_specialist' con la consulta del cliente
5. **PERSISTENCIA:** Sé muy insistente pero amable para convencer al cliente sobre los beneficios de los seguros de autos

IMPORTANTE: En mensajes posteriores de esta misma conversación, NO repitas su nombre constantemente. Manténte natural y directo como especialista en seguros vehiculares.

TONO: Personalizado y especializado en el primer mensaje, experto y convincente en mensajes siguientes.`;
          } else if (clientInfo.service === 'bienestar') {
            // Cliente existente con seguro Bienestar Plus: activar modo especialista en bienestar
            greeting = `CLIENTE IDENTIFICADO - PRIMER MENSAJE ÚNICAMENTE: ¡Hola ${clientInfo.name}! Veo que tienes interés en nuestro seguro Bienestar Plus y estoy aquí para ayudarte con todas las dudas que tengas sobre este increíble plan de protección individual integral.

DATOS DEL CLIENTE (SOLO PARA PRIMERA INTERACCIÓN):
- Nombre: ${clientInfo.name}
- Teléfono: ${phoneNumber}
- Servicio: ${clientInfo.service}
${clientInfo.document_id ? `- Cédula: ${clientInfo.document_id}` : ''}

INSTRUCCIONES PARA EL PRIMER SALUDO ÚNICAMENTE:

1. **SALUDO PERSONALIZADO:** Salúdalo por su nombre de manera cálida y entusiasta (SOLO EN ESTE PRIMER MENSAJE)
2. **ESPECIALISTA EN BIENESTAR:** Identifícate como especialista en seguros Bienestar Plus de Coltefinanciera
3. **ATENCIÓN PERSONALIZADA:** Menciona que ves su interés en el seguro Bienestar Plus y estás aquí para ayudarle con todas sus dudas sobre este plan de protección individual
4. **ACTIVACIÓN AUTOMÁTICA:** Para CUALQUIER consulta relacionada con Bienestar Plus, usa INMEDIATAMENTE la herramienta 'consult_bienestar_specialist' con la consulta del cliente
5. **PERSISTENCIA COMERCIAL:** Sé muy insistente pero amable para convencer al cliente sobre los beneficios del seguro Bienestar Plus
6. **ENFOQUE DE VENTA:** Pregúntale qué aspectos del seguro le gustaría conocer mejor para tomar la mejor decisión para su bienestar

IMPORTANTE: En mensajes posteriores de esta misma conversación, NO repitas su nombre constantemente. Manténte natural y directo como especialista en seguros de bienestar individual.

TONO: Personalizado y comercial en el primer mensaje, experto y convincente en mensajes siguientes.`;
          } else if (clientInfo.service === 'soat') {
            // Cliente existente con seguros SOAT: activar modo especialista en SOAT
            greeting = `CLIENTE IDENTIFICADO - PRIMER MENSAJE ÚNICAMENTE: ¡Hola ${clientInfo.name}! Veo que estás interesado en el SOAT (Seguro Obligatorio de Accidentes de Tránsito) y estoy aquí para ayudarte con todas las dudas que tengas sobre este seguro obligatorio.

DATOS DEL CLIENTE (SOLO PARA PRIMERA INTERACCIÓN):
- Nombre: ${clientInfo.name}
- Teléfono: ${phoneNumber}
- Servicio: ${clientInfo.service}
- Producto: ${clientInfo.product || 'No especificado'}
${clientInfo.document_id ? `- Cédula: ${clientInfo.document_id}` : ''}

INSTRUCCIONES PARA EL PRIMER SALUDO ÚNICAMENTE:

1. **SALUDO PERSONALIZADO:** Salúdalo por su nombre de manera cálida (SOLO EN ESTE PRIMER MENSAJE)
2. **ESPECIALISTA EN SOAT:** Identifícate como especialista en seguros SOAT de Coltefinanciera
3. **ATENCIÓN PERSONALIZADA:** Menciona que ves su interés en el SOAT y estás aquí para ayudarle con todas sus dudas sobre el seguro obligatorio
4. **ACTIVACIÓN AUTOMÁTICA:** Para CUALQUIER consulta relacionada con SOAT, usa INMEDIATAMENTE la herramienta 'consult_soat_specialist' con la consulta del cliente
5. **PERSISTENCIA LEGAL:** Sé muy insistente pero amable para convencer al cliente sobre la importancia legal del SOAT
6. **ENFOQUE LEGAL:** Enfatiza que el SOAT es OBLIGATORIO por ley y las consecuencias de no tenerlo

IMPORTANTE: En mensajes posteriores de esta misma conversación, NO repitas su nombre constantemente. Manténte natural y directo como especialista en seguros SOAT obligatorios.

TONO: Personalizado y especializado en el primer mensaje, experto y convincente con enfoque legal en mensajes siguientes.`;
          } else if (clientInfo.service === 'vidadeudor') {
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
          } else {
            // Cliente existente con otros servicios
            greeting = `CLIENTE IDENTIFICADO - PRIMER MENSAJE: El cliente ha sido identificado (${phoneNumber}): ${JSON.stringify(clientInfo)}. Salúdalo por su nombre (${clientInfo.name}) en este primer mensaje y procede a consultar al especialista adecuado. En mensajes posteriores, mantente natural sin repetir constantemente su información personal.`;
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
