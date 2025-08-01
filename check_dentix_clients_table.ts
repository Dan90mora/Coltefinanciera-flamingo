/**
 * Verificar estructura de la tabla dentix_clients
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

async function checkTableStructure() {
    console.log('🔍 Verificando estructura de la tabla dentix_clients...\n');

    const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_KEY!
    );

    try {
        // Ver algunos registros de ejemplo
        const { data, error } = await supabase
            .from('dentix_clients')
            .select('*')
            .limit(3);

        if (error) {
            console.error('❌ Error consultando tabla:', error);
            return;
        }

        console.log('✅ Estructura de la tabla dentix_clients:');
        if (data && data.length > 0) {
            console.log('📋 Columnas disponibles:');
            Object.keys(data[0]).forEach(col => {
                console.log(`   • ${col}: ${typeof data[0][col]}`);
            });

            console.log('\n📄 Registros de ejemplo:');
            data.forEach((record, i) => {
                console.log(`   ${i + 1}. ${record.name} - Service: ${record.service}`);
            });
        } else {
            console.log('⚠️ No hay registros en la tabla');
        }

        // Probar inserción de prueba
        console.log('\n🧪 Probando inserción de vida deudor...');
        const testInsert = {
            name: 'Usuario Prueba Vida Deudor',
            email: 'test.vidadeudor@example.com',
            phone_number: '+573001234599',
            service: 'vidadeudor'
        };

        const { data: insertData, error: insertError } = await supabase
            .from('dentix_clients')
            .insert(testInsert)
            .select();

        if (insertError) {
            console.error('❌ Error en inserción de prueba:', insertError);
        } else {
            console.log('✅ Inserción de prueba exitosa:', insertData);
            
            // Eliminar el registro de prueba
            await supabase
                .from('dentix_clients')
                .delete()
                .eq('email', 'test.vidadeudor@example.com');
            console.log('🗑️ Registro de prueba eliminado');
        }

    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

checkTableStructure().catch(console.error);
