# Fenix Chatbot

Este proyecto es un chatbot basado en LangChain y LangGraph para la empresa Fenix Producciones.
Se encarga de gestionar conversaciones con clientes a través de WhatsApp y Twilio, manejando tanto
ventas como soporte técnico de productos de seguridad.

Para lograr el equilibrio de cargas usa un sistema de multiagentes con un supervisor que dirige las solicitudes
al agente adecuado, una vez el agente encargado procesa el supervisor responde al cliente.

## Tecnologías utilizadas

- **Node.js**: Entorno de ejecución de JavaScript.
- **TypeScript**: Superset de JavaScript con tipado estático.
- **LangChain** y **LangGraph**: Frameworks para construir flujos conversacionales inteligentes.
- **Express.js**: Framework para la creación de APIs en Node.js.
- **OpenAI API**: Modelo de IA utilizado para el procesamiento del lenguaje natural.
- **Zod**: Biblioteca para validaciones de datos.

## Instalación

1. Clona el repositorio:
   ```sh
   git clone https://github.com/jobetancur/fenix-chatbot.git
   cd fenix-chatbot
   ```

2. Instala las dependencias:
   ```sh
   npm install
   ```

3. Crea un archivo `.env` con las siguientes variables:
   ```env
   OPENAI_API_KEY=tu_api_key
   ```

4. Inicia el servidor:
   ```sh
   npx tsx src/index.ts
   ```

El chatbot estará disponible en `http://localhost:3023`.

## Estructura del Proyecto

```
fenix-chatbot/
│── src/
│   ├── agents/                # Contiene los agentes de ventas y soporte técnico
│   │   ├── agentState.ts       # Define el estado compartido entre agentes
│   │   ├── dentixServiceAgent.ts # Lógica del agente de Dentix
│   │   ├── credintegralServiceAgent.ts # Lógica del agente de Credintegral
│   │   ├── insuranceServiceAgent.ts # Lógica del agente de seguros
│   ├── config/                # Configuración del chatbot
│   │   ├── constants.ts        # Prompts predefinidos para los agentes
│   │   ├── llm.ts              # Configuración del modelo LLM de OpenAI
│   ├── data/                   # Datos usados por el chatbot (por ejemplo, cobertura de ciudades)
│   ├── functions/              # Funciones auxiliares
│   │   ├── functions.ts        # Funciones que son ejecutadas por las tools
│   ├── tools/                  # Herramientas usadas por los agentes
│   │   ├── tools.ts            # Definición de herramientas para interacción con LangChain
│   ├── utils/                  # Utilidades generales, firebase, supabase, etc.
│   │   ├── index.ts            # Archivo principal de ejecución del servidor
│   │   ├── supervisor.ts       # Lógica del supervisor que administra los agentes
│── .env                        # Variables de entorno
│── package.json                # Dependencias y configuración del proyecto
│── tsconfig.json               # Configuración de TypeScript
```

## Endpoints principales

### 1. Chatbot API

- **POST `/fenix/receive-messages`**: Procesa los mensajes del usuario y devuelve una respuesta.
  - **Parámetros:**
    ```json
    {
      "message": "Hola, quiero comprar una cámara",
      "sessionId": "12345"
    }
    ```
  - **Respuesta:**
    ```json
    {
      "message": "Tenemos varias opciones de cámaras, ¿qué tipo te interesa?",
      "threadId": "12345"
    }
    ```


---