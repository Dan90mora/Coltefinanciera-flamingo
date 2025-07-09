import { HumanMessage } from "@langchain/core/messages";
import { graph } from "./src/supervisor";

async function testLuciaBehavior() {
    console.log("🧪 Probando comportamiento inteligente de Lucia\n");
    
    const threadId = "test-thread-" + Date.now();
    
    // TEST 1: Solo saludo
    console.log("=== TEST 1: Solo saludo ===");
    try {
        const config = { configurable: { thread_id: threadId + "-1" } };
        const initialState = {
            messages: [new HumanMessage("Hola")],
            next: "lucia_service"
        };
        
        const stream = await graph.stream(initialState, config);
        for await (const output of stream) {
            console.log("---");
            console.log(output);
        }
    } catch (error) {
        console.error("Error en TEST 1:", error);
    }
    
    console.log("\n");
    
    // TEST 2: Saludo + necesidad específica
    console.log("=== TEST 2: Saludo + necesidad específica ===");
    try {
        const config = { configurable: { thread_id: threadId + "-2" } };
        const initialState = {
            messages: [new HumanMessage("Hola, necesito seguro dental")],
            next: "lucia_service"
        };
        
        const stream = await graph.stream(initialState, config);
        for await (const output of stream) {
            console.log("---");
            console.log(output);
        }
    } catch (error) {
        console.error("Error en TEST 2:", error);
    }
}

testLuciaBehavior().catch(console.error);
