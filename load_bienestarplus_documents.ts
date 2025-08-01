// Script para cargar documentos de Bienestar Plus con embeddings en Supabase
// Ejecutar con: npx tsx load_bienestarplus_documents.ts

import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { createClient } from '@supabase/supabase-js';
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
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

// Archivos a procesar - AJUSTA ESTAS RUTAS A TUS ARCHIVOS REALES
const documentFiles = [
    "./documents/COBERTURAS_BIENESTAR_PLUS.docx",
    // Agrega más archivos aquí si los tienes:
    // "./documents/PROPUESTA_ECONOMICA_BIENESTAR_PLUS.docx",
    // "./documents/INFO_GENERAL_BIENESTAR_PLUS.docx",
];

async function loadBienestarPlusDocuments() {
    console.log('🚀 Iniciando carga de documentos de Bienestar Plus...');
    
    try {
        // 1. Verificar conexión con Supabase
        const { data: testData, error: testError } = await supabase
            .from('bienestarplus_documents')
            .select('count', { count: 'exact' });
        
        if (testError) {
            throw new Error(`Error conectando con Supabase: ${testError.message}`);
        }
        
        console.log(`📊 Documentos actuales en la tabla: ${testData[0]?.count || 0}`);
        
        // 2. Procesar cada archivo
        for (let i = 0; i < documentFiles.length; i++) {
            const filePath = documentFiles[i];
            
            console.log(`\n📄 Procesando archivo ${i + 1}/${documentFiles.length}: ${filePath}`);
            
            try {
                // 3. Cargar documento
                const loader = new DocxLoader(filePath);
                const docs = await loader.load();
                
                console.log(`   ✅ Documento cargado: ${docs.length} páginas/secciones`);
                
                // 4. Dividir en chunks
                const textSplitter = new RecursiveCharacterTextSplitter({
                    chunkSize: 1000,
                    chunkOverlap: 200,
                });
                
                const splitDocs = await textSplitter.splitDocuments(docs);
                console.log(`   📝 Dividido en ${splitDocs.length} chunks`);
                
                // 5. Configurar metadata para cada chunk
                const processedDocs = splitDocs.map((doc, index) => ({
                    ...doc,
                    metadata: {
                        ...doc.metadata,
                        fileName: filePath.split('/').pop() || 'unknown',
                        chunkIndex: index,
                        service: 'bienestar_plus',
                        loadedAt: new Date().toISOString()
                    }
                }));
                
                // 6. Cargar en Supabase con embeddings
                console.log(`   🔄 Generando embeddings y cargando en Supabase...`);
                
                const vectorStore = await SupabaseVectorStore.fromDocuments(
                    processedDocs,
                    embeddings,
                    {
                        client: supabase,
                        tableName: "bienestarplus_documents",
                    }
                );
                
                console.log(`   ✅ Archivo procesado exitosamente`);
                
            } catch (fileError) {
                console.error(`   ❌ Error procesando ${filePath}:`, fileError);
                console.log(`   💡 Verifica que el archivo existe y es accesible`);
                continue; // Continuar con el siguiente archivo
            }
        }
        
        // 7. Verificar que los documentos se cargaron correctamente
        console.log('\n🔍 Verificando carga exitosa...');
        const { data: finalCount, error: countError } = await supabase
            .from('bienestarplus_documents')
            .select('count', { count: 'exact' });
        
        if (countError) {
            console.error('❌ Error verificando conteo final:', countError);
        } else {
            console.log(`📊 Total de documentos en la base: ${finalCount[0]?.count || 0}`);
        }
        
        // 8. Probar búsqueda híbrida
        console.log('\n🧪 Probando función de búsqueda híbrida...');
        const testQuery = "información sobre coberturas";
        const testEmbedding = await embeddings.embedQuery(testQuery);
        
        const { data: searchData, error: searchError } = await supabase.rpc('search_bienestarplus_documents_hybrid', {
            query_text: testQuery,
            query_embedding: testEmbedding,
            match_threshold: 0.1,
            match_count: 3,
            rrf_k: 60
        });
        
        if (searchError) {
            console.error('❌ Error en búsqueda híbrida:', searchError);
            console.log('💡 Asegúrate de haber ejecutado supabase_bienestarplus_setup.sql');
        } else if (searchData && searchData.length > 0) {
            console.log('✅ Búsqueda híbrida funcionando correctamente!');
            console.log(`   Encontrados ${searchData.length} resultados`);
            console.log(`   Contenido: ${searchData[0].content.substring(0, 100)}...`);
            console.log(`   Rank: ${searchData[0].final_rank}`);
        } else {
            console.log('⚠️ Búsqueda híbrida no devolvió resultados');
            console.log('💡 Esto puede ser normal si el contenido no contiene información sobre coberturas');
        }
        
        // 9. Probar búsqueda básica
        console.log('\n🔍 Probando búsqueda básica...');
        const { data: basicSearchData, error: basicSearchError } = await supabase.rpc('match_bienestarplus_documents', {
            query_embedding: testEmbedding,
            match_threshold: 0.1,
            match_count: 3
        });
        
        if (basicSearchError) {
            console.error('❌ Error en búsqueda básica:', basicSearchError);
        } else if (basicSearchData && basicSearchData.length > 0) {
            console.log('✅ Búsqueda básica funcionando correctamente!');
            console.log(`   Encontrados ${basicSearchData.length} resultados`);
        } else {
            console.log('⚠️ Búsqueda básica no devolvió resultados');
        }
        
    } catch (error) {
        console.error('💥 Error general:', error);
        console.log('\n🔧 Posibles soluciones:');
        console.log('1. Verificar que los archivos existen en la carpeta ./documents/');
        console.log('2. Verificar variables de entorno en .env');
        console.log('3. Verificar que la tabla bienestarplus_documents existe');
        console.log('4. Ejecutar supabase_bienestarplus_setup.sql si es necesario');
        process.exit(1);
    }
}

// Ejecutar la función
if (import.meta.url === `file://${process.argv[1]}`) {
    loadBienestarPlusDocuments()
        .then(() => {
            console.log('\n🎉 ¡Proceso completado exitosamente!');
            console.log('🔧 El agente bienestarServiceAgent ya puede funcionar con los documentos cargados');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error fatal:', error);
            process.exit(1);
        });
}
