"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentState = void 0;
const langgraph_1 = require("@langchain/langgraph");
exports.AgentState = langgraph_1.Annotation.Root({
    messages: (0, langgraph_1.Annotation)({
        reducer: (x, y) => x.concat(y),
        default: () => [],
    }),
    next: (0, langgraph_1.Annotation)({
        reducer: (x, y) => y ?? x ?? langgraph_1.END,
        default: () => langgraph_1.END,
    }),
});
// Explicación de código:
// --------------------------------
// AgentState es una anotación que contiene el estado de un agente en particular.
// En este caso, el estado de un agente es una lista de mensajes y el siguiente mensaje a enviar.
// El estado de un agente es un objeto que contiene dos propiedades:
// - messages: una lista de mensajes que el agente ha recibido.
// - next: el siguiente mensaje que el agente enviará.
// Ambas propiedades son anotaciones que contienen valores de tipo específico.
