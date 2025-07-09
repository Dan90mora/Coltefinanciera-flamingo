"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactCustomerService = contactCustomerService;
exports.validateCity = validateCity;
exports.getProductInfo = getProductInfo;
exports.troubleshootIssue = troubleshootIssue;
exports.getInsuranceInfo = getInsuranceInfo;
exports.searchDentixDocuments = searchDentixDocuments;
exports.searchCredintegralDocuments = searchCredintegralDocuments;
exports.searchDentixClientByPhone = searchDentixClientByPhone;
const colombia_json_1 = __importDefault(require("../data/colombia.json"));
const retrievers_1 = require("./retrievers");
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function contactCustomerService() {
    const customerServiceData = {
        whatsapp: "https://wa.me/573335655669",
        description: "Linea de atención especializada para ventas.",
    };
    console.log('contactCustomerService executed');
    return JSON.stringify(customerServiceData);
}
// Función para eliminar tildes y diéresis
function removeAccents(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
// Lista de departamentos permitidos
const allowedDepartments = [
    "Antioquia",
    "Córdoba",
    "Chocó",
    "Norte de Santander",
    "Guainía",
    "Boyacá",
    "Arauca"
];
// Función para validar si el municipio ingresado pertenece a Antioquia, Córdoba, Chocó, Norte de Santander, Guainía, Boyacá o Arauca. Leerlo del archivo colombia.json
function validateCity(city) {
    console.log('validateCity executed');
    const normalizedCity = removeAccents(city.toLowerCase());
    const filteredDepartments = colombia_json_1.default.filter((dept) => allowedDepartments.includes(dept.departamento));
    const cityExists = filteredDepartments.some((dept) => dept.ciudades.some((c) => removeAccents(c.toLowerCase()) === normalizedCity));
    if (cityExists) {
        return "Perfecto, tu ciudad está dentro de nuestra cobertura.";
    }
    return "Lo siento, actualmente no tenemos cobertura en tu ciudad. Puedes comunicarte en el siguiente enlace: https://wa.me/573186925681";
}
function getProductInfo(product) {
    const products = {
        "cámara": {
            description: "Cámara de seguridad para interiores y exteriores.",
            price: "$200.000",
            features: ["Resolución HD", "Visión nocturna", "Detección de movimiento"],
        },
        "alarma": {
            description: "Alarma para proteger tu hogar o negocio.",
            price: "$150.000",
            features: ["Sirena de alta potencia", "Sensor de movimiento", "Control remoto"],
        },
        "cerca eléctrica": {
            description: "Cerca eléctrica para proteger tu propiedad.",
            price: "$300.000",
            features: ["Alarma de alta potencia", "Sensor de movimiento", "Control remoto"],
        },
    };
    console.log('getProductInfo executed');
    const productInfo = products[product];
    if (productInfo) {
        return JSON.stringify(productInfo);
    }
    return "Lo siento, no tenemos información sobre ese producto.";
}
// Función para solucionar problema con camara que no da imagen
function troubleshootIssue(issue) {
    console.log('troubleshootIssue executed');
    let result;
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
    const insurances = {
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
    const insuranceInfo = insurances[insuranceType];
    if (insuranceInfo) {
        return JSON.stringify(insuranceInfo);
    }
    return "Lo siento, no tenemos información sobre ese tipo de seguro.";
}
async function searchDentixDocuments(query) {
    try {
        console.log('searchDentixDocuments executed with query:', query); // Intentar primero búsqueda vectorial en Supabase
        try {
            const supabaseResults = await (0, retrievers_1.searchDentixVectors)(query);
            if (supabaseResults && supabaseResults.length > 0) {
                console.log('✅ Usando resultados de Supabase');
                return formatSupabaseResults(supabaseResults);
            }
        }
        catch (supabaseError) {
            const errorMessage = supabaseError instanceof Error ? supabaseError.message : String(supabaseError);
            console.log('⚠️ Supabase no disponible, usando búsqueda local:', errorMessage);
        }
        // Fallback: Buscar en archivos locales de texto
        const results = await searchInLocalTextFiles(query);
        if (!results || results.length === 0) {
            return "Lo siento, no encontré información específica sobre tu consulta en los documentos de Dentix. ¿Podrías reformular tu pregunta o ser más específico?";
        }
        console.log('✅ Usando resultados de búsqueda local');
        return formatLocalResults(results);
    }
    catch (error) {
        console.error('Error in searchDentixDocuments:', error);
        return "Lo siento, ocurrió un error al buscar en los documentos de Dentix. Por favor intenta nuevamente.";
    }
}
/**
 * Formatea resultados de Supabase
 */
function formatSupabaseResults(results) {
    let response = "Encontré la siguiente información en los documentos de Dentix:\n\n";
    results.forEach((result, index) => {
        const fileName = result.metadata?.fileName || 'Documento';
        response += `📄 **${fileName.replace('.txt', '')}**\n`;
        response += `${result.content}\n`;
        response += `(Similitud: ${(result.similarity * 100).toFixed(1)}%)\n`;
        response += "\n---\n\n";
    });
    return response;
}
/**
 * Formatea resultados de búsqueda local
 */
function formatLocalResults(results) {
    let response = "Encontré la siguiente información en los documentos de Dentix:\n\n";
    results.forEach((result, index) => {
        response += `📄 **${result.fileName.replace('.txt', '')}**\n`;
        response += `${result.content}\n`;
        response += `(Relevancia: ${result.score})\n`;
        response += "\n---\n\n";
    });
    return response;
}
/**
 * Busca en archivos de texto locales como sistema de fallback
 */
async function searchInLocalTextFiles(query) {
    const fs = await Promise.resolve().then(() => __importStar(require('fs')));
    const path = await Promise.resolve().then(() => __importStar(require('path')));
    const { fileURLToPath } = await Promise.resolve().then(() => __importStar(require('url')));
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const dentixFolder = path.join(__dirname, '../../Dentix-pdf');
    const results = [];
    try {
        // Verificar si existe la carpeta
        if (!fs.existsSync(dentixFolder)) {
            console.log('❌ Carpeta Dentix-pdf no encontrada');
            return results;
        }
        // Leer archivos .txt
        const files = fs.readdirSync(dentixFolder);
        const txtFiles = files.filter(file => file.endsWith('.txt'));
        if (txtFiles.length === 0) {
            console.log('❌ No se encontraron archivos .txt en Dentix-pdf');
            return results;
        }
        console.log(`📁 Buscando en ${txtFiles.length} archivos .txt`);
        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
        for (const txtFile of txtFiles) {
            const filePath = path.join(dentixFolder, txtFile);
            const content = fs.readFileSync(filePath, 'utf-8');
            const contentLower = content.toLowerCase();
            let score = 0;
            let matchedSections = [];
            // Buscar palabras clave
            for (const word of queryWords) {
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
                const lines = content.split('\n');
                const relevantLines = [];
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    const lineLower = line.toLowerCase();
                    // Verificar si la línea contiene alguna palabra clave
                    const hasKeyword = queryWords.some(word => lineLower.includes(word));
                    if (hasKeyword) {
                        // Incluir contexto (líneas anteriores y posteriores)
                        const start = Math.max(0, i - 2);
                        const end = Math.min(lines.length, i + 3);
                        const contextLines = lines.slice(start, end).join('\n');
                        if (!matchedSections.some(section => section.includes(contextLines.substring(0, 50)))) {
                            matchedSections.push(contextLines);
                        }
                    }
                }
                // Combinar las secciones relevantes
                const relevantContent = matchedSections.length > 0
                    ? matchedSections.join('\n\n...\n\n')
                    : content.substring(0, 500) + '...';
                results.push({
                    fileName: txtFile.replace('.txt', ''),
                    content: relevantContent,
                    score: `${score} coincidencias`
                });
            }
        }
        // Ordenar por score descendente
        results.sort((a, b) => {
            const scoreA = parseInt(a.score.split(' ')[0]);
            const scoreB = parseInt(b.score.split(' ')[0]);
            return scoreB - scoreA;
        });
        // Limitar a 3 resultados
        return results.slice(0, 3);
    }
    catch (error) {
        console.error('Error en searchInLocalTextFiles:', error);
        return results;
    }
}
/*
 * Busca información en los documentos de Credintegral usando búsqueda híbrida (Supabase + local)
 * @param query - La consulta del usuario
 * @returns Resultados formateados de la búsqueda
 */
async function searchCredintegralDocuments(query) {
    console.log('🔍 Buscando en documentos de Credintegral:', query);
    try { // Intentar buscar primero en Supabase (vectorial)
        try {
            console.log('🔄 Intentando búsqueda vectorial en Supabase...');
            const supabaseResults = await (0, retrievers_1.searchCredintegralVectors)(query);
            if (supabaseResults && supabaseResults.length > 0) {
                console.log(`✅ Encontrados ${supabaseResults.length} resultados en Supabase`);
                return formatSupabaseResults(supabaseResults);
            }
        }
        catch (supabaseError) {
            const errorMessage = supabaseError instanceof Error ? supabaseError.message : String(supabaseError);
            console.log('⚠️ Supabase no disponible, usando búsqueda local:', errorMessage);
        }
        // Fallback: Buscar en archivos locales de texto
        const results = await searchInCredintegralLocalTextFiles(query);
        if (!results || results.length === 0) {
            return "Lo siento, no encontré información específica sobre tu consulta en los documentos de Credintegral. ¿Podrías reformular tu pregunta o ser más específico sobre el producto financiero?";
        }
        console.log('✅ Usando resultados de búsqueda local');
        return formatLocalResults(results);
    }
    catch (error) {
        console.error('Error in searchCredintegralDocuments:', error);
        return "Lo siento, ocurrió un error al buscar en los documentos de Credintegral. Por favor intenta nuevamente.";
    }
}
/**
 * Busca en Supabase usando embeddings vectoriales para Credintegral
 /**
 * Busca en archivos de texto locales de Credintegral como sistema de fallback
 */
async function searchInCredintegralLocalTextFiles(query) {
    const fs = await Promise.resolve().then(() => __importStar(require('fs')));
    const path = await Promise.resolve().then(() => __importStar(require('path')));
    const { fileURLToPath } = await Promise.resolve().then(() => __importStar(require('url')));
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const credintegralFolder = path.join(__dirname, '../../Credintegral-pdf');
    const results = [];
    try {
        // Verificar si existe la carpeta
        if (!fs.existsSync(credintegralFolder)) {
            console.log('❌ Carpeta Credintegral-pdf no encontrada');
            return results;
        }
        // Leer archivos .txt
        const files = fs.readdirSync(credintegralFolder);
        const txtFiles = files.filter(file => file.endsWith('.txt'));
        if (txtFiles.length === 0) {
            console.log('❌ No se encontraron archivos .txt en Credintegral-pdf');
            return results;
        }
        console.log(`📁 Buscando en ${txtFiles.length} archivos .txt de Credintegral`);
        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
        for (const txtFile of txtFiles) {
            const filePath = path.join(credintegralFolder, txtFile);
            const content = fs.readFileSync(filePath, 'utf-8');
            const contentLower = content.toLowerCase();
            let score = 0;
            let matchedSections = [];
            // Buscar palabras clave
            for (const word of queryWords) {
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
                const lines = content.split('\n');
                const relevantLines = [];
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    const lineLower = line.toLowerCase();
                    // Verificar si la línea contiene alguna palabra clave
                    const hasKeyword = queryWords.some(word => lineLower.includes(word));
                    if (hasKeyword) {
                        // Incluir contexto (líneas anteriores y posteriores)
                        const start = Math.max(0, i - 2);
                        const end = Math.min(lines.length, i + 3);
                        const contextLines = lines.slice(start, end).join('\n');
                        if (!matchedSections.some(section => section.includes(contextLines.substring(0, 50)))) {
                            matchedSections.push(contextLines);
                        }
                    }
                }
                // Combinar las secciones relevantes
                const relevantContent = matchedSections.length > 0
                    ? matchedSections.join('\n\n...\n\n')
                    : content.substring(0, 500) + '...';
                results.push({
                    fileName: txtFile.replace('.txt', ''),
                    content: relevantContent,
                    score: `${score} coincidencias`
                });
            }
        }
        // Ordenar por score descendente
        results.sort((a, b) => {
            const scoreA = parseInt(a.score.split(' ')[0]);
            const scoreB = parseInt(b.score.split(' ')[0]);
            return scoreB - scoreA;
        });
        // Limitar a 3 resultados
        return results.slice(0, 3);
    }
    catch (error) {
        console.error('Error en searchInCredintegralLocalTextFiles:', error);
        return results;
    }
}
/**
 * Configuración para Supabase (reutilizable)
 */
const createSupabaseClient = () => (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
/**
 * Busca un cliente de Dentix por número telefónico
 * @param phoneNumber - El número telefónico del cliente
 * @returns Información del cliente si existe, null si no se encuentra
 */
async function searchDentixClientByPhone(phoneNumber) {
    const supabase = createSupabaseClient();
    // Limpiar el número telefónico (quitar espacios, guiones, paréntesis)
    const cleanPhoneNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    try {
        // Buscar cliente por número telefónico en la tabla dentix_client
        const { data, error } = await supabase
            .from('dentix_client')
            .select('*')
            .eq('phone_number', cleanPhoneNumber)
            .single();
        if (error && error.code !== 'PGRST116') { // PGRST116 es "no rows returned"
            throw new Error(`Dentix client search error: ${error.message}`);
        }
        return data || null;
    }
    catch (error) {
        console.error('Error searching Dentix client:', error);
        return null;
    }
}
