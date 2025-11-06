import dotenv from "dotenv";
import { HumanMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { SystemMessage } from "@langchain/core/messages";
import { consultAutosSpecialistTool, sendVehicleQuoteEmailTool } from "../tools/tools";
import { llm } from "../config/llm";
import { MESSAGES } from '../config/constants';
import { searchDentixClientByPhone } from "../functions/functions";
dotenv.config();
const vehicleServiceAgent = createReactAgent({
    llm,
    tools: [consultAutosSpecialistTool, sendVehicleQuoteEmailTool],
    stateModifier: new SystemMessage(MESSAGES.SYSTEM_VEHICLE_PROMPT)
});
export const vehicleServiceNode = async (state, config) => {
    // Obtener el último mensaje del usuario
    const lastUserMessage = state.messages[state.messages.length - 1];
    const userMessage = typeof lastUserMessage.content === 'string' ? lastUserMessage.content.toLowerCase() : '';
    const originalMessage = typeof lastUserMessage.content === 'string' ? lastUserMessage.content : '';
    // Función para extraer datos del mensaje del usuario
    const extractDataFromMessage = (message) => {
        const extractedData = {};
        // Extraer nombre (buscar patrones como "mi nombre es", "me llamo", etc.)
        const namePatterns = [
            /(?:mi nombre es|me llamo|soy|nombre completo.*?es)\s+([a-záéíóúñ\s]+)/i,
            /nombre:\s*([a-záéíóúñ\s]+)/i
        ];
        for (const pattern of namePatterns) {
            const nameMatch = message.match(pattern);
            if (nameMatch && nameMatch[1]) {
                extractedData.fullName = nameMatch[1].trim();
                break;
            }
        }
        // Extraer cédula (números de 8-10 dígitos)
        const cedulaPattern = /(?:cédula|cedula|cc|documento).*?(\d{8,10})/i;
        const cedulaMatch = message.match(cedulaPattern);
        if (cedulaMatch) {
            extractedData.cedula = cedulaMatch[1];
        }
        // Extraer teléfono (números de 10 dígitos o con +57)
        const phonePatterns = [
            /(?:teléfono|telefono|celular|número|movil).*?(\+?57)?(\d{10})/i,
            /(?:mi número es|mi cel es|mi teléfono es)\s*(\+?57)?(\d{10})/i,
            /(\+57\d{10})/i, // Formato +57XXXXXXXXXX
            /(\d{10})/i // Solo 10 dígitos
        ];
        for (const pattern of phonePatterns) {
            const phoneMatch = message.match(pattern);
            if (phoneMatch) {
                let phone;
                if (phoneMatch[0].startsWith('+57')) {
                    phone = phoneMatch[0]; // Ya tiene formato +57
                }
                else if (phoneMatch[2] && phoneMatch[2].length === 10) {
                    phone = '+57' + phoneMatch[2]; // Agregar +57 a número de 10 dígitos
                }
                else if (phoneMatch[1] && phoneMatch[1].length === 10) {
                    phone = '+57' + phoneMatch[1]; // Agregar +57 a número de 10 dígitos
                }
                else if (phoneMatch[0].length === 10) {
                    phone = '+57' + phoneMatch[0]; // Agregar +57 a número de 10 dígitos
                }
                if (phone) {
                    extractedData.phone = phone;
                    console.log('🔍 [VEHICLE AGENT DEBUG] Teléfono extraído del mensaje:', extractedData.phone);
                    break;
                }
            }
        }
        // Extraer fecha de nacimiento (DD/MM/YYYY, DD-MM-YYYY, etc.)
        const datePatterns = [
            /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
            /(?:naci|nacimiento|fecha.*?nacimiento).*?(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i
        ];
        for (const pattern of datePatterns) {
            const dateMatch = message.match(pattern);
            if (dateMatch) {
                extractedData.birthDate = `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}`;
                break;
            }
        }
        // Extraer marca del vehículo
        const brandPatterns = [
            /(?:marca|es un|tengo un|mi auto es)\s+(toyota|chevrolet|nissan|mazda|hyundai|kia|ford|volkswagen|renault|peugeot|bmw|mercedes|audi)/i,
            /(?:vehículo|carro|auto).*?(toyota|chevrolet|nissan|mazda|hyundai|kia|ford|volkswagen|renault|peugeot|bmw|mercedes|audi)/i
        ];
        for (const pattern of brandPatterns) {
            const brandMatch = message.match(pattern);
            if (brandMatch && brandMatch[1]) {
                extractedData.vehicleBrand = brandMatch[1].charAt(0).toUpperCase() + brandMatch[1].slice(1).toLowerCase();
                break;
            }
        }
        // Extraer modelo del vehículo
        const modelPatterns = [
            /(?:modelo|es un|modelo es)\s+([a-záéíóúñ0-9\s]+?)(?:\s+(?:del|año|\d{4})|$)/i,
            /toyota\s+([a-záéíóúñ0-9\s]+?)(?:\s+(?:del|año|\d{4})|$)/i,
            /chevrolet\s+([a-záéíóúñ0-9\s]+?)(?:\s+(?:del|año|\d{4})|$)/i,
            /nissan\s+([a-záéíóúñ0-9\s]+?)(?:\s+(?:del|año|\d{4})|$)/i,
            /(corolla|aveo|sentra|accent|rio|fiesta|gol|logan|sandero|civic|fit|march|versa|spark|sail|picanto|i10|i20|clio|duster|stepway)/i
        ];
        for (const pattern of modelPatterns) {
            const modelMatch = message.match(pattern);
            if (modelMatch && modelMatch[1]) {
                extractedData.vehicleModel = modelMatch[1].trim();
                break;
            }
        }
        // Extraer año del vehículo (2000-2025) - mejorado
        const yearPatterns = [
            /(?:año|modelo|del)\s*(20[0-2][0-9])/i,
            /(?:es del|del año)\s*(20[0-2][0-9])/i,
            /(\s|^)(20[0-2][0-9])(?:\s|,|$)/gi // Buscar años como palabras separadas
        ];
        for (const pattern of yearPatterns) {
            if (pattern.global) {
                const yearMatches = [...message.matchAll(pattern)];
                for (const match of yearMatches) {
                    const year = parseInt(match[2] || match[1]);
                    if (year >= 2000 && year <= 2025) {
                        extractedData.vehicleYear = year.toString();
                        break;
                    }
                }
            }
            else {
                const yearMatch = message.match(pattern);
                if (yearMatch && yearMatch[1]) {
                    const year = parseInt(yearMatch[1]);
                    if (year >= 2000 && year <= 2025) {
                        extractedData.vehicleYear = year.toString();
                        break;
                    }
                }
            }
            if (extractedData.vehicleYear)
                break;
        }
        // Extraer placa (3 letras + 3 números o formato similar)
        const platePattern = /(?:placa|matricula).*?([a-z]{3}[-\s]?\d{3}|[a-z]{3}\d{3})/i;
        const plateMatch = message.match(platePattern);
        if (plateMatch) {
            extractedData.vehiclePlate = plateMatch[1].toUpperCase();
        }
        // Extraer ciudad (buscar después de "ciudad", "circula en", etc.) - mejorado
        const cityPatterns = [
            /(?:circula.*?en|vehículo.*?en|auto.*?en)\s+([a-záéíóúñ]+)(?:\s+y\s|,|\s+mi\s|\s*$)/i,
            /ciudad[:\s]+([a-záéíóúñ]+)(?:\s+y\s|,|\s+mi\s|\s*$)/i,
            /en\s+([a-záéíóúñ]+)(?:\s+y\s|,|\s+mi\s|\s*$)/i,
            /(bogotá|medellín|cali|barranquilla|cartagena|cúcuta|bucaramanga|pereira|santa marta|ibagué|pasto|manizales|neiva|villavicencio|armenia)/i
        ];
        for (const pattern of cityPatterns) {
            const cityMatch = message.match(pattern);
            if (cityMatch && cityMatch[1]) {
                extractedData.vehicleCity = cityMatch[1].trim();
                break;
            }
        }
        return extractedData;
    };
    // Detectar intención de compra/adquisición O si está proporcionando datos para cotización
    const purchaseIntentKeywords = [
        'quiero adquirir', 'deseo comprar', 'quiero comprar', 'me interesa adquirir',
        'quiero contratar', 'deseo contratar', 'quiero el seguro', 'adquirir seguro',
        'comprar seguro', 'contratar seguro', 'proceder con la compra', 'seguir con la compra'
    ];
    const hasPurchaseIntent = purchaseIntentKeywords.some(keyword => userMessage.includes(keyword));
    // Detectar si está proporcionando datos de vehículo/personales para cotización
    const extractedData = extractDataFromMessage(originalMessage);
    const isProvidingVehicleData = extractedData.vehicleBrand ||
        extractedData.vehicleModel ||
        extractedData.vehicleYear ||
        extractedData.vehiclePlate ||
        extractedData.vehicleCity ||
        extractedData.birthDate;
    // Verificar si el usuario está proporcionando datos (no es la primera vez)
    const isProvidingData = state.vehicleInsuranceData && Object.keys(state.vehicleInsuranceData).length > 0;
    if (hasPurchaseIntent || isProvidingData || isProvidingVehicleData) {
        // Inicializar objeto para datos del cliente si no existe
        if (!state.vehicleInsuranceData) {
            state.vehicleInsuranceData = {
                fullName: null,
                cedula: null,
                birthDate: null,
                phone: null,
                vehicleBrand: null,
                vehicleModel: null,
                vehicleYear: null,
                vehiclePlate: null,
                vehicleCity: null
            };
        }
        // 🔍 DEBUG: Mostrar estado inicial de vehicleInsuranceData
        console.log('🔍 [VEHICLE AGENT DEBUG] Estado inicial de vehicleInsuranceData:', state.vehicleInsuranceData);
        // Actualizar datos si se encontraron (solo si no existen ya)
        if (extractedData.fullName && !state.vehicleInsuranceData.fullName) {
            state.vehicleInsuranceData.fullName = extractedData.fullName;
        }
        if (extractedData.cedula && !state.vehicleInsuranceData.cedula) {
            state.vehicleInsuranceData.cedula = extractedData.cedula;
        }
        if (extractedData.birthDate && !state.vehicleInsuranceData.birthDate) {
            state.vehicleInsuranceData.birthDate = extractedData.birthDate;
        }
        if (extractedData.phone && !state.vehicleInsuranceData.phone) {
            state.vehicleInsuranceData.phone = extractedData.phone;
            console.log('🔍 [VEHICLE AGENT DEBUG] Teléfono asignado al state:', state.vehicleInsuranceData.phone);
        }
        if (extractedData.vehicleBrand && !state.vehicleInsuranceData.vehicleBrand) {
            state.vehicleInsuranceData.vehicleBrand = extractedData.vehicleBrand;
        }
        if (extractedData.vehicleModel && !state.vehicleInsuranceData.vehicleModel) {
            state.vehicleInsuranceData.vehicleModel = extractedData.vehicleModel;
        }
        if (extractedData.vehicleYear && !state.vehicleInsuranceData.vehicleYear) {
            state.vehicleInsuranceData.vehicleYear = extractedData.vehicleYear;
        }
        if (extractedData.vehiclePlate && !state.vehicleInsuranceData.vehiclePlate) {
            state.vehicleInsuranceData.vehiclePlate = extractedData.vehiclePlate;
        }
        if (extractedData.vehicleCity && !state.vehicleInsuranceData.vehicleCity) {
            state.vehicleInsuranceData.vehicleCity = extractedData.vehicleCity;
        }
        // Verificar qué datos faltan SOLO DE LOS 6 CAMPOS REQUERIDOS
        const missingData = [];
        if (!state.vehicleInsuranceData.birthDate)
            missingData.push('Fecha de nacimiento (DD/MM/YYYY)');
        if (!state.vehicleInsuranceData.vehicleBrand)
            missingData.push('Marca del vehículo');
        if (!state.vehicleInsuranceData.vehicleModel)
            missingData.push('Modelo del vehículo');
        if (!state.vehicleInsuranceData.vehicleYear)
            missingData.push('Año del vehículo');
        if (!state.vehicleInsuranceData.vehiclePlate)
            missingData.push('Placa del vehículo');
        if (!state.vehicleInsuranceData.vehicleCity)
            missingData.push('Ciudad de circulación del vehículo');
        if (missingData.length > 0) {
            // Mostrar datos capturados y solicitar faltantes
            let message = '';
            if (Object.values(extractedData).some(val => val)) {
                message += '✅ **Datos capturados:**\n';
                if (extractedData.fullName)
                    message += `• Nombre: ${extractedData.fullName}\n`;
                if (extractedData.cedula)
                    message += `• Cédula: ${extractedData.cedula}\n`;
                if (extractedData.birthDate)
                    message += `• Fecha de nacimiento: ${extractedData.birthDate}\n`;
                if (extractedData.phone)
                    message += `• Teléfono: ${extractedData.phone}\n`;
                if (extractedData.vehicleBrand)
                    message += `• Marca: ${extractedData.vehicleBrand}\n`;
                if (extractedData.vehicleModel)
                    message += `• Modelo: ${extractedData.vehicleModel}\n`;
                if (extractedData.vehicleYear)
                    message += `• Año: ${extractedData.vehicleYear}\n`;
                if (extractedData.vehiclePlate)
                    message += `• Placa: ${extractedData.vehiclePlate}\n`;
                if (extractedData.vehicleCity)
                    message += `• Ciudad: ${extractedData.vehicleCity}\n`;
                message += '\n';
            }
            message += `📋 **Aún necesito los siguientes datos:**\n${missingData.map((data, index) => `${index + 1}. ${data}`).join('\n')}\n\nPor favor compárteme esta información para continuar con tu cotización.`;
            return {
                messages: [
                    new HumanMessage({ content: message, name: "VehicleService" }),
                ],
                next: "supervisor",
                vehicleInsuranceData: state.vehicleInsuranceData
            };
        }
        else {
            // Todos los datos ESENCIALES están completos - ENVIAR EMAIL DIRECTAMENTE
            console.log('🎉 [VEHICLE AGENT] Datos esenciales capturados (6 campos), enviando email...');
            // 🔍 BUSCAR CÉDULA DEL CLIENTE SI TENEMOS TELÉFONO Y NO CÉDULA
            let finalClientDocument = state.vehicleInsuranceData.cedula || 'No proporcionado';
            let finalClientName = state.vehicleInsuranceData.fullName || 'No proporcionado';
            // 🐛 DEBUG: Agregar logs detallados para identificar el problema
            console.log('🔍 [VEHICLE AGENT DEBUG] Estado antes de búsqueda automática:');
            console.log('   - Teléfono:', state.vehicleInsuranceData.phone);
            console.log('   - Cédula actual:', state.vehicleInsuranceData.cedula);
            console.log('   - Tiene teléfono:', !!state.vehicleInsuranceData.phone);
            console.log('   - NO tiene cédula:', !state.vehicleInsuranceData.cedula);
            console.log('   - Condición cumplida:', !!(state.vehicleInsuranceData.phone && !state.vehicleInsuranceData.cedula));
            if (state.vehicleInsuranceData.phone && !state.vehicleInsuranceData.cedula) {
                try {
                    console.log('🔍 [VEHICLE AGENT] Buscando datos del cliente en base de datos con teléfono:', state.vehicleInsuranceData.phone);
                    const clientData = await searchDentixClientByPhone(state.vehicleInsuranceData.phone);
                    console.log('🔍 [VEHICLE AGENT DEBUG] Resultado de búsqueda:', clientData);
                    if (clientData && clientData.document_id) {
                        finalClientDocument = clientData.document_id;
                        console.log('✅ [VEHICLE AGENT] Cédula encontrada en base de datos:', finalClientDocument);
                        // También actualizamos el nombre si no lo teníamos
                        if (!state.vehicleInsuranceData.fullName && clientData.name) {
                            finalClientName = clientData.name;
                            console.log('✅ [VEHICLE AGENT] Nombre encontrado en base de datos:', finalClientName);
                        }
                    }
                    else {
                        console.log('ℹ️ [VEHICLE AGENT] No se encontró cédula en la base de datos para el teléfono proporcionado');
                    }
                }
                catch (error) {
                    console.error('❌ [VEHICLE AGENT] Error buscando datos del cliente:', error);
                    // Continuamos con 'No proporcionado' si hay error
                }
            }
            else {
                console.log('❌ [VEHICLE AGENT DEBUG] NO se ejecutó búsqueda automática');
                if (!state.vehicleInsuranceData.phone) {
                    console.log('   - Razón: No hay teléfono en vehicleInsuranceData');
                }
                if (state.vehicleInsuranceData.cedula) {
                    console.log('   - Razón: Ya hay cédula en vehicleInsuranceData:', state.vehicleInsuranceData.cedula);
                }
            }
            // 🐛 DEBUG: Mostrar datos finales que se enviarán en el email
            console.log('📧 [VEHICLE AGENT DEBUG] Datos finales para email:');
            console.log('   - Nombre final:', finalClientName);
            console.log('   - Cédula final:', finalClientDocument);
            console.log('   - Teléfono final:', state.vehicleInsuranceData.phone || 'No proporcionado');
            // Llamar directamente la herramienta en lugar de invocar el agente
            try {
                const emailResult = await sendVehicleQuoteEmailTool.func({
                    clientName: finalClientName,
                    clientDocument: finalClientDocument,
                    clientBirthDate: state.vehicleInsuranceData.birthDate,
                    clientPhone: state.vehicleInsuranceData.phone || 'No proporcionado',
                    vehicleBrand: state.vehicleInsuranceData.vehicleBrand,
                    vehicleModel: state.vehicleInsuranceData.vehicleModel,
                    vehicleYear: state.vehicleInsuranceData.vehicleYear,
                    vehiclePlate: state.vehicleInsuranceData.vehiclePlate,
                    vehicleCity: state.vehicleInsuranceData.vehicleCity
                });
                console.log('📧 [VEHICLE AGENT] Resultado del envío de email:', emailResult);
            }
            catch (error) {
                console.error('❌ [VEHICLE AGENT] Error enviando email:', error);
            }
            const confirmationMessage = `🎉 **¡Perfecto! Ya tengo la información esencial para tu cotización:**

✅ **DATOS DEL VEHÍCULO:**
• **Marca:** ${state.vehicleInsuranceData.vehicleBrand}
• **Modelo:** ${state.vehicleInsuranceData.vehicleModel}
• **Año:** ${state.vehicleInsuranceData.vehicleYear}
• **Placa:** ${state.vehicleInsuranceData.vehiclePlate}
• **Ciudad de circulación:** ${state.vehicleInsuranceData.vehicleCity}

✅ **FECHA DE NACIMIENTO:** ${state.vehicleInsuranceData.birthDate}

${state.vehicleInsuranceData.fullName || state.vehicleInsuranceData.cedula || state.vehicleInsuranceData.phone ?
                `\n📋 **DATOS ADICIONALES CAPTURADOS:**
${state.vehicleInsuranceData.fullName ? `• **Nombre:** ${state.vehicleInsuranceData.fullName}\n` : ''}${state.vehicleInsuranceData.cedula ? `• **Cédula:** ${state.vehicleInsuranceData.cedula}\n` : ''}${state.vehicleInsuranceData.phone ? `• **Teléfono:** ${state.vehicleInsuranceData.phone}\n` : ''}` : ''}
📧 **He enviado tus datos al área especializada para generar tu cotización personalizada.** Un asesor experto en seguros vehiculares se pondrá en contacto contigo pronto con las mejores opciones y precios para tu vehículo.

¡Gracias por confiar en Coltefinanciera Seguros! 🚗💙`;
            return {
                messages: [
                    new HumanMessage({ content: confirmationMessage, name: "VehicleService" }),
                ],
                next: "supervisor",
                vehicleInsuranceData: state.vehicleInsuranceData
            };
        }
    }
    // Si no es intención de compra, proceder normalmente
    const result = await vehicleServiceAgent.invoke(state, config);
    const lastMessage = result.messages[result.messages.length - 1];
    return {
        messages: [
            new HumanMessage({ content: lastMessage.content, name: "VehicleService" }),
        ],
        next: "supervisor",
    };
};
// vehicleServiceNode es un nodo que procesa mensajes para el agente de servicio de seguros vehiculares.
// El nodo invoca el agente de servicio de autos con el estado actual y la configuración proporcionada.
// Luego, devuelve la respuesta del agente de servicio de autos como un mensaje humano.
// El mensaje humano contiene el contenido de la respuesta y el nombre del agente que envió el mensaje.
export { vehicleServiceAgent };
