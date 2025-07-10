// Test script para verificar búsqueda directa en credintegral_documents
// Para usar: npx tsx test_credintegral_search.ts

import { createClient } from '@supabase/supabase-js';
import { OpenAIEmbeddings } from '@langchain/openai';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!
);

const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY!,
    modelName: "text-embedding-3-small",
});

async function testCredintegralSearch() {
    console.log('🔍 Probando búsqueda directa en credintegral_documents...');
    
    try {
        // 1. Verificar que hay documentos
        const { data: countData, error: countError } = await supabase
            .from('credintegral_documents')
            .select('count', { count: 'exact' });
        
        if (countError) {
            console.error('❌ Error contando documentos:', countError);
            return;
        }
        
        console.log('📊 Total de documentos:', countData);
        
        // 2. Ver algunos documentos de ejemplo
        const { data: sampleData, error: sampleError } = await supabase
            .from('credintegral_documents')
            .select('id, content, metadata')
            .limit(2);
        
        if (sampleError) {
            console.error('❌ Error obteniendo muestras:', sampleError);
            return;
        }
        
        console.log('📄 Documentos de ejemplo:');
        sampleData?.forEach((doc, i) => {
            console.log(`${i + 1}. ID: ${doc.id}`);
            console.log(`   Contenido: ${doc.content.substring(0, 100)}...`);
            console.log(`   Metadata: ${JSON.stringify(doc.metadata)}`);
        });
        
        // 3. Generar embedding para "Credintegral"
        console.log('\n🔧 Generando embedding para "Credintegral"...');
        const queryEmbedding = await embeddings.embedQuery("Credintegral");
        console.log('✅ Embedding generado con dimensiones:', queryEmbedding.length);
        
        // 4. Probar función híbrida
        console.log('\n🎯 Probando función search_credintegral_documents_hybrid...');
        const { data: hybridData, error: hybridError } = await supabase.rpc('search_credintegral_documents_hybrid', {
            query_embedding: queryEmbedding,
            query_text: "Credintegral",
            match_threshold: 0.1,
            match_count: 3,
            rrf_k: 60
        });
        
        if (hybridError) {
            console.error('❌ Error en función híbrida:', hybridError);
            return;
        }
        
        if (hybridData && hybridData.length > 0) {
            console.log('✅ Función híbrida devolvió resultados:');
            hybridData.forEach((result: any, i: number) => {
                console.log(`${i + 1}. ID: ${result.id}, Rank: ${result.final_rank}`);
                console.log(`   Contenido: ${result.content.substring(0, 100)}...`);
            });
        } else {
            console.log('⚠️ Función híbrida no devolvió resultados');
        }
        
        // 5. Probar función básica match_credintegral_documents
        console.log('\n🎯 Probando función match_credintegral_documents...');
        const { data: matchData, error: matchError } = await supabase.rpc('match_credintegral_documents', {
            query_embedding: queryEmbedding,
            match_threshold: 0.1,
            match_count: 3
        });
        
        if (matchError) {
            console.error('❌ Error en función match:', matchError);
            return;
        }
        
        if (matchData && matchData.length > 0) {
            console.log('✅ Función match devolvió resultados:');
            matchData.forEach((result: any, i: number) => {
                console.log(`${i + 1}. ID: ${result.id}, Similarity: ${result.similarity}`);
                console.log(`   Contenido: ${result.content.substring(0, 100)}...`);
            });
        } else {
            console.log('⚠️ Función match no devolvió resultados');
        }
        
    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

// Ejecutar test
testCredintegralSearch().then(() => {
    console.log('\n🏁 Test completado');
    process.exit(0);
}).catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
});
