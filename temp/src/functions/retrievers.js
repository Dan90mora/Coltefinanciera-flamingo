"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchCredintegralVectors = exports.searchDentixVectors = void 0;
const openai_1 = require("@langchain/openai");
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
/**
 * Configuración compartida para embeddings
 */
const createEmbeddings = () => new openai_1.OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "text-embedding-3-small",
});
/**
 * Configuración compartida para Supabase
 */
const createSupabaseClient = () => (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
/**
 * Busca en la base vectorial de Dentix usando embeddings de OpenAI
 * @param query - La consulta del usuario
 * @returns Array de resultados de la búsqueda vectorial
 */
const searchDentixVectors = async (query) => {
    const embeddings = createEmbeddings();
    const supabase = createSupabaseClient();
    console.log(`🔍 Buscando en Dentix`);
    // Generar embedding para la consulta
    const queryEmbedding = await embeddings.embedQuery(query);
    // Buscar documentos similares en Dentix
    const { data, error } = await supabase.rpc('match_dentix_documents', {
        query_embedding: queryEmbedding,
        match_threshold: 0.6,
        match_count: 3,
    });
    if (error) {
        throw new Error(`Dentix vector search error: ${error.message}`);
    }
    return data || [];
};
exports.searchDentixVectors = searchDentixVectors;
/**
 * Busca en la base vectorial de Credintegral usando embeddings de OpenAI
 * @param query - La consulta del usuario
 * @returns Array de resultados de la búsqueda vectorial
 */
const searchCredintegralVectors = async (query) => {
    const embeddings = createEmbeddings();
    const supabase = createSupabaseClient();
    console.log(`🔍 Buscando en Credintegral`);
    // Generar embedding para la consulta
    const queryEmbedding = await embeddings.embedQuery(query);
    // Buscar documentos similares en Credintegral
    const { data, error } = await supabase.rpc('search_credintegral_documents', {
        query_embedding: queryEmbedding,
        match_threshold: 0.6,
        match_count: 3,
    });
    if (error) {
        throw new Error(`Credintegral vector search error: ${error.message}`);
    }
    return data || [];
};
exports.searchCredintegralVectors = searchCredintegralVectors;
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
