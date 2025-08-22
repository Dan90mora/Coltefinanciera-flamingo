// Guardar hustorial de conversación en Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);
// Función para consultar si una persona esta disponible para mandarle audios
export async function getAvailableForAudio(clientNumber) {
    try {
        console.log('🔍 Consultando disponibilidad de audio para:', clientNumber);
        // Verificar si el cliente ya tiene un chat
        const { data: existingChat, error: fetchError } = await supabase
            .from('chat_history')
            .select('audio')
            .eq('client_number', clientNumber)
            .single();
        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: No rows found
            console.error('❌ Error consultando DB audio:', fetchError.message);
            throw new Error(`Error fetching data: ${fetchError.message}`);
        }
        if (existingChat) {
            console.log('✅ Cliente encontrado en DB, audio habilitado:', existingChat.audio);
            return existingChat.audio || true; // Si es null/undefined, default a true
        }
        else {
            console.log('🆕 Cliente nuevo, habilitando audio por defecto');
            return true; // Por defecto, nuevos clientes pueden recibir audio
        }
    }
    catch (error) {
        console.error('❌ Error en getAvailableForAudio:', error);
        return true; // En caso de error, permitir audio por defecto
    }
}
