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
 * Busca en la base vectorial de Vida Deudor usando embeddings de OpenAI
 * @param query - La consulta del usuario
 * @returns Array de resultados de la búsqueda vectorial
 */
export const searchVidaDeudorVectors = async (query: string): Promise<any[]> => {
    const embeddings = createEmbeddings();
    const supabase = createSupabaseClient();
    console.log(`[DEBUG] Iniciando búsqueda en Vida Deudor con la consulta: "${query}"`);

    try {
        // Generar embedding para la consulta
        const queryEmbedding = await embeddings.embedQuery(query);
        console.log("[DEBUG] Embedding generado para la consulta.");

        // Detectar si la consulta es sobre cobertura o precios y optimizar la búsqueda
        const isCoverageQuery = /cobertura|cubre|abarca|servicios|incluye|esperar|beneficios|protección|ampara/i.test(query);
        const isPriceQuery = /precio|cuesta|vale|pagar|costo|cuánto|propuesta económica|económica|tarifa|valor|cotización|cuanto cuesta|que cuesta|que precio|precio tiene|valor tiene|costo tiene|vale el seguro|cuanto vale|valor del seguro|costo del seguro|precio del seguro/i.test(query);
        
        // Estrategia de búsqueda: empezar con la consulta original, luego simplificar
        let searchQueries = [query];
        
        // Siempre agregar versiones simplificadas como fallback
        searchQueries.push("vida deudor");
        searchQueries.push("seguro vida deudor");
        searchQueries.push("asistencia vida deudor");
        
        if (isCoverageQuery) {
            // Agregar variaciones de búsqueda para consultas sobre cobertura
            searchQueries.push("cobertura");
            searchQueries.push("servicios incluidos");
            searchQueries.push("beneficios seguro");
            searchQueries.push("qué cubre");
        } else if (isPriceQuery) {
            // Agregar variaciones de búsqueda específicas para encontrar tarifas de vida deudor
            searchQueries.push("Tarifa mes / persona");
            searchQueries.push("Tarifa completa IVA del 19%");
            searchQueries.push("Tarifa propuesta para productos mandatorios");
            searchQueries.push("propuesta económica vida deudor");
            searchQueries.push("propuesta económica");
            searchQueries.push("tarifa mes persona");
            searchQueries.push("tarifa completa IVA");
            searchQueries.push("tarifa propuesta productos mandatorios");
            searchQueries.push("precio del seguro vida deudor");
            searchQueries.push("costo del seguro vida deudor");
            searchQueries.push("valor del seguro vida deudor");
            searchQueries.push("tarifa vida deudor");
        } else {
            // Para consultas generales, agregar términos relacionados
            searchQueries.push("información");
            searchQueries.push("seguro");
            searchQueries.push("cobertura");
            searchQueries.push("beneficios");
        }

        for (const searchQuery of searchQueries) {
            const searchEmbedding = searchQuery === query ? queryEmbedding : await embeddings.embedQuery(searchQuery);
            
            const { data, error } = await supabase.rpc('search_asistenciavida_documents_hybrid', {
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
                console.log(`[DEBUG] 📄 Encontrado con consulta: "${searchQuery}"`);
                console.log('[DEBUG] 📄 Datos recibidos de Supabase:', JSON.stringify(data, null, 2));
                return data;
            }
        }

        // Si no encontramos nada con ninguna consulta
        console.log('[DEBUG] ⚠️ La búsqueda no arrojó resultados desde Supabase.');
        return [];

    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error(`[DEBUG] ❌ Excepción capturada en searchVidaDeudorVectors: ${errorMessage}`);
        throw e;
    }
};

/**
 * Busca específicamente información de tarifas de vida deudor con texto exacto
 * @param query - La consulta del usuario sobre precios
 * @returns Array de resultados específicos de tarifas
 */
export const searchVidaDeudorTariffs = async (query: string): Promise<any[]> => {
    const supabase = createSupabaseClient();
    console.log(`[DEBUG] Búsqueda específica de tarifas vida deudor: "${query}"`);

    try {
        // Búsquedas específicas de texto para encontrar tarifas exactas
        const tariffSearches = [
            "Tarifa mes / persona",
            "Tarifa completa IVA del 19%",
            "Tarifa propuesta para productos mandatorios"
        ];

        for (const tariffText of tariffSearches) {
            console.log(`[DEBUG] Buscando texto exacto: "${tariffText}"`);
            
            const { data, error } = await supabase
                .from('asistenciavida_documents')
                .select('*')
                .ilike('content', `%${tariffText}%`);

            if (error) {
                console.error(`[DEBUG] ❌ Error buscando "${tariffText}":`, error);
                continue;
            }

            if (data && data.length > 0) {
                console.log(`[DEBUG] ✅ Encontrado documento con "${tariffText}"`);
                
                // Extraer el precio específicamente
                const content = data[0].content;
                const priceInfo = extractPriceFromTariffContent(content);
                
                if (priceInfo) {
                    // Crear un resultado mejorado con el precio destacado
                    const enhancedResult = {
                        ...data[0],
                        content: `PRECIOS DEL SEGURO DE VIDA DEUDOR:

${priceInfo}

INFORMACIÓN ADICIONAL:
${content}`,
                        extracted_price: priceInfo
                    };
                    
                    console.log(`[DEBUG] 📄 Precio extraído: ${priceInfo}`);
                    return [enhancedResult];
                }
                
                console.log(`[DEBUG] 📄 Contenido:`, content.substring(0, 800));
                return data;
            }
        }

        // Si no encontramos nada con texto exacto, usar búsqueda normal
        console.log('[DEBUG] ⚠️ No se encontraron tarifas con texto exacto, usando búsqueda híbrida');
        return await searchVidaDeudorVectors(query);

    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error(`[DEBUG] ❌ Error en searchVidaDeudorTariffs: ${errorMessage}`);
        return await searchVidaDeudorVectors(query);
    }
};

/**
 * Extrae el precio específico del contenido de tarifas
 * @param content - Contenido del documento
 * @returns Información del precio formateada
 */
function extractPriceFromTariffContent(content: string): string | null {
    const lines = content.split('\n');
    let foundTariffSection = false;
    let priceInfo = '';
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Detectar si estamos en la sección de tarifas
        if (line.includes('Tarifa mes / persona') || 
            line.includes('Tarifa completa IVA') || 
            line.includes('Tarifa propuesta para productos mandatorios')) {
            foundTariffSection = true;
            priceInfo += `📋 ${line}\n`;
            continue;
        }
        
        // Si estamos en la sección de tarifas y encontramos un precio
        if (foundTariffSection && /\$\d+/.test(line)) {
            priceInfo += `💰 PRECIO: ${line}\n`;
            
            // Crear un resumen claro
            return `${priceInfo}
📍 RESUMEN: El seguro de vida deudor tiene un costo de ${line} según la propuesta económica.`;
        }
        
        // Si estamos en la sección de tarifas, agregar líneas relevantes
        if (foundTariffSection && line) {
            priceInfo += `   ${line}\n`;
        }
    }
    
    return null;
}

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

/**
 * Busca en la base vectorial de Bienestar Plus usando embeddings de OpenAI
 * @param query - La consulta del usuario
 * @returns Array de resultados de la búsqueda vectorial
 */
export const searchBienestarVectors = async (query: string): Promise<any[]> => {
    const embeddings = createEmbeddings();
    const supabase = createSupabaseClient();
    console.log(`[DEBUG] Iniciando búsqueda en Bienestar Plus con la consulta: "${query}"`);

    try {
        // Generar embedding para la consulta
        const queryEmbedding = await embeddings.embedQuery(query);
        console.log("[DEBUG] Embedding generado para la consulta.");

        // Detectar si la consulta es sobre cobertura o precios y optimizar la búsqueda
        const isCoverageQuery = /cobertura|cubre|abarca|servicios|incluye|esperar|beneficios|protección|ampara/i.test(query);
        const isPriceQuery = /precio|cuesta|vale|pagar|costo|cuánto|propuesta económica|económica|tarifa|valor|cotización/i.test(query);
        
        // Estrategia de búsqueda: empezar con la consulta original, luego simplificar
        let searchQueries = [query];
        
        // Siempre agregar versiones simplificadas como fallback
        searchQueries.push("bienestar plus");
        searchQueries.push("seguro bienestar");
        searchQueries.push("plan bienestar");
        
        if (isCoverageQuery) {
            // Agregar variaciones de búsqueda para consultas sobre cobertura
            searchQueries.push("cobertura");
            searchQueries.push("servicios incluidos");
            searchQueries.push("beneficios seguro");
            searchQueries.push("qué cubre");
        } else if (isPriceQuery) {
            // Agregar variaciones de búsqueda para consultas sobre precio
            searchQueries.push("propuesta económica");
            searchQueries.push("precio del seguro");
            searchQueries.push("costo del seguro");
            searchQueries.push("valor del seguro");
            searchQueries.push("cuánto cuesta");
            searchQueries.push("tarifa");
        } else {
            // Para consultas generales, agregar términos relacionados
            searchQueries.push("información");
            searchQueries.push("seguro");
            searchQueries.push("cobertura");
            searchQueries.push("beneficios");
        }

        // Acumular todos los chunks relevantes de todas las queries
        const allChunks: any[] = [];
        const seenIds = new Set();
        for (const searchQuery of searchQueries) {
            const searchEmbedding = searchQuery === query ? queryEmbedding : await embeddings.embedQuery(searchQuery);
            const { data, error } = await supabase.rpc('search_bienestarplus_documents_hybrid', {
                query_embedding: searchEmbedding,
                query_text: searchQuery,
                match_threshold: 0.05, // Más bajo para asegurar chunks relevantes
                match_count: 20, // Más alto para asegurar chunk 8
                rrf_k: 60
            });

            if (error) {
                console.error('[DEBUG] ❌ Error en la llamada RPC a Supabase:', JSON.stringify(error, null, 2));
                continue;
            }

            if (data && data.length > 0) {
                console.log(`[DEBUG] ✅ Llamada RPC a Supabase exitosa para query: "${searchQuery}"`);
                console.log(`[DEBUG] Se recibieron ${data.length} chunks. IDs:`, (data as any[]).map((d: any) => d.id));
                (data as any[]).forEach((chunk: any, idx: number) => {
                  console.log(`[DEBUG] Chunk #${idx + 1} (ID: ${chunk.id}):\n${chunk.content.substring(0, 200)}...`);
                  if (!seenIds.has(chunk.id)) {
                    allChunks.push(chunk);
                    seenIds.add(chunk.id);
                  }
                });
            }
        }

        // Si es consulta de precio, buscar explícitamente chunks con "$"
        if (isPriceQuery) {
            const { data: priceChunks, error: priceError } = await supabase
                .from('bienestarplus_documents')
                .select('*')
                .ilike('content', '%$%');
            if (priceError) {
                console.error('[DEBUG] ❌ Error buscando chunks con "$":', priceError);
            } else if (priceChunks && priceChunks.length > 0) {
                priceChunks.forEach((chunk: any) => {
                    if (!seenIds.has(chunk.id)) {
                        allChunks.push(chunk);
                        seenIds.add(chunk.id);
                        console.log(`[DEBUG] Chunk de precio añadido por búsqueda directa (ID: ${chunk.id})`);
                    }
                });
            }
        }

        if (allChunks.length > 0) {
            // Si es consulta de precio, priorizar el chunk con el precio literal
            if (isPriceQuery) {
                // Busca el primer chunk que contenga un patrón de precio claro
                const priceChunk = allChunks.find(chunk => /\$\s?\d+[\d\.]*\s?(MENSUAL|ANUAL|\/PERSONA|TARIFA|IVA)?/i.test(chunk.content));
                if (priceChunk) {
                    console.log(`[DEBUG] Chunk de precio detectado y priorizado (ID: ${priceChunk.id})`);
                    return [priceChunk];
                }
            }
            return allChunks;
        }

        // Si no encontramos nada con ninguna consulta
        console.log('[DEBUG] ⚠️ La búsqueda no arrojó resultados desde Supabase.');
        return [];
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error(`[DEBUG] ❌ Excepción capturada en searchBienestarVectors: ${errorMessage}`);
        throw e;
    }
};