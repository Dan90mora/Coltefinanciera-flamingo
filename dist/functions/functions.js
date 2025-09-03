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
    const isPriceQuery = /precio|cuesta|vale|pagar|costo|cuánto|cuanto|tarifa|valor|cotización|económica|propuesta/i.test(query);

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
    try { // 3. Buscar en la base de datos con todas las variaciones
        const { data, error } = await supabase
            .from('dentix_clients')
            .select('name, email, phone_number, service, product')
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
 * Confirma los datos del cliente existente y permite actualizarlos si es necesario
 * @param phoneNumber - Número de teléfono del cliente
 * @param updates - Objeto con los campos a actualizar (opcional)
 * @returns Información del cliente y confirmación de la operación
 */
export async function confirmAndUpdateClientData(phoneNumber, updates) {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    console.log(`🔍 Confirmando datos del cliente con número: ${phoneNumber}`);
    try {
        // Primero buscar el cliente existente
        const searchVariations = [
            phoneNumber,
            `+${phoneNumber}`,
            `+57${phoneNumber}`
        ];
        let clientData = null;
        for (const variation of searchVariations) {
            const { data, error } = await supabase
                .from('dentix_clients')
                .select('*')
                .eq('phone_number', variation);
            if (error) {
                console.error('❌ Error buscando cliente:', error);
                continue;
            }
            if (data && data.length > 0) {
                clientData = data[0];
                console.log(`✅ Cliente encontrado con variación: ${variation}`);
                break;
            }
        }
        if (!clientData) {
            return JSON.stringify({
                success: false,
                message: 'No se encontró un cliente con ese número de teléfono.'
            });
        }
        // Si no hay actualizaciones, solo devolver los datos actuales para confirmación
        if (!updates) {
            console.log('📋 Mostrando datos actuales para confirmación');
            return JSON.stringify({
                success: true,
                action: 'show_current_data',
                currentData: {
                    name: clientData.name,
                    email: clientData.email,
                    phoneNumber: clientData.phone_number,
                    service: clientData.service
                },
                message: `Estos son tus datos actuales:
• Nombre: ${clientData.name}
• Email: ${clientData.email}
• Número de teléfono: ${clientData.phone_number}
• Servicio de interés: ${clientData.service}

¿Todos los datos son correctos o hay algo que necesites actualizar?`
            });
        }
        // Si hay actualizaciones, aplicarlas
        console.log('✏️ Aplicando actualizaciones a los datos del cliente');
        const fieldsToUpdate = {};
        if (updates.name && updates.name.trim() !== '') {
            fieldsToUpdate.name = updates.name.trim();
        }
        if (updates.email && updates.email.trim() !== '') {
            fieldsToUpdate.email = updates.email.trim();
        }
        if (updates.phoneNumber && updates.phoneNumber.trim() !== '') {
            // Normalizar el nuevo número de teléfono
            const cleanPhone = updates.phoneNumber.replace(/\D/g, '');
            if (cleanPhone.startsWith('57')) {
                fieldsToUpdate.phone_number = `+${cleanPhone}`;
            }
            else if (cleanPhone.startsWith('3')) {
                fieldsToUpdate.phone_number = `+57${cleanPhone}`;
            }
            else {
                fieldsToUpdate.phone_number = `+57${cleanPhone}`;
            }
        }
        if (Object.keys(fieldsToUpdate).length === 0) {
            return JSON.stringify({
                success: false,
                message: 'No se proporcionaron datos válidos para actualizar.'
            });
        }
        // Actualizar los datos en la base de datos
        const { data: updatedData, error: updateError } = await supabase
            .from('dentix_clients')
            .update(fieldsToUpdate)
            .eq('id', clientData.id)
            .select();
        if (updateError) {
            console.error('❌ Error actualizando cliente:', updateError);
            return JSON.stringify({
                success: false,
                message: `Error al actualizar los datos: ${updateError.message}`
            });
        }
        console.log('✅ Datos del cliente actualizados exitosamente');
        const updatedClient = updatedData[0];
        return JSON.stringify({
            success: true,
            action: 'data_updated',
            updatedData: {
                name: updatedClient.name,
                email: updatedClient.email,
                phoneNumber: updatedClient.phone_number,
                service: updatedClient.service
            },
            message: `✅ Datos actualizados correctamente:
• Nombre: ${updatedClient.name}
• Email: ${updatedClient.email}
• Número de teléfono: ${updatedClient.phone_number}
• Servicio de interés: ${updatedClient.service}

Ahora puedes proceder con la adquisición de tu seguro.`
        });
    }
    catch (error) {
        console.error('❌ Error en confirmAndUpdateClientData:', error);
        return JSON.stringify({
            success: false,
            message: `Error interno: ${error.message}`
        });
    }
}
/**
 * Muestra los datos del cliente para confirmación en el flujo de vida deudor
 * @param phoneNumber - Número de teléfono del cliente
 * @returns Datos del cliente en formato específico para vida deudor
 */
export async function showVidaDeudorClientDataForConfirmation(phoneNumber) {
    console.log(`🛡️ [VIDA DEUDOR] Mostrando datos para confirmación - Cliente: ${phoneNumber}`);
    const supabase = createSupabaseClient();
    try { // Buscar cliente con las variaciones de número
        const cleanNumber = phoneNumber.replace(/[\s\-\(\)\+]/g, '');
        const searchVariations = [
            phoneNumber, // Número original
            phoneNumber.replace(/[\s\-\(\)]/g, ''), // Sin espacios/guiones
            cleanNumber, // Sin espacios, guiones, ni +
            cleanNumber.startsWith('57') ? cleanNumber.substring(2) : cleanNumber, // Sin código país 57
            `+${cleanNumber}`, // Con + al inicio
            `+57${cleanNumber.startsWith('57') ? cleanNumber.substring(2) : cleanNumber}`, // +57 + número local
            cleanNumber.startsWith('57') ? `+57${cleanNumber.substring(2)}` : `+57${cleanNumber}` // Asegurar +57
        ];
        // Eliminar duplicados y números vacíos
        const uniqueVariations = [...new Set(searchVariations)].filter(v => v && v.length >= 10);
        console.log(`🔍 Variaciones de búsqueda para "${phoneNumber}":`, uniqueVariations);
        console.log(`🔍 Variaciones de búsqueda para "${phoneNumber}":`, uniqueVariations);
        let clientData = null;
        for (const variation of uniqueVariations) {
            const { data, error } = await supabase
                .from('dentix_clients')
                .select('document_id, name, phone_number, email, service')
                .eq('phone_number', variation)
                .maybeSingle();
            if (error) {
                console.error('❌ Error buscando cliente:', error);
                continue;
            }
            if (data) {
                clientData = data;
                console.log(`✅ Cliente encontrado con variación: ${variation}`);
                break;
            }
        }
        if (!clientData) {
            return 'No se encontró un cliente con ese número de teléfono. ¿Podrías verificar el número y intentar nuevamente?';
        }
        // Formatear datos en el formato específico solicitado
        const formattedData = {
            document_id: clientData.document_id || 'No registrado', // cédula
            name: clientData.name || 'No registrado', // nombre
            phone_number: clientData.phone_number || 'No registrado', // celular
            email: clientData.email || 'No registrado' // correo electrónico
        };
        const confirmationMessage = `🛡️ **CONFIRMACIÓN DE DATOS PARA ASISTENCIA VIDA DEUDOR**

Por favor confirma que estos datos son correctos:

📋 **Cédula:** ${formattedData.document_id}
👤 **Nombre:** ${formattedData.name}
📱 **Celular:** ${formattedData.phone_number}
📧 **Correo electrónico:** ${formattedData.email}

¿Todos los datos son correctos o necesitas modificar alguno antes de activar tu asistencia Vida Deudor?`;
        console.log(`✅ Datos formateados para confirmación:`, formattedData);
        return confirmationMessage;
    }
    catch (error) {
        console.error('❌ Error en showVidaDeudorClientDataForConfirmation:', error);
        return `Error interno al buscar tus datos: ${error.message}. Por favor intenta nuevamente.`;
    }
}
/**
 * Actualiza datos específicos de un cliente para el flujo de vida deudor
 * @param phoneNumber - Número de teléfono del cliente
 * @param updates - Datos a actualizar (document_id, name, phone_number, email)
 * @returns Resultado de la actualización
 */
export async function updateVidaDeudorClientData(phoneNumber, updates) {
    console.log(`🛡️ [VIDA DEUDOR] Actualizando datos del cliente: ${phoneNumber}`);
    const supabase = createSupabaseClient();
    try {
        // Buscar cliente con las variaciones de número (misma lógica que showVidaDeudorClientDataForConfirmation)
        const cleanNumber = phoneNumber.replace(/[\s\-\(\)\+]/g, '');
        const searchVariations = [
            phoneNumber, // Número original
            phoneNumber.replace(/[\s\-\(\)]/g, ''), // Sin espacios/guiones
            cleanNumber, // Sin espacios, guiones, ni +
            cleanNumber.startsWith('57') ? cleanNumber.substring(2) : cleanNumber, // Sin código país 57
            `+${cleanNumber}`, // Con + al inicio
            `+57${cleanNumber.startsWith('57') ? cleanNumber.substring(2) : cleanNumber}`, // +57 + número local
            cleanNumber.startsWith('57') ? `+57${cleanNumber.substring(2)}` : `+57${cleanNumber}` // Asegurar +57
        ];
        // Eliminar duplicados y números vacíos
        const uniqueVariations = [...new Set(searchVariations)].filter(v => v && v.length >= 10);
        console.log(`🔍 [UPDATE] Variaciones de búsqueda para "${phoneNumber}":`, uniqueVariations);
        let clientData = null;
        for (const variation of uniqueVariations) {
            const { data, error } = await supabase
                .from('dentix_clients')
                .select('*')
                .eq('phone_number', variation)
                .maybeSingle();
            if (error) {
                console.error('❌ Error buscando cliente:', error);
                continue;
            }
            if (data) {
                clientData = data;
                console.log(`✅ Cliente encontrado con variación: ${variation}`);
                break;
            }
        }
        if (!clientData) {
            return JSON.stringify({
                success: false,
                message: 'No se encontró un cliente con ese número de teléfono.'
            });
        }
        // Preparar campos a actualizar
        const fieldsToUpdate = {};
        if (updates.document_id && updates.document_id.trim() !== '') {
            fieldsToUpdate.document_id = updates.document_id.trim();
        }
        if (updates.name && updates.name.trim() !== '') {
            fieldsToUpdate.name = updates.name.trim();
        }
        if (updates.email && updates.email.trim() !== '') {
            fieldsToUpdate.email = updates.email.trim();
        }
        if (updates.phone_number && updates.phone_number.trim() !== '') {
            const cleanPhone = updates.phone_number.replace(/\D/g, '');
            if (cleanPhone.startsWith('57')) {
                fieldsToUpdate.phone_number = `+${cleanPhone}`;
            }
            else if (cleanPhone.startsWith('3')) {
                fieldsToUpdate.phone_number = `+57${cleanPhone}`;
            }
            else {
                fieldsToUpdate.phone_number = `+57${cleanPhone}`;
            }
        }
        if (Object.keys(fieldsToUpdate).length === 0) {
            return JSON.stringify({
                success: false,
                message: 'No se proporcionaron datos válidos para actualizar.'
            });
        }
        // Actualizar en la base de datos
        const { data: updatedData, error: updateError } = await supabase
            .from('dentix_clients')
            .update(fieldsToUpdate)
            .eq('id', clientData.id)
            .select();
        if (updateError) {
            console.error('❌ Error actualizando cliente:', updateError);
            return JSON.stringify({
                success: false,
                message: `Error al actualizar los datos: ${updateError.message}`
            });
        }
        console.log('✅ Datos del cliente actualizados exitosamente para vida deudor');
        const updatedClient = updatedData[0];
        return JSON.stringify({
            success: true,
            action: 'vida_deudor_data_updated',
            updatedData: {
                document_id: updatedClient.document_id || 'No registrado',
                name: updatedClient.name,
                email: updatedClient.email,
                phone_number: updatedClient.phone_number
            },
            message: `✅ Datos actualizados correctamente:

📋 **Cédula:** ${updatedClient.document_id || 'No registrado'}
👤 **Nombre:** ${updatedClient.name}
📱 **Celular:** ${updatedClient.phone_number}
📧 **Correo electrónico:** ${updatedClient.email}

¡Perfecto! Ahora puedes proceder con la activación de tu asistencia Vida Deudor.`
        });
    }
    catch (error) {
        console.error('❌ Error en updateVidaDeudorClientData:', error);
        return JSON.stringify({
            success: false,
            message: `Error interno: ${error.message}`
        });
    }
}
/**
 * Busca información en los documentos de Bienestar Plus SOLO EN SUPABASE
 * @param query - La consulta del usuario
 * @returns Resultados formateados de la búsqueda
 */
export async function searchBienestarDocuments(query) {
    console.log('🔍 [BIENESTAR PLUS] Procesando consulta SOLO EN SUPABASE:', query);
    try {
        console.log('🔄 Intentando búsqueda vectorial en Supabase...');
        const { searchBienestarVectors } = await import('./retrievers');
        const supabaseResults = await searchBienestarVectors(query);
        if (supabaseResults && supabaseResults.length > 0) {
            console.log('✅ Usando resultados de Supabase para Bienestar Plus');
            return formatSupabaseResults(supabaseResults, "Bienestar Plus");
        }
        return "Lo siento, no encontré información específica sobre tu consulta en los documentos de Bienestar Plus. ¿Podrías reformular tu pregunta o ser más específico?";
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Error al buscar en Supabase para Bienestar Plus:', errorMessage);
        return "Lo siento, ocurrió un error al buscar en los documentos de Bienestar Plus. Por favor intenta nuevamente.";
    }
}
/**
 * Extrae una sección específica del contenido de Bienestar Plus
 * @param content - Contenido del documento
 * @param type - Tipo de sección: 'precio', 'cobertura', 'beneficios', 'asistenciales'
 * @returns Texto extraído o null
 */
export function extractBienestarSection(content, type) {
    const lines = content.split('\n');
    let sectionTitles = [];
    let sectionName = '';
    switch (type) {
        case 'precio':
            sectionTitles = ['propuesta económica', 'tarifa', 'precio', 'valor', 'costo'];
            sectionName = 'PRECIOS Y TARIFAS';
            break;
        case 'cobertura':
            sectionTitles = ['cobertura', 'servicios cubiertos', 'qué cubre', 'servicios incluidos'];
            sectionName = 'COBERTURA';
            break;
        case 'beneficios':
            sectionTitles = ['beneficios', 'ventajas', 'beneficio'];
            sectionName = 'BENEFICIOS';
            break;
        case 'asistenciales':
            sectionTitles = ['asistenciales', 'servicios asistenciales', 'asistencia'];
            sectionName = 'ASISTENCIALES';
            break;
        default:
            return null;
    }
    // Buscar la línea que contiene el título de la sección
    let startIdx = -1;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        if (sectionTitles.some(title => line.includes(title))) {
            startIdx = i;
            break;
        }
    }
    // Si no hay título pero es consulta de precio y el chunk contiene un monto, devolver el bloque completo
    if (type === 'precio' && startIdx === -1) {
        const montoRegex = /\$\s*\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?/;
        for (let i = 0; i < lines.length; i++) {
            if (montoRegex.test(lines[i])) {
                // Devolver todo el bloque que contiene la tarifa
                return lines.join('\n').trim();
            }
        }
        return null;
    }
    if (startIdx === -1)
        return null;
    // Extraer hasta la siguiente sección o hasta 10 líneas, pero si es precio y hay monto, no cortar por líneas vacías ni separadores
    let extracted = `📋 **${sectionName}**\n`;
    let foundMonto = false;
    const montoRegex = /\$\s*\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?/;
    for (let j = startIdx; j < lines.length; j++) {
        const l = lines[j];
        if (type === 'precio' && montoRegex.test(l))
            foundMonto = true;
        // Si detecta el inicio de otra sección, corta (excepto si es precio y aún no encontró monto)
        if (j !== startIdx && /^([A-ZÁÉÍÓÚÑ ]{5,}|\*\*.+\*\*)$/.test(l.trim()) && (type !== 'precio' || foundMonto))
            break;
        extracted += l + '\n';
        // Si es precio y ya encontró monto y hay línea vacía después, corta
        if (type === 'precio' && foundMonto && l.trim() === '' && lines[j + 1] && lines[j + 1].trim() === '')
            break;
    }
    return extracted.trim();
}
/**
 * Envía un correo de activación para la asistencia Vida Deudor
 * @param clientName - Nombre del cliente
 * @param clientEmail - Correo electrónico del cliente
 * @param clientPhone - Número de teléfono del cliente (opcional)
 * @param clientDocument - Documento del cliente (opcional)
 * @returns Resultado de la operación
 */
export async function sendVidaDeudorActivationEmail(clientName, clientEmail, clientPhone, clientDocument) {
    console.log(`🚀 [VIDA DEUDOR EMAIL] Iniciando envío para ${clientName} (${clientEmail})`);
    console.log(`📋 Datos recibidos: nombre=${clientName}, email=${clientEmail}, phone=${clientPhone}, doc=${clientDocument}`);
    if (!process.env.SENDGRID_API_KEY) {
        const errorMsg = 'SendGrid API Key no configurado';
        console.error(`❌ ${errorMsg}`);
        return JSON.stringify({
            success: false,
            message: errorMsg
        });
    }
    // 📧 USAR MÉTODO OFICIAL SENDGRID: ARRAY DE EMAILS
    const multipleMessages = [
        {
            to: clientEmail,
            from: {
                email: "notificaciones@asistenciacoltefinanciera.com",
                name: "Coltefinanciera Seguros"
            },
            replyTo: "atencion@asistenciacoltefinanciera.com",
            subject: "✅ Tu Asistencia Vida Deudor ha sido activada",
            text: `Hola ${clientName},

¡Excelentes noticias! Tu asistencia Vida Deudor ha sido activada exitosamente.

Como cliente especial de Coltefinanciera, disfrutarás de 3 meses completamente gratis de cobertura.

Tu asistencia incluye:
• Teleconsulta medicina general (2 eventos por año)
• Telenutrición ilimitada
• Telepsicología (2 eventos por año)
• Descuentos ilimitados en farmacias

Tu cobertura está activa desde este momento y no requiere ningún pago adicional durante los primeros 3 meses.

Gracias por confiar en Coltefinanciera Seguros.

Saludos,
Lucia
Asesora de Seguros
Coltefinanciera Seguros`,
            html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Activación Vida Deudor</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
        <h2 style="color: #2c3e50;">¡Tu Asistencia Vida Deudor está Activada!</h2>

        <p>Hola <strong>${clientName}</strong>,</p>

        <p>¡Excelentes noticias! Tu asistencia Vida Deudor ha sido activada exitosamente.</p>

        <p>Como cliente especial de Coltefinanciera, disfrutarás de <strong>3 meses completamente gratis</strong> de cobertura.</p>

        <h3 style="color: #27ae60;">Tu asistencia incluye:</h3>
        <ul>
            <li>Teleconsulta medicina general (2 eventos por año)</li>
            <li>Telenutrición ilimitada</li>
            <li>Telepsicología (2 eventos por año)</li>
            <li>Descuentos ilimitados en farmacias</li>
        </ul>

        <p style="background-color: #e8f5e8; padding: 15px; border-radius: 5px;">
            <strong>Tu cobertura está activa desde este momento</strong> y no requiere ningún pago adicional durante los primeros 3 meses.
        </p>

        <p>Gracias por confiar en Coltefinanciera Seguros.</p>

        <p>Saludos,<br>
        <strong>Lucia</strong><br>
        Asesora de Seguros<br>
        Coltefinanciera Seguros</p>

        <hr style="margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">
            Este correo fue enviado desde nuestro sistema automatizado de activación de seguros.
        </p>
    </div>
</body>
</html>`,
            categories: ["vida-deudor", "activacion", "cliente"],
            customArgs: {
                "client_email": clientEmail,
                "client_name": clientName,
                "service": "vida_deudor",
                "type": "activation"
            }
        },
        {
            to: "mariana.b@ultimmarketing.com",
            from: {
                email: "notificaciones@asistenciacoltefinanciera.com",
                name: "Sistema Coltefinanciera"
            },
            subject: "🔔 Nueva activación de Vida Deudor - " + clientName,
            text: `Estimado Daniel,

Te informamos que un nuevo cliente ha activado el servicio de Vida Deudor.

DATOS DEL CLIENTE:
📋 Nombre: ${clientName}
📧 Correo: ${clientEmail}
📱 Teléfono: ${clientPhone || 'No proporcionado'}
🆔 Documento: ${clientDocument || 'No proporcionado'}
📅 Fecha de activación: ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}

El cliente ha recibido su correo de confirmación y ya tiene acceso a los beneficios de la asistencia Vida Deudor por 3 meses gratis.

Saludos,
Sistema Coltefinanciera`,
            html: `<h3>Nueva activación de Vida Deudor</h3>
<p>Estimado Daniel,</p>
<p>Te informamos que un nuevo cliente ha activado el servicio de Vida Deudor.</p>
<h4>DATOS DEL CLIENTE:</h4>
<ul>
<li><strong>Nombre:</strong> ${clientName}</li>
<li><strong>Correo:</strong> ${clientEmail}</li>
<li><strong>Teléfono:</strong> ${clientPhone || 'No proporcionado'}</li>
<li><strong>Documento:</strong> ${clientDocument || 'No proporcionado'}</li>
<li><strong>Fecha:</strong> ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</li>
</ul>
<p>El cliente ha recibido su correo de confirmación y ya tiene acceso a los beneficios de la asistencia Vida Deudor por 3 meses gratis.</p>
<p>Saludos,<br>Sistema Coltefinanciera</p>`,
            categories: ["vida-deudor", "activacion", "admin"]
        }
    ];
    try {
        console.log('📧 USANDO MÉTODO OFICIAL SENDGRID: Array de emails');
        console.log(`   📧 Email 1: Cliente (${clientEmail})`);
        console.log(`   📧 Email 2: Admin (mariana.b@ultimmarketing.com)`);
        const results = await sgMail.send(multipleMessages);
        console.log(`✅ ENVÍO COMPLETADO: ${results.length} emails procesados`);
        let clientSent = false;
        let adminSent = false;
        let clientMessageId = null;
        let adminMessageId = null;
        results.forEach((result, index) => {
            const email = multipleMessages[index].to;
            const status = result.statusCode || 'unknown';
            const messageId = result.headers?.['x-message-id'] || null;
            console.log(`   ✅ Email ${index + 1} (${email}): Status ${status}, MessageID: ${messageId}`);
            if (email === clientEmail) {
                clientSent = true;
                clientMessageId = messageId;
            }
            else if (email === "mariana.b@ultimmarketing.com") {
                adminSent = true;
                adminMessageId = messageId;
            }
        });
        const success = clientSent && adminSent;
        console.log(`📊 RESULTADO FINAL:`);
        console.log(`   Cliente (${clientEmail}): ${clientSent ? '✅ ENVIADO' : '❌ ERROR'}`);
        console.log(`   Admin: ${adminSent ? '✅ ENVIADO' : '❌ ERROR'}`);
        console.log(`   Éxito general: ${success ? '✅ SÍ' : '❌ NO'}`);
        return JSON.stringify({
            success: success,
            message: success
                ? `✅ CORREOS ENVIADOS EXITOSAMENTE a ${clientEmail} y al administrador`
                : `❌ Error en el envío de emails`,
            details: {
                clientSent,
                adminSent,
                clientEmail,
                clientMessageId,
                adminMessageId,
                totalEmailsSent: results.length,
                method: "sendgrid_array_official",
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('❌ ERROR EN ENVÍO DE EMAILS:', error.message);
        if (error.response && error.response.body) {
            console.error('📋 Detalles del error:', JSON.stringify(error.response.body, null, 2));
        }
        return JSON.stringify({
            success: false,
            message: `Error al enviar correos: ${error.message}`,
            details: {
                errorType: error.code || 'unknown',
                errorMessage: error.message,
                clientEmail,
                method: "sendgrid_array_official"
            }
        });
    }
}
/**
 * Busca información específica en los documentos de autos almacenados en Supabase
 * @param query - La consulta del usuario para buscar en los documentos de autos
 * @returns Resultados de la búsqueda o mensaje de error
 */
export async function searchAutosDocuments(query) {
    console.log('🚗 Buscando en documentos de autos:', query);
    try {
        const supabase = createSupabaseClient();
        // 🔍 PASO 1: Verificar estructura de la tabla y contar registros
        console.log('🔍 Verificando estructura de la tabla autos_documents...');
        const { data: countData, error: countError } = await supabase
            .from('autos_documents')
            .select('*', { count: 'exact', head: true });
        if (countError) {
            console.error('❌ Error al verificar tabla autos_documents:', countError);
            throw countError;
        }
        console.log(`📊 Total de registros en autos_documents: ${countData?.length || 'N/A'}`);
        // 🔍 PASO 2: Realizar múltiples tipos de búsqueda
        console.log('🔄 Intentando búsqueda específica con query:', query);
        // Búsqueda principal
        let { data: autosResults, error } = await supabase
            .from('autos_documents')
            .select('id, content, metadata')
            .ilike('content', `%${query}%`)
            .limit(5);
        if (error) {
            console.error('❌ Error en búsqueda principal:', error);
        }
        // Si no encuentra resultados, intentar con términos generales
        if (!autosResults || autosResults.length === 0) {
            console.log('⚠️ Búsqueda específica sin resultados, intentando términos generales...');
            const fallbackTerms = ['seguro', 'auto', 'vehículo', 'cobertura', 'precio'];
            for (const term of fallbackTerms) {
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('autos_documents')
                    .select('id, content, metadata')
                    .ilike('content', `%${term}%`)
                    .limit(3);
                if (!fallbackError && fallbackData && fallbackData.length > 0) {
                    console.log(`✅ Encontrados ${fallbackData.length} resultados con término: ${term}`);
                    autosResults = fallbackData;
                    break;
                }
            }
        }
        // Si aún no hay resultados, obtener cualquier registro para diagnóstico
        if (!autosResults || autosResults.length === 0) {
            console.log('⚠️ Sin resultados con términos generales, obteniendo muestras aleatorias...');
            const { data: sampleData, error: sampleError } = await supabase
                .from('autos_documents')
                .select('id, content, metadata')
                .limit(3);
            if (!sampleError && sampleData && sampleData.length > 0) {
                console.log(`📋 Mostrando ${sampleData.length} registros de muestra`);
                autosResults = sampleData;
            }
        }
        if (!autosResults || autosResults.length === 0) {
            return "Lo siento, no encontré información específica sobre tu consulta en los documentos de seguros de autos. La tabla parece estar vacía o no accesible. ¿Podrías reformular tu pregunta o ser más específico?";
        }
        console.log('✅ Encontrados', autosResults.length, 'resultados en autos_documents');
        // Formatear resultados usando la estructura correcta (sin title)
        let response = "Según la información de nuestra base de datos de seguros de autos, esto es lo que encontré:\n\n";
        autosResults.forEach((result, index) => {
            // No hay columna title, usar un título genérico o extraer del metadata
            const title = result.metadata?.title || `Documento de Seguros de Autos #${result.id}`;
            response += `🚗 **${title}**\n`;
            response += `${result.content}\n`;
            if (result.metadata && typeof result.metadata === 'object') {
                const metaStr = JSON.stringify(result.metadata);
                if (metaStr !== '{}') {
                    response += `📄 Información adicional: ${metaStr}\n`;
                }
            }
            if (index < autosResults.length - 1) {
                response += "\n---\n\n";
            }
        });
        return response;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Error al buscar en Supabase para seguros de autos:', errorMessage);
        return "Lo siento, ocurrió un error al buscar en los documentos de seguros de autos. Por favor intenta nuevamente.";
    }
}
/**
 * Función de prueba para enviar un email simple de vida deudor
 * @param clientEmail - Email del cliente
 * @returns Resultado de la operación
 */
export async function testSendVidaDeudorEmail(clientEmail) {
    console.log(`🧪 [TEST] Enviando email de prueba de Vida Deudor a: ${clientEmail}`);
    const testMsg = {
        to: clientEmail,
        from: "notificaciones@asistenciacoltefinanciera.com",
        subject: "🧪 TEST - Activación Vida Deudor",
        text: `Hola,

Este es un email de prueba para verificar que los correos de activación de Vida Deudor lleguen correctamente al cliente.

Si recibes este correo, significa que la funcionalidad básica de envío está funcionando.

Datos de la prueba:
- Destinatario: ${clientEmail}
- Fecha: ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}
- Remitente verificado: notificaciones@asistenciacoltefinanciera.com

Saludos,
Sistema de Pruebas Coltefinanciera`,
        html: `<h3>🧪 Email de Prueba - Vida Deudor</h3>
        <p><strong>Hola,</strong></p>
        <p>Este es un email de prueba para verificar que los correos de activación de Vida Deudor lleguen correctamente al cliente.</p>
        <p>Si recibes este correo, significa que la funcionalidad básica de envío está funcionando.</p>
        <h4>Datos de la prueba:</h4>
        <ul>
            <li><strong>Destinatario:</strong> ${clientEmail}</li>
            <li><strong>Fecha:</strong> ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</li>
            <li><strong>Remitente verificado:</strong> notificaciones@asistenciacoltefinanciera.com</li>
        </ul>
        <p><em>Saludos,<br>Sistema de Pruebas Coltefinanciera</em></p>`
    };
    if (!process.env.SENDGRID_API_KEY) {
        return JSON.stringify({
            success: false,
            message: 'Error: SENDGRID_API_KEY no configurado'
        });
    }
    try {
        const result = await sgMail.send(testMsg);
        console.log(`✅ [TEST] Email de prueba enviado exitosamente a ${clientEmail}`);
        console.log(`   Status: ${result[0]?.statusCode || 'N/A'}`);
        return JSON.stringify({
            success: true,
            message: `Email de prueba enviado exitosamente a ${clientEmail}`, details: {
                statusCode: result[0]?.statusCode,
                to: clientEmail,
                from: "notificaciones@asistenciacoltefinanciera.com"
            }
        });
    }
    catch (error) {
        console.error(`❌ [TEST] Error enviando email de prueba:`, error);
        if (error.response) {
            console.error('   Detalles:', JSON.stringify(error.response.body, null, 2));
        }
        return JSON.stringify({
            success: false,
            message: `Error enviando email de prueba: ${error.message}`,
            details: {
                errorType: error.code || 'unknown',
                to: clientEmail
            }
        });
    }
}
