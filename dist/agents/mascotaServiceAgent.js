import dotenv from "dotenv";
import { HumanMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { SystemMessage } from "@langchain/core/messages";
import { consultMascotaSpecialistTool } from "../tools/tools";
import { llm } from "../config/llm";
import { MESSAGES } from '../config/constants';
dotenv.config();
const mascotaServiceAgent = createReactAgent({
    llm,
    tools: [consultMascotaSpecialistTool],
    stateModifier: new SystemMessage(MESSAGES.SYSTEM_MASCOTA_PROMPT)
});
export const mascotaServiceNode = async (state, config) => {
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
                    console.log('🔍 [MASCOTA AGENT DEBUG] Teléfono extraído del mensaje:', extractedData.phone);
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
        // Extraer nombre de la mascota
        const petNamePatterns = [
            /(?:mi mascota se llama|se llama|el nombre es|su nombre es)\s+([a-záéíóúñ]+)/i,
            /(?:mascota|perro|perrita|gato|gata|gatito|gatita).*?(?:se llama|nombre|llamado|llamada)\s+([a-záéíóúñ]+)/i,
            /nombre.*?(?:mascota|perro|gato).*?([a-záéíóúñ]+)/i
        ];
        for (const pattern of petNamePatterns) {
            const petNameMatch = message.match(pattern);
            if (petNameMatch && petNameMatch[1]) {
                extractedData.petName = petNameMatch[1].trim();
                break;
            }
        }
        // Extraer tipo de mascota
        const petTypePatterns = [
            /(?:tengo un|tengo una|es un|es una|mi mascota es)\s+(perro|perrita|gato|gata|conejo|hamster|loro|ave)/i,
            /(perro|perrita|gato|gata|conejo|hamster|loro|ave)/i
        ];
        for (const pattern of petTypePatterns) {
            const petTypeMatch = message.match(pattern);
            if (petTypeMatch && petTypeMatch[1]) {
                let petType = petTypeMatch[1].toLowerCase();
                // Normalizar tipos
                if (petType === 'perrita')
                    petType = 'perro';
                if (petType === 'gata' || petType === 'gatito' || petType === 'gatita')
                    petType = 'gato';
                extractedData.petType = petType.charAt(0).toUpperCase() + petType.slice(1);
                break;
            }
        }
        // Extraer raza de la mascota
        const breedPatterns = [
            /(?:raza|es un|es una)\s+([a-záéíóúñ\s]+?)(?:\s+(?:de|del|año|\d)|$)/i,
            /(?:labrador|golden|bulldog|pastor alemán|chihuahua|poodle|yorkshire|siamés|persa|angora|mestizo|criollo)/i
        ];
        for (const pattern of breedPatterns) {
            const breedMatch = message.match(pattern);
            if (breedMatch && breedMatch[1]) {
                extractedData.petBreed = breedMatch[1].trim();
                break;
            }
            else if (breedMatch && breedMatch[0]) {
                extractedData.petBreed = breedMatch[0].trim();
                break;
            }
        }
        // Extraer edad de la mascota (1-20 años aproximadamente)
        const agePatterns = [
            /(?:tiene|edad|años?).*?(\d{1,2})\s*(?:años?|meses?)/i,
            /(\d{1,2})\s*(?:años?|meses?)/i
        ];
        for (const pattern of agePatterns) {
            const ageMatch = message.match(pattern);
            if (ageMatch && ageMatch[1]) {
                const age = parseInt(ageMatch[1]);
                if (age >= 1 && age <= 20) {
                    const unit = ageMatch[0].includes('mes') ? 'meses' : 'años';
                    extractedData.petAge = `${age} ${unit}`;
                    break;
                }
            }
        }
        // Extraer peso de la mascota (1-80 kg aproximadamente)
        const weightPatterns = [
            /(?:pesa|peso).*?(\d{1,2})\s*(?:kg|kilos?|kilogramos?)/i,
            /(\d{1,2})\s*(?:kg|kilos?|kilogramos?)/i
        ];
        for (const pattern of weightPatterns) {
            const weightMatch = message.match(pattern);
            if (weightMatch && weightMatch[1]) {
                const weight = parseInt(weightMatch[1]);
                if (weight >= 1 && weight <= 80) {
                    extractedData.petWeight = `${weight} kg`;
                    break;
                }
            }
        }
        // Extraer ciudad
        const cityPatterns = [
            /(?:vivo en|soy de|ciudad|ubicado en)\s+([a-záéíóúñ\s]+)/i,
            /(?:bogotá|medellín|cali|barranquilla|cartagena|bucaramanga|pereira|manizales|ibagué|cúcuta|santa marta|villavicencio|pasto|montería|valledupar|neiva|armenia|popayán|sincelejo|florencia)/i
        ];
        for (const pattern of cityPatterns) {
            const cityMatch = message.match(pattern);
            if (cityMatch && cityMatch[1]) {
                extractedData.city = cityMatch[1].trim();
                break;
            }
            else if (cityMatch && cityMatch[0]) {
                extractedData.city = cityMatch[0].trim();
                break;
            }
        }
        console.log('🐾 [MASCOTA AGENT DEBUG] Datos extraídos:', extractedData);
        return extractedData;
    };
    // Detectar intención de compra
    const isPurchaseIntent = /(?:quiero|deseo|me interesa|necesito|comprar|adquirir|contratar|cotizar|precio|costo|cuánto|valor).*?(?:seguro|póliza|plan|protección|cobertura).*?(?:mascota|perro|gato|veterinario)/i.test(userMessage) ||
        /(?:seguro|póliza|plan|protección|cobertura).*?(?:mascota|perro|gato|veterinario).*?(?:quiero|deseo|me interesa|necesito|comprar|adquirir|contratar|cotizar|precio|costo|cuánto|valor)/i.test(userMessage);
    console.log('🐾 [MASCOTA AGENT DEBUG] ¿Es intención de compra?', isPurchaseIntent);
    if (isPurchaseIntent) {
        // Extraer datos del mensaje actual
        const currentData = extractDataFromMessage(originalMessage);
        // Inicializar o actualizar los datos de seguro para mascotas
        const updatedMascotaData = {
            fullName: currentData.fullName || state.mascotaInsuranceData?.fullName || null,
            cedula: currentData.cedula || state.mascotaInsuranceData?.cedula || null,
            birthDate: currentData.birthDate || state.mascotaInsuranceData?.birthDate || null,
            phone: currentData.phone || state.mascotaInsuranceData?.phone || null,
            petName: currentData.petName || state.mascotaInsuranceData?.petName || null,
            petType: currentData.petType || state.mascotaInsuranceData?.petType || null,
            petBreed: currentData.petBreed || state.mascotaInsuranceData?.petBreed || null,
            petAge: currentData.petAge || state.mascotaInsuranceData?.petAge || null,
            petWeight: currentData.petWeight || state.mascotaInsuranceData?.petWeight || null,
            city: currentData.city || state.mascotaInsuranceData?.city || null,
        };
        console.log('🐾 [MASCOTA AGENT DEBUG] Datos actualizados:', updatedMascotaData);
        // Verificar qué datos falta recopilar
        const missingData = [];
        const missingPetData = [];
        // Datos personales básicos
        if (!updatedMascotaData.fullName)
            missingData.push('**nombre completo**');
        if (!updatedMascotaData.birthDate)
            missingData.push('**fecha de nacimiento**');
        // Datos específicos de la mascota
        if (!updatedMascotaData.petName)
            missingPetData.push('**nombre de tu mascota**');
        if (!updatedMascotaData.petType)
            missingPetData.push('**tipo de mascota** (perro, gato, etc.)');
        if (!updatedMascotaData.petAge)
            missingPetData.push('**edad de tu mascota**');
        if (!updatedMascotaData.city)
            missingPetData.push('**ciudad donde vives**');
        const allMissingData = [...missingData, ...missingPetData];
        if (allMissingData.length > 0) {
            // Solicitar datos faltantes de forma amigable y específica para mascotas
            let requestMessage = `🐾 **¡Excelente! Me encanta que quieras proteger a tu mascotita.**\n\n`;
            if (updatedMascotaData.petName) {
                requestMessage += `Perfecto, ya sé que tu compañerito se llama **${updatedMascotaData.petName}** 😊\n\n`;
            }
            requestMessage += `Para generar la cotización perfecta para tu mascota, necesito que me proporciones:\n\n`;
            allMissingData.forEach((data, index) => {
                requestMessage += `${index + 1}. ${data}\n`;
            });
            requestMessage += `\n💡 **Ejemplo:** "Mi nombre es Ana García, nací el 15/03/1985, tengo un perro llamado Max de 3 años y vivo en Bogotá"\n\n`;
            requestMessage += `🎯 **¿Me puedes compartir esta información para que podamos proteger a tu mascota?**`;
            return {
                messages: [
                    new HumanMessage({ content: requestMessage, name: "MascotaService" }),
                ],
                next: "supervisor",
                mascotaInsuranceData: updatedMascotaData
            };
        }
        else {
            // Todos los datos están completos - confirmar información y proceder
            console.log('🐾 [MASCOTA AGENT] Datos completos, enviando confirmación...');
            // Aquí se podría agregar la lógica para enviar email como en el agente de vehículos
            // Por ahora, solo mostramos confirmación
            const confirmationMessage = `🎉 **¡Perfecto! Ya tengo toda la información para proteger a tu mascota:**

✅ **DATOS DE TU MASCOTA:**
• **🐾 Nombre:** ${updatedMascotaData.petName}
• **🐕 Tipo:** ${updatedMascotaData.petType}
${updatedMascotaData.petBreed ? `• **🎭 Raza:** ${updatedMascotaData.petBreed}\n` : ''}• **⏰ Edad:** ${updatedMascotaData.petAge}
${updatedMascotaData.petWeight ? `• **⚖️ Peso:** ${updatedMascotaData.petWeight}\n` : ''}• **🏠 Ciudad:** ${updatedMascotaData.city}

✅ **TUS DATOS:**
• **👤 Nombre:** ${updatedMascotaData.fullName}
• **📅 Fecha de nacimiento:** ${updatedMascotaData.birthDate}
${updatedMascotaData.cedula ? `• **🆔 Cédula:** ${updatedMascotaData.cedula}\n` : ''}${updatedMascotaData.phone ? `• **📱 Teléfono:** ${updatedMascotaData.phone}\n` : ''}
💕 **He enviado la información de tu mascota al área especializada para generar la cotización más completa.** Un veterinario asesor experto en seguros para mascotas se pondrá en contacto contigo pronto con las mejores opciones y precios para proteger la salud de tu compañerito.

¡Gracias por confiar en Coltefinanciera Seguros para proteger a tu familia peluda! 🐾💙`;
            return {
                messages: [
                    new HumanMessage({ content: confirmationMessage, name: "MascotaService" }),
                ],
                next: "supervisor",
                mascotaInsuranceData: updatedMascotaData
            };
        }
    }
    // Si no es intención de compra, proceder normalmente
    const result = await mascotaServiceAgent.invoke(state, config);
    const lastMessage = result.messages[result.messages.length - 1];
    return {
        messages: [
            new HumanMessage({ content: lastMessage.content, name: "MascotaService" }),
        ],
        next: "supervisor",
    };
};
// mascotaServiceNode es un nodo que procesa mensajes para el agente de servicio de seguros para mascotas.
// El nodo invoca el agente de servicio de mascotas con el estado actual y la configuración proporcionada.
// Luego, devuelve la respuesta del agente de servicio de mascotas como un mensaje humano.
// El mensaje humano contiene el contenido de la respuesta y el nombre del agente que envió el mensaje.
export { mascotaServiceAgent };
