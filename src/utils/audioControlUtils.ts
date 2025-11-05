// Función para detectar si es el primer saludo del día/sesión
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;
export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Detecta si es el primer saludo del día/sesión para un cliente
 * @param clientNumber - Número del cliente
 * @returns true si es el primer saludo del día, false en caso contrario
 */
export async function isFirstGreetingOfDay(clientNumber: string): Promise<boolean> {
    try {
        console.log('🔍 Verificando si es primer saludo del día para:', clientNumber);
        
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

        if (!existingChat || !existingChat.messages || existingChat.messages.length === 0) {
            console.log('🆕 Cliente nuevo o sin historial - ES PRIMER SALUDO');
            return true;
        }

        // Obtener la fecha actual
        const today = new Date();
        const todayDateString = today.toISOString().split('T')[0]; // YYYY-MM-DD

        // Buscar si ya hay mensajes del agente hoy
        const todayAgentMessages = existingChat.messages.filter((message: any) => {
            if (message.user !== 'agent_message') return false;
            
            const messageDate = new Date(message.date);
            const messageDateString = messageDate.toISOString().split('T')[0];
            
            return messageDateString === todayDateString;
        });

        const isFirstToday = todayAgentMessages.length === 0;
        
        console.log(`📅 Mensajes del agente hoy (${todayDateString}):`, todayAgentMessages.length);
        console.log('🎯 ¿Es primer saludo del día?:', isFirstToday);
        
        return isFirstToday;

    } catch (error) {
        console.error('❌ Error en isFirstGreetingOfDay:', error);
        return true; // En caso de error, asumir que es primer saludo para no perder la funcionalidad
    }
}

/**
 * Detecta si el cliente está solicitando explícitamente un audio
 * @param message - Mensaje del cliente
 * @returns true si el cliente solicita audio, false en caso contrario
 */
export function isClientRequestingAudio(message: string): boolean {
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
