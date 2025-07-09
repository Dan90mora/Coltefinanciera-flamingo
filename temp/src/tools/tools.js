"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchDentixClientTool = exports.searchCredintegralDocumentsTool = exports.searchDentixDocumentsTool = exports.getInsuranceInfoTool = exports.troubleshootIssueTool = exports.getProductInfoTool = exports.contactTool = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const tools_1 = require("@langchain/core/tools");
const zod_1 = require("zod");
const functions_1 = require("../functions/functions");
dotenv_1.default.config();
exports.contactTool = (0, tools_1.tool)(async () => {
    const contact = (0, functions_1.contactCustomerService)();
    return contact;
}, {
    name: 'contacto_servicio_cliente',
    description: 'Brinda el canal de contacto para ventas y servicios.',
    schema: zod_1.z.object({}),
});
exports.getProductInfoTool = (0, tools_1.tool)(async ({ product }) => {
    const productInfo = (0, functions_1.getProductInfo)(product);
    return productInfo;
}, {
    name: "get_product_info",
    description: "Obtiene información sobre un producto específico de Fenix Producciones. Usa esta tool solo cuando el cliente te pregunte por un producto.",
    schema: zod_1.z.object({
        product: zod_1.z.union([zod_1.z.literal("cámara"), zod_1.z.literal("alarma"), zod_1.z.literal("cerca eléctrica")]),
    }),
});
exports.troubleshootIssueTool = (0, tools_1.tool)(async ({ issue }) => {
    const diagnostic = (0, functions_1.troubleshootIssue)(issue);
    return diagnostic;
}, {
    name: "troubleshoot_issue",
    description: "Brinda soluciones a problemas comunes con los productos de Fenix Producciones.",
    schema: zod_1.z.object({
        issue: zod_1.z.string(),
    }),
});
exports.getInsuranceInfoTool = (0, tools_1.tool)(async ({ insuranceType }) => {
    const insuranceInfo = (0, functions_1.getInsuranceInfo)(insuranceType);
    return insuranceInfo;
}, {
    name: "get_insurance_info",
    description: "Obtiene información sobre tipos de seguros disponibles en Fenix Producciones. Usa esta tool cuando el cliente pregunte sobre seguros.",
    schema: zod_1.z.object({
        insuranceType: zod_1.z.union([
            zod_1.z.literal("hogar"),
            zod_1.z.literal("comercial"),
            zod_1.z.literal("equipos"),
            zod_1.z.literal("responsabilidad civil")
        ]),
    }),
});
exports.searchDentixDocumentsTool = (0, tools_1.tool)(async ({ query }) => {
    const searchResults = await (0, functions_1.searchDentixDocuments)(query);
    return searchResults;
}, {
    name: "search_dentix_documents",
    description: "Busca información específica en los documentos de Dentix usando búsqueda semántica. Usa esta tool cuando el cliente pregunte sobre productos, servicios o información específica de Dentix.",
    schema: zod_1.z.object({
        query: zod_1.z.string().describe("La consulta o pregunta del usuario para buscar en los documentos de Dentix"),
    }),
});
exports.searchCredintegralDocumentsTool = (0, tools_1.tool)(async ({ query }) => {
    const searchResults = await (0, functions_1.searchCredintegralDocuments)(query);
    return searchResults;
}, {
    name: "search_credintegral_documents",
    description: "Busca información específica en los documentos de Credintegral sobre productos financieros, requisitos, beneficios y procedimientos. Usa esta tool cuando el cliente pregunte sobre información específica de Credintegral como créditos, financiamiento, requisitos o servicios financieros.",
    schema: zod_1.z.object({
        query: zod_1.z.string().describe("La consulta o pregunta del usuario para buscar en los documentos de Credintegral"),
    }),
});
exports.searchDentixClientTool = (0, tools_1.tool)(async ({ phoneNumber }) => {
    console.log(`🔍 Tool: Buscando cliente con número: ${phoneNumber}`);
    const clientInfo = await (0, functions_1.searchDentixClientByPhone)(phoneNumber);
    // Formatear la respuesta para el LLM de manera clara
    if (clientInfo && clientInfo.found && clientInfo.name) {
        const response = `CLIENTE ENCONTRADO: ${clientInfo.name} (${clientInfo.email}). Este cliente ya está registrado en Dentix.`;
        console.log(`✅ Tool response: ${response}`);
        return response;
    }
    else {
        const response = `CLIENTE NO ENCONTRADO: No hay ningún cliente registrado con el número ${phoneNumber}.`;
        console.log(`❌ Tool response: ${response}`);
        return response;
    }
}, {
    name: "search_dentix_client",
    description: "Busca información de un cliente de Dentix por su número telefónico para personalizar el saludo y la atención. Usa esta tool al inicio de la conversación para identificar si el cliente ya está registrado.",
    schema: zod_1.z.object({
        phoneNumber: zod_1.z.string().describe("El número telefónico del cliente para buscar en la base de datos de clientes de Dentix"),
    }),
});
