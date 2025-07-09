"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.insuranceServiceNode = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const messages_1 = require("@langchain/core/messages");
const prebuilt_1 = require("@langchain/langgraph/prebuilt");
const messages_2 = require("@langchain/core/messages");
const tools_1 = require("../tools/tools");
const llm_1 = require("../config/llm");
const constants_1 = require("../config/constants");
dotenv_1.default.config();
const insuranceServiceAgent = (0, prebuilt_1.createReactAgent)({
    llm: llm_1.llm,
    tools: [tools_1.getInsuranceInfoTool],
    stateModifier: new messages_2.SystemMessage(constants_1.MESSAGES.SYSTEM_INSURANCE_PROMPT)
});
const insuranceServiceNode = async (state, config) => {
    const result = await insuranceServiceAgent.invoke(state, config);
    const lastMessage = result.messages[result.messages.length - 1];
    return {
        messages: [
            new messages_1.HumanMessage({ content: lastMessage.content, name: "InsuranceService" }),
        ],
        next: "supervisor",
    };
};
exports.insuranceServiceNode = insuranceServiceNode;
// insuranceServiceNode es un nodo que procesa mensajes para el agente de servicio de seguros.
// El nodo invoca el agente de servicio de seguros con el estado actual y la configuración proporcionada.
// Luego, devuelve la respuesta del agente de servicio de seguros como un mensaje humano.
// El mensaje humano contiene el contenido de la respuesta y el nombre del agente que envió el mensaje.
