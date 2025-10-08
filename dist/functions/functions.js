//import colombia from '../data/colombia.json';
import { searchDentixVectors, searchCredintegralVectors } from './retrievers.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import sgMail from '@sendgrid/mail';
dotenv.config();
// Configurar SendGrid
if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}
else {
    console.warn('SENDGRID_API_KEY no está definida. El envío de correos no funcionará.');
}
// Función para solucionar problema con camara que no da imagen
export function troubleshootIssue(issue) {
    console.log('troubleshootIssue executed');
    let result;
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
    }
    return JSON.stringify(result);
}
export function getInsuranceInfo(insuranceType) {
    const insurances = {
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
export async function searchDentixDocuments(query) {
    try {
        console.log('searchDentixDocuments executed with query:', query); // Intentar primero búsqueda vectorial en Supabase
        try {
            const supabaseResults = await searchDentixVectors(query);
            if (supabaseResults && supabaseResults.length > 0) {
                console.log('✅ Usando resultados de Supabase para Dentix');
                return formatSupabaseResults(supabaseResults, "Dentix");
            }
        }
        catch (supabaseError) {
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
    }
    catch (error) {
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
function formatSupabaseResults(results, serviceName) {
    let response = `Según la información de nuestra base de datos de ${serviceName}, esto es lo que encontré:\n\n`;
    results.forEach((result, index) => {
        // Manejo seguro de metadata y fileName
        const fileName = result.metadata?.fileName || `Documento de ${serviceName}`;
        response += `📄 **${fileName.replace('.txt', '')}**\n`;
        response += `${result.content}\n`;
        response += `(Similitud: ${(result.similarity * 100).toFixed(1)}%)\n`;
        if (index < results.length - 1)
            response += "\n---\n\n";
    });
    return response;
}
/**
 * Formatea resultados de búsqueda local
 */
function formatLocalResults(results) {
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
async function searchInLocalTextFiles(query) {
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const dentixFolder = path.join(__dirname, '../../Dentix-pdf');
    const results = [];
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
            let matchedSections = [];
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
                const relevantLines = [];
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
    }
    catch (error) {
        console.error('Error en searchInLocalTextFiles:', error);
        return results;
    }
}
/*
 * Busca información en los documentos de Credintegral usando búsqueda híbrida (Supabase + local)
 * @param query - La consulta del usuario
 * @returns Resultados formateados de la búsqueda
 */
export async function searchCredintegralDocuments(query) {
    console.log('🔍 Buscando en documentos de Credintegral:', query);
    try {
        console.log('🔄 Intentando búsqueda vectorial en Supabase...');
        const supabaseResults = await searchCredintegralVectors(query);
        if (supabaseResults && supabaseResults.length > 0) {
            console.log('✅ Usando resultados de Supabase para Credintegral');
            return formatSupabaseResults(supabaseResults, "Credintegral");
        }
        return "Lo siento, no encontré información específica sobre tu consulta en los documentos de Credintegral. ¿Podrías reformular tu pregunta o ser más específico?";
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Error al buscar en Supabase para Credintegral:', errorMessage);
        return "Lo siento, ocurrió un error al buscar en los documentos de Credintegral. Por favor intenta nuevamente.";
    }
}
// FUNCIÓN COMENTADA: Esta función devuelve precio hardcodeado ($500) que viola las restricciones
// de precio para clientes existentes con service="vidadeudor". La función ha sido deshabilitada
// para evitar que el agente acceda al precio real después de los 3 meses gratuitos.
/*
export async function searchVidaDeudorDocuments(query: string): Promise<string> {
    console.log('🔍 [VIDA DEUDOR] Procesando consulta:', query);

    // PASO 1: DETECTAR CONSULTAS DE PRECIO DE MANERA MÁS AGRESIVA
    const isPriceQuery = /precio|cuesta|vale|pagar|costo|cuánto|cuanto|tarifa|valor|cotización|económica/i.test(query);

    if (isPriceQuery) {
        console.log('💰 [PRECIO DETECTADO] Para clientes nuevos...');

        // RETORNO DEL PRECIO SOLO PARA CLIENTES NUEVOS
        // NOTA: Para clientes existentes con service="vidadeudor", el agente debe manejar esto según el prompt
        return `💰 **INFORMACIÓN SOBRE LA ASISTENCIA VIDA DEUDOR**

La asistencia Vida Deudor tiene un costo de **$500** por persona al mes para usuarios regulares.

📋 **DETALLES DE LA TARIFA:**
• Tarifa mensual por persona: $500
• Tarifa completa con IVA del 19% incluido
• Tarifa propuesta para productos mandatorios

⚠️ **NOTA IMPORTANTE:** Si eres cliente existente con un servicio/crédito activo, puedes tener beneficios especiales. Tu asesor te informará sobre cualquier promoción disponible.

📋 **COBERTURAS INCLUIDAS:**
• Teleconsulta medicina general (2 eventos por año)
• Telenutrición (ilimitado)
• Telepsicología (2 eventos por año)
• Descuentos en farmacias (ilimitado)

---
📄 Información extraída de la propuesta económica oficial de Vida Deudor.

**PRECIO ESTÁNDAR: $500 por persona al mes**`;
    }

    // PASO 2: Para consultas que NO son de precio, usar búsqueda normal
    try {
        console.log('🔄 Intentando búsqueda vectorial en Supabase...');
        const { searchVidaDeudorVectors } = await import('./retrievers');
        const supabaseResults = await searchVidaDeudorVectors(query);

        if (supabaseResults && supabaseResults.length > 0) {
            console.log('✅ Usando resultados de Supabase para Vida Deudor');
            return formatSupabaseResults(supabaseResults, "Vida Deudor");
        }

        return "Lo siento, no encontré información específica sobre tu consulta en los documentos de Vida Deudor. ¿Podrías reformular tu pregunta o ser más específico?";

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Error al buscar en Supabase para Vida Deudor:', errorMessage);
        return "Lo siento, ocurrió un error al buscar en los documentos de Vida Deudor. Por favor intenta nuevamente.";
    }
}
*/
/**
 * Configuración para Supabase (reutilizable)
 */
const createSupabaseClient = () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
/**
 * Busca un cliente de Dentix por número telefónico
 * @param phoneNumber - El número telefónico del cliente
 * @returns Información del cliente si existe, null si no se encuentra
 */
export async function searchDentixClientByPhone(phoneNumber) {
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
    const searchVariations = new Set();
    searchVariations.add(cleanPhoneNumber); // Tal como viene
    // Si tiene +, buscar sin +
    if (cleanPhoneNumber.startsWith('+')) {
        searchVariations.add(cleanPhoneNumber.substring(1)); // Sin el +
        searchVariations.add(cleanPhoneNumber.substring(3)); // Sin el +57
    }
    else {
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
            .select('name, email, phone_number, service, product, document_id')
            .in('phone_number', variationsToSearch)
            .maybeSingle(); // .maybeSingle() para que no dé error si encuentra 0 o 1
        if (error) {
            throw new Error(`Error en la búsqueda de cliente Dentix: ${error.message}`);
        }
        if (data) {
            console.log(`✅ Cliente encontrado para "${phoneNumber}":`, data.name);
        }
        else {
            console.log(`❌ No se encontró cliente para "${phoneNumber}" con las variaciones probadas.`);
        }
        return data || null;
    }
    catch (error) {
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
export async function registerDentixClient({ name, email, phone_number, service }) {
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
    }
    catch (err) {
        return { success: false, message: `Error inesperado: ${err.message}` };
    }
}
export async function sendPaymentLinkEmail(clientName, clientEmail, insuranceName) {
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
        from: "notificaciones@asistenciacoltefinanciera.com", // <-- 🚨 REEMPLAZA ESTO con tu email verificado en SendGrid
        subject: `Finaliza la compra de tu ${insuranceName}`,
        text: emailContent,
        html: emailContent.replace(/\n/g, "<br>"),
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
    }
    catch (error) {
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
/**
 * Busca información específica en los documentos de SOAT almacenados en Supabase
 * @param query - La consulta del usuario para buscar en los documentos de SOAT
 * @returns Resultados de la búsqueda o mensaje de error
 */
export async function searchSoatDocuments(query) {
    console.log(`🛡️ [SOAT] Procesando consulta: "${query}"`);
    // PASO 0: DETECTAR SELECCIÓN DE CATEGORÍA (nueva funcionalidad)
    const categorySelectionResult = await handleCategorySelection(query);
    if (categorySelectionResult) {
        console.log('✅ [CATEGORÍA DETECTADA] Procesando selección de categoría');
        return categorySelectionResult;
    }
    // PASO 1: DETECTAR CONSULTAS DE PRECIO (EXCLUYENDO MULTAS/SANCIONES)
    const isPriceQuery = /precio|cuesta|vale|pagar|costo|cuánto|cuanto|tarifa|valor|cotización|económica|cuánto.*cuesta|cuanto.*vale/i.test(query);
    const isFineQuery = /multa|sanción|sancion|deuda|infracción|infraccion|penalidad|castigo|comparendo|contravencion|contravención/i.test(query);
    // Solo activar respuesta de precio si es consulta de precio Y NO es sobre multas/sanciones
    if (isPriceQuery && !isFineQuery) {
        console.log('💰 [PRECIO DETECTADO] Solicitando categoría del vehículo para precio exacto');
        try {
            // Obtener categorías disponibles de la base de datos
            const categories = await getSoatCategories();
            if (categories.length > 0) {
                let response = `💰 **CONSULTA DE PRECIOS SOAT 2025**\n\n`;
                response += `Para darte el precio exacto del SOAT, necesito saber qué tipo de vehículo tienes.\n\n`;
                response += `📋 **Selecciona la categoría de tu vehículo:**\n\n`;
                categories.forEach((category, index) => {
                    // Convertir nombres técnicos a nombres más amigables
                    const friendlyName = category
                        .replace(/_/g, ' ')
                        .toLowerCase()
                        .replace(/\b\w/g, (l) => l.toUpperCase());
                    response += `${index + 1}. **${friendlyName}**\n`;
                });
                response += `\n💬 **Responde con el número o nombre de la categoría** (ej: "1" o "Motos")\n\n`;
                response += `ℹ️ Una vez selecciones la categoría, te mostraré el precio exacto del SOAT para 2025.`;
                return response;
            }
            else {
                // Fallback en caso de error obteniendo categorías
                return `💰 **INFORMACIÓN SOBRE PRECIOS DEL SOAT**

El precio del SOAT (Seguro Obligatorio de Accidentes de Tránsito) varía según el tipo de vehículo y su uso. Para generar una cotización personalizada y precisa, necesito la siguiente información:

📋 **DATOS DEL VEHÍCULO:**
• **Tipo de vehículo** (Automóvil, motocicleta, camioneta, etc.)
• **Cilindraje del motor** (para motos y algunos vehículos)
• **Año del vehículo** (modelo y año de fabricación)
• **Placa del vehículo** (para verificar historial)
• **Uso del vehículo** (particular, público, carga, etc.)

👤 **DATOS DEL PROPIETARIO:**
• **Cédula del propietario** (para verificar datos)
• **Ciudad de circulación** (donde se usa principalmente)

🎯 **¿POR QUÉ NECESITAMOS ESTA INFORMACIÓN?**
• El **tipo y cilindraje** determinan la categoría tarifaria
• El **año** afecta el valor comercial y riesgo
• El **uso** (particular vs comercial) modifica las tarifas
• La **ciudad** influye en los factores de riesgo regional

Una vez que tengas esta información completa, podremos generar una cotización personalizada del SOAT con los mejores precios disponibles.

¿Te gustaría proporcionarme estos datos para proceder con tu cotización SOAT?`;
            }
        }
        catch (error) {
            console.error('❌ Error obteniendo categorías:', error);
            return "Lo siento, ocurrió un error al obtener las categorías de vehículos. Por favor intenta nuevamente.";
        }
    }
    // PASO 2: Si es consulta sobre multas/sanciones, buscar en base de datos
    if (isFineQuery) {
        console.log('⚖️ [MULTA/SANCIÓN DETECTADA] Buscando información real en base de datos de SOAT');
        try {
            // Para consultas de multas, buscar específicamente "Consecuencias de no tener SOAT vigente"
            console.log('🔍 Buscando información específica sobre consecuencias...');
            const supabase = createSupabaseClient();
            const { data: consecuenciasResults, error } = await supabase
                .from('soat_documents')
                .select('id, content, metadata')
                .or('content.ilike.%Consecuencias de no tener SOAT%,content.ilike.%consecuencias%,content.ilike.%multa%,content.ilike.%sanción%,content.ilike.%penalidad%')
                .limit(3);
            if (error) {
                console.error('❌ Error buscando consecuencias:', error);
                return "Lo siento, ocurrió un error al buscar información sobre las consecuencias de no tener SOAT. Por favor intenta nuevamente.";
            }
            if (consecuenciasResults && consecuenciasResults.length > 0) {
                console.log('✅ Encontrada información sobre consecuencias y multas');
                let response = "Según la información oficial de SOAT, esto es lo que encontré sobre las consecuencias:\n\n";
                consecuenciasResults.forEach((result, index) => {
                    response += `📋 **Información Oficial ${index + 1}:**\n`;
                    response += `${result.content}\n\n`;
                    if (index < consecuenciasResults.length - 1) {
                        response += "---\n\n";
                    }
                });
                return response;
            }
            return "Lo siento, no encontré información específica sobre las consecuencias o multas en los documentos de SOAT. ¿Podrías reformular tu pregunta?";
        }
        catch (error) {
            console.error('❌ Error al buscar consecuencias:', error);
            return "Lo siento, ocurrió un error al buscar información sobre las consecuencias. Por favor intenta nuevamente.";
        }
    }
    try {
        // Para consultas que NO son de precio de cotización, usar búsqueda vectorial
        console.log('🔄 Intentando búsqueda vectorial en Supabase para SOAT...');
        const { searchSoatVectors } = await import('./retrievers');
        const supabaseResults = await searchSoatVectors(query);
        if (supabaseResults && supabaseResults.length > 0) {
            console.log('✅ Usando resultados vectoriales para SOAT');
            return formatSupabaseResults(supabaseResults, "SOAT");
        }
        // Fallback: búsqueda simple en caso de que la vectorial no funcione
        const supabase = createSupabaseClient();
        const { data: soatResults, error } = await supabase
            .from('soat_documents')
            .select('id, content, metadata')
            .ilike('content', `%${query}%`)
            .limit(3);
        if (error) {
            console.error('❌ Error en búsqueda fallback SOAT:', error);
            return "Lo siento, ocurrió un error al buscar en los documentos de SOAT. Por favor intenta nuevamente.";
        }
        if (!soatResults || soatResults.length === 0) {
            return "Lo siento, no encontré información específica sobre tu consulta en los documentos de SOAT. ¿Podrías reformular tu pregunta o ser más específico sobre el seguro obligatorio de accidentes de tránsito?";
        }
        console.log('✅ Encontrados', soatResults.length, 'resultados en soat_documents');
        // Formatear resultados usando fallback simple
        let response = "Según la información de nuestra base de datos de SOAT, esto es lo que encontré:\n\n";
        soatResults.forEach((result, index) => {
            response += `📄 **Información ${index + 1}:**\n`;
            response += `${result.content.substring(0, 400)}...\n\n`;
        });
        return response;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Error al buscar en Supabase para SOAT:', errorMessage);
        return "Lo siento, ocurrió un error al buscar en los documentos de SOAT. Por favor intenta nuevamente.";
    }
}
/**
 * Función de prueba para verificar conexión con tabla soat_prices_2025
 * @returns Información sobre la conexión y estructura de la tabla
 */
export async function testSoatPricesConnection() {
    console.log('🔍 [SOAT PRICES] Probando conexión con tabla soat_prices_2025...');
    try {
        const supabase = createSupabaseClient();
        // Test básico de conexión
        const { data: testData, error: testError } = await supabase
            .from('soat_prices_2025')
            .select('*')
            .limit(3);
        if (testError) {
            console.error('❌ Error conectando a soat_prices_2025:', testError);
            return `❌ Error de conexión: ${testError.message}`;
        }
        console.log('✅ CONEXIÓN EXITOSA a soat_prices_2025');
        console.log(`📊 Registros obtenidos: ${testData?.length || 0}`);
        if (testData && testData.length > 0) {
            // Obtener estructura de columnas
            const columns = Object.keys(testData[0]);
            console.log('📋 Columnas disponibles:', columns);
            let response = `✅ **CONEXIÓN EXITOSA A TABLA soat_prices_2025**\n\n`;
            response += `📊 **Registros encontrados:** ${testData.length}\n\n`;
            response += `📋 **Columnas disponibles:**\n`;
            columns.forEach(col => {
                response += `• ${col}\n`;
            });
            response += `\n📄 **Ejemplo de datos:**\n`;
            testData.forEach((record, index) => {
                response += `\n**Registro ${index + 1}:**\n`;
                Object.entries(record).forEach(([key, value]) => {
                    response += `- ${key}: ${value}\n`;
                });
            });
            return response;
        }
        else {
            return "⚠️ Conexión exitosa pero la tabla no contiene datos";
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Error general en testSoatPricesConnection:', errorMessage);
        return `❌ Error: ${errorMessage}`;
    }
}
/**
 * Obtiene todas las categorías disponibles de vehículos en la tabla soat_prices_2025
 * @returns Array de categorías únicas disponibles
 */
export async function getSoatCategories() {
    console.log('📋 [SOAT PRICES] Obteniendo categorías disponibles...');
    try {
        const supabase = createSupabaseClient();
        const { data: categoriesData, error } = await supabase
            .from('soat_prices_2025')
            .select('categoria')
            .not('categoria', 'is', null);
        if (error) {
            console.error('❌ Error obteniendo categorías:', error);
            return [];
        }
        if (categoriesData && categoriesData.length > 0) {
            // Extraer categorías únicas
            const uniqueCategories = [...new Set(categoriesData.map(item => item.categoria))];
            console.log('✅ Categorías encontradas:', uniqueCategories);
            return uniqueCategories;
        }
        return [];
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Error general en getSoatCategories:', errorMessage);
        return [];
    }
}
/**
 * Obtiene todos los subtipos disponibles para una categoría específica en la tabla soat_prices_2025
 * @param categoria - La categoría del vehículo (ej: MOTOS, AUTOS)
 * @returns Array de subtipos únicos para esa categoría (solo si existen)
 */
export async function getSoatSubtypesByCategory(categoria) {
    console.log(`🔍 [SOAT PRICES] Obteniendo subtipos para categoría: ${categoria}`);
    try {
        const supabase = createSupabaseClient();
        const { data: subtypesData, error } = await supabase
            .from('soat_prices_2025')
            .select('subtipo')
            .eq('categoria', categoria)
            .not('subtipo', 'is', null)
            .neq('subtipo', '');
        if (error) {
            console.error('❌ Error obteniendo subtipos:', error);
            return [];
        }
        if (subtypesData && subtypesData.length > 0) {
            // Extraer subtipos únicos que no sean null o vacíos
            const uniqueSubtypes = [...new Set(subtypesData
                    .map(item => item.subtipo)
                    .filter(subtipo => subtipo && subtipo.trim() !== ''))];
            console.log(`✅ Subtipos encontrados para ${categoria}:`, uniqueSubtypes);
            return uniqueSubtypes;
        }
        console.log(`ℹ️ No se encontraron subtipos para la categoría: ${categoria}`);
        return [];
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Error general en getSoatSubtypesByCategory:', errorMessage);
        return [];
    }
}
/**
 * Obtiene el precio exacto del SOAT basado en categoría y subtipo (si aplica)
 * @param categoria - La categoría del vehículo
 * @param subtipo - El subtipo del vehículo (opcional)
 * @returns Información completa del precio SOAT
 */
export async function getSoatPriceByCategory(categoria, subtipo) {
    console.log(`💰 [SOAT PRICES] Obteniendo precio para categoría: ${categoria}, subtipo: ${subtipo || 'N/A'}`);
    try {
        const supabase = createSupabaseClient();
        let query = supabase
            .from('soat_prices_2025')
            .select('*')
            .eq('categoria', categoria);
        // Si se proporciona subtipo, agregarlo a la consulta
        if (subtipo) {
            query = query.eq('subtipo', subtipo);
        }
        const { data: priceData, error } = await query;
        if (error) {
            console.error('❌ Error obteniendo precio SOAT:', error);
            return "❌ Error al consultar los precios del SOAT. Por favor intenta nuevamente.";
        }
        if (!priceData || priceData.length === 0) {
            return "❌ No se encontraron precios para la categoría y subtipo especificados.";
        }
        // Formatear respuesta con los precios encontrados
        let response = `💰 **PRECIOS SOAT 2025**\n\n`;
        response += `📋 **Categoría:** ${categoria.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())}\n`;
        if (subtipo) {
            response += `🔸 **Subtipo:** ${subtipo}\n`;
        }
        response += `\n📊 **PRECIOS DISPONIBLES:**\n\n`;
        priceData.forEach((record, index) => {
            response += `**${index + 1}. `;
            if (record.subtipo) {
                response += `${record.subtipo}`;
            }
            else {
                response += record.categoria.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
            }
            if (record.cilindrada_cc) {
                response += ` (${record.cilindrada_cc})`;
            }
            response += `:**\n`;
            response += `💵 **Precio Total:** $${record.total_a_pagar?.toLocaleString() || 'N/A'}\n`;
            if (record.tarifa_maxima && record.tarifa_maxima !== record.total_a_pagar) {
                response += `📋 Tarifa Máxima: $${record.tarifa_maxima.toLocaleString()}\n`;
            }
            response += `\n`;
        });
        response += `✅ **Estos son los precios oficiales del SOAT para 2025**\n\n`;
        response += `🎯 **¿Te gustaría proceder con la compra de tu SOAT?**\n`;
        response += `📞 Puedo ayudarte con el proceso de adquisición paso a paso.`;
        return response;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Error general en getSoatPriceByCategory:', errorMessage);
        return "❌ Error al consultar los precios del SOAT. Por favor intenta nuevamente.";
    }
}
/**
 * Detecta si el usuario está seleccionando una categoría y maneja la lógica de precios
 * @param query - La consulta del usuario
 * @returns Información de precio o solicitud de subtipo si es necesario
 */
export async function handleCategorySelection(query) {
    console.log(`🔍 [SOAT] Analizando posible selección de categoría: "${query}"`);
    // Obtener todas las categorías disponibles
    const categories = await getSoatCategories();
    // Detectar selección por número
    const numberMatch = query.match(/^\s*(\d+)\s*$/);
    if (numberMatch) {
        const categoryIndex = parseInt(numberMatch[1]) - 1;
        if (categoryIndex >= 0 && categoryIndex < categories.length) {
            const selectedCategory = categories[categoryIndex];
            console.log(`✅ Categoría seleccionada por número: ${selectedCategory}`);
            return await processCategorySelection(selectedCategory);
        }
    }
    // Detectar selección por nombre (parcial o completo)
    const queryLower = query.toLowerCase();
    const matchedCategory = categories.find(category => {
        const categoryFriendly = category.replace(/_/g, ' ').toLowerCase();
        return queryLower.includes(categoryFriendly) ||
            categoryFriendly.includes(queryLower) ||
            queryLower === category.toLowerCase();
    });
    if (matchedCategory) {
        console.log(`✅ Categoría seleccionada por nombre: ${matchedCategory}`);
        return await processCategorySelection(matchedCategory);
    }
    // No se detectó selección de categoría
    return null;
}
/**
 * Procesa la selección de una categoría específica
 * @param categoria - La categoría seleccionada
 * @returns Respuesta con precios o solicitud de subtipo
 */
async function processCategorySelection(categoria) {
    console.log(`⚙️ [SOAT] Procesando selección de categoría: ${categoria}`);
    // Verificar si esta categoría tiene subtipos
    const subtypes = await getSoatSubtypesByCategory(categoria);
    if (subtypes.length > 0) {
        // Esta categoría tiene subtipos, solicitar al usuario que seleccione uno
        let response = `🔸 **SUBTIPOS DISPONIBLES PARA ${categoria.replace(/_/g, ' ').toUpperCase()}**\n\n`;
        response += `Tu categoría de vehículo tiene varios subtipos con precios diferentes.\n\n`;
        response += `📋 **Selecciona el subtipo específico:**\n\n`;
        subtypes.forEach((subtype, index) => {
            response += `${index + 1}. **${subtype}**\n`;
        });
        response += `\n💬 **Responde con el número o nombre del subtipo** (ej: "1" o "${subtypes[0]}")\n\n`;
        response += `ℹ️ Una vez selecciones el subtipo, te mostraré el precio exacto.`;
        return response;
    }
    else {
        // Esta categoría no tiene subtipos, mostrar precio directamente
        return await getSoatPriceByCategory(categoria);
    }
}
/**
 * Detecta si el usuario está seleccionando un subtipo y obtiene el precio
 * @param query - La consulta del usuario
 * @param categoria - La categoría previamente seleccionada (debe manejarse en el contexto)
 * @returns Precio específico del subtipo seleccionado
 */
export async function handleSubtypeSelection(query, categoria) {
    console.log(`🔍 [SOAT] Analizando posible selección de subtipo para ${categoria}: "${query}"`);
    // Obtener subtipos de la categoría
    const subtypes = await getSoatSubtypesByCategory(categoria);
    if (subtypes.length === 0) {
        return null; // No hay subtipos para esta categoría
    }
    // Detectar selección por número
    const numberMatch = query.match(/^\s*(\d+)\s*$/);
    if (numberMatch) {
        const subtypeIndex = parseInt(numberMatch[1]) - 1;
        if (subtypeIndex >= 0 && subtypeIndex < subtypes.length) {
            const selectedSubtype = subtypes[subtypeIndex];
            console.log(`✅ Subtipo seleccionado por número: ${selectedSubtype}`);
            return await getSoatPriceByCategory(categoria, selectedSubtype);
        }
    }
    // Detectar selección por nombre (parcial o completo)
    const queryLower = query.toLowerCase();
    const matchedSubtype = subtypes.find(subtype => {
        const subtypeLower = subtype.toLowerCase();
        return queryLower.includes(subtypeLower) ||
            subtypeLower.includes(queryLower);
    });
    if (matchedSubtype) {
        console.log(`✅ Subtipo seleccionado por nombre: ${matchedSubtype}`);
        return await getSoatPriceByCategory(categoria, matchedSubtype);
    }
    // No se detectó selección de subtipo
    return null;
}
