// Verificar directamente qué datos tenemos en la tabla dentix_clients
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

async function verificarDatosBase() {
    console.log('🔍 VERIFICANDO DATOS EN TABLA dentix_clients');
    
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
    
    try {
        // Buscar todos los registros que contengan "Daniel" o terminen en "595613"
        console.log('\n📋 Buscando registros de Daniel...');
        
        const { data: danielRecords, error: danielError } = await supabase
            .from('dentix_clients')
            .select('*')
            .or('name.ilike.%Daniel%,phone_number.like.%595613');

        if (danielError) {
            console.error('❌ Error buscando Daniel:', danielError);
        } else {
            console.log('✅ Registros encontrados con "Daniel" o "595613":');
            console.log(JSON.stringify(danielRecords, null, 2));
        }

        // También buscar registros con servicio vida deudor
        console.log('\n🛡️ Buscando registros con servicio vidadeudor...');
        
        const { data: vidaDeudorRecords, error: vidaError } = await supabase
            .from('dentix_clients')
            .select('*')
            .eq('service', 'vidadeudor');

        if (vidaError) {
            console.error('❌ Error buscando vida deudor:', vidaError);
        } else {
            console.log('✅ Registros con servicio vidadeudor:');
            console.log(JSON.stringify(vidaDeudorRecords, null, 2));
        }

        // Buscar con diferentes variaciones del número
        const phoneVariations = [
            '+573197595613',
            '573197595613',
            '3197595613',
            '+57 319 759 5613',
            '319 759 5613'
        ];

        console.log('\n📞 Probando variaciones de número de teléfono...');
        
        for (const phone of phoneVariations) {
            const { data, error } = await supabase
                .from('dentix_clients')
                .select('*')
                .eq('phone_number', phone);

            if (error) {
                console.error(`❌ Error con ${phone}:`, error);
            } else if (data && data.length > 0) {
                console.log(`✅ Encontrado con ${phone}:`, data);
            } else {
                console.log(`⚪ No encontrado con: ${phone}`);
            }
        }

    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

verificarDatosBase();
