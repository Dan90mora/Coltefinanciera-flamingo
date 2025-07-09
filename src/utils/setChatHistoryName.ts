// Guardar hustorial de conversación en Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { exportedFromNumber } from '../routes/chatRoutes';

dotenv.config();

// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;
export const supabase = createClient(supabaseUrl, supabaseKey);

// Función para para actualizar el client_name en la base de datos en la tabla chat_history.

export async function setChatHistoryName(clientName: string): Promise<void> {
    try {
        // Verificar si el cliente ya tiene un chat
        const { data: existingChat, error: fetchError } = await supabase
            .from('chat_history')
            .select('id')
            .eq('client_number', exportedFromNumber)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: No rows found
            throw new Error(`Error fetching data: ${fetchError.message}`);
        }

        if (existingChat) {
            // Si el cliente ya tiene un chat, actualizar el nombre del cliente
            const { error: updateError } = await supabase
                .from('chat_history')
                .update({ client_name: clientName })
                .eq('id', existingChat.id);

            if (updateError) {
                throw new Error(`Error updating data: ${updateError.message}`);
            } else {
                console.log('Data updated successfully');
            }
        } 
        
    } catch (error) {
        console.error(error);
    }
}