"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.graph = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const langgraph_1 = require("@langchain/langgraph");
const zod_1 = require("zod");
const prompts_1 = require("@langchain/core/prompts");
const langgraph_2 = require("@langchain/langgraph");
const langgraph_3 = require("@langchain/langgraph");
const agentState_1 = require("./agents/agentState");
const dentixServiceAgent_1 = require("./agents/dentixServiceAgent");
const credintegralServiceAgent_1 = require("./agents/credintegralServiceAgent");
const insuranceServiceAgent_1 = require("./agents/insuranceServiceAgent");
const luciaServiceAgent_1 = require("./agents/luciaServiceAgent");
const llm_1 = require("./config/llm");
dotenv_1.default.config();
const checkpointer = new langgraph_3.MemorySaver();
const members = ["lucia_service", "dentix_service", "credintegral_service", "insurance_service"];
const systemPrompt = "You are a supervisor tasked with managing a conversation between the" +
    " following workers: {members}. Given the following user request," +
    " respond with the worker to act next. Each worker will perform a" +
    " task and respond with their results and status. When finished," +
    " respond with FINISH.";
const options = [langgraph_1.END, ...members];
// Define the routing function
const routingTool = {
    name: "route",
    description: "Select the next role.",
    schema: zod_1.z.object({
        next: zod_1.z.enum([langgraph_1.END, ...members]),
    }),
};
const prompt = prompts_1.ChatPromptTemplate.fromMessages([
    ["system", systemPrompt],
    new prompts_1.MessagesPlaceholder("messages"),
    [
        "human",
        "Given the conversation above, who should act next?" +
            " Or should we FINISH? Select one of: {options}",
    ],
]);
const formattedPrompt = await prompt.partial({
    options: options.join(", "),
    members: members.join(", "),
});
const supervisorChain = formattedPrompt
    .pipe(llm_1.llm.bindTools([routingTool], {
    tool_choice: "route",
}))
    // select the first one
    // @ts-ignore
    .pipe((x) => (x.tool_calls[0].args));
// --------------------------------
//* Explicación de código:
// --------------------------------
// workflow es un gráfico de estados que define el flujo de trabajo de los agentes.
// El gráfico de estados contiene nodos que realizan tareas y bordes que conectan los nodos.
// Los nodos son funciones que procesan mensajes y devuelven mensajes.
// Los bordes son transiciones entre nodos que se activan cuando se cumple una condición.  
// --------------------------------
// 1. Create the graph
const workflow = new langgraph_2.StateGraph(agentState_1.AgentState)
    // 2. Add the nodes; these will do the work
    .addNode("supervisor", supervisorChain, {
    ends: ["lucia_service", "dentix_service", "credintegral_service", "insurance_service", "__end__"],
}).addNode("lucia_service", luciaServiceAgent_1.luciaServiceNode, {
    ends: ["lucia_service", "dentix_service", "credintegral_service", "insurance_service"],
})
    .addNode("dentix_service", dentixServiceAgent_1.dentixServiceNode, {
    ends: ["supervisor"],
})
    .addNode("credintegral_service", credintegralServiceAgent_1.credintegralServiceNode, {
    ends: ["supervisor"],
})
    .addNode("insurance_service", insuranceServiceAgent_1.insuranceServiceNode, {
    ends: ["supervisor"],
});
// 3. Define the edges. We will define both regular and conditional ones
// After a worker completes, report to supervisor
// members.forEach((member) => {
//   workflow.addEdge(member, "supervisor");
// });
workflow.addConditionalEdges("supervisor", (x) => x.next);
workflow.addConditionalEdges("lucia_service", (x) => x.next);
workflow.addEdge(langgraph_2.START, "lucia_service"); // Lucia es siempre el primer punto de contacto
exports.graph = workflow.compile({
    checkpointer
});
