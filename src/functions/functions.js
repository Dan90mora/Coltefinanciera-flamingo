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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.troubleshootIssue = troubleshootIssue;
exports.getInsuranceInfo = getInsuranceInfo;
exports.searchDentixDocuments = searchDentixDocuments;
exports.searchCredintegralDocuments = searchCredintegralDocuments;
exports.searchDentixClientByPhone = searchDentixClientByPhone;
exports.registerDentixClient = registerDentixClient;
exports.sendPaymentLinkEmail = sendPaymentLinkEmail;
exports.confirmAndUpdateClientData = confirmAndUpdateClientData;
exports.showVidaDeudorClientDataForConfirmation = showVidaDeudorClientDataForConfirmation;
exports.updateVidaDeudorClientData = updateVidaDeudorClientData;
exports.searchBienestarDocuments = searchBienestarDocuments;
exports.extractBienestarSection = extractBienestarSection;
exports.sendVidaDeudorActivationEmail = sendVidaDeudorActivationEmail;
exports.cleanTextForSpeech = cleanTextForSpeech;
exports.generateMarianVoice = generateMarianVoice;
exports.generateLuciaAudioResponse = generateLuciaAudioResponse;
//import colombia from '../data/colombia.json';
var retrievers_1 = require("./retrievers");
var supabase_js_1 = require("@supabase/supabase-js");
var dotenv_1 = require("dotenv");
var mail_1 = require("@sendgrid/mail");
var elevenlabs_1 = require("elevenlabs");
dotenv_1.default.config();
// Configurar ElevenLabs
var elevenLabsClient = null;
if (process.env.ELEVENLABS_API_KEY) {
    elevenLabsClient = new elevenlabs_1.ElevenLabsClient({
        apiKey: process.env.ELEVENLABS_API_KEY
    });
    console.log('✅ ElevenLabs configurado correctamente');
}
else {
    console.warn('⚠️ ELEVENLABS_API_KEY no está definida. La generación de audio no funcionará.');
}
// Configurar SendGrid
if (process.env.SENDGRID_API_KEY) {
    mail_1.default.setApiKey(process.env.SENDGRID_API_KEY);
}
else {
    console.warn('SENDGRID_API_KEY no está definida. El envío de correos no funcionará.');
}
// export function contactCustomerService() {
//     const customerServiceData = {
//       whatsapp: "https://wa.me/573335655669",
//       description: "Linea de atención especializada para ventas.",
//     };
//     console.log('contactCustomerService executed');
//     return JSON.stringify(customerServiceData);
// }
// Función para eliminar tildes y diéresis
// function removeAccents(str: string): string {
//     return str.normalize("NFD").replace(/[̀-ͯ]/g, "");
//   }
// export function getProductInfo(product: "cámara" | "alarma" | "cerca eléctrica"): string {
//     type ProductType = "cámara" | "alarma" | "cerca eléctrica";
//     const products: Record<ProductType, { description: string; price: string; features: string[] }> = {
//       "cámara": {
//         description: "Cámara de seguridad para interiores y exteriores.",
//         price: "$200.000",
//         features: ["Resolución HD", "Visión nocturna", "Detección de movimiento"],
//       },
//       "alarma": {
//         description: "Alarma para proteger tu hogar o negocio.",
//         price: "$150.000",
//         features: ["Sirena de alta potencia", "Sensor de movimiento", "Control remoto"],
// },
// "cerca eléctrica": {
//   description: "Cerca eléctrica para proteger tu propiedad.",
//   price: "$300.000",
//   features: ["Alarma de alta potencia", "Sensor de movimiento", "Control remoto"],
// },
// };
// console.log('getProductInfo executed');
// const productInfo = products[product];
// if (productInfo) {
//   return JSON.stringify(productInfo);
// }
// return "Lo siento, no tenemos información sobre ese producto.";
//}
// Función para solucionar problema con camara que no da imagen
function troubleshootIssue(issue) {
    console.log('troubleshootIssue executed');
    var result;
    if (issue === "no hay imagen" || issue === "no da imagen" || issue === "no hay video") {
        result = "1. Verifica que la cámara esté conectada a la corriente y encendida.\n2. Asegúrate de que la cámara esté conectada al router mediante un cable Ethernet.\n3. Reinicia la cámara y el router.\n4. Si el problema persiste, restablece la cámara a los valores de fábrica.";
    }
    else if (issue === "imagen borrosa" || issue === "imagen distorsionada") {
        result = "1. Limpia la lente de la cámara con un paño suave y seco.\n2. Ajusta la resolución de la cámara en la aplicación móvil.\n3. Verifica que la cámara esté enfocada correctamente.";
    }
    else if (issue === "imagen con ruido" || issue === "imagen con interferencias") {
        result = "1. Aleja la cámara de dispositivos electrónicos que puedan causar interferencias.\n2. Verifica que la cámara esté conectada a una fuente de energía estable.\n3. Actualiza el firmware de la cámara.";
    }
    else {
        result = "Lo siento, no tengo información sobre ese problema.";
    }
    return JSON.stringify(result);
}
function getInsuranceInfo(insuranceType) {
    var insurances = {
        "hogar": {
            description: "Seguro integral para proteger tu hogar y contenido.",
            coverage: ["Incendio", "Robo", "Daños por agua", "Fenómenos naturales", "Responsabilidad civil familiar"],
            price: "Desde $45.000/mes",
            benefits: ["Cobertura 24/7", "Asistencia en el hogar", "Reposición a valor nuevo", "Sin deducible en robo total"],
        },
        "comercial": {
            description: "Protección completa para tu negocio o empresa.",
            coverage: ["Incendio", "Robo", "Lucro cesante", "Responsabilidad civil", "Equipos electrónicos"],
            price: "Desde $120.000/mes",
            benefits: ["Asesoría legal", "Asistencia 24/7", "Cobertura de inventarios", "Protección de ingresos"],
        },
        "equipos": {
            description: "Seguro específico para equipos de seguridad instalados.",
            coverage: ["Daño accidental", "Robo de equipos", "Fallas eléctricas", "Vandalismo"],
            price: "Desde $25.000/mes",
            benefits: ["Reposición inmediata", "Instalación incluida", "Mantenimiento preventivo", "Soporte técnico"],
        },
        "responsabilidad civil": {
            description: "Protección contra daños a terceros.",
            coverage: ["Daños a terceros", "Lesiones personales", "Daños materiales", "Gastos legales"],
            price: "Desde $35.000/mes",
            benefits: ["Defensa jurídica", "Cobertura mundial", "Sin límite de eventos", "Asesoría especializada"],
        },
    };
    console.log('getInsuranceInfo executed');
    var insuranceInfo = insurances[insuranceType];
    if (insuranceInfo) {
        return JSON.stringify(insuranceInfo);
    }
    return "Lo siento, no tenemos información sobre ese tipo de seguro.";
}
function searchDentixDocuments(query) {
    return __awaiter(this, void 0, void 0, function () {
        var supabaseResults, supabaseError_1, errorMessage, results, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    console.log('searchDentixDocuments executed with query:', query); // Intentar primero búsqueda vectorial en Supabase
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, retrievers_1.searchDentixVectors)(query)];
                case 2:
                    supabaseResults = _a.sent();
                    if (supabaseResults && supabaseResults.length > 0) {
                        console.log('✅ Usando resultados de Supabase para Dentix');
                        return [2 /*return*/, formatSupabaseResults(supabaseResults, "Dentix")];
                    }
                    return [3 /*break*/, 4];
                case 3:
                    supabaseError_1 = _a.sent();
                    errorMessage = supabaseError_1 instanceof Error ? supabaseError_1.message : String(supabaseError_1);
                    console.log('⚠️ Supabase no disponible, usando búsqueda local:', errorMessage);
                    return [3 /*break*/, 4];
                case 4: return [4 /*yield*/, searchInLocalTextFiles(query)];
                case 5:
                    results = _a.sent();
                    if (!results || results.length === 0) {
                        return [2 /*return*/, "Lo siento, no encontré información específica sobre tu consulta en los documentos de Dentix. ¿Podrías reformular tu pregunta o ser más específico?"];
                    }
                    console.log('✅ Usando resultados de búsqueda local');
                    return [2 /*return*/, formatLocalResults(results)];
                case 6:
                    error_1 = _a.sent();
                    console.error('Error in searchDentixDocuments:', error_1);
                    return [2 /*return*/, "Lo siento, ocurrió un error al buscar en los documentos de Dentix. Por favor intenta nuevamente."];
                case 7: return [2 /*return*/];
            }
        });
    });
}
/**
 * Formatea resultados de Supabase de forma genérica y robusta
 * @param results - Array de resultados de la búsqueda vectorial
 * @param serviceName - Nombre del servicio (ej. "Dentix", "Credintegral") para personalizar la respuesta
 * @returns Resultados formateados como un string
 */
function formatSupabaseResults(results, serviceName) {
    var response = "Seg\u00FAn la informaci\u00F3n de nuestra base de datos de ".concat(serviceName, ", esto es lo que encontr\u00E9:\n\n");
    results.forEach(function (result, index) {
        var _a;
        // Manejo seguro de metadata y fileName
        var fileName = ((_a = result.metadata) === null || _a === void 0 ? void 0 : _a.fileName) || "Documento de ".concat(serviceName);
        response += "\uD83D\uDCC4 **".concat(fileName.replace('.txt', ''), "**\n");
        response += "".concat(result.content, "\n");
        response += "(Similitud: ".concat((result.similarity * 100).toFixed(1), "%)\n");
        if (index < results.length - 1)
            response += "\n---\n\n";
    });
    return response;
}
/**
 * Formatea resultados de búsqueda local
 */
function formatLocalResults(results) {
    var response = "Encontré la siguiente información en los documentos de Dentix:\n\n";
    results.forEach(function (result, index) {
        response += "\uD83D\uDCC4 **".concat(result.fileName.replace('.txt', ''), "**\n");
        response += "".concat(result.content, "\n");
        response += "(Relevancia: ".concat(result.score, ")\n");
        response += "\n---\n\n";
    });
    return response;
}
/**
 * Busca en archivos de texto locales como sistema de fallback
 */
function searchInLocalTextFiles(query) {
    return __awaiter(this, void 0, void 0, function () {
        var fs, path, fileURLToPath, __filename, __dirname, dentixFolder, results, files, txtFiles, queryLower, queryWords, _i, txtFiles_1, txtFile, filePath, content, contentLower, score, matchedSections, _a, queryWords_1, word, lines, relevantLines, _loop_1, i, relevantContent;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('fs'); })];
                case 1:
                    fs = _b.sent();
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('path'); })];
                case 2:
                    path = _b.sent();
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('url'); })];
                case 3:
                    fileURLToPath = (_b.sent()).fileURLToPath;
                    __filename = fileURLToPath(import.meta.url);
                    __dirname = path.dirname(__filename);
                    dentixFolder = path.join(__dirname, '../../Dentix-pdf');
                    results = [];
                    try {
                        // Verificar si existe la carpeta
                        if (!fs.existsSync(dentixFolder)) {
                            console.log('❌ Carpeta Dentix-pdf no encontrada');
                            return [2 /*return*/, results];
                        }
                        files = fs.readdirSync(dentixFolder);
                        txtFiles = files.filter(function (file) { return file.endsWith('.txt'); });
                        if (txtFiles.length === 0) {
                            console.log('❌ No se encontraron archivos .txt en Dentix-pdf');
                            return [2 /*return*/, results];
                        }
                        console.log("\uD83D\uDCC1 Buscando en ".concat(txtFiles.length, " archivos .txt"));
                        queryLower = query.toLowerCase();
                        queryWords = queryLower.split(/\s+/).filter(function (word) { return word.length > 2; });
                        for (_i = 0, txtFiles_1 = txtFiles; _i < txtFiles_1.length; _i++) {
                            txtFile = txtFiles_1[_i];
                            filePath = path.join(dentixFolder, txtFile);
                            content = fs.readFileSync(filePath, 'utf-8');
                            contentLower = content.toLowerCase();
                            score = 0;
                            matchedSections = [];
                            // Buscar palabras clave
                            for (_a = 0, queryWords_1 = queryWords; _a < queryWords_1.length; _a++) {
                                word = queryWords_1[_a];
                                if (contentLower.includes(word)) {
                                    score += 1;
                                }
                            }
                            // Buscar frase completa
                            if (contentLower.includes(queryLower)) {
                                score += 3;
                            }
                            // Si hay coincidencias, encontrar las secciones relevantes
                            if (score > 0) {
                                lines = content.split('\n');
                                relevantLines = [];
                                _loop_1 = function (i) {
                                    var line = lines[i];
                                    var lineLower = line.toLowerCase();
                                    // Verificar si la línea contiene alguna palabra clave
                                    var hasKeyword = queryWords.some(function (word) { return lineLower.includes(word); });
                                    if (hasKeyword) {
                                        // Incluir contexto (líneas anteriores y posteriores)
                                        var start = Math.max(0, i - 2);
                                        var end = Math.min(lines.length, i + 3);
                                        var contextLines_1 = lines.slice(start, end).join('\n');
                                        if (!matchedSections.some(function (section) { return section.includes(contextLines_1.substring(0, 50)); })) {
                                            matchedSections.push(contextLines_1);
                                        }
                                    }
                                };
                                for (i = 0; i < lines.length; i++) {
                                    _loop_1(i);
                                }
                                relevantContent = matchedSections.length > 0
                                    ? matchedSections.join('\n\n...\n\n')
                                    : content.substring(0, 500) + '...';
                                results.push({
                                    fileName: txtFile.replace('.txt', ''),
                                    content: relevantContent,
                                    score: "".concat(score, " coincidencias")
                                });
                            }
                        }
                        // Ordenar por score descendente
                        results.sort(function (a, b) {
                            var scoreA = parseInt(a.score.split(' ')[0]);
                            var scoreB = parseInt(b.score.split(' ')[0]);
                            return scoreB - scoreA;
                        });
                        // Limitar a 3 resultados
                        return [2 /*return*/, results.slice(0, 3)];
                    }
                    catch (error) {
                        console.error('Error en searchInLocalTextFiles:', error);
                        return [2 /*return*/, results];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
/*
 * Busca información en los documentos de Credintegral usando búsqueda híbrida (Supabase + local)
 * @param query - La consulta del usuario
 * @returns Resultados formateados de la búsqueda
 */
function searchCredintegralDocuments(query) {
    return __awaiter(this, void 0, void 0, function () {
        var supabaseResults, error_2, errorMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🔍 Buscando en documentos de Credintegral:', query);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    console.log('🔄 Intentando búsqueda vectorial en Supabase...');
                    return [4 /*yield*/, (0, retrievers_1.searchCredintegralVectors)(query)];
                case 2:
                    supabaseResults = _a.sent();
                    if (supabaseResults && supabaseResults.length > 0) {
                        console.log('✅ Usando resultados de Supabase para Credintegral');
                        return [2 /*return*/, formatSupabaseResults(supabaseResults, "Credintegral")];
                    }
                    return [2 /*return*/, "Lo siento, no encontré información específica sobre tu consulta en los documentos de Credintegral. ¿Podrías reformular tu pregunta o ser más específico?"];
                case 3:
                    error_2 = _a.sent();
                    errorMessage = error_2 instanceof Error ? error_2.message : String(error_2);
                    console.error('❌ Error al buscar en Supabase para Credintegral:', errorMessage);
                    return [2 /*return*/, "Lo siento, ocurrió un error al buscar en los documentos de Credintegral. Por favor intenta nuevamente."];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// FUNCIÓN COMENTADA: Esta función devuelve precio hardcodeado ($500) que viola las restricciones
// de precio para clientes existentes con service="vidadeudor". La función ha sido deshabilitada
// para evitar que el agente acceda al precio real después de los 3 meses gratuitos.
/*
export async function searchVidaDeudorDocuments(query: string): Promise<string> {
    console.log('🔍 [VIDA DEUDOR] Procesando consulta:', query);
    
    // PASO 1: DETECTAR CONSULTAS DE PRECIO DE MANera MÁS AGRESIVA
    const isPriceQuery = /precio|cuesta|vale|pagar|costo|cuánto|cuanto|tarifa|valor|cotización|económica|propuesta/i.test(query);
    
    if (isPriceQuery) {
        console.log('💰 [PRECIO DETECTADO] Para clientes nuevos...');
        
        // RETORNO DEL PRECIO SOLO PARA CLIENTES NUEVOS
        // NOTA: Para clientes existentes con service="vidadeudor", el agente debe manejar esto según el prompt
        return `💰 **INFORMACIÓN SOBRE LA ASISTENCIA VIDA DEUDOR**

La asistencia Vida Deudor tiene un costo de **$500** por persona al mes para usuarios regulares.

📋 **DETALLES DE LA TARIFA:**
• Tarifa mensual por persona: $500
• Tarifa completa con IVA del 19% incluido
• Tarifa propuesta para productos mandatorios

⚠️ **NOTA IMPORTANTE:** Si eres cliente existente con un servicio/crédito activo, puedes tener beneficios especiales. Tu asesor te informará sobre cualquier promoción disponible.

📋 **COBERTURAS INCLUIDAS:**
• Teleconsulta medicina general (2 eventos por año)
• Telenutrición (ilimitado)
• Telepsicología (2 eventos por año)
• Descuentos en farmacias (ilimitado)

---
📄 Información extraída de la propuesta económica oficial de Vida Deudor.

**PRECIO ESTÁNDAR: $500 por persona al mes`;
    }
    
    // PASO 2: Para consultas que NO son de precio, usar búsqueda normal
    try {
        console.log('🔄 Intentando búsqueda vectorial en Supabase...');
        const { searchVidaDeudorVectors } = await import('./retrievers');
        const supabaseResults = await searchVidaDeudorVectors(query);
        
        if (supabaseResults && supabaseResults.length > 0) {
            console.log('✅ Usando resultados de Supabase para Vida Deudor');
            return formatSupabaseResults(supabaseResults, "Vida Deudor");
        }

        return "Lo siento, no encontré información específica sobre tu consulta en los documentos de Vida Deudor. ¿Podrías reformular tu pregunta o ser más específico?";

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Error al buscar en Supabase para Vida Deudor:', errorMessage);
        return "Lo siento, ocurrió un error al buscar en los documentos de Vida Deudor. Por favor intenta nuevamente.";
    }
}
*/
/**
 * Configuración para Supabase (reutilizable)
 */
var createSupabaseClient = function () { return (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_KEY); };
/**
 * Busca un cliente de Dentix por número telefónico
 * @param phoneNumber - El número telefónico del cliente
 * @returns Información del cliente si existe, null si no se encuentra
 */
function searchDentixClientByPhone(phoneNumber) {
    return __awaiter(this, void 0, void 0, function () {
        var supabaseUrl, supabaseKey, supabase, cleanPhoneNumber, searchVariations, variationsToSearch, _a, data, error, error_3;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log("\uD83D\uDD0D Buscando cliente en Supabase con n\u00FAmero: ".concat(phoneNumber));
                    supabaseUrl = process.env.SUPABASE_URL;
                    supabaseKey = process.env.SUPABASE_KEY;
                    if (!supabaseUrl || !supabaseKey) {
                        console.error('❌ Supabase URL o KEY no están definidos en las variables de entorno');
                        return [2 /*return*/, null];
                    }
                    supabase = createSupabaseClient();
                    cleanPhoneNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
                    searchVariations = new Set();
                    searchVariations.add(cleanPhoneNumber); // Tal como viene
                    // Si tiene +, buscar sin +
                    if (cleanPhoneNumber.startsWith('+')) {
                        searchVariations.add(cleanPhoneNumber.substring(1)); // Sin el +
                        searchVariations.add(cleanPhoneNumber.substring(3)); // Sin el +57
                    }
                    else {
                        // Si no tiene +, agregar versiones con +
                        searchVariations.add('+' + cleanPhoneNumber); // Con +
                        // Si es un número colombiano de 10 dígitos, agregar la versión completa
                        if (cleanPhoneNumber.length === 10) {
                            searchVariations.add('+57' + cleanPhoneNumber);
                        }
                    }
                    variationsToSearch = Array.from(searchVariations);
                    console.log("\uD83D\uDD0D B\u00FAsquedas para el n\u00FAmero \"".concat(phoneNumber, "\":"), variationsToSearch);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, supabase
                            .from('dentix_clients')
                            .select('name, email, phone_number, service, product')
                            .in('phone_number', variationsToSearch)
                            .maybeSingle()];
                case 2:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        throw new Error("Error en la b\u00FAsqueda de cliente Dentix: ".concat(error.message));
                    }
                    if (data) {
                        console.log("\u2705 Cliente encontrado para \"".concat(phoneNumber, "\":"), data.name);
                    }
                    else {
                        console.log("\u274C No se encontr\u00F3 cliente para \"".concat(phoneNumber, "\" con las variaciones probadas."));
                    }
                    return [2 /*return*/, data || null];
                case 3:
                    error_3 = _b.sent();
                    console.error('Error buscando cliente Dentix:', error_3);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Registra un nuevo cliente en la tabla dentix_clients
 * @param name - Nombre completo del cliente
 * @param email - Correo electrónico del cliente
 * @param phone_number - Número de celular del cliente
 * @param service - Tipo de seguro/servicio de interés
 * @returns Resultado de la operación
 */
function registerDentixClient(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var supabase, _c, data, error, err_1;
        var name = _b.name, email = _b.email, phone_number = _b.phone_number, service = _b.service;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    supabase = createSupabaseClient();
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, supabase
                            .from('dentix_clients')
                            .insert([
                            { name: name, email: email, phone_number: phone_number, service: service }
                        ])];
                case 2:
                    _c = _d.sent(), data = _c.data, error = _c.error;
                    if (error) {
                        return [2 /*return*/, { success: false, message: "Error al registrar el cliente: ".concat(error.message) }];
                    }
                    return [2 /*return*/, { success: true, message: 'Cliente registrado exitosamente.' }];
                case 3:
                    err_1 = _d.sent();
                    return [2 /*return*/, { success: false, message: "Error inesperado: ".concat(err_1.message) }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function sendPaymentLinkEmail(clientName, clientEmail, insuranceName) {
    return __awaiter(this, void 0, void 0, function () {
        var emailContent, msg, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("\uD83D\uDCE7 Intentando enviar correo de pago a ".concat(clientName, " (").concat(clientEmail, ") por el seguro ").concat(insuranceName));
                    emailContent = "\n        Hola ".concat(clientName, ",\n\n        \u00A1Felicitaciones por dar el primer paso para asegurar tu tranquilidad con nuestro ").concat(insuranceName, "!\n\n        Est\u00E1s a un solo clic de finalizar la adquisici\u00F3n de tu seguro. Por favor, utiliza el siguiente enlace para completar el pago de forma segura.\n\n        Enlace de pago: https://pagos.coltefinanciera.com/12345?cliente=").concat(encodeURIComponent(clientEmail), "\n\n        Gracias por confiar en Coltefinanciera Seguros.\n\n        Saludos,\n        Lucia\n        Asesora de Seguros\n    ");
                    msg = {
                        to: clientEmail,
                        from: "notificaciones@asistenciacoltefinanciera.com", // <-- 🚨 REEMPLAZA ESTO con tu email verificado en SendGrid
                        subject: "Finaliza la compra de tu ".concat(insuranceName),
                        text: emailContent,
                        html: emailContent.replace(/\n/g, "<br>"),
                    };
                    if (!process.env.SENDGRID_API_KEY) {
                        return [2 /*return*/, JSON.stringify({
                                success: false,
                                message: 'Error: El servicio de correo no está configurado (falta SENDGRID_API_KEY).'
                            })];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, mail_1.default.send(msg)];
                case 2:
                    _a.sent();
                    console.log("\u2705 Correo enviado exitosamente a ".concat(clientEmail));
                    return [2 /*return*/, JSON.stringify({
                            success: true,
                            message: "Correo con enlace de pago enviado exitosamente a ".concat(clientEmail, ".")
                        })];
                case 3:
                    error_4 = _a.sent();
                    console.error('❌ Error al enviar el correo con SendGrid:', error_4);
                    if (error_4.response) {
                        console.error(error_4.response.body);
                    }
                    return [2 /*return*/, JSON.stringify({
                            success: false,
                            message: "Error al enviar el correo: ".concat(error_4.message)
                        })];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Confirma los datos del cliente existente y permite actualizarlos si es necesario
 * @param phoneNumber - Número de teléfono del cliente
 * @param updates - Objeto con los campos a actualizar (opcional)
 * @returns Información del cliente y confirmación de la operación
 */
function confirmAndUpdateClientData(phoneNumber, updates) {
    return __awaiter(this, void 0, void 0, function () {
        var supabase, searchVariations, clientData, _i, searchVariations_1, variation, _a, data, error, fieldsToUpdate, cleanPhone, _b, updatedData, updateError, updatedClient, error_5;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
                    console.log("\uD83D\uDD0D Confirmando datos del cliente con n\u00FAmero: ".concat(phoneNumber));
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 7, , 8]);
                    searchVariations = [
                        phoneNumber,
                        "+".concat(phoneNumber),
                        "+57".concat(phoneNumber)
                    ];
                    clientData = null;
                    _i = 0, searchVariations_1 = searchVariations;
                    _c.label = 2;
                case 2:
                    if (!(_i < searchVariations_1.length)) return [3 /*break*/, 5];
                    variation = searchVariations_1[_i];
                    return [4 /*yield*/, supabase
                            .from('dentix_clients')
                            .select('*')
                            .eq('phone_number', variation)];
                case 3:
                    _a = _c.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        console.error('❌ Error buscando cliente:', error);
                        return [3 /*break*/, 4];
                    }
                    if (data && data.length > 0) {
                        clientData = data[0];
                        console.log("\u2705 Cliente encontrado con variaci\u00F3n: ".concat(variation));
                        return [3 /*break*/, 5];
                    }
                    _c.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    if (!clientData) {
                        return [2 /*return*/, JSON.stringify({
                                success: false,
                                message: 'No se encontró un cliente con ese número de teléfono.'
                            })];
                    }
                    // Si no hay actualizaciones, solo devolver los datos actuales para confirmación
                    if (!updates) {
                        console.log('📋 Mostrando datos actuales para confirmación');
                        return [2 /*return*/, JSON.stringify({
                                success: true,
                                action: 'show_current_data',
                                currentData: {
                                    name: clientData.name,
                                    email: clientData.email,
                                    phoneNumber: clientData.phone_number,
                                    service: clientData.service
                                },
                                message: "Estos son tus datos actuales:\n\u2022 Nombre: ".concat(clientData.name, "\n\u2022 Email: ").concat(clientData.email, "\n\u2022 N\u00FAmero de tel\u00E9fono: ").concat(clientData.phone_number, "\n\u2022 Servicio de inter\u00E9s: ").concat(clientData.service, "\n\n\u00BFTodos los datos son correctos o hay algo que necesites actualizar?")
                            })];
                    }
                    // Si hay actualizaciones, aplicarlas
                    console.log('✏️ Aplicando actualizaciones a los datos del cliente');
                    fieldsToUpdate = {};
                    if (updates.name && updates.name.trim() !== '') {
                        fieldsToUpdate.name = updates.name.trim();
                    }
                    if (updates.email && updates.email.trim() !== '') {
                        fieldsToUpdate.email = updates.email.trim();
                    }
                    if (updates.phoneNumber && updates.phoneNumber.trim() !== '') {
                        cleanPhone = updates.phoneNumber.replace(/\D/g, '');
                        if (cleanPhone.startsWith('57')) {
                            fieldsToUpdate.phone_number = "+".concat(cleanPhone);
                        }
                        else if (cleanPhone.startsWith('3')) {
                            fieldsToUpdate.phone_number = "+57".concat(cleanPhone);
                        }
                        else {
                            fieldsToUpdate.phone_number = "+57".concat(cleanPhone);
                        }
                    }
                    if (Object.keys(fieldsToUpdate).length === 0) {
                        return [2 /*return*/, JSON.stringify({
                                success: false,
                                message: 'No se proporcionaron datos válidos para actualizar.'
                            })];
                    }
                    return [4 /*yield*/, supabase
                            .from('dentix_clients')
                            .update(fieldsToUpdate)
                            .eq('id', clientData.id)
                            .select()];
                case 6:
                    _b = _c.sent(), updatedData = _b.data, updateError = _b.error;
                    if (updateError) {
                        console.error('❌ Error actualizando cliente:', updateError);
                        return [2 /*return*/, JSON.stringify({
                                success: false,
                                message: "Error al actualizar los datos: ".concat(updateError.message)
                            })];
                    }
                    console.log('✅ Datos del cliente actualizados exitosamente');
                    updatedClient = updatedData[0];
                    return [2 /*return*/, JSON.stringify({
                            success: true,
                            action: 'data_updated',
                            updatedData: {
                                name: updatedClient.name,
                                email: updatedClient.email,
                                phoneNumber: updatedClient.phone_number,
                                service: updatedClient.service
                            },
                            message: "\u2705 Datos actualizados correctamente:\n\u2022 Nombre: ".concat(updatedClient.name, "\n\u2022 Email: ").concat(updatedClient.email, "\n\u2022 N\u00FAmero de tel\u00E9fono: ").concat(updatedClient.phone_number, "\n\u2022 Servicio de inter\u00E9s: ").concat(updatedClient.service, "\n\nAhora puedes proceder con la adquisici\u00F3n de tu seguro.")
                        })];
                case 7:
                    error_5 = _c.sent();
                    console.error('❌ Error en confirmAndUpdateClientData:', error_5);
                    return [2 /*return*/, JSON.stringify({
                            success: false,
                            message: "Error interno: ".concat(error_5.message)
                        })];
                case 8: return [2 /*return*/];
            }
        });
    });
}
/**
 * Muestra los datos del cliente para confirmación en el flujo de vida deudor
 * @param phoneNumber - Número de teléfono del cliente
 * @returns Datos del cliente en formato específico para vida deudor
 */
function showVidaDeudorClientDataForConfirmation(phoneNumber) {
    return __awaiter(this, void 0, void 0, function () {
        var supabase, cleanNumber, searchVariations, uniqueVariations, clientData, _i, uniqueVariations_1, variation, _a, data, error, formattedData, confirmationMessage, error_6;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log("\uD83D\uDEE1\uFE0F [VIDA DEUDOR] Mostrando datos para confirmaci\u00F3n - Cliente: ".concat(phoneNumber));
                    supabase = createSupabaseClient();
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 6, , 7]);
                    cleanNumber = phoneNumber.replace(/[\s\-\(\)\+]/g, '');
                    searchVariations = [
                        phoneNumber, // Número original
                        phoneNumber.replace(/[\s\-\(\)]/g, ''), // Sin espacios/guiones
                        cleanNumber, // Sin espacios, guiones, ni +
                        cleanNumber.startsWith('57') ? cleanNumber.substring(2) : cleanNumber, // Sin código país 57
                        "+".concat(cleanNumber), // Con + al inicio
                        "+57".concat(cleanNumber.startsWith('57') ? cleanNumber.substring(2) : cleanNumber), // +57 + número local
                        cleanNumber.startsWith('57') ? "+57".concat(cleanNumber.substring(2)) : "+57".concat(cleanNumber) // Asegurar +57
                    ];
                    uniqueVariations = __spreadArray([], new Set(searchVariations), true).filter(function (v) { return v && v.length >= 10; });
                    console.log("\uD83D\uDD0D Variaciones de b\u00FAsqueda para \"".concat(phoneNumber, "\":"), uniqueVariations);
                    console.log("\uD83D\uDD0D Variaciones de b\u00FAsqueda para \"".concat(phoneNumber, "\":"), uniqueVariations);
                    clientData = null;
                    _i = 0, uniqueVariations_1 = uniqueVariations;
                    _b.label = 2;
                case 2:
                    if (!(_i < uniqueVariations_1.length)) return [3 /*break*/, 5];
                    variation = uniqueVariations_1[_i];
                    return [4 /*yield*/, supabase
                            .from('dentix_clients')
                            .select('document_id, name, phone_number, email, service')
                            .eq('phone_number', variation)
                            .maybeSingle()];
                case 3:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        console.error('❌ Error buscando cliente:', error);
                        return [3 /*break*/, 4];
                    }
                    if (data) {
                        clientData = data;
                        console.log("\u2705 Cliente encontrado con variaci\u00F3n: ".concat(variation));
                        return [3 /*break*/, 5];
                    }
                    _b.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    if (!clientData) {
                        return [2 /*return*/, 'No se encontró un cliente con ese número de teléfono. ¿Podrías verificar el número y intentar nuevamente?'];
                    }
                    formattedData = {
                        document_id: clientData.document_id || 'No registrado', // cédula
                        name: clientData.name || 'No registrado', // nombre
                        phone_number: clientData.phone_number || 'No registrado', // celular
                        email: clientData.email || 'No registrado' // correo electrónico
                    };
                    confirmationMessage = "\uD83D\uDEE1\uFE0F **CONFIRMACI\u00D3N DE DATOS PARA ASISTENCIA VIDA DEUDOR**\n\nPor favor confirma que estos datos son correctos:\n\n\uD83D\uDCCB **C\u00E9dula:** ".concat(formattedData.document_id, "\n\uD83D\uDC64 **Nombre:** ").concat(formattedData.name, "\n\uD83D\uDCF1 **Celular:** ").concat(formattedData.phone_number, "\n\uD83D\uDCE7 **Correo electr\u00F3nico:** ").concat(formattedData.email, "\n\n\u00BFTodos los datos son correctos o necesitas modificar alguno antes de activar tu asistencia Vida Deudor?");
                    console.log("\u2705 Datos formateados para confirmaci\u00F3n:", formattedData);
                    return [2 /*return*/, confirmationMessage];
                case 6:
                    error_6 = _b.sent();
                    console.error('❌ Error en showVidaDeudorClientDataForConfirmation:', error_6);
                    return [2 /*return*/, "Error interno al buscar tus datos: ".concat(error_6.message, ". Por favor intenta nuevamente.")];
                case 7: return [2 /*return*/];
            }
        });
    });
}
/**
 * Actualiza datos específicos de un cliente para el flujo de vida deudor
 * @param phoneNumber - Número de teléfono del cliente
 * @param updates - Datos a actualizar (document_id, name, phone_number, email)
 * @returns Resultado de la actualización
 */
function updateVidaDeudorClientData(phoneNumber, updates) {
    return __awaiter(this, void 0, void 0, function () {
        var supabase, cleanNumber, searchVariations, uniqueVariations, clientData, _i, uniqueVariations_2, variation, _a, data, error, fieldsToUpdate, cleanPhone, _b, updatedData, updateError, updatedClient, error_7;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    console.log("\uD83D\uDEE1\uFE0F [VIDA DEUDOR] Actualizando datos del cliente: ".concat(phoneNumber));
                    supabase = createSupabaseClient();
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 7, , 8]);
                    cleanNumber = phoneNumber.replace(/[\s\-\(\)\+]/g, '');
                    searchVariations = [
                        phoneNumber, // Número original
                        phoneNumber.replace(/[\s\-\(\)]/g, ''), // Sin espacios/guiones
                        cleanNumber, // Sin espacios, guiones, ni +
                        cleanNumber.startsWith('57') ? cleanNumber.substring(2) : cleanNumber, // Sin código país 57
                        "+".concat(cleanNumber), // Con + al inicio
                        "+57".concat(cleanNumber.startsWith('57') ? cleanNumber.substring(2) : cleanNumber), // +57 + número local
                        cleanNumber.startsWith('57') ? "+57".concat(cleanNumber.substring(2)) : "+57".concat(cleanNumber) // Asegurar +57
                    ];
                    uniqueVariations = __spreadArray([], new Set(searchVariations), true).filter(function (v) { return v && v.length >= 10; });
                    console.log("\uD83D\uDD0D [UPDATE] Variaciones de b\u00FAsqueda para \"".concat(phoneNumber, "\":"), uniqueVariations);
                    clientData = null;
                    _i = 0, uniqueVariations_2 = uniqueVariations;
                    _c.label = 2;
                case 2:
                    if (!(_i < uniqueVariations_2.length)) return [3 /*break*/, 5];
                    variation = uniqueVariations_2[_i];
                    return [4 /*yield*/, supabase
                            .from('dentix_clients')
                            .select('*')
                            .eq('phone_number', variation)
                            .maybeSingle()];
                case 3:
                    _a = _c.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        console.error('❌ Error buscando cliente:', error);
                        return [3 /*break*/, 4];
                    }
                    if (data) {
                        clientData = data;
                        console.log("\u2705 Cliente encontrado con variaci\u00F3n: ".concat(variation));
                        return [3 /*break*/, 5];
                    }
                    _c.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    if (!clientData) {
                        return [2 /*return*/, JSON.stringify({
                                success: false,
                                message: 'No se encontró un cliente con ese número de teléfono.'
                            })];
                    }
                    fieldsToUpdate = {};
                    if (updates.document_id && updates.document_id.trim() !== '') {
                        fieldsToUpdate.document_id = updates.document_id.trim();
                    }
                    if (updates.name && updates.name.trim() !== '') {
                        fieldsToUpdate.name = updates.name.trim();
                    }
                    if (updates.email && updates.email.trim() !== '') {
                        fieldsToUpdate.email = updates.email.trim();
                    }
                    if (updates.phone_number && updates.phone_number.trim() !== '') {
                        cleanPhone = updates.phone_number.replace(/\D/g, '');
                        if (cleanPhone.startsWith('57')) {
                            fieldsToUpdate.phone_number = "+".concat(cleanPhone);
                        }
                        else if (cleanPhone.startsWith('3')) {
                            fieldsToUpdate.phone_number = "+57".concat(cleanPhone);
                        }
                        else {
                            fieldsToUpdate.phone_number = "+57".concat(cleanPhone);
                        }
                    }
                    if (Object.keys(fieldsToUpdate).length === 0) {
                        return [2 /*return*/, JSON.stringify({
                                success: false,
                                message: 'No se proporcionaron datos válidos para actualizar.'
                            })];
                    }
                    return [4 /*yield*/, supabase
                            .from('dentix_clients')
                            .update(fieldsToUpdate)
                            .eq('id', clientData.id)
                            .select()];
                case 6:
                    _b = _c.sent(), updatedData = _b.data, updateError = _b.error;
                    if (updateError) {
                        console.error('❌ Error actualizando cliente:', updateError);
                        return [2 /*return*/, JSON.stringify({
                                success: false,
                                message: "Error al actualizar los datos: ".concat(updateError.message)
                            })];
                    }
                    console.log('✅ Datos del cliente actualizados exitosamente para vida deudor');
                    updatedClient = updatedData[0];
                    return [2 /*return*/, JSON.stringify({
                            success: true,
                            action: 'vida_deudor_data_updated',
                            updatedData: {
                                document_id: updatedClient.document_id || 'No registrado',
                                name: updatedClient.name,
                                email: updatedClient.email,
                                phone_number: updatedClient.phone_number
                            },
                            message: "\u2705 Datos actualizados correctamente:\n\n\uD83D\uDCCB **C\u00E9dula:** ".concat(updatedClient.document_id || 'No registrado', "\n\uD83D\uDC64 **Nombre:** ").concat(updatedClient.name, "\n\uD83D\uDCF1 **Celular:** ").concat(updatedClient.phone_number, "\n\uD83D\uDCE7 **Correo electr\u00F3nico:** ").concat(updatedClient.email, "\n\n\u00A1Perfecto! Ahora puedes proceder con la activaci\u00F3n de tu asistencia Vida Deudor.")
                        })];
                case 7:
                    error_7 = _c.sent();
                    console.error('❌ Error en updateVidaDeudorClientData:', error_7);
                    return [2 /*return*/, JSON.stringify({
                            success: false,
                            message: "Error interno: ".concat(error_7.message)
                        })];
                case 8: return [2 /*return*/];
            }
        });
    });
}
/**
 * Busca información en los documentos de Bienestar Plus SOLO EN SUPABASE
 * @param query - La consulta del usuario
 * @returns Resultados formateados de la búsqueda
 */
function searchBienestarDocuments(query) {
    return __awaiter(this, void 0, void 0, function () {
        var searchBienestarVectors, supabaseResults, error_8, errorMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🔍 [BIENESTAR PLUS] Procesando consulta SOLO EN SUPABASE:', query);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    console.log('🔄 Intentando búsqueda vectorial en Supabase...');
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('./retrievers'); })];
                case 2:
                    searchBienestarVectors = (_a.sent()).searchBienestarVectors;
                    return [4 /*yield*/, searchBienestarVectors(query)];
                case 3:
                    supabaseResults = _a.sent();
                    if (supabaseResults && supabaseResults.length > 0) {
                        console.log('✅ Usando resultados de Supabase para Bienestar Plus');
                        return [2 /*return*/, formatSupabaseResults(supabaseResults, "Bienestar Plus")];
                    }
                    return [2 /*return*/, "Lo siento, no encontré información específica sobre tu consulta en los documentos de Bienestar Plus. ¿Podrías reformular tu pregunta o ser más específico?"];
                case 4:
                    error_8 = _a.sent();
                    errorMessage = error_8 instanceof Error ? error_8.message : String(error_8);
                    console.error('❌ Error al buscar en Supabase para Bienestar Plus:', errorMessage);
                    return [2 /*return*/, "Lo siento, ocurrió un error al buscar en los documentos de Bienestar Plus. Por favor intenta nuevamente."];
                case 5: return [2 /*return*/];
            }
        });
    });
}
/**
 * Extrae una sección específica del contenido de Bienestar Plus
 * @param content - Contenido del documento
 * @param type - Tipo de sección: 'precio', 'cobertura', 'beneficios', 'asistenciales'
 * @returns Texto extraído o null
 */
function extractBienestarSection(content, type) {
    var lines = content.split('\n');
    var sectionTitles = [];
    var sectionName = '';
    switch (type) {
        case 'precio':
            sectionTitles = ['propuesta económica', 'tarifa', 'precio', 'valor', 'costo'];
            sectionName = 'PRECIOS Y TARIFAS';
            break;
        case 'cobertura':
            sectionTitles = ['cobertura', 'servicios cubiertos', 'qué cubre', 'servicios incluidos'];
            sectionName = 'COBERTURA';
            break;
        case 'beneficios':
            sectionTitles = ['beneficios', 'ventajas', 'beneficio'];
            sectionName = 'BENEFICIOS';
            break;
        case 'asistenciales':
            sectionTitles = ['asistenciales', 'servicios asistenciales', 'asistencia'];
            sectionName = 'ASISTENCIALES';
            break;
        default:
            return null;
    }
    // Buscar la línea que contiene el título de la sección
    var startIdx = -1;
    var _loop_2 = function (i) {
        var line = lines[i].toLowerCase();
        if (sectionTitles.some(function (title) { return line.includes(title); })) {
            startIdx = i;
            return "break";
        }
    };
    for (var i = 0; i < lines.length; i++) {
        var state_1 = _loop_2(i);
        if (state_1 === "break")
            break;
    }
    // Si no hay título pero es consulta de precio y el chunk contiene un monto, devolver el bloque completo
    if (type === 'precio' && startIdx === -1) {
        var montoRegex_1 = /\$\s*\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?/;
        for (var i = 0; i < lines.length; i++) {
            if (montoRegex_1.test(lines[i])) {
                // Devolver todo el bloque que contiene la tarifa
                return lines.join('\n').trim();
            }
        }
        return null;
    }
    if (startIdx === -1)
        return null;
    // Extraer hasta la siguiente sección o hasta 10 líneas, pero si es precio y hay monto, no cortar por líneas vacías ni separadores
    var extracted = "\uD83D\uDCCB **".concat(sectionName, "**\n");
    var foundMonto = false;
    var montoRegex = /\$\s*\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?/;
    for (var j = startIdx; j < lines.length; j++) {
        var l = lines[j];
        if (type === 'precio' && montoRegex.test(l))
            foundMonto = true;
        // Si detecta el inicio de otra sección, corta (excepto si es precio y aún no encontró monto)
        if (j !== startIdx && /^([A-ZÁÉÍÓÚÑ ]{5,}|\*\*.+\*\*)$/.test(l.trim()) && (type !== 'precio' || foundMonto))
            break;
        extracted += l + '\n';
        // Si es precio y ya encontró monto y hay línea vacía después, corta
        if (type === 'precio' && foundMonto && l.trim() === '' && lines[j + 1] && lines[j + 1].trim() === '')
            break;
    }
    return extracted.trim();
}
/**
 * Envía un correo de activación para la asistencia Vida Deudor
 * @param clientName - Nombre del cliente
 * @param clientEmail - Correo electrónico del cliente
 * @returns Resultado de la operación
 */
function sendVidaDeudorActivationEmail(clientName, clientEmail) {
    return __awaiter(this, void 0, void 0, function () {
        var emailContent, msg, error_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("\uD83D\uDCE7 Intentando enviar correo de activaci\u00F3n de Vida Deudor a ".concat(clientName, " (").concat(clientEmail, ")"));
                    emailContent = "\n        Hola ".concat(clientName, ",        \u00A1Excelentes noticias! Tu asistencia Vida Deudor ha sido activada exitosamente.\n\n        Como cliente especial de Coltefinanciera, disfrutar\u00E1s de 3 meses completamente gratis de cobertura.\n\n        Tu asistencia incluye:\n        \u2022 Teleconsulta medicina general (2 eventos por a\u00F1o)\n        \u2022 Telenutrici\u00F3n ilimitada\n        \u2022 Telepsicolog\u00EDa (2 eventos por a\u00F1o)\n        \u2022 Descuentos ilimitados en farmacias\n\n        Tu cobertura est\u00E1 activa desde este momento y no requiere ning\u00FAn pago adicional durante los primeros 3 meses.\n\n        Gracias por confiar en Coltefinanciera Seguros.\n\n        Saludos,\n        Lucia\n        Asesora de Seguros\n    ");
                    msg = {
                        to: clientEmail,
                        from: "notificaciones@asistenciacoltefinanciera.com",
                        subject: "✅ Tu Asistencia Vida Deudor ha sido activada",
                        text: emailContent,
                        html: emailContent.replace(/\n/g, "<br>"),
                    };
                    if (!process.env.SENDGRID_API_KEY) {
                        return [2 /*return*/, JSON.stringify({
                                success: false,
                                message: 'Error: El servicio de correo no está configurado (falta SENDGRID_API_KEY).'
                            })];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, mail_1.default.send(msg)];
                case 2:
                    _a.sent();
                    console.log("\u2705 Correo de activaci\u00F3n de Vida Deudor enviado exitosamente a ".concat(clientEmail));
                    return [2 /*return*/, JSON.stringify({
                            success: true,
                            message: "Correo de activaci\u00F3n enviado exitosamente a ".concat(clientEmail, ". Tu asistencia Vida Deudor est\u00E1 ahora activa con 3 meses gratis.")
                        })];
                case 3:
                    error_9 = _a.sent();
                    console.error('❌ Error al enviar el correo de activación con SendGrid:', error_9);
                    if (error_9.response) {
                        console.error(error_9.response.body);
                    }
                    return [2 /*return*/, JSON.stringify({
                            success: false,
                            message: "Error al enviar el correo de activaci\u00F3n: ".concat(error_9.message)
                        })];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// ===========================
// FUNCIONES DE ELEVENLABS AUDIO
// ===========================
/**
 * Limpia el texto para que sea adecuado para síntesis de voz
 * @param text - Texto a limpiar
 * @returns Texto limpio
 */
function cleanTextForSpeech(text) {
    return text
        // Remover emojis
        .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
        // Remover formato Markdown
        .replace(/\*\*(.*?)\*\*/g, '$1') // **bold**
        .replace(/\*(.*?)\*/g, '$1') // *italic*
        .replace(/`(.*?)`/g, '$1') // `code`
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // [text](link)
        // Limpiar URLs
        .replace(/https?:\/\/[^\s]+/g, '')
        // Convertir números con formato a números hablados
        .replace(/\$(\d+)\.(\d{3})\.(\d{3})/g, '$1 millones $2 mil $3 pesos')
        .replace(/\$(\d+)\.(\d{3})/g, '$1 mil $2 pesos')
        .replace(/\$(\d+)/g, '$1 pesos')
        // Reemplazar símbolos por palabras
        .replace(/&/g, ' y ')
        .replace(/%/g, ' por ciento')
        .replace(/@/g, ' arroba ')
        // Limpiar espacios múltiples y caracteres especiales
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s\.,;:¡!¿?ñáéíóúüÑÁÉÍÓÚÜ]/g, '')
        .trim();
}
/**
 * Genera audio usando la voz Marian de ElevenLabs
 * @param text - Texto a convertir en audio
 * @param saveToFile - Ruta del archivo donde guardar el audio (opcional)
 * @returns Buffer del audio generado o información del archivo guardado
 */
function generateMarianVoice(text, saveToFile) {
    return __awaiter(this, void 0, void 0, function () {
        var cleanText, audio, chunks, _a, audio_1, audio_1_1, chunk, e_1_1, audioBuffer, fs, audioBase64, error_10;
        var _b, e_1, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    if (!elevenLabsClient) {
                        return [2 /*return*/, JSON.stringify({
                                success: false,
                                message: 'Error: ElevenLabs no está configurado correctamente. Verifica el API key.'
                            })];
                    }
                    if (!text || text.trim().length === 0) {
                        return [2 /*return*/, JSON.stringify({
                                success: false,
                                message: 'Error: El texto para convertir a audio no puede estar vacío.'
                            })];
                    }
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 18, , 19]);
                    cleanText = cleanTextForSpeech(text);
                    if (cleanText.length > 1000) {
                        return [2 /*return*/, JSON.stringify({
                                success: false,
                                message: 'Error: El texto es demasiado largo. Máximo 1000 caracteres permitidos.'
                            })];
                    }
                    console.log("\uD83C\uDFB5 Generando audio con voz Marian para texto: \"".concat(cleanText.substring(0, 50), "...\""));
                    return [4 /*yield*/, elevenLabsClient.generate({
                            voice: "XrExE9yKIg1WjnnlVkGX", // Voice ID de Marian
                            model_id: "eleven_multilingual_v2", // Modelo optimizado para español
                            text: cleanText,
                            voice_settings: {
                                stability: 0.75,
                                similarity_boost: 0.85,
                                style: 0.30
                            }
                        })];
                case 2:
                    audio = _e.sent();
                    chunks = [];
                    _e.label = 3;
                case 3:
                    _e.trys.push([3, 8, 9, 14]);
                    _a = true, audio_1 = __asyncValues(audio);
                    _e.label = 4;
                case 4: return [4 /*yield*/, audio_1.next()];
                case 5:
                    if (!(audio_1_1 = _e.sent(), _b = audio_1_1.done, !_b)) return [3 /*break*/, 7];
                    _d = audio_1_1.value;
                    _a = false;
                    chunk = _d;
                    chunks.push(chunk);
                    _e.label = 6;
                case 6:
                    _a = true;
                    return [3 /*break*/, 4];
                case 7: return [3 /*break*/, 14];
                case 8:
                    e_1_1 = _e.sent();
                    e_1 = { error: e_1_1 };
                    return [3 /*break*/, 14];
                case 9:
                    _e.trys.push([9, , 12, 13]);
                    if (!(!_a && !_b && (_c = audio_1.return))) return [3 /*break*/, 11];
                    return [4 /*yield*/, _c.call(audio_1)];
                case 10:
                    _e.sent();
                    _e.label = 11;
                case 11: return [3 /*break*/, 13];
                case 12:
                    if (e_1) throw e_1.error;
                    return [7 /*endfinally*/];
                case 13: return [7 /*endfinally*/];
                case 14:
                    audioBuffer = Buffer.concat(chunks);
                    if (!saveToFile) return [3 /*break*/, 16];
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('fs'); })];
                case 15:
                    fs = _e.sent();
                    fs.writeFileSync(saveToFile, audioBuffer);
                    console.log("\u2705 Audio generado y guardado en: ".concat(saveToFile));
                    return [2 /*return*/, JSON.stringify({
                            success: true,
                            message: "Audio generado exitosamente y guardado en ".concat(saveToFile),
                            audioPath: saveToFile,
                            textLength: cleanText.length,
                            originalTextLength: text.length
                        })];
                case 16:
                    audioBase64 = audioBuffer.toString('base64');
                    console.log("\u2705 Audio generado exitosamente. Tama\u00F1o: ".concat(audioBuffer.length, " bytes"));
                    return [2 /*return*/, JSON.stringify({
                            success: true,
                            message: 'Audio generado exitosamente',
                            audioBase64: audioBase64,
                            audioSize: audioBuffer.length,
                            textLength: cleanText.length,
                            originalTextLength: text.length
                        })];
                case 17: return [3 /*break*/, 19];
                case 18:
                    error_10 = _e.sent();
                    console.error('❌ Error generando audio con ElevenLabs:', error_10);
                    return [2 /*return*/, JSON.stringify({
                            success: false,
                            message: "Error al generar audio: ".concat(error_10.message || 'Error desconocido'),
                            error: error_10.toString()
                        })];
                case 19: return [2 /*return*/];
            }
        });
    });
}
/**
 * Función especializada para generar respuestas de audio de Lucia
 * Optimizada para las respuestas del agente supervisor
 * @param text - Respuesta de Lucia a convertir en audio
 * @returns Audio optimizado para las respuestas de Lucia
 */
function generateLuciaAudioResponse(text) {
    return __awaiter(this, void 0, void 0, function () {
        var luciaText, result, parsedResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!text) {
                        return [2 /*return*/, JSON.stringify({
                                success: false,
                                message: 'Error: No hay texto para convertir a audio.'
                            })];
                    }
                    luciaText = text;
                    // Agregar introducción natural si no la tiene
                    if (!text.toLowerCase().includes('hola') && !text.toLowerCase().includes('buenos')) {
                        luciaText = "Hola, soy Lucia, tu asesora de seguros. ".concat(text);
                    }
                    return [4 /*yield*/, generateMarianVoice(luciaText)];
                case 1:
                    result = _a.sent();
                    try {
                        parsedResult = JSON.parse(result);
                        if (parsedResult.success) {
                            console.log("\uD83C\uDFA4 Audio de Lucia generado: \"".concat(luciaText.substring(0, 50), "...\""));
                            return [2 /*return*/, JSON.stringify(__assign(__assign({}, parsedResult), { voiceType: 'lucia_supervisor', message: 'Respuesta de audio de Lucia generada exitosamente' }))];
                        }
                        return [2 /*return*/, result];
                    }
                    catch (error) {
                        return [2 /*return*/, result];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
