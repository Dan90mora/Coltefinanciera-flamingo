import dotenv from "dotenv";
import { StructuredTool, tool } from "@langchain/core/tools";
import { z } from "zod";
import { contactCustomerService, getProductInfo, troubleshootIssue, getInsuranceInfo, searchDentixDocuments, searchCredintegralDocuments, searchDentixClientByPhone, registerDentixClient, sendPaymentLinkEmail } from "../functions/functions";
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

/*
export const contactTool = tool(
    async () => {
      const contact = contactCustomerService();
      return contact;
    },
    {
      name: 'contacto_servicio_cliente',
      description: 'Brinda el canal de contacto para ventas y servicios.',
      schema: z.object({}),
    }
);
*/

/* export const getProductInfoTool = tool(
    async ({ product }: { product: "cámara" | "alarma" | "cerca eléctrica" }) => {
      const productInfo = getProductInfo(product);
      return productInfo;
    },
    {
      name: "get_product_info",
      description: "Obtiene información sobre un producto específico de Fenix Producciones. Usa esta tool solo cuando el cliente te pregunte por un producto.",
      schema: z.object({
        product: z.union([z.literal("cámara"), z.literal("alarma"), z.literal("cerca eléctrica")]),
      }),
    }
); */

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
            service: clientInfo.service
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