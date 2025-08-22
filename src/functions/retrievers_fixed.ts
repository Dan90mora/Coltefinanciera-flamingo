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
        console.log("[DEBUG] Embedding generado para la consulta.");
        
        // Detectar si la consulta es sobre cobertura o precios y optimizar la búsqueda
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
 * 🚀 MEJORA GLOBAL: Busca en la base vectorial de Vida Deudor usando embeddings de OpenAI
 * NUEVA ESTRATEGIA: Búsqueda exhaustiva con ranking en lugar de devolver "lo primero que encuentre"
 * @param query - La consulta del usuario
 * @returns Array de resultados de la búsqueda vectorial rankeados por relevancia
 */
export const searchVidaDeudorVectors = async (query: string): Promise<any[]> => {
    const embeddings = createEmbeddings();
    const supabase = createSupabaseClient();
    console.log(`[DEBUG] 🔍 Iniciando búsqueda EXHAUSTIVA en Vida Deudor con la consulta: "${query}"`);

    try {
        // Generar embedding para la consulta
        const queryEmbedding = await embeddings.embedQuery(query);
        console.log("[DEBUG] Embedding generado para la consulta.");
        
        // Detectar si la consulta es sobre cobertura, precios o farmacias y optimizar la búsqueda
        const isCoverageQuery = /cobertura|cubre|abarca|servicios|incluye|esperar|beneficios|protección|ampara/i.test(query);
        const isPriceQuery = /precio|cuesta|vale|pagar|costo|cuánto|propuesta económica|económica|tarifa|valor|cotización|cuanto cuesta|que cuesta|que precio|precio tiene|valor tiene|costo tiene|vale el seguro|cuanto vale|valor del seguro|costo del seguro|precio del seguro/i.test(query);
        const isFarmaciaQuery = /farmacia|farmacias|droguería|droguerías|drogue|rebaja|medicamento|medicina|aplicar beneficio|donde puedo|que farmacias|cuales farmacias/i.test(query);
        
        // 🎯 NUEVA ESTRATEGIA: BÚSQUEDA EXHAUSTIVA CON RANKING
        // En lugar de devolver el primer resultado, recopilar TODOS los resultados y rankearlos
        let searchQueries = [query];
        
        // Siempre agregar versiones simplificadas como fallback
        searchQueries.push("vida deudor");
        searchQueries.push("seguro vida deudor");
        searchQueries.push("asistencia vida deudor");
        
        if (isFarmaciaQuery) {
            // 🎯 NUEVA LÓGICA: Consultas específicas sobre farmacias
            console.log("[DEBUG] 💊 Consulta sobre farmacias detectada, agregando términos específicos...");
            searchQueries.push("SERVICIO CONVENIO DESCUENTOS EN FARMACIAS");
            searchQueries.push("descuento farmacias");
            searchQueries.push("descuentos en farmacias");
            searchQueries.push("farmacia aliada");
            searchQueries.push("beneficio farmacia");
            searchQueries.push("Rebaja Droguerías");
            searchQueries.push("5% descuento");
            searchQueries.push("ACCESO AL SERVICIO DESCUENTOS EN FARMACIAS");
            searchQueries.push("puntos de venta");
            searchQueries.push("Minimarkets");
        } else if (isCoverageQuery) {
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

        // 🔍 BÚSQUEDA EXHAUSTIVA: Recopilar resultados de TODAS las consultas
        const allChunks: any[] = [];
        const seenIds = new Set<number>();
        
        for (const searchQuery of searchQueries) {
            const searchEmbedding = searchQuery === query ? queryEmbedding : await embeddings.embedQuery(searchQuery);
            
            const { data, error } = await supabase.rpc('search_asistenciavida_documents_hybrid', {
                query_embedding: searchEmbedding,
                query_text: searchQuery,
                match_threshold: 0.1,
                match_count: 8, // Aumentamos para obtener más resultados
                rrf_k: 60
            });

            if (error) {
                console.error('[DEBUG] ❌ Error en la llamada RPC a Supabase:', JSON.stringify(error, null, 2));
                continue;
            }

            if (data && data.length > 0) {
                console.log(`[DEBUG] ✅ Consulta "${searchQuery}" encontró ${data.length} resultados`);
                
                // Agregar solo documentos únicos (evitar duplicados)
                for (const doc of data) {
                    if (!seenIds.has(doc.id)) {
                        seenIds.add(doc.id);
                        // Agregar score de la consulta que lo encontró para ranking
                        doc.search_query = searchQuery;
                        doc.query_index = searchQueries.indexOf(searchQuery); // 0 = consulta original, mayor = menos específica
                        allChunks.push(doc);
                    }
                }
            }
        }

        // 📊 RANKING Y CONSOLIDACIÓN DE RESULTADOS
        if (allChunks.length === 0) {
            console.log('[DEBUG] ⚠️ La búsqueda exhaustiva no arrojó resultados desde Supabase.');
            return [];
        }

        console.log(`[DEBUG] 🔍 Búsqueda exhaustiva completada: ${allChunks.length} documentos únicos encontrados`);

        // 🎯 LÓGICA ESPECIAL PARA FARMACIAS: Priorización específica
        if (isFarmaciaQuery) {
            const farmaciaDoc = allChunks.find((doc: any) => 
                doc.id === 35 || 
                doc.content.includes('SERVICIO CONVENIO DESCUENTOS EN FARMACIAS') || 
                doc.content.includes('Rebaja Droguerías')
            );
            if (farmaciaDoc) {
                console.log('[DEBUG] 🎯 ¡Documento específico de farmacias encontrado! Priorizando...');
                // Reorganizar para poner el documento de farmacias primero
                const otherDocs = allChunks.filter((doc: any) => doc.id !== farmaciaDoc.id);
                return [farmaciaDoc, ...otherDocs.slice(0, 2)]; // Farmacia + 2 documentos adicionales
            }
        }

        // 🏆 RANKING GLOBAL: Ordenar por relevancia combinada
        allChunks.sort((a, b) => {
            // 1. Priorizar por final_rank (relevancia semántica)
            const rankDiff = (b.final_rank || 0) - (a.final_rank || 0);
            if (Math.abs(rankDiff) > 0.01) return rankDiff;
            
            // 2. Si el ranking es similar, priorizar consultas más específicas (query_index menor)
            const queryDiff = (a.query_index || 0) - (b.query_index || 0);
            if (queryDiff !== 0) return queryDiff;
            
            // 3. Como último criterio, usar similarity si está disponible
            return (b.similarity || 0) - (a.similarity || 0);
        });

        // Filtrar por umbral mínimo de relevancia
        const relevantResults = allChunks.filter(doc => (doc.final_rank || 0) > 0.01);
        
        if (relevantResults.length === 0) {
            console.log('[DEBUG] ⚠️ Ningún resultado superó el umbral mínimo de relevancia (0.01)');
            return allChunks.slice(0, 3); // Devolver los 3 mejores aunque tengan baja relevancia
        }

        console.log(`[DEBUG] 🏆 Ranking final: ${relevantResults.length} documentos relevantes`);
        relevantResults.slice(0, 3).forEach((doc, i) => {
            console.log(`[DEBUG] ${i + 1}. ID: ${doc.id}, Rank: ${doc.final_rank?.toFixed(3)}, Query: "${doc.search_query}"`);
        });

        // Devolver los mejores 3 resultados rankeados
        return relevantResults.slice(0, 3);

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
