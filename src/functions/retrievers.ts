import { OpenAIEmbeddings } from '@langchain/openai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Configuración compartida para embeddings
 */
const createEmbeddings = () => new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY!,
    modelName: "text-embedding-3-small",
});

/**
 * Configuración compartida para Supabase
 */
const createSupabaseClient = () => createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!
);

/**
 * Busca en la base vectorial de Dentix usando embeddings de OpenAI
 * @param query - La consulta del usuario
 * @returns Array de resultados de la búsqueda vectorial
 */
export const searchDentixVectors = async (query: string): Promise<any[]> => {
    const embeddings = createEmbeddings();
    const supabase = createSupabaseClient();
    console.log(`🔍 Buscando en Dentix`);
    // Generar embedding para la consulta
    const queryEmbedding = await embeddings.embedQuery(query);
      // Buscar documentos similares en Dentix
    const { data, error } = await supabase.rpc('match_dentix_documents', {
        query_embedding: queryEmbedding,
        match_threshold: 0.3, // Umbral más bajo para permitir más resultados
        match_count: 3,
    });
    
    if (error) {
        throw new Error(`Dentix vector search error: ${error.message}`);
    }
    
    return data || [];
};

/**
 * Busca en la base vectorial de Credintegral usando embeddings de OpenAI
 * @param query - La consulta del usuario
 * @returns Array de resultados de la búsqueda vectorial
 */
export const searchCredintegralVectors = async (query: string): Promise<any[]> => {
    const embeddings = createEmbeddings();
    const supabase = createSupabaseClient();
    console.log(`[DEBUG] Iniciando búsqueda en Credintegral con la consulta: "${query}"`);

    try {
        const queryEmbedding = await embeddings.embedQuery(query);
        console.log("[DEBUG] Embedding generado para la consulta.");        // Detectar si la consulta es sobre cobertura o precios y optimizar la búsqueda
        const isCoverageQuery = /cobertura|cubre|abarca|servicios|incluye|esperar|beneficios|protección|ampara/i.test(query);
        const isPriceQuery = /precio|cuesta|vale|pagar|costo|cuánto|propuesta económica|económica|tarifa|valor|cotización/i.test(query);
        
        // Primero intentar con la consulta original, luego con variaciones si es necesario
        let searchQueries = [query];
        
        if (isCoverageQuery) {
            // Agregar variaciones de búsqueda para consultas sobre cobertura
            searchQueries = [
                query,
                "cobertura",
                "servicios incluidos",
                "beneficios seguro",
                "qué cubre"
            ];
        } else if (isPriceQuery) {
            // Agregar variaciones de búsqueda para consultas sobre precio
            searchQueries = [
                query,
                "propuesta económica",
                "precio del seguro",
                "costo del seguro",
                "valor del seguro",
                "cuánto cuesta",
                "tarifa"
            ];
        }

        for (const searchQuery of searchQueries) {
            const searchEmbedding = searchQuery === query ? queryEmbedding : await embeddings.embedQuery(searchQuery);
            
            const { data, error } = await supabase.rpc('search_credintegral_documents_hybrid', {
                query_embedding: searchEmbedding,
                query_text: searchQuery,
                match_threshold: 0.1,
                match_count: 5, 
                rrf_k: 60
            });

            if (error) {
                console.error('[DEBUG] ❌ Error en la llamada RPC a Supabase:', JSON.stringify(error, null, 2));
                continue;
            }

            if (data && data.length > 0) {
                console.log('[DEBUG] ✅ Llamada RPC a Supabase exitosa.');
                console.log('[DEBUG] 📄 Datos recibidos de Supabase:', JSON.stringify(data, null, 2));
                return data;
            }
        }

        // Si no encontramos nada con ninguna consulta
        console.log('[DEBUG] ⚠️ La búsqueda no arrojó resultados desde Supabase.');
        return [];

    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error(`[DEBUG] ❌ Excepción capturada en searchCredintegralVectors: ${errorMessage}`);
        throw e;
    }
};

/**
 * PLANTILLA para futuras bases vectoriales
 * Copia y adapta esta función para nuevas bases de datos vectoriales
 */
/*
export const searchNewServiceVectors = async (query: string): Promise<any[]> => {
    const embeddings = createEmbeddings();
    const supabase = createSupabaseClient();
    
    // Generar embedding para la consulta
    const queryEmbedding = await embeddings.embedQuery(query);
    
    // Buscar documentos similares en la nueva base
    const { data, error } = await supabase.rpc('match_newservice_documents', {
        query_embedding: queryEmbedding,
        match_threshold: 0.6,
        match_count: 3,
    });
    
    if (error) {
        throw new Error(`NewService vector search error: ${error.message}`);
    }
    
    return data || [];
};
*/