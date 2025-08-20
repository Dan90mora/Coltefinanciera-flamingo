"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchBienestarVectors = exports.searchVidaDeudorTariffs = exports.searchVidaDeudorVectors = exports.searchCredintegralVectors = exports.searchDentixVectors = void 0;
var openai_1 = require("@langchain/openai");
var supabase_js_1 = require("@supabase/supabase-js");
var dotenv_1 = require("dotenv");
dotenv_1.default.config();
/**
 * Configuración compartida para embeddings
 */
var createEmbeddings = function () { return new openai_1.OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "text-embedding-3-small",
}); };
/**
 * Configuración compartida para Supabase
 */
var createSupabaseClient = function () { return (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_KEY); };
/**
 * Busca en la base vectorial de Dentix usando embeddings de OpenAI
 * @param query - La consulta del usuario
 * @returns Array de resultados de la búsqueda vectorial
 */
var searchDentixVectors = function (query) { return __awaiter(void 0, void 0, void 0, function () {
    var embeddings, supabase, queryEmbedding, _a, data, error;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                embeddings = createEmbeddings();
                supabase = createSupabaseClient();
                console.log("\uD83D\uDD0D Buscando en Dentix");
                return [4 /*yield*/, embeddings.embedQuery(query)];
            case 1:
                queryEmbedding = _b.sent();
                return [4 /*yield*/, supabase.rpc('match_dentix_documents', {
                        query_embedding: queryEmbedding,
                        match_threshold: 0.3, // Umbral más bajo para permitir más resultados
                        match_count: 3,
                    })];
            case 2:
                _a = _b.sent(), data = _a.data, error = _a.error;
                if (error) {
                    throw new Error("Dentix vector search error: ".concat(error.message));
                }
                return [2 /*return*/, data || []];
        }
    });
}); };
exports.searchDentixVectors = searchDentixVectors;
/**
 * Busca en la base vectorial de Credintegral usando embeddings de OpenAI
 * @param query - La consulta del usuario
 * @returns Array de resultados de la búsqueda vectorial
 */
var searchCredintegralVectors = function (query) { return __awaiter(void 0, void 0, void 0, function () {
    var embeddings, supabase, queryEmbedding, isCoverageQuery, isPriceQuery, searchQueries, _i, searchQueries_1, searchQuery, searchEmbedding, _a, _b, data, error, e_1, errorMessage;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                embeddings = createEmbeddings();
                supabase = createSupabaseClient();
                console.log("[DEBUG] Iniciando b\u00FAsqueda en Credintegral con la consulta: \"".concat(query, "\""));
                _c.label = 1;
            case 1:
                _c.trys.push([1, 10, , 11]);
                return [4 /*yield*/, embeddings.embedQuery(query)];
            case 2:
                queryEmbedding = _c.sent();
                console.log("[DEBUG] Embedding generado para la consulta."); // Detectar si la consulta es sobre cobertura o precios y optimizar la búsqueda
                isCoverageQuery = /cobertura|cubre|abarca|servicios|incluye|esperar|beneficios|protección|ampara/i.test(query);
                isPriceQuery = /precio|cuesta|vale|pagar|costo|cuánto|propuesta económica|económica|tarifa|valor|cotización/i.test(query);
                searchQueries = [query];
                if (isCoverageQuery) {
                    // Agregar variaciones de búsqueda para consultas sobre cobertura
                    searchQueries = [
                        query,
                        "cobertura",
                        "servicios incluidos",
                        "beneficios seguro",
                        "qué cubre"
                    ];
                }
                else if (isPriceQuery) {
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
                _i = 0, searchQueries_1 = searchQueries;
                _c.label = 3;
            case 3:
                if (!(_i < searchQueries_1.length)) return [3 /*break*/, 9];
                searchQuery = searchQueries_1[_i];
                if (!(searchQuery === query)) return [3 /*break*/, 4];
                _a = queryEmbedding;
                return [3 /*break*/, 6];
            case 4: return [4 /*yield*/, embeddings.embedQuery(searchQuery)];
            case 5:
                _a = _c.sent();
                _c.label = 6;
            case 6:
                searchEmbedding = _a;
                return [4 /*yield*/, supabase.rpc('search_credintegral_documents_hybrid', {
                        query_embedding: searchEmbedding,
                        query_text: searchQuery,
                        match_threshold: 0.1,
                        match_count: 5,
                        rrf_k: 60
                    })];
            case 7:
                _b = _c.sent(), data = _b.data, error = _b.error;
                if (error) {
                    console.error('[DEBUG] ❌ Error en la llamada RPC a Supabase:', JSON.stringify(error, null, 2));
                    return [3 /*break*/, 8];
                }
                if (data && data.length > 0) {
                    console.log('[DEBUG] ✅ Llamada RPC a Supabase exitosa.');
                    console.log('[DEBUG] 📄 Datos recibidos de Supabase:', JSON.stringify(data, null, 2));
                    return [2 /*return*/, data];
                }
                _c.label = 8;
            case 8:
                _i++;
                return [3 /*break*/, 3];
            case 9:
                // Si no encontramos nada con ninguna consulta
                console.log('[DEBUG] ⚠️ La búsqueda no arrojó resultados desde Supabase.');
                return [2 /*return*/, []];
            case 10:
                e_1 = _c.sent();
                errorMessage = e_1 instanceof Error ? e_1.message : String(e_1);
                console.error("[DEBUG] \u274C Excepci\u00F3n capturada en searchCredintegralVectors: ".concat(errorMessage));
                throw e_1;
            case 11: return [2 /*return*/];
        }
    });
}); };
exports.searchCredintegralVectors = searchCredintegralVectors;
/**
 * Busca en la base vectorial de Vida Deudor usando embeddings de OpenAI
 * @param query - La consulta del usuario
 * @returns Array de resultados de la búsqueda vectorial
 */
var searchVidaDeudorVectors = function (query) { return __awaiter(void 0, void 0, void 0, function () {
    var embeddings, supabase, queryEmbedding, isCoverageQuery, isPriceQuery, searchQueries, _i, searchQueries_2, searchQuery, searchEmbedding, _a, _b, data, error, e_2, errorMessage;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                embeddings = createEmbeddings();
                supabase = createSupabaseClient();
                console.log("[DEBUG] Iniciando b\u00FAsqueda en Vida Deudor con la consulta: \"".concat(query, "\""));
                _c.label = 1;
            case 1:
                _c.trys.push([1, 10, , 11]);
                return [4 /*yield*/, embeddings.embedQuery(query)];
            case 2:
                queryEmbedding = _c.sent();
                console.log("[DEBUG] Embedding generado para la consulta.");
                isCoverageQuery = /cobertura|cubre|abarca|servicios|incluye|esperar|beneficios|protección|ampara/i.test(query);
                isPriceQuery = /precio|cuesta|vale|pagar|costo|cuánto|propuesta económica|económica|tarifa|valor|cotización|cuanto cuesta|que cuesta|que precio|precio tiene|valor tiene|costo tiene|vale el seguro|cuanto vale|valor del seguro|costo del seguro|precio del seguro/i.test(query);
                searchQueries = [query];
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
                }
                else if (isPriceQuery) {
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
                }
                else {
                    // Para consultas generales, agregar términos relacionados
                    searchQueries.push("información");
                    searchQueries.push("seguro");
                    searchQueries.push("cobertura");
                    searchQueries.push("beneficios");
                }
                _i = 0, searchQueries_2 = searchQueries;
                _c.label = 3;
            case 3:
                if (!(_i < searchQueries_2.length)) return [3 /*break*/, 9];
                searchQuery = searchQueries_2[_i];
                if (!(searchQuery === query)) return [3 /*break*/, 4];
                _a = queryEmbedding;
                return [3 /*break*/, 6];
            case 4: return [4 /*yield*/, embeddings.embedQuery(searchQuery)];
            case 5:
                _a = _c.sent();
                _c.label = 6;
            case 6:
                searchEmbedding = _a;
                return [4 /*yield*/, supabase.rpc('search_asistenciavida_documents_hybrid', {
                        query_embedding: searchEmbedding,
                        query_text: searchQuery,
                        match_threshold: 0.1,
                        match_count: 5,
                        rrf_k: 60
                    })];
            case 7:
                _b = _c.sent(), data = _b.data, error = _b.error;
                if (error) {
                    console.error('[DEBUG] ❌ Error en la llamada RPC a Supabase:', JSON.stringify(error, null, 2));
                    return [3 /*break*/, 8];
                }
                if (data && data.length > 0) {
                    console.log('[DEBUG] ✅ Llamada RPC a Supabase exitosa.');
                    console.log("[DEBUG] \uD83D\uDCC4 Encontrado con consulta: \"".concat(searchQuery, "\""));
                    console.log('[DEBUG] 📄 Datos recibidos de Supabase:', JSON.stringify(data, null, 2));
                    return [2 /*return*/, data];
                }
                _c.label = 8;
            case 8:
                _i++;
                return [3 /*break*/, 3];
            case 9:
                // Si no encontramos nada con ninguna consulta
                console.log('[DEBUG] ⚠️ La búsqueda no arrojó resultados desde Supabase.');
                return [2 /*return*/, []];
            case 10:
                e_2 = _c.sent();
                errorMessage = e_2 instanceof Error ? e_2.message : String(e_2);
                console.error("[DEBUG] \u274C Excepci\u00F3n capturada en searchVidaDeudorVectors: ".concat(errorMessage));
                throw e_2;
            case 11: return [2 /*return*/];
        }
    });
}); };
exports.searchVidaDeudorVectors = searchVidaDeudorVectors;
/**
 * Busca específicamente información de tarifas de vida deudor con texto exacto
 * @param query - La consulta del usuario sobre precios
 * @returns Array de resultados específicos de tarifas
 */
var searchVidaDeudorTariffs = function (query) { return __awaiter(void 0, void 0, void 0, function () {
    var supabase, tariffSearches, _i, tariffSearches_1, tariffText, _a, data, error, content, priceInfo, enhancedResult, e_3, errorMessage;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                supabase = createSupabaseClient();
                console.log("[DEBUG] B\u00FAsqueda espec\u00EDfica de tarifas vida deudor: \"".concat(query, "\""));
                _b.label = 1;
            case 1:
                _b.trys.push([1, 7, , 9]);
                tariffSearches = [
                    "Tarifa mes / persona",
                    "Tarifa completa IVA del 19%",
                    "Tarifa propuesta para productos mandatorios"
                ];
                _i = 0, tariffSearches_1 = tariffSearches;
                _b.label = 2;
            case 2:
                if (!(_i < tariffSearches_1.length)) return [3 /*break*/, 5];
                tariffText = tariffSearches_1[_i];
                console.log("[DEBUG] Buscando texto exacto: \"".concat(tariffText, "\""));
                return [4 /*yield*/, supabase
                        .from('asistenciavida_documents')
                        .select('*')
                        .ilike('content', "%".concat(tariffText, "%"))];
            case 3:
                _a = _b.sent(), data = _a.data, error = _a.error;
                if (error) {
                    console.error("[DEBUG] \u274C Error buscando \"".concat(tariffText, "\":"), error);
                    return [3 /*break*/, 4];
                }
                if (data && data.length > 0) {
                    console.log("[DEBUG] \u2705 Encontrado documento con \"".concat(tariffText, "\""));
                    content = data[0].content;
                    priceInfo = extractPriceFromTariffContent(content);
                    if (priceInfo) {
                        enhancedResult = __assign(__assign({}, data[0]), { content: "PRECIOS DEL SEGURO DE VIDA DEUDOR:\n\n".concat(priceInfo, "\n\nINFORMACI\u00D3N ADICIONAL:\n").concat(content), extracted_price: priceInfo });
                        console.log("[DEBUG] \uD83D\uDCC4 Precio extra\u00EDdo: ".concat(priceInfo));
                        return [2 /*return*/, [enhancedResult]];
                    }
                    console.log("[DEBUG] \uD83D\uDCC4 Contenido:", content.substring(0, 800));
                    return [2 /*return*/, data];
                }
                _b.label = 4;
            case 4:
                _i++;
                return [3 /*break*/, 2];
            case 5:
                // Si no encontramos nada con texto exacto, usar búsqueda normal
                console.log('[DEBUG] ⚠️ No se encontraron tarifas con texto exacto, usando búsqueda híbrida');
                return [4 /*yield*/, (0, exports.searchVidaDeudorVectors)(query)];
            case 6: return [2 /*return*/, _b.sent()];
            case 7:
                e_3 = _b.sent();
                errorMessage = e_3 instanceof Error ? e_3.message : String(e_3);
                console.error("[DEBUG] \u274C Error en searchVidaDeudorTariffs: ".concat(errorMessage));
                return [4 /*yield*/, (0, exports.searchVidaDeudorVectors)(query)];
            case 8: return [2 /*return*/, _b.sent()];
            case 9: return [2 /*return*/];
        }
    });
}); };
exports.searchVidaDeudorTariffs = searchVidaDeudorTariffs;
/**
 * Extrae el precio específico del contenido de tarifas
 * @param content - Contenido del documento
 * @returns Información del precio formateada
 */
function extractPriceFromTariffContent(content) {
    var lines = content.split('\n');
    var foundTariffSection = false;
    var priceInfo = '';
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        // Detectar si estamos en la sección de tarifas
        if (line.includes('Tarifa mes / persona') ||
            line.includes('Tarifa completa IVA') ||
            line.includes('Tarifa propuesta para productos mandatorios')) {
            foundTariffSection = true;
            priceInfo += "\uD83D\uDCCB ".concat(line, "\n");
            continue;
        }
        // Si estamos en la sección de tarifas y encontramos un precio
        if (foundTariffSection && /\$\d+/.test(line)) {
            priceInfo += "\uD83D\uDCB0 PRECIO: ".concat(line, "\n");
            // Crear un resumen claro
            return "".concat(priceInfo, "\n\uD83D\uDCCD RESUMEN: El seguro de vida deudor tiene un costo de ").concat(line, " seg\u00FAn la propuesta econ\u00F3mica.");
        }
        // Si estamos en la sección de tarifas, agregar líneas relevantes
        if (foundTariffSection && line) {
            priceInfo += "   ".concat(line, "\n");
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
var searchBienestarVectors = function (query) { return __awaiter(void 0, void 0, void 0, function () {
    var embeddings, supabase, queryEmbedding, isCoverageQuery, isPriceQuery, searchQueries, allChunks_1, seenIds_1, _i, searchQueries_3, searchQuery, searchEmbedding, _a, _b, data, error, _c, priceChunks, priceError, priceChunk, e_4, errorMessage;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                embeddings = createEmbeddings();
                supabase = createSupabaseClient();
                console.log("[DEBUG] Iniciando b\u00FAsqueda en Bienestar Plus con la consulta: \"".concat(query, "\""));
                _d.label = 1;
            case 1:
                _d.trys.push([1, 12, , 13]);
                return [4 /*yield*/, embeddings.embedQuery(query)];
            case 2:
                queryEmbedding = _d.sent();
                console.log("[DEBUG] Embedding generado para la consulta.");
                isCoverageQuery = /cobertura|cubre|abarca|servicios|incluye|esperar|beneficios|protección|ampara/i.test(query);
                isPriceQuery = /precio|cuesta|vale|pagar|costo|cuánto|propuesta económica|económica|tarifa|valor|cotización/i.test(query);
                searchQueries = [query];
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
                }
                else if (isPriceQuery) {
                    // Agregar variaciones de búsqueda para consultas sobre precio
                    searchQueries.push("propuesta económica");
                    searchQueries.push("precio del seguro");
                    searchQueries.push("costo del seguro");
                    searchQueries.push("valor del seguro");
                    searchQueries.push("cuánto cuesta");
                    searchQueries.push("tarifa");
                }
                else {
                    // Para consultas generales, agregar términos relacionados
                    searchQueries.push("información");
                    searchQueries.push("seguro");
                    searchQueries.push("cobertura");
                    searchQueries.push("beneficios");
                }
                allChunks_1 = [];
                seenIds_1 = new Set();
                _i = 0, searchQueries_3 = searchQueries;
                _d.label = 3;
            case 3:
                if (!(_i < searchQueries_3.length)) return [3 /*break*/, 9];
                searchQuery = searchQueries_3[_i];
                if (!(searchQuery === query)) return [3 /*break*/, 4];
                _a = queryEmbedding;
                return [3 /*break*/, 6];
            case 4: return [4 /*yield*/, embeddings.embedQuery(searchQuery)];
            case 5:
                _a = _d.sent();
                _d.label = 6;
            case 6:
                searchEmbedding = _a;
                return [4 /*yield*/, supabase.rpc('search_bienestarplus_documents_hybrid', {
                        query_embedding: searchEmbedding,
                        query_text: searchQuery,
                        match_threshold: 0.05, // Más bajo para asegurar chunks relevantes
                        match_count: 20, // Más alto para asegurar chunk 8
                        rrf_k: 60
                    })];
            case 7:
                _b = _d.sent(), data = _b.data, error = _b.error;
                if (error) {
                    console.error('[DEBUG] ❌ Error en la llamada RPC a Supabase:', JSON.stringify(error, null, 2));
                    return [3 /*break*/, 8];
                }
                if (data && data.length > 0) {
                    console.log("[DEBUG] \u2705 Llamada RPC a Supabase exitosa para query: \"".concat(searchQuery, "\""));
                    console.log("[DEBUG] Se recibieron ".concat(data.length, " chunks. IDs:"), data.map(function (d) { return d.id; }));
                    data.forEach(function (chunk, idx) {
                        console.log("[DEBUG] Chunk #".concat(idx + 1, " (ID: ").concat(chunk.id, "):\n").concat(chunk.content.substring(0, 200), "..."));
                        if (!seenIds_1.has(chunk.id)) {
                            allChunks_1.push(chunk);
                            seenIds_1.add(chunk.id);
                        }
                    });
                }
                _d.label = 8;
            case 8:
                _i++;
                return [3 /*break*/, 3];
            case 9:
                if (!isPriceQuery) return [3 /*break*/, 11];
                return [4 /*yield*/, supabase
                        .from('bienestarplus_documents')
                        .select('*')
                        .ilike('content', '%$%')];
            case 10:
                _c = _d.sent(), priceChunks = _c.data, priceError = _c.error;
                if (priceError) {
                    console.error('[DEBUG] ❌ Error buscando chunks con "$":', priceError);
                }
                else if (priceChunks && priceChunks.length > 0) {
                    priceChunks.forEach(function (chunk) {
                        if (!seenIds_1.has(chunk.id)) {
                            allChunks_1.push(chunk);
                            seenIds_1.add(chunk.id);
                            console.log("[DEBUG] Chunk de precio a\u00F1adido por b\u00FAsqueda directa (ID: ".concat(chunk.id, ")"));
                        }
                    });
                }
                _d.label = 11;
            case 11:
                if (allChunks_1.length > 0) {
                    // Si es consulta de precio, priorizar el chunk con el precio literal
                    if (isPriceQuery) {
                        priceChunk = allChunks_1.find(function (chunk) { return /\$\s?\d+[\d\.]*\s?(MENSUAL|ANUAL|\/PERSONA|TARIFA|IVA)?/i.test(chunk.content); });
                        if (priceChunk) {
                            console.log("[DEBUG] Chunk de precio detectado y priorizado (ID: ".concat(priceChunk.id, ")"));
                            return [2 /*return*/, [priceChunk]];
                        }
                    }
                    return [2 /*return*/, allChunks_1];
                }
                // Si no encontramos nada con ninguna consulta
                console.log('[DEBUG] ⚠️ La búsqueda no arrojó resultados desde Supabase.');
                return [2 /*return*/, []];
            case 12:
                e_4 = _d.sent();
                errorMessage = e_4 instanceof Error ? e_4.message : String(e_4);
                console.error("[DEBUG] \u274C Excepci\u00F3n capturada en searchBienestarVectors: ".concat(errorMessage));
                throw e_4;
            case 13: return [2 /*return*/];
        }
    });
}); };
exports.searchBienestarVectors = searchBienestarVectors;
