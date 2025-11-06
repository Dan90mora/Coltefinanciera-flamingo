// Función para detectar si es el primer saludo del día/sesión
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);
/**
 * Detecta si es el primer saludo (primera vez o después de 24+ horas) para un cliente
 * @param clientNumber - Número del cliente
 * @returns true si es primer saludo o han pasado más de 24 horas desde el último mensaje del agente
 */
export async function isFirstGreetingOfDay(clientNumber) {
    try {
        console.log('🔍 Verificando si es primer saludo (primera vez o +24h) para:', clientNumber);
        // Obtener historial del cliente
        const { data: existingChat, error: fetchError } = await supabase
            .from('chat_history')
            .select('messages')
            .eq('client_number', clientNumber)
            .single();
        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: No rows found
            console.error('❌ Error consultando historial:', fetchError.message);
            return true; // En caso de error, asumir que es primer saludo
        }
        // ESCENARIO 1: Primera vez que escribe (no hay historial)
        if (!existingChat || !existingChat.messages || existingChat.messages.length === 0) {
            console.log('🆕 ESCENARIO 1: Cliente nuevo o sin historial - ES PRIMER SALUDO');
            return true;
        }
        // Buscar el último mensaje del AGENTE (no del cliente)
        const agentMessages = existingChat.messages.filter((message) => message.user === 'agent_message');
        if (agentMessages.length === 0) {
            console.log('🆕 ESCENARIO 1: No hay mensajes previos del agente - ES PRIMER SALUDO');
            return true;
        }
        // Obtener el último mensaje del agente (ordenar por fecha descendente)
        const lastAgentMessage = agentMessages.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        // ESCENARIO 2: Verificar si han pasado más de 24 horas + 1 minuto
        const now = new Date();
        const lastMessageDate = new Date(lastAgentMessage.date);
        const timeDifferenceMs = now.getTime() - lastMessageDate.getTime();
        const hoursElapsed = timeDifferenceMs / (1000 * 60 * 60); // Convertir a horas
        const twentyFourHoursAndOneMinute = 24 + (1 / 60); // 24 horas y 1 minuto
        const isAfter24Hours = hoursElapsed > twentyFourHoursAndOneMinute;
        console.log(`📅 Último mensaje del agente: ${lastAgentMessage.date}`);
        console.log(`⏰ Tiempo transcurrido: ${hoursElapsed.toFixed(2)} horas`);
        console.log(`🕐 ¿Más de 24h 1min? (${twentyFourHoursAndOneMinute.toFixed(2)}h):`, isAfter24Hours);
        if (isAfter24Hours) {
            console.log('🆕 ESCENARIO 2: Han pasado más de 24 horas - ES PRIMER SALUDO');
            return true;
        }
        else {
            console.log('❌ No es primer saludo: Último mensaje hace menos de 24 horas');
            return false;
        }
    }
    catch (error) {
        console.error('❌ Error en isFirstGreetingOfDay:', error);
        return true; // En caso de error, asumir que es primer saludo para no perder la funcionalidad
    }
}
/**
 * Detecta si el cliente está solicitando explícitamente un audio
 * @param message - Mensaje del cliente
 * @returns true si el cliente solicita audio, false en caso contrario
 */
export function isClientRequestingAudio(message) {
    const lowerMessage = message.toLowerCase();
    // Palabras clave que indican solicitud de audio
    const audioRequestKeywords = [
        'envíame un audio',
        'enviame un audio',
        'envía un audio',
        'envia un audio',
        'manda un audio',
        'mándame un audio',
        'mandame un audio',
        'voy conduciendo',
        'estoy conduciendo',
        'no puedo leer',
        'no puedo ver',
        'manda audio',
        'envía audio',
        'envia audio',
        'quiero un audio',
        'necesito un audio',
        'prefiero audio',
        'mejor un audio',
        'en audio por favor',
        'responde en audio',
        'respóndeme en audio',
        'respondeme en audio'
    ];
    const isRequesting = audioRequestKeywords.some(keyword => lowerMessage.includes(keyword));
    if (isRequesting) {
        console.log('🎤 SOLICITUD DE AUDIO DETECTADA:', message.substring(0, 50) + '...');
    }
    return isRequesting;
}
