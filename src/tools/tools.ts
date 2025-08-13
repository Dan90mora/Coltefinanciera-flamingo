import dotenv from "dotenv";
import { StructuredTool, tool } from "@langchain/core/tools";
import { z } from "zod";
//import { contactCustomerService, getProductInfo, troubleshootIssue, getInsuranceInfo, searchDentixDocuments, searchCredintegralDocuments, searchBienestarDocuments, searchDentixClientByPhone, registerDentixClient, sendPaymentLinkEmail, confirmAndUpdateClientData } from "../functions/functions";
import {
  troubleshootIssue,
  getInsuranceInfo,
  searchDentixDocuments,
  searchCredintegralDocuments,
  searchBienestarDocuments,
  searchDentixClientByPhone,
  registerDentixClient,
  sendPaymentLinkEmail,
  confirmAndUpdateClientData,
} from "../functions/functions";
import { extractPhoneNumber } from "../utils/phoneUtils";

dotenv.config();

export const extractPhoneNumberTool = tool(
    async (input: { message: string }) => {
      console.log(`📞 Tool: Extrayendo número de teléfono del mensaje: "${input.message}"`);
      const phoneNumber = extractPhoneNumber(input.message);
      
      if (phoneNumber) {
        console.log(`✅ Tool response: Número de teléfono extraído: ${phoneNumber}`);
        return phoneNumber;
      } else {
        console.log(`❌ Tool response: No se encontró un número de teléfono.`);
        return "No se encontró un número de teléfono en el mensaje.";
      }
    },
    {
      name: "extract_phone_number",
      description: "Extrae un número de teléfono de un texto o mensaje. Útil para identificar el número de un cliente al inicio de la conversación.",
      schema: z.object({
        message: z.string().describe("El mensaje del cual extraer el número de teléfono."),
      }),
    }
);

export const troubleshootIssueTool = tool(
    async ({ issue }: { issue: string }) => {
      const diagnostic = troubleshootIssue(issue);
      return diagnostic;
    },
    {
      name: "troubleshoot_issue",
      description: "Brinda soluciones a problemas comunes con los productos de Fenix Producciones.",
      schema: z.object({
        issue: z.string(),
      }),
    }
);

export const getInsuranceInfoTool = tool(
    async ({ insuranceType }: { insuranceType: "hogar" | "comercial" | "equipos" | "responsabilidad civil" }) => {
      const insuranceInfo = getInsuranceInfo(insuranceType);
      return insuranceInfo;
    },
    {
      name: "get_insurance_info",
      description: "Obtiene información sobre tipos de seguros disponibles en Fenix Producciones. Usa esta tool cuando el cliente pregunte sobre seguros.",
      schema: z.object({
        insuranceType: z.union([
          z.literal("hogar"), 
          z.literal("comercial"), 
          z.literal("equipos"), 
          z.literal("responsabilidad civil")
        ]),
      }),
    }
);

export const searchDentixDocumentsTool = tool(
    async ({ query }: { query: string }) => {
      const searchResults = await searchDentixDocuments(query);
      return searchResults;
    },
    {
      name: "search_dentix_documents",
      description: "Busca información específica en los documentos de Dentix usando búsqueda semántica. Usa esta tool cuando el cliente pregunte sobre productos, servicios o información específica de Dentix.",
      schema: z.object({
        query: z.string().describe("La consulta o pregunta del usuario para buscar en los documentos de Dentix"),
      }),
    }
);

export const searchCredintegralDocumentsTool = tool(
    async ({ query }: { query: string }) => {
      const searchResults = await searchCredintegralDocuments(query);
      return searchResults;
    },
    {
      name: "search_credintegral_documents",
      description: "Busca información específica en los documentos de Credintegral sobre productos financieros, requisitos, beneficios y procedimientos. Usa esta tool cuando el cliente pregunte sobre información específica de Credintegral como créditos, financiamiento, requisitos o servicios financieros.",
      schema: z.object({
        query: z.string().describe("La consulta o pregunta del usuario para buscar en los documentos de Credintegral"),
      }),
    }
);

export const searchDentixClientTool = tool(
    async ({ phoneNumber }: { phoneNumber: string }) => {
      console.log(`🔍 Tool: Buscando cliente con número: ${phoneNumber}`);
      
      const clientInfo = await searchDentixClientByPhone(phoneNumber);
        // Formatear la respuesta para el LLM de manera clara
      if (clientInfo && clientInfo.name) {
        // Cliente encontrado, devolver un objeto estructurado
        const result = {
            found: true,
            name: clientInfo.name,
            email: clientInfo.email,
            phoneNumber: clientInfo.phone_number,
            service: clientInfo.service,
            product: clientInfo.product
        };
        console.log(`✅ Tool response: Cliente encontrado`, result);
        return JSON.stringify(result);
      } else {
        // Cliente no encontrado
        const result = { found: false };
        console.log(`❌ Tool response: Cliente no encontrado`);
        return JSON.stringify(result);
      }
    },
    {
      name: "search_dentix_client",
      description: "Busca información de un cliente de Dentix por su número telefónico para personalizar el saludo y la atención. Usa esta tool al inicio de la conversación para identificar si el cliente ya está registrado.",
      schema: z.object({
        phoneNumber: z.string().describe("El número telefónico del cliente para buscar en la base de datos de clientes de Dentix"),
      }),
    }
);

// Herramientas para que Lucia consulte a los especialistas (SOLO usando Supabase)
export const consultDentixSpecialistTool = tool(
    async ({ customerQuery }: { customerQuery: string }) => {
      console.log(`🦷 Lucia consulta al especialista Dentix (SOLO Supabase): ${customerQuery}`);
        // Consultar ÚNICAMENTE la base vectorial de Supabase para Dentix
      try {
        const { searchDentixVectors } = await import('../functions/retrievers');
        const vectorResults = await searchDentixVectors(customerQuery);
        
        if (!vectorResults || vectorResults.length === 0) {
          return 'Lo siento, no encontré información específica sobre tu consulta en la base de datos de Dentix. ¿Podrías reformular tu pregunta o ser más específico sobre el seguro dental?';
        }
        
        // Verificar si los resultados son realmente relevantes (umbral de similitud)
        const relevantResults = vectorResults.filter(result => result.similarity > 0.4);
        
        if (relevantResults.length === 0) {
          return 'Lo siento, no encontré información específica sobre tu consulta en la base de datos de seguros dentales Dentix. Mi especialidad son los seguros dentales, copagos, coberturas y tratamientos odontológicos. ¿Podrías preguntarme algo relacionado con seguros dentales?';
        }
        
        // Formatear respuesta como especialista usando SOLO resultados vectoriales relevantes
        let response = "Como especialista en seguros dentales Dentix, te proporciono esta información:\n\n";
        
        relevantResults.forEach((result, index) => {
          const fileName = result.metadata?.fileName || 'Documento Dentix';
          response += `📋 **${fileName.replace('.txt', '')}**\n`;
          response += `${result.content}\n`;
          response += `(Relevancia: ${(result.similarity * 100).toFixed(1)}%)\n`;
          if (index < relevantResults.length - 1) response += "\n---\n\n";
        });
        
        console.log(`✅ Respuesta del especialista Dentix (Supabase): ${response.substring(0, 100)}...`);
        return response;
      } catch (error) {
        console.error('❌ Error consultando base vectorial Dentix:', error);
        return 'Lo siento, no pude acceder a la base de datos de seguros dentales en este momento. Por favor intenta nuevamente o contacta a nuestro servicio al cliente.';
      }
    },
    {
      name: "consult_dentix_specialist",
      description: "Consulta al especialista en seguros dentales Dentix usando ÚNICAMENTE la base de datos vectorial de Supabase. Obtiene información específica sobre productos, coberturas, precios y procedimientos dentales. Úsala cuando el cliente pregunte sobre seguros dentales.",
      schema: z.object({
        customerQuery: z.string().describe("La consulta específica del cliente sobre seguros dentales que necesita respuesta especializada"),
      }),
    }
);

export const consultCredintegralSpecialistTool = tool(    async ({ customerQuery }: { customerQuery: string }) => {
      console.log(`📋 Lucia consulta al especialista Credintegral (SOLO Supabase): ${customerQuery}`);
        // Detectar si la consulta es sobre cobertura/servicios o precios
      const isCoverageQuery = /cobertura|cubre|abarca|servicios|incluye|esperar|beneficios|protección|ampara/i.test(customerQuery);
      const isPriceQuery = /precio|cuesta|vale|pagar|costo|cuánto|propuesta económica|económica|tarifa|valor|cotización/i.test(customerQuery);
      
      // Consultar ÚNICAMENTE la base vectorial de Supabase para Credintegral
      try {
        const { searchCredintegralVectors } = await import('../functions/retrievers');
          // Si es una consulta sobre cobertura, buscar específicamente con términos relacionados
        let searchQuery = customerQuery;
        if (isCoverageQuery) {
          searchQuery = `cobertura ${customerQuery}`;
        } else if (isPriceQuery) {
          searchQuery = `propuesta económica precio ${customerQuery}`;
        }
        
        const vectorResults = await searchCredintegralVectors(searchQuery);
        
        if (!vectorResults || vectorResults.length === 0) {
          return 'Lo siento, no encontré información específica sobre tu consulta en la base de datos de Credintegral. ¿Podrías reformular tu pregunta o ser más específico sobre el producto financiero?';
        }
        
        // Verificar si los resultados son realmente relevantes (umbral de similitud)
        const relevantResults = vectorResults.filter(result => result.final_rank > 0.01);
        
        if (relevantResults.length === 0) {
          return 'Lo siento, no encontré información específica sobre tu consulta en la base de datos de seguros generales Credintegral. Mi especialidad son los seguros generales, de vida, familiares y de protección personal. ¿Podrías preguntarme algo relacionado con seguros generales?';
        }
          // Formatear respuesta como especialista usando SOLO resultados vectoriales relevantes
        let response = "Como especialista en seguros generales Credintegral, te proporciono esta información:\n\n";
        
        // Si es una consulta sobre cobertura, dar contexto especial
        if (isCoverageQuery) {
          response = "Te explico sobre la cobertura y servicios que incluye el seguro de Credintegral:\n\n";
        } else if (isPriceQuery) {
          response = "Te explico sobre los precios y costos del seguro de Credintegral:\n\n";
        }
        
        relevantResults.forEach((result, index) => {
          const fileName = result.metadata?.fileName || 'Documento Credintegral';
          response += `📋 **${fileName.replace('.txt', '')}**\n`;
          response += `${result.content}\n`;
          response += `(Relevancia: ${(result.final_rank * 100).toFixed(1)}%)\n`;
          if (index < relevantResults.length - 1) response += "\n---\n\n";
        });
        
        console.log(`✅ Respuesta del especialista Credintegral (Supabase): ${response.substring(0, 100)}...`);
        return response;
      } catch (error) {
        console.error('❌ Error consultando base vectorial Credintegral:', error);
        return 'Lo siento, no pude acceder a la base de datos de seguros generales en este momento. Por favor intenta nuevamente o contacta a nuestro servicio al cliente.';
      }
    },
    {
      name: "consult_credintegral_specialist",
      description: "Consulta al especialista en seguros generales Credintegral usando ÚNICAMENTE la base de datos vectorial de Supabase. Obtiene información específica sobre productos, coberturas, beneficios y procedimientos. Úsala cuando el cliente pregunte sobre seguros generales, de vida o familiares.",
      schema: z.object({
        customerQuery: z.string().describe("La consulta específica del cliente sobre seguros generales que necesita respuesta especializada"),
      }),
    }
);

export const consultInsuranceSpecialistTool = tool(
    async ({ customerQuery }: { customerQuery: string }) => {
      console.log(`🏠 Lucia consulta al especialista Insurance (sin archivos locales): ${customerQuery}`);
      
      // Analizar la consulta para determinar el tipo de seguro
      const query = customerQuery.toLowerCase();
      
      // Función para determinar el tipo de seguro basado en palabras clave
      function determineInsuranceType(query: string): "hogar" | "comercial" | "equipos" | "responsabilidad civil" {
        // Palabras clave para cada tipo de seguro
        const hogarKeywords = ['casa', 'hogar', 'vivienda', 'domicilio', 'residencia', 'apartamento'];
        const comercialKeywords = ['negocio', 'empresa', 'comercial', 'local', 'oficina', 'establecimiento'];
        const equiposKeywords = ['cámara', 'equipo', 'seguridad', 'alarma', 'cerca eléctrica', 'dispositivo'];
        const responsabilidadKeywords = ['responsabilidad', 'civil', 'daños a terceros', 'responsabilidad civil'];
        
        // Verificar en orden de prioridad
        if (responsabilidadKeywords.some(keyword => query.includes(keyword))) {
          return 'responsabilidad civil';
        }
        if (comercialKeywords.some(keyword => query.includes(keyword))) {
          return 'comercial';
        }
        if (equiposKeywords.some(keyword => query.includes(keyword))) {
          return 'equipos';
        }
        if (hogarKeywords.some(keyword => query.includes(keyword))) {
          return 'hogar';
        }
        
        // Por defecto, asumir hogar si no se puede determinar
        return 'hogar';
      }
      
      // Consultar información de seguros usando SOLO datos internos (sin archivos locales)
      try {
        // Determinar el tipo de seguro basado en la consulta
        const insuranceType = determineInsuranceType(query);
        console.log(`🎯 Tipo de seguro identificado: ${insuranceType}`);
        
        // Usar información estructurada interna en lugar de archivos locales
        const insuranceInfo = getInsuranceInfo(insuranceType);
        
        // Formatear respuesta como especialista
        const response = `Como especialista en seguros de ${insuranceType}, te proporciono esta información específica:\n\n${insuranceInfo}`;
        console.log(`✅ Respuesta del especialista Insurance (datos internos): ${response.substring(0, 100)}...`);
        return response;
      } catch (error) {
        console.error('❌ Error consultando especialista Insurance:', error);
        return 'Lo siento, no pude obtener información específica sobre seguros de hogar y equipos en este momento. Por favor intenta nuevamente o contacta a nuestro servicio al cliente.';
      }
    },
    {
      name: "consult_insurance_specialist",
      description: "Consulta al especialista en seguros de hogar, equipos y protección patrimonial usando ÚNICAMENTE datos internos estructurados (sin archivos locales o internet). Obtiene información específica sobre coberturas, equipos de seguridad y procedimientos. Úsala cuando el cliente pregunte sobre seguros de hogar, equipos, cámaras de seguridad o protección patrimonial.",
      schema: z.object({
        customerQuery: z.string().describe("La consulta específica del cliente sobre seguros de hogar/equipos que necesita respuesta especializada"),
      }),
    }
);

export const registerDentixClientTool = tool(
  async ({ name, email, phone_number, service }: { name: string; email: string; phone_number: string; service: string }) => {
    const result = await registerDentixClient({ name, email, phone_number, service });
    return JSON.stringify(result);
  },
  {
    name: "register_dentix_client",
    description: "Registra un nuevo cliente en la base de datos de Dentix con nombre, email, número de celular y tipo de servicio/seguro de interés. Úsala cuando un cliente nuevo quiera adquirir un seguro y haya proporcionado todos sus datos.",
    schema: z.object({
      name: z.string().describe("Nombre completo del cliente"),
      email: z.string().describe("Correo electrónico del cliente"),
      phone_number: z.string().describe("Número de celular del cliente"),
      service: z.string().describe("Tipo de seguro o servicio de interés (ejemplo: dentix, credintegral, etc.)"),
    }),
  }
);

export const sendPaymentLinkEmailTool = tool(
  async ({ clientName, clientEmail, insuranceName }: { clientName: string; clientEmail: string; insuranceName: string; }) => {
    const result = sendPaymentLinkEmail(clientName, clientEmail, insuranceName);
    return result;
  },
  {
    name: "sendPaymentLinkEmail",
    description: "Envía un correo electrónico al cliente con un enlace de pago para finalizar la compra de un seguro. Úsalo después de registrar a un cliente nuevo.",
    schema: z.object({
      clientName: z.string().describe("El nombre completo del cliente."),
      clientEmail: z.string().describe("El correo electrónico del cliente."),
      insuranceName: z.string().describe("El nombre del seguro que el cliente está adquiriendo."),
    }),
  }
);

// HERRAMIENTA COMENTADA: Esta herramienta usaba searchVidaDeudorDocuments que devuelve precios hardcodeados
// Para evitar que los agentes accedan a precios específicos para clientes existentes con vida deudor
/*
export const searchVidaDeudorDocumentsTool = tool(
    async ({ query }: { query: string }) => {
      const { searchVidaDeudorDocuments } = await import('../functions/functions');
      const searchResults = await searchVidaDeudorDocuments(query);
      return searchResults;
    },
    {
      name: "search_vida_deudor_documents",
      description: "Busca información específica en los documentos de Vida Deudor sobre seguros de vida, coberturas, beneficios, requisitos y procedimientos. Usa esta tool cuando el cliente pregunte sobre información específica del seguro de Vida Deudor, protección familiar, coberturas por fallecimiento o invalidez.",
      schema: z.object({
        query: z.string().describe("La consulta o pregunta del usuario para buscar en los documentos de Vida Deudor"),
      }),
    }
);
*/

export const consultVidaDeudorSpecialistTool = tool(    async ({ customerQuery, clientInfo, phoneNumber }: { customerQuery: string; clientInfo?: { name?: string; service?: string; product?: string }; phoneNumber?: string }) => {
      console.log(`🛡️ Lucia consulta al especialista Vida Deudor: ${customerQuery}`);
      console.log(`👤 Información del cliente recibida:`, clientInfo);
      console.log(`📞 Número de teléfono recibido:`, phoneNumber);
      
      try {
        // Si no tenemos información del cliente pero tenemos número, buscarla
        let finalClientInfo = clientInfo;
        if (!finalClientInfo && phoneNumber) {
          console.log(`🔍 Buscando información del cliente con número: ${phoneNumber}`);
          const clientData = await searchDentixClientByPhone(phoneNumber);
          if (clientData) {
            finalClientInfo = {
              name: clientData.name,
              service: clientData.service,
              product: clientData.product
            };
            console.log(`✅ Información del cliente encontrada:`, finalClientInfo);
          }
        }
        // DETECTAR CONSULTAS DE PRECIO Y RESPONDER SIN BUSCAR EN BASE DE DATOS
        const isPriceQuery = /precio|cuesta|vale|pagar|costo|cuánto|cuanto|tarifa|valor|cotización|económica|propuesta|cuestan|cuesta|cobran|cobrar/i.test(customerQuery);
        
        if (isPriceQuery) {
          console.log('💰 [PRECIO DETECTADO] Respondiendo con mensaje estándar para clientes existentes');
            // Personalizar el mensaje si tenemos información del cliente
          let mensajePersonalizado = '';
          if (finalClientInfo && finalClientInfo.product) {
            mensajePersonalizado = `\n🎯 **RECORDATORIO:** Este beneficio está incluido por haber adquirido tu ${finalClientInfo.product} con nosotros.\n`;
          }
          
          return `📞 **INFORMACIÓN IMPORTANTE SOBRE CONTINUIDAD**

Como ya tienes activada tu asistencia Vida Deudor con 3 meses completamente GRATIS, no necesitas preocuparte por costos en este momento.${mensajePersonalizado}
🔔 **PROCESO DE CONTACTO:**
• **Antes de que se acabe el tercer mes, te estaremos llamando para comunicarte cómo continúa funcionando este beneficio**
• Nuestro equipo especializado te explicará todas las opciones disponibles
• Te daremos toda la información necesaria para que tomes la mejor decisión

🛡️ **MIENTRAS TANTO:**
• Disfruta de tus 3 meses gratuitos
• Usa todos los servicios incluidos sin restricciones
• No tienes que hacer ningún pago adicional por ahora

¿Te gustaría que te explique más sobre los servicios incluidos en tu asistencia?`;
        }
          // PARA CONSULTAS QUE NO SON DE PRECIO: Buscar SOLO en base vectorial de Supabase
        const { searchVidaDeudorVectors } = await import('../functions/retrievers');
        const vectorResults = await searchVidaDeudorVectors(customerQuery);
        
        if (!vectorResults || vectorResults.length === 0) {
          return 'Lo siento, no encontré información específica sobre tu consulta en nuestra base de datos de Vida Deudor. ¿Podrías reformular tu pregunta o ser más específico sobre la asistencia de vida deudor?';
        }        // Formatear respuesta SOLO con información de la base vectorial
        let response = '';
        
        // Personalizar el encabezado según la información del cliente
        if (finalClientInfo && finalClientInfo.service === 'vidadeudor' && finalClientInfo.product) {
          response = `🎯 **Como beneficiario por tu ${finalClientInfo.product}:** Te proporciono información específica sobre tu asistencia Vida Deudor:\n\n`;
        } else if (finalClientInfo && finalClientInfo.service === 'vidadeudor') {
          response = `🎯 **Como cliente con servicio activo:** Te proporciono información sobre tu asistencia Vida Deudor:\n\n`;
        } else {
          response = '🛡️ Según nuestra base de datos de Vida Deudor, aquí tienes la información:\n\n';
        }
        
        vectorResults.slice(0, 3).forEach((result, index) => {
          const fileName = result.metadata?.fileName || 'Documento Vida Deudor';
          response += `📋 **${fileName.replace('.txt', '')}**\n`;
          response += `${result.content}\n`;
          response += `(Relevancia: ${(result.final_rank * 100).toFixed(1)}%)\n`;
          if (index < vectorResults.length - 1) response += "\n---\n\n";
        });
        
        console.log(`✅ Respuesta del especialista Vida Deudor (información): ${response.substring(0, 100)}...`);
        return response;
      } catch (error) {
        console.error('❌ Error consultando especialista Vida Deudor:', error);
        return 'Lo siento, ocurrió un problema técnico al acceder a la información de Vida Deudor. ¿Podrías intentar reformular tu consulta?';
      }
    },
    {
      name: "consult_vida_deudor_specialist",
      description: "Consulta al especialista en seguros de Vida Deudor para obtener información detallada sobre coberturas, precios, beneficios y procedimientos. Úsalo cuando el cliente pregunte sobre seguros de vida, protección familiar, coberturas por fallecimiento o invalidez.",      schema: z.object({
        customerQuery: z.string().describe("La consulta específica del cliente sobre el seguro de Vida Deudor"),
        clientInfo: z.object({
          name: z.string().nullable().optional().describe("Nombre del cliente"),
          service: z.string().nullable().optional().describe("Servicio del cliente (vidadeudor, dentix, etc.)"),
          product: z.string().nullable().optional().describe("Producto específico del cliente")
        }).nullable().optional().describe("Información del cliente para personalizar la respuesta"),
        phoneNumber: z.string().nullable().optional().describe("Número de teléfono del cliente para buscar información adicional si es necesario")
      }),
    }
);

export const confirmAndUpdateClientDataTool = tool(
    async ({ phoneNumber, updates }: { phoneNumber: string; updates?: { name?: string; email?: string; phoneNumber?: string } }) => {
      console.log(`📋 Tool: Confirmando/actualizando datos del cliente con número: ${phoneNumber}`);
      
      if (updates) {
        console.log(`✏️ Tool: Actualizaciones solicitadas:`, updates);
      } else {
        console.log(`📄 Tool: Solo mostrando datos actuales para confirmación`);
      }
      
      const result = await confirmAndUpdateClientData(phoneNumber, updates);
      console.log(`✅ Tool response: ${result.substring(0, 150)}...`);
      return result;
    },
    {
      name: "confirm_and_update_client_data",
      description: "Confirma los datos actuales de un cliente existente (nombre, email, teléfono) y permite actualizarlos si es necesario. Úsalo cuando un cliente existente quiera proceder con la compra de su seguro y necesites verificar/corregir sus datos antes de finalizar. Si no se proporcionan updates, solo mostrará los datos para confirmación.",      schema: z.object({
        phoneNumber: z.string().describe("Número de teléfono del cliente existente"),
        updates: z.object({
          name: z.string().nullable().optional().describe("Nuevo nombre del cliente (opcional)"),
          email: z.string().nullable().optional().describe("Nuevo email del cliente (opcional)"),
          phoneNumber: z.string().nullable().optional().describe("Nuevo número de teléfono del cliente (opcional)")
        }).nullable().optional().describe("Datos a actualizar del cliente (opcional)")
      }),
    }
);

export const consultBienestarSpecialistTool = tool(
    async ({ customerQuery }: { customerQuery: string }) => {
      console.log(`🌟 Lucia consulta al especialista Bienestar Plus (SOLO Supabase): ${customerQuery}`);
      // Unificar todas las palabras clave de precio/costo/valor/tarifa
      const isCoverageQuery = /cobertura|cubre|abarca|servicios|incluye|esperar|beneficios|protección|ampara|salud|médica|medicina|hospitalización|consultas|medicamentos|psicología/i.test(customerQuery);
      const isPriceQuery = /precio|cuesta|vale|pagar|costo|cuánto|propuesta económica|económica|tarifa|valor|cotización/i.test(customerQuery);
      const isBenefitQuery = /beneficio|beneficios|ventajas/i.test(customerQuery);
      const isAssistQuery = /asistencial|asistenciales|asistencia/i.test(customerQuery);
      try {
        const { searchBienestarVectors } = await import('../functions/retrievers');
        const { extractBienestarSection } = await import('../functions/functions');
        let searchQuery = customerQuery;
        // Si es consulta de precio/costo/valor/tarifa, forzar búsqueda por 'tarifa'
        if (isPriceQuery) {
          searchQuery = `tarifa ${customerQuery}`;
        } else if (isCoverageQuery) {
          searchQuery = `cobertura servicios médicos ${customerQuery}`;
        }
        console.log('[DEBUG] Query enviada a searchBienestarVectors:', searchQuery);
        const vectorResults = await searchBienestarVectors(searchQuery);
        console.log('[DEBUG] Resultados crudos de searchBienestarVectors:', JSON.stringify(vectorResults, null, 2));
        if (!vectorResults || vectorResults.length === 0) {
          console.log('[DEBUG] No se encontraron resultados vectoriales relevantes.');
          return 'Lo siento, no encontré información específica sobre tu consulta en la base de datos de Bienestar Plus. ¿Podrías reformular tu pregunta o ser más específico sobre el seguro de bienestar familiar?';
        }
        const relevantResults = vectorResults.filter(result => result.final_rank > 0.01);
        console.log('[DEBUG] Resultados relevantes (final_rank > 0.01):', JSON.stringify(relevantResults, null, 2));
        if (relevantResults.length === 0) {
          console.log('[DEBUG] Ningún resultado relevante tras el filtrado.');
          return 'Lo siento, no encontré información específica sobre tu consulta en la base de datos de seguros de Bienestar Plus. Mi especialidad son los seguros de bienestar familiar, salud, medicina y protección integral. ¿Podrías preguntarme algo relacionado con seguros de bienestar familiar?';
        }
        // Extracción y formateo especial: buscar en TODOS los chunks
        let response = '';
        let foundSection = null;
        let foundInChunk = null;
        if (isPriceQuery) {
          for (const result of relevantResults) {
            const section = extractBienestarSection(result.content, 'precio');
            console.log('[DEBUG] Sección extraída (precio) en chunk:', result.id, section);
            if (section) { foundSection = section; foundInChunk = result.id; break; }
          }
          if (foundSection) {
            response = 'Te explico sobre los precios y costos del seguro de Bienestar Plus:\n\n' + foundSection + `\n\n[Extraído del chunk ID: ${foundInChunk}]`;
            return response;
          }
        } else if (isCoverageQuery) {
          for (const result of relevantResults) {
            const section = extractBienestarSection(result.content, 'cobertura');
            console.log('[DEBUG] Sección extraída (cobertura) en chunk:', result.id, section);
            if (section) { foundSection = section; foundInChunk = result.id; break; }
          }
          if (foundSection) {
            response = 'Te explico sobre la cobertura y servicios que incluye el seguro de Bienestar Plus:\n\n' + foundSection + `\n\n[Extraído del chunk ID: ${foundInChunk}]`;
            return response;
          }
        } else if (isBenefitQuery) {
          for (const result of relevantResults) {
            const section = extractBienestarSection(result.content, 'beneficios');
            console.log('[DEBUG] Sección extraída (beneficios) en chunk:', result.id, section);
            if (section) { foundSection = section; foundInChunk = result.id; break; }
          }
          if (foundSection) {
            response = 'Estos son los beneficios destacados del seguro de Bienestar Plus:\n\n' + foundSection + `\n\n[Extraído del chunk ID: ${foundInChunk}]`;
            return response;
          }
        } else if (isAssistQuery) {
          for (const result of relevantResults) {
            const section = extractBienestarSection(result.content, 'asistenciales');
            console.log('[DEBUG] Sección extraída (asistenciales) en chunk:', result.id, section);
            if (section) { foundSection = section; foundInChunk = result.id; break; }
          }
          if (foundSection) {
            response = 'Estos son los servicios asistenciales incluidos en Bienestar Plus:\n\n' + foundSection + `\n\n[Extraído del chunk ID: ${foundInChunk}]`;
            return response;
          }
        }
        // Si no se encontró sección específica, fallback a respuesta general
        response = 'Como especialista en seguros de Bienestar Plus, te proporciono esta información:\n\n';
        relevantResults.forEach((result, index) => {
          const fileName = result.metadata?.fileName || 'Documento Bienestar Plus';
          response += `📋 **${fileName.replace('.txt', '')}**\n`;
          response += `${result.content}\n`;
          response += `(Relevancia: ${(result.final_rank * 100).toFixed(1)}%)\n`;
          if (index < relevantResults.length - 1) response += "\n---\n\n";
        });
        return response;
      } catch (error) {
        console.error('❌ Error consultando base vectorial Bienestar Plus:', error);
        return 'Lo siento, no pude acceder a la base de datos de seguros de Bienestar Plus en este momento. Por favor intenta nuevamente o contacta a nuestro servicio al cliente.';
      }
    },
    {
      name: "consult_bienestar_specialist",
      description: "Consulta al especialista en seguros de Bienestar Plus usando ÚNICAMENTE la base de datos vectorial de Supabase. Obtiene información específica sobre productos, coberturas, beneficios y procedimientos de bienestar familiar. Úsala cuando el cliente pregunte sobre seguros de bienestar, planes de salud, servicios médicos o protección familiar integral.",
      schema: z.object({
        customerQuery: z.string().describe("La consulta específica del cliente sobre seguros de bienestar familiar que necesita respuesta especializada"),
      }),
    }
);

export const sendVidaDeudorActivationEmailTool = tool(
  async ({ clientName, clientEmail }: { clientName: string; clientEmail: string; }) => {
    const { sendVidaDeudorActivationEmail } = await import('../functions/functions');
    const result = await sendVidaDeudorActivationEmail(clientName, clientEmail);
    return result;
  },
  {
    name: "sendVidaDeudorActivationEmail",
    description: "Envía un correo electrónico de activación especial para clientes existentes con servicio vida deudor que aceptan el seguro. Este correo NO incluye enlace de pago ya que obtienen 3 meses gratis. ÚSALO SOLO para clientes existentes con service='vidadeudor' cuando acepten el seguro.",
    schema: z.object({
      clientName: z.string().describe("El nombre completo del cliente existente."),
      clientEmail: z.string().describe("El correo electrónico del cliente existente."),
    }),
  }
);

export const showVidaDeudorClientDataTool = tool(
  async ({ phoneNumber }: { phoneNumber: string }) => {
    console.log(`🛡️ [VIDA DEUDOR] Tool: Mostrando datos para confirmación - Cliente: ${phoneNumber}`);
    
    const { showVidaDeudorClientDataForConfirmation } = await import('../functions/functions');
    const result = await showVidaDeudorClientDataForConfirmation(phoneNumber);
    console.log(`✅ Tool response: ${result.substring(0, 200)}...`);
    return result;
  },
  {
    name: "show_vida_deudor_client_data",
    description: "Muestra los datos del cliente (document_id=cédula, name=nombre, phone_number=celular, email=correo electrónico) para confirmación antes de activar la asistencia vida deudor. ÚSALO cuando un cliente existente quiera adquirir vida deudor y necesites que confirme sus datos.",
    schema: z.object({
      phoneNumber: z.string().describe("Número de teléfono del cliente existente"),
    }),
  }
);

export const updateVidaDeudorClientDataTool = tool(
  async ({ phoneNumber, updates }: { 
    phoneNumber: string; 
    updates: { document_id?: string; name?: string; phone_number?: string; email?: string } 
  }) => {
    console.log(`🛡️ [VIDA DEUDOR] Tool: Actualizando datos del cliente: ${phoneNumber}`);
    console.log(`✏️ Tool: Actualizaciones solicitadas:`, updates);
    
    const { updateVidaDeudorClientData } = await import('../functions/functions');
    const result = await updateVidaDeudorClientData(phoneNumber, updates);
    console.log(`✅ Tool response: ${result.substring(0, 200)}...`);
    return result;
  },
  {
    name: "update_vida_deudor_client_data",
    description: "Actualiza los datos específicos de un cliente para el flujo de vida deudor (document_id=cédula, name=nombre, phone_number=celular, email=correo electrónico). ÚSALO después de que el cliente confirme cambios en sus datos antes de activar vida deudor.",
    schema: z.object({
      phoneNumber: z.string().describe("Número de teléfono del cliente existente"),
      updates: z.object({
        document_id: z.string().nullable().optional().describe("Nueva cédula del cliente (opcional)"),
        name: z.string().nullable().optional().describe("Nuevo nombre del cliente (opcional)"),
        phone_number: z.string().nullable().optional().describe("Nuevo número de teléfono del cliente (opcional)"),
        email: z.string().nullable().optional().describe("Nuevo correo electrónico del cliente (opcional)")
      }).describe("Datos a actualizar del cliente")
    }),
  }
);