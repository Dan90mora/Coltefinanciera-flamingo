// Script para cargar documentos de Credintegral con embeddings en Supabase
// Ejecutar con: npx tsx load_credintegral_documents.ts

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
    "./documents/COBERTURAS_CREDINTEGRAL.docx",
    // Agrega más archivos aquí si los tienes:
    // "./documents/PROPUESTA_ECONOMICA_CREDINTEGRAL.docx",
    // "./documents/INFO_GENERAL_CREDINTEGRAL.docx",
];
async function loadCredintegralDocuments() {
    console.log('🚀 Iniciando carga de documentos de Credintegral...');
    
    try {
        // 1. Verificar conexión con Supabase
        const { data: testData, error: testError } = await supabase
            .from('credintegral_documents')
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
                // 3. Cargar el archivo .docx usando DocxLoader
                const loader = new DocxLoader(filePath);
                const docs = await loader.load();
                
                console.log(`📖 Documento cargado: ${docs.length} páginas/secciones`);
                
                // 4. Dividir el documento en chunks
                const splitter = new RecursiveCharacterTextSplitter({
                    chunkSize: 1000,  // Chunks más grandes para mejor contexto
                    chunkOverlap: 100, // Más solapamiento para mantener contexto
                    separators: ['\n\n', '\n', '. ', ' ', '']
                });
                
                const chunks = await splitter.splitDocuments(docs);
                console.log(`✂️ Documento dividido en ${chunks.length} chunks`);
                
                // 5. Usar SupabaseVectorStore para cargar automáticamente con embeddings
                console.log('🔧 Generando embeddings y cargando en Supabase...');
                
                await SupabaseVectorStore.fromDocuments(
                    chunks,
                    embeddings,
                    {
                        client: supabase,
                        tableName: 'credintegral_documents',
                        queryName: 'match_credintegral_documents'
                    }
                );
                
                console.log(`✅ Archivo ${filePath} procesado exitosamente`);
                
            } catch (fileError) {
                console.error(`❌ Error procesando archivo ${filePath}:`, fileError);
                console.log('💡 Verifica que el archivo existe y es accesible');
                continue;
            }
        }
        
        // 6. Verificar resultados finales
        const { data: finalData, error: finalError } = await supabase
            .from('credintegral_documents')
            .select('count', { count: 'exact' });
        
        if (finalError) {
            throw new Error(`Error verificando resultados: ${finalError.message}`);
        }
        
        console.log(`\n🎉 Proceso completado exitosamente!`);
        console.log(`📊 Total de documentos en la tabla: ${finalData[0]?.count || 0}`);
        
        // 7. Probar búsqueda vectorial
        console.log('\n🔍 Probando búsqueda vectorial...');
        const testEmbedding = await embeddings.embedQuery("precio del seguro");
        
        const { data: searchData, error: searchError } = await supabase.rpc('search_credintegral_documents_hybrid', {
            query_embedding: testEmbedding,
            query_text: "precio",
            match_threshold: 0.1,
            match_count: 3,
            rrf_k: 60
        });
        
        if (searchError) {
            console.error('❌ Error en búsqueda de prueba:', searchError);
        } else if (searchData && searchData.length > 0) {
            console.log('✅ Búsqueda vectorial funcionando correctamente!');
            console.log(`   Encontrados ${searchData.length} resultados`);
            console.log('📄 Primer resultado:');
            console.log(`   ID: ${searchData[0].id}`);
            console.log(`   Contenido: ${searchData[0].content.substring(0, 100)}...`);
            console.log(`   Rank: ${searchData[0].final_rank}`);
        } else {
            console.log('⚠️ Búsqueda vectorial no devolvió resultados');
            console.log('💡 Esto puede ser normal si el contenido no contiene información sobre precios');
        }
        
        // 8. Probar búsqueda básica
        console.log('\n🔍 Probando búsqueda básica...');
        const { data: basicSearchData, error: basicSearchError } = await supabase.rpc('match_credintegral_documents', {
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
        console.log('3. Verificar que la tabla credintegral_documents existe');
        console.log('4. Ejecutar supabase_credintegral_setup.sql si es necesario');
        process.exit(1);
    }
}

// Ejecutar carga
loadCredintegralDocuments().then(() => {
    console.log('\n🏁 Script completado');
    console.log('🎯 Próximos pasos:');
    console.log('1. Probar el chatbot con: npm run dev');
    console.log('2. Enviar mensaje: "Credintegral"');
    console.log('3. Enviar mensaje: "¿Cuánto cuesta el seguro?"');
    console.log('4. Verificar que las respuestas incluyan información de los documentos');
    process.exit(0);
}).catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
});

export {};
