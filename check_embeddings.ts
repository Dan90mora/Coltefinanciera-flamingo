// Test script para verificar embeddings en credintegral_documents
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!
);

async function checkEmbeddings() {
    console.log('🔍 Verificando embeddings en credintegral_documents...');
    
    try {
        // 1. Verificar si hay embeddings NULL
        const { data: embeddingCheck, error } = await supabase
            .from('credintegral_documents')
            .select('id, embedding')
            .limit(5);
        
        if (error) {
            console.error('❌ Error verificando embeddings:', error);
            return;
        }
        
        console.log('📊 Estado de embeddings:');
        embeddingCheck?.forEach((doc, i) => {
            console.log(`${i + 1}. ID: ${doc.id}, Embedding: ${doc.embedding ? 'PRESENT' : 'NULL'}`);
            if (doc.embedding) {
                console.log(`   Dimensiones: ${doc.embedding.length}`);
            }
        });
        
        // 2. Contar documentos con y sin embeddings
        const { data: withEmbeddings } = await supabase
            .from('credintegral_documents')
            .select('id', { count: 'exact' })
            .not('embedding', 'is', null);
            
        const { data: withoutEmbeddings } = await supabase
            .from('credintegral_documents')
            .select('id', { count: 'exact' })
            .is('embedding', null);
        
        console.log('\n📈 Resumen:');
        console.log(`Documentos con embeddings: ${withEmbeddings?.length || 0}`);
        console.log(`Documentos sin embeddings: ${withoutEmbeddings?.length || 0}`);
        
        // 3. Verificar extensión vector
        console.log('\n🔧 Verificando extensión vector...');
        const { data: extensions } = await supabase
            .rpc('sql', { query: "SELECT * FROM pg_extension WHERE extname = 'vector'" });
        
        console.log('Extensión vector:', extensions);
        
    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

checkEmbeddings().then(() => {
    console.log('\n🏁 Verificación completada');
    process.exit(0);
}).catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
});
