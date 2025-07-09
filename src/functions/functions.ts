import colombia from '../data/colombia.json';
import { searchDentixVectors, searchCredintegralVectors } from './retrievers';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import sgMail from '@sendgrid/mail';

dotenv.config();

// Configurar SendGrid
if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
    console.warn('SENDGRID_API_KEY no está definida. El envío de correos no funcionará.');
}

// export function contactCustomerService() {
//     const customerServiceData = {
//       whatsapp: "https://wa.me/573335655669",
//       description: "Linea de atención especializada para ventas.",
//     };
//     console.log('contactCustomerService executed');
//     return JSON.stringify(customerServiceData);
// }

// Función para eliminar tildes y diéresis
// function removeAccents(str: string): string {
//     return str.normalize("NFD").replace(/[̀-ͯ]/g, "");
//   }
  
// export function getProductInfo(product: "cámara" | "alarma" | "cerca eléctrica"): string {
//     type ProductType = "cámara" | "alarma" | "cerca eléctrica";

//     const products: Record<ProductType, { description: string; price: string; features: string[] }> = {
//       "cámara": {
//         description: "Cámara de seguridad para interiores y exteriores.",
//         price: "$200.000",
//         features: ["Resolución HD", "Visión nocturna", "Detección de movimiento"],
//       },
//       "alarma": {
//         description: "Alarma para proteger tu hogar o negocio.",
//         price: "$150.000",
//         features: ["Sirena de alta potencia", "Sensor de movimiento", "Control remoto"],
        // },
        // "cerca eléctrica": {
        //   description: "Cerca eléctrica para proteger tu propiedad.",
        //   price: "$300.000",
        //   features: ["Alarma de alta potencia", "Sensor de movimiento", "Control remoto"],
        // },
    // };

    // console.log('getProductInfo executed');

    // const productInfo = products[product];
    // if (productInfo) {
    //   return JSON.stringify(productInfo);
    // }

    // return "Lo siento, no tenemos información sobre ese producto.";
//}

// Función para solucionar problema con camara que no da imagen
export function troubleshootIssue(issue: string): string {
    console.log('troubleshootIssue executed');

    let result

    if (issue === "no hay imagen" || issue === "no da imagen" || issue === "no hay video") {
      result = "1. Verifica que la cámara esté conectada a la corriente y encendida.\n2. Asegúrate de que la cámara esté conectada al router mediante un cable Ethernet.\n3. Reinicia la cámara y el router.\n4. Si el problema persiste, restablece la cámara a los valores de fábrica.";
    }
    else if (issue === "imagen borrosa" || issue === "imagen distorsionada") {
      result = "1. Limpia la lente de la cámara con un paño suave y seco.\n2. Ajusta la resolución de la cámara en la aplicación móvil.\n3. Verifica que la cámara esté enfocada correctamente.";
    }
    else if (issue === "imagen con ruido" || issue === "imagen con interferencias") {
      result = "1. Aleja la cámara de dispositivos electrónicos que puedan causar interferencias.\n2. Verifica que la cámara esté conectada a una fuente de energía estable.\n3. Actualiza el firmware de la cámara.";
    }
    else {
      result = "Lo siento, no tengo información sobre ese problema.";
    }    return JSON.stringify(result);
}

export function getInsuranceInfo(insuranceType: "hogar" | "comercial" | "equipos" | "responsabilidad civil"): string {
    type InsuranceType = "hogar" | "comercial" | "equipos" | "responsabilidad civil";

    const insurances: Record<InsuranceType, { description: string; coverage: string[]; price: string; benefits: string[] }> = {
      "hogar": {
        description: "Seguro integral para proteger tu hogar y contenido.",
        coverage: ["Incendio", "Robo", "Daños por agua", "Fenómenos naturales", "Responsabilidad civil familiar"],
        price: "Desde $45.000/mes",
        benefits: ["Cobertura 24/7", "Asistencia en el hogar", "Reposición a valor nuevo", "Sin deducible en robo total"],
      },
      "comercial": {
        description: "Protección completa para tu negocio o empresa.",
        coverage: ["Incendio", "Robo", "Lucro cesante", "Responsabilidad civil", "Equipos electrónicos"],
        price: "Desde $120.000/mes",
        benefits: ["Asesoría legal", "Asistencia 24/7", "Cobertura de inventarios", "Protección de ingresos"],
      },
      "equipos": {
        description: "Seguro específico para equipos de seguridad instalados.",
        coverage: ["Daño accidental", "Robo de equipos", "Fallas eléctricas", "Vandalismo"],
        price: "Desde $25.000/mes",
        benefits: ["Reposición inmediata", "Instalación incluida", "Mantenimiento preventivo", "Soporte técnico"],
      },
      "responsabilidad civil": {
        description: "Protección contra daños a terceros.",
        coverage: ["Daños a terceros", "Lesiones personales", "Daños materiales", "Gastos legales"],
        price: "Desde $35.000/mes",
        benefits: ["Defensa jurídica", "Cobertura mundial", "Sin límite de eventos", "Asesoría especializada"],
      },
    };

    console.log('getInsuranceInfo executed');

    const insuranceInfo = insurances[insuranceType];
    if (insuranceInfo) {
      return JSON.stringify(insuranceInfo);
    }

    return "Lo siento, no tenemos información sobre ese tipo de seguro.";
}

export async function searchDentixDocuments(query: string): Promise<string> {
    try {
        console.log('searchDentixDocuments executed with query:', query);        // Intentar primero búsqueda vectorial en Supabase
        try {
            const supabaseResults = await searchDentixVectors(query);
            if (supabaseResults && supabaseResults.length > 0) {
                console.log('✅ Usando resultados de Supabase para Dentix');
                return formatSupabaseResults(supabaseResults, "Dentix");
            }
        } catch (supabaseError) {
            const errorMessage = supabaseError instanceof Error ? supabaseError.message : String(supabaseError);
            console.log('⚠️ Supabase no disponible, usando búsqueda local:', errorMessage);
        }
        
        // Fallback: Buscar en archivos locales de texto
        const results = await searchInLocalTextFiles(query);
        
        if (!results || results.length === 0) {
            return "Lo siento, no encontré información específica sobre tu consulta en los documentos de Dentix. ¿Podrías reformular tu pregunta o ser más específico?";
        }
        
        console.log('✅ Usando resultados de búsqueda local');
        return formatLocalResults(results);
    } catch (error) {
        console.error('Error in searchDentixDocuments:', error);
        return "Lo siento, ocurrió un error al buscar en los documentos de Dentix. Por favor intenta nuevamente.";
    }
}

/**
 * Formatea resultados de Supabase de forma genérica y robusta
 * @param results - Array de resultados de la búsqueda vectorial
 * @param serviceName - Nombre del servicio (ej. "Dentix", "Credintegral") para personalizar la respuesta
 * @returns Resultados formateados como un string
 */
function formatSupabaseResults(results: any[], serviceName: string): string {
    let response = `Según la información de nuestra base de datos de ${serviceName}, esto es lo que encontré:\n\n`;
    
    results.forEach((result, index) => {
        // Manejo seguro de metadata y fileName
        const fileName = result.metadata?.fileName || `Documento de ${serviceName}`;
        response += `📄 **${fileName.replace('.txt', '')}**\n`;
        response += `${result.content}\n`;
        response += `(Similitud: ${(result.similarity * 100).toFixed(1)}%)\n`;
        if (index < results.length - 1) response += "\n---\n\n";
    });
    
    return response;
}

/**
 * Formatea resultados de búsqueda local
 */
function formatLocalResults(results: Array<{fileName: string, content: string, score: string}>): string {
    let response = "Encontré la siguiente información en los documentos de Dentix:\n\n";
    
    results.forEach((result, index) => {
        response += `📄 **${result.fileName.replace('.txt', '')}**\n`;
        response += `${result.content}\n`;
        response += `(Relevancia: ${result.score})\n`;
        response += "\n---\n\n";
    });
    
    return response;
}

/**
 * Busca en archivos de texto locales como sistema de fallback
 */
async function searchInLocalTextFiles(query: string): Promise<Array<{fileName: string, content: string, score: string}>> {
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const dentixFolder = path.join(__dirname, '../../Dentix-pdf');
    
    const results: Array<{fileName: string, content: string, score: string}> = [];
    
    try {
        // Verificar si existe la carpeta
        if (!fs.existsSync(dentixFolder)) {
            console.log('❌ Carpeta Dentix-pdf no encontrada');
            return results;
        }
        
        // Leer archivos .txt
        const files = fs.readdirSync(dentixFolder);
        const txtFiles = files.filter(file => file.endsWith('.txt'));
        
        if (txtFiles.length === 0) {
            console.log('❌ No se encontraron archivos .txt en Dentix-pdf');
            return results;
        }
        
        console.log(`📁 Buscando en ${txtFiles.length} archivos .txt`);
        
        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
        
        for (const txtFile of txtFiles) {
            const filePath = path.join(dentixFolder, txtFile);
            const content = fs.readFileSync(filePath, 'utf-8');
            const contentLower = content.toLowerCase();
            
            let score = 0;
            let matchedSections: string[] = [];
            
            // Buscar palabras clave
            for (const word of queryWords) {
                if (contentLower.includes(word)) {
                    score += 1;
                }
            }
            
            // Buscar frase completa
            if (contentLower.includes(queryLower)) {
                score += 3;
            }
            
            // Si hay coincidencias, encontrar las secciones relevantes
            if (score > 0) {
                const lines = content.split('\n');
                const relevantLines: string[] = [];
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    const lineLower = line.toLowerCase();
                    
                    // Verificar si la línea contiene alguna palabra clave
                    const hasKeyword = queryWords.some(word => lineLower.includes(word));
                    
                    if (hasKeyword) {
                        // Incluir contexto (líneas anteriores y posteriores)
                        const start = Math.max(0, i - 2);
                        const end = Math.min(lines.length, i + 3);
                        
                        const contextLines = lines.slice(start, end).join('\n');
                        if (!matchedSections.some(section => section.includes(contextLines.substring(0, 50)))) {
                            matchedSections.push(contextLines);
                        }
                    }
                }
                
                // Combinar las secciones relevantes
                const relevantContent = matchedSections.length > 0 
                    ? matchedSections.join('\n\n...\n\n')
                    : content.substring(0, 500) + '...';
                
                results.push({
                    fileName: txtFile.replace('.txt', ''),
                    content: relevantContent,
                    score: `${score} coincidencias`
                });
            }
        }
        
        // Ordenar por score descendente
        results.sort((a, b) => {
            const scoreA = parseInt(a.score.split(' ')[0]);
            const scoreB = parseInt(b.score.split(' ')[0]);
            return scoreB - scoreA;
        });
        
        // Limitar a 3 resultados
        return results.slice(0, 3);
        
    } catch (error) {
        console.error('Error en searchInLocalTextFiles:', error);
        return results;
    }
}

/*
 * Busca información en los documentos de Credintegral usando búsqueda híbrida (Supabase + local)
 * @param query - La consulta del usuario
 * @returns Resultados formateados de la búsqueda
 */
export async function searchCredintegralDocuments(query: string): Promise<string> {
    console.log('🔍 Buscando en documentos de Credintegral:', query);
    
    try {
        console.log('🔄 Intentando búsqueda vectorial en Supabase...');
        const supabaseResults = await searchCredintegralVectors(query);
        
        if (supabaseResults && supabaseResults.length > 0) {
            console.log('✅ Usando resultados de Supabase para Credintegral');
            return formatSupabaseResults(supabaseResults, "Credintegral");
        }

        return "Lo siento, no encontré información específica sobre tu consulta en los documentos de Credintegral. ¿Podrías reformular tu pregunta o ser más específico?";

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Error al buscar en Supabase para Credintegral:', errorMessage);
        return "Lo siento, ocurrió un error al buscar en los documentos de Credintegral. Por favor intenta nuevamente.";
    }
}

/**
 * Configuración para Supabase (reutilizable)
 */
const createSupabaseClient = () => createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!
);

/**
 * Busca un cliente de Dentix por número telefónico
 * @param phoneNumber - El número telefónico del cliente
 * @returns Información del cliente si existe, null si no se encuentra
 */
export async function searchDentixClientByPhone(phoneNumber: string): Promise<{ name: string; email: string; phone_number: string; service?: string; } | null> {
    console.log(`🔍 Buscando cliente en Supabase con número: ${phoneNumber}`);
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Supabase URL o KEY no están definidos en las variables de entorno');
        return null;
    }

    const supabase = createSupabaseClient();
    
    // 1. Limpiar el número telefónico (quitar espacios, guiones, paréntesis)
    const cleanPhoneNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // 2. Construir una lista de posibles números a buscar
    const searchVariations = new Set<string>();
    searchVariations.add(cleanPhoneNumber); // Tal como viene

    // Si tiene +, buscar sin +
    if (cleanPhoneNumber.startsWith('+')) {
        searchVariations.add(cleanPhoneNumber.substring(1)); // Sin el +
        searchVariations.add(cleanPhoneNumber.substring(3)); // Sin el +57
    } else {
        // Si no tiene +, agregar versiones con +
        searchVariations.add('+' + cleanPhoneNumber); // Con +
        // Si es un número colombiano de 10 dígitos, agregar la versión completa
        if (cleanPhoneNumber.length === 10) {
            searchVariations.add('+57' + cleanPhoneNumber);
        }
    }

    const variationsToSearch = Array.from(searchVariations);
    console.log(`🔍 Búsquedas para el número "${phoneNumber}":`, variationsToSearch);

    try {
        // 3. Buscar en la base de datos con todas las variaciones
        const { data, error } = await supabase
            .from('dentix_clients')
            .select('name, email, phone_number, service')
            .in('phone_number', variationsToSearch)
            .maybeSingle(); // .maybeSingle() para que no dé error si encuentra 0 o 1

        if (error) {
            throw new Error(`Error en la búsqueda de cliente Dentix: ${error.message}`);
        }

        if (data) {
            console.log(`✅ Cliente encontrado para "${phoneNumber}":`, data.name);
        } else {
            console.log(`❌ No se encontró cliente para "${phoneNumber}" con las variaciones probadas.`);
        }
        
        return data || null;
    } catch (error) {
        console.error('Error buscando cliente Dentix:', error);
        return null;
    }
}

/**
 * Registra un nuevo cliente en la tabla dentix_clients
 * @param name - Nombre completo del cliente
 * @param email - Correo electrónico del cliente
 * @param phone_number - Número de celular del cliente
 * @param service - Tipo de seguro/servicio de interés
 * @returns Resultado de la operación
 */
export async function registerDentixClient({ name, email, phone_number, service }: { name: string; email: string; phone_number: string; service: string; }): Promise<{ success: boolean; message: string; }> {
    const supabase = createSupabaseClient();
    try {
        const { data, error } = await supabase
            .from('dentix_clients')
            .insert([
                { name, email, phone_number, service }
            ]);
        if (error) {
            return { success: false, message: `Error al registrar el cliente: ${error.message}` };
        }
        return { success: true, message: 'Cliente registrado exitosamente.' };
    } catch (err: any) {
        return { success: false, message: `Error inesperado: ${err.message}` };
    }
}

export async function sendPaymentLinkEmail(clientName: string, clientEmail: string, insuranceName: string): Promise<string> {
    console.log(`📧 Intentando enviar correo de pago a ${clientName} (${clientEmail}) por el seguro ${insuranceName}`);

    const emailContent = `
        Hola ${clientName},

        ¡Felicitaciones por dar el primer paso para asegurar tu tranquilidad con nuestro ${insuranceName}!

        Estás a un solo clic de finalizar la adquisición de tu seguro. Por favor, utiliza el siguiente enlace para completar el pago de forma segura.

        Enlace de pago: https://pagos.coltefinanciera.com/12345?cliente=${encodeURIComponent(clientEmail)}

        Gracias por confiar en Coltefinanciera Seguros.

        Saludos,
        Lucia
        Asesora de Seguros
    `;

    const msg = {
        to: clientEmail,
        from: 'grow@ultimmarketing.com', // <-- 🚨 REEMPLAZA ESTO con tu email verificado en SendGrid
        subject: `Finaliza la compra de tu ${insuranceName}`,
        text: emailContent,
        html: emailContent.replace(/\n/g, '<br>'),
    };

    if (!process.env.SENDGRID_API_KEY) {
        return JSON.stringify({
            success: false,
            message: 'Error: El servicio de correo no está configurado (falta SENDGRID_API_KEY).'
        });
    }

    try {
        await sgMail.send(msg);
        console.log(`✅ Correo enviado exitosamente a ${clientEmail}`);
        return JSON.stringify({
            success: true,
            message: `Correo con enlace de pago enviado exitosamente a ${clientEmail}.`
        });
    } catch (error: any) {
        console.error('❌ Error al enviar el correo con SendGrid:', error);
        if (error.response) {
            console.error(error.response.body);
        }
        return JSON.stringify({
            success: false,
            message: `Error al enviar el correo: ${error.message}`
        });
    }
}