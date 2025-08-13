import dotenv from 'dotenv';
dotenv.config();

import { showVidaDeudorClientDataForConfirmation } from './src/functions/functions';
import { showVidaDeudorClientDataTool } from './src/tools/tools';

async function debugVidaDeudorError() {
    console.log('🔍 DEBUG: Investigando error en confirmación de datos de vida deudor\n');

    const phoneNumbers = [
        '3197595613',  // Número de Daniel sin prefijo
        '+573197595613', // Número con prefijo
        '573197595613'   // Número con código país sin +
    ];

    for (const phoneNumber of phoneNumbers) {
        console.log(`\n📞 Probando con número: ${phoneNumber}`);
        console.log('=' + '='.repeat(50));

        try {
            // 1. Test directo de la función
            console.log('1️⃣ Test directo de la función:');
            const directResult = await showVidaDeudorClientDataForConfirmation(phoneNumber);
            console.log('✅ Función directa exitosa');
            console.log('Resultado:', directResult.substring(0, 200) + '...');

            // 2. Test de la herramienta
            console.log('\n2️⃣ Test de la herramienta:');
            const toolResult = await showVidaDeudorClientDataTool.invoke({ phoneNumber });
            console.log('✅ Herramienta exitosa');
            console.log('Resultado:', toolResult.substring(0, 200) + '...');

        } catch (error) {
            console.error(`❌ Error con número ${phoneNumber}:`, error);
            console.error('Stack trace:', error.stack);
        }
    }

    // 3. Verificar si el cliente existe en la base de datos
    console.log('\n\n3️⃣ Verificando existencia del cliente en BD:');
    try {
        const { searchDentixClientByPhone } = await import('./src/functions/functions');
        const clientInfo = await searchDentixClientByPhone('3197595613');
        console.log('Cliente en BD:', clientInfo);
    } catch (error) {
        console.error('❌ Error buscando cliente:', error);
    }

    console.log('\n🎯 Debug completado');
}

debugVidaDeudorError().catch(console.error);
