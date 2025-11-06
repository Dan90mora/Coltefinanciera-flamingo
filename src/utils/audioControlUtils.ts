// Función para detectar si es el primer saludo del día/sesión
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;
export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Detecta si es el primer saludo (primera vez o después de 24+ horas) para un cliente
 * @param clientNumber - Número del cliente
 * @returns true si es primer saludo o han pasado más de 24 horas desde el último mensaje del agente
 */
export async function isFirstGreetingOfDay(clientNumber: string): Promise<boolean> {
    try {
        console.log('🔍 ========== INICIO DIAGNÓSTICO AUDIO ==========');
        console.log('🔍 Verificando si es primer saludo (primera vez o +24h) para:', clientNumber);
        console.log('🕐 Fecha y hora actual del servidor:', new Date().toISOString());
        
        // Obtener historial del cliente
        const { data: existingChat, error: fetchError } = await supabase
            .from('chat_history')
            .select('messages')
            .eq('client_number', clientNumber)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: No rows found
            console.error('❌ Error consultando historial:', fetchError.message);
            console.log('❌ Código de error:', fetchError.code);
            console.log('❌ Detalles completos del error:', fetchError);
            console.log('✅ RESULTADO: Asumiendo primer saludo por error en consulta');
            console.log('🔍 ========== FIN DIAGNÓSTICO AUDIO ==========');
            return true; // En caso de error, asumir que es primer saludo
        }

        // ESCENARIO 1: Primera vez que escribe (no hay historial)
        if (!existingChat || !existingChat.messages || existingChat.messages.length === 0) {
            console.log('🆕 ESCENARIO 1: Cliente nuevo o sin historial - ES PRIMER SALUDO');
            console.log('💾 Datos del chat encontrados:', existingChat ? 'SÍ' : 'NO');
            console.log('📝 Cantidad de mensajes:', existingChat?.messages?.length || 0);
            console.log('✅ RESULTADO: ES PRIMER SALUDO (sin historial)');
            console.log('🔍 ========== FIN DIAGNÓSTICO AUDIO ==========');
            return true;
        }

        // Buscar el último mensaje del AGENTE (no del cliente)
        // Incluir diferentes tipos de mensajes del agente que pueden aparecer en el historial
        const agentMessages = existingChat.messages.filter((message: any) => 
            message.user === 'agent_message' || 
            message.user === 'Seguros Pruebas' ||
            (message.user && message.user !== 'client_message' && !message.user.startsWith('+'))
        );
        console.log('📊 Total de mensajes en historial:', existingChat.messages.length);
        console.log('🤖 Mensajes del agente encontrados:', agentMessages.length);
        console.log('🔍 Tipos de usuarios en historial:', [...new Set(existingChat.messages.map((m: any) => m.user))]);
        
        if (agentMessages.length === 0) {
            console.log('🆕 ESCENARIO 1: No hay mensajes previos del agente - ES PRIMER SALUDO');
            console.log('✅ RESULTADO: ES PRIMER SALUDO (sin mensajes del agente)');
            console.log('🔍 ========== FIN DIAGNÓSTICO AUDIO ==========');
            return true;
        }

        // Obtener el último mensaje del agente (ordenar por fecha descendente)
        const lastAgentMessage = agentMessages.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        
        console.log('📅 Datos del último mensaje del agente:');
        console.log('   - Fecha original:', lastAgentMessage.date);
        console.log('   - Tipo de usuario:', lastAgentMessage.user);
        console.log('   - Tipo de fecha:', typeof lastAgentMessage.date);
        console.log('   - Mensaje:', lastAgentMessage.message?.substring(0, 50) + '...');
        
        // ESCENARIO 2: Verificar si han pasado más de 24 horas + 1 minuto
        const now = new Date();
        const lastMessageDate = new Date(lastAgentMessage.date);
        
        console.log('🕐 Comparación de fechas:');
        console.log('   - Ahora (servidor):', now.toISOString());
        console.log('   - Último mensaje:', lastMessageDate.toISOString());
        console.log('   - ¿Fecha válida?:', !isNaN(lastMessageDate.getTime()));
        
        if (isNaN(lastMessageDate.getTime())) {
            console.error('❌ ERROR: Fecha inválida en el último mensaje del agente');
            console.log('✅ RESULTADO: Asumiendo primer saludo por fecha inválida');
            console.log('🔍 ========== FIN DIAGNÓSTICO AUDIO ==========');
            return true;
        }
        
        const timeDifferenceMs = now.getTime() - lastMessageDate.getTime();
        const hoursElapsed = timeDifferenceMs / (1000 * 60 * 60); // Convertir a horas
        const daysElapsed = hoursElapsed / 24; // Convertir a días
        const twentyFourHoursAndOneMinute = 24 + (1 / 60); // 24 horas y 1 minuto

        const isAfter24Hours = hoursElapsed > twentyFourHoursAndOneMinute;
        
        console.log('⏰ Cálculos de tiempo:');
        console.log(`   - Diferencia en ms: ${timeDifferenceMs}`);
        console.log(`   - Tiempo transcurrido: ${hoursElapsed.toFixed(2)} horas (${daysElapsed.toFixed(2)} días)`);
        console.log(`   - Umbral requerido: ${twentyFourHoursAndOneMinute.toFixed(2)} horas`);
        console.log(`   - ¿Más de 24h 1min?: ${isAfter24Hours}`);
        
        if (isAfter24Hours) {
            console.log('🆕 ESCENARIO 2: Han pasado más de 24 horas - ES PRIMER SALUDO');
            console.log('✅ RESULTADO: ES PRIMER SALUDO (+24h transcurridas)');
            console.log('🔍 ========== FIN DIAGNÓSTICO AUDIO ==========');
            return true;
        } else {
            console.log('❌ No es primer saludo: Último mensaje hace menos de 24 horas');
            console.log('❌ RESULTADO: NO ES PRIMER SALUDO (menos de 24h)');
            console.log('🔍 ========== FIN DIAGNÓSTICO AUDIO ==========');
            return false;
        }

    } catch (error) {
        console.error('❌ Error en isFirstGreetingOfDay:', error);
        console.log('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack available');
        console.log('✅ RESULTADO: Asumiendo primer saludo por error en función');
        console.log('🔍 ========== FIN DIAGNÓSTICO AUDIO ==========');
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
