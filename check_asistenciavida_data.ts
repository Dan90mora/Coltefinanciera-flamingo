/**
 * Verificar datos en tabla asistenciavida_documents
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

async function checkAsistenciaVidaData() {
    console.log('🔍 Verificando datos en tabla asistenciavida_documents...\n');

    const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_KEY!
    );

    try {
        // Verificar si la tabla existe y tiene datos
        const { data, error } = await supabase
            .from('asistenciavida_documents')
            .select('*')
            .limit(5);

        if (error) {
            console.error('❌ Error consultando tabla asistenciavida_documents:', error);
            return;
        }

        if (!data || data.length === 0) {
            console.log('❌ La tabla asistenciavida_documents está VACÍA');
            console.log('💡 Esto explica por qué no encuentra información');
            return;
        }

        console.log(`✅ La tabla tiene ${data.length} documentos (mostrando primeros 5):`);
        data.forEach((doc, i) => {
            console.log(`\n📄 Documento ${i + 1}:`);
            console.log(`   ID: ${doc.id}`);
            console.log(`   Contenido: ${doc.content?.substring(0, 150)}...`);
            console.log(`   Metadata: ${JSON.stringify(doc.metadata || {})}`);
            console.log(`   Embedding: ${doc.embedding ? 'PRESENTE' : 'AUSENTE'}`);
        });

        // Probar búsqueda específica
        console.log('\n🔍 Probando búsqueda específica...');
        
        // Verificar si existe la función RPC
        const { data: rpcData, error: rpcError } = await supabase.rpc('search_asistenciavida_documents_hybrid', {
            query_embedding: new Array(1536).fill(0.1), // Embedding de prueba
            query_text: 'seguro vida deudor',
            match_threshold: 0.1,
            match_count: 3,
            rrf_k: 60
        });

        if (rpcError) {
            console.error('❌ Error en función RPC search_asistenciavida_documents_hybrid:', rpcError);
            console.log('💡 La función RPC no existe o tiene errores');
        } else {
            console.log('✅ Función RPC funciona correctamente');
            console.log(`📊 Resultados de búsqueda: ${rpcData?.length || 0}`);
        }

    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

checkAsistenciaVidaData().catch(console.error);
