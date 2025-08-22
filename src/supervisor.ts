import dotenv from "dotenv";
import { END } from "@langchain/langgraph";
import { z } from "zod";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { START, StateGraph } from "@langchain/langgraph";
import { MemorySaver } from "@langchain/langgraph";
import { AgentState } from "./agents/agentState";
import { dentixServiceNode } from "./agents/dentixServiceAgent";
import { credintegralServiceNode } from "./agents/credintegralServiceAgent";
import { vidaDeudorServiceNode } from "./agents/vidaDeudorAgent";
import { insuranceServiceNode } from "./agents/insuranceServiceAgent";
import { luciaServiceNode } from "./agents/luciaServiceAgent";
import { llm } from "./config/llm";

dotenv.config();

const checkpointer = new MemorySaver();

const members = ["lucia_service", "dentix_service", "credintegral_service", "vida_deudor_service", "insurance_service"] as const;

const systemPrompt =
  "You are a supervisor tasked with managing a conversation between the" +
  " following workers: {members}. Given the following user request," +
  " respond with the worker to act next. Each worker will perform a" +
  " task and respond with their results and status. When finished," +
  " respond with FINISH.";

const options = [END, ...members];

// Define the routing function
const routingTool = {
    name: "route",
    description: "Select the next role.",
    schema: z.object({
      next: z.enum([END, ...members]),
    }),
};

const prompt = ChatPromptTemplate.fromMessages([
    ["system", systemPrompt],
    new MessagesPlaceholder("messages"),
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
  .pipe(llm.bindTools(
    [routingTool],
    {
      tool_choice: "route",
    },
  ))
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
// 1. Create the graph - FLUJO SIMPLIFICADO: Solo Lucia maneja todo
const workflow = new StateGraph(AgentState)
  // 2. Add only Lucia node - ella maneja toda la conversación
  .addNode("lucia_service", luciaServiceNode, {
    ends: ["__end__"],
  })

// 3. Lucia siempre termina después de responder, no necesita supervisor
workflow.addConditionalEdges(
  "lucia_service",
  (x: typeof AgentState.State) => x.next,
);

workflow.addEdge(START, "lucia_service"); // Lucia es siempre el único punto de contacto

export const graph = workflow.compile({
    checkpointer
});