# 🤖 Guía Completa - Fenix Chatbot

## 📋 Descripción General

**Fenix Chatbot** es un sistema inteligente de atención al cliente basado en **inteligencia artificial multiagente** para **Fenix Producciones**, una empresa especializada en soluciones de seguridad (cámaras, alarmas y cercas eléctricas).

El sistema utiliza un **supervisor inteligente** que dirige las conversaciones hacia el agente más apropiado según el tipo de consulta:
- 🛒 **Agente de Ventas (Isabela)**: Para consultas comerciales, precios, características de productos
- 🔧 **Agente de Soporte Técnico (Fernando)**: Para problemas técnicos, instalación, configuración

## 🏗️ Arquitectura del Sistema

### 🧠 Componentes Principales

1. **Supervisor Inteligente** (`supervisor.ts`)
   - Analiza cada mensaje del cliente
   - Decide qué agente debe responder
   - Coordina el flujo de conversación

2. **Agente de Dentix - Isabela** (`dentixServiceAgent.ts`)
   - Especializada en cerrar ventas
   - Acceso a información de productos
   - Enfoque en conversión y atención comercial

3. **Agente de Credintegral - Carolina** (`credintegralServiceAgent.ts`)
   - Especializada en el producto financiero Credintegral
   - Asesoría en líneas de crédito rotativas
   - Orientación en requisitos y procesos de solicitud

### 🛠️ Tecnologías Utilizadas

- **Backend**: Node.js + TypeScript + Express.js
- **IA**: LangChain + LangGraph + OpenAI GPT
- **Validación**: Zod
- **Base de Datos**: Supabase
- **Comunicación**: Twilio (WhatsApp)
- **Audio**: ElevenLabs (síntesis de voz)
- **Almacenamiento**: Firebase Storage
- **Email**: SendGrid

## 📁 Estructura del Proyecto

```
chat/
├── src/
│   ├── index.ts                    # Servidor principal Express
│   ├── supervisor.ts               # Lógica del supervisor multiagente
│   ├── agents/
│   │   ├── agentState.ts          # Estado compartido entre agentes
│   │   ├── dentixServiceAgent.ts   # Agente de Dentix (Isabela)
│   │   ├── credintegralServiceAgent.ts # Agente de Credintegral (Carolina)
│   │   └── insuranceServiceAgent.ts # Agente de seguros (Daniel)
│   ├── config/
│   │   ├── constants.ts           # Prompts y configuraciones
│   │   └── llm.ts                 # Configuración OpenAI
│   ├── data/
│   │   └── colombia.json          # Datos de ciudades/cobertura
│   ├── functions/
│   │   ├── functions.ts           # Lógica de negocio
│   │   └── retrievers.ts          # Recuperación de información
│   ├── routes/
│   │   └── chatRoutes.ts          # Endpoints de la API
│   ├── tools/
│   │   └── tools.ts               # Herramientas para los agentes
│   └── utils/                     # Utilidades (Firebase, Supabase, etc.)
├── .env                           # Variables de entorno
├── package.json                   # Dependencias del proyecto
└── tsconfig.json                  # Configuración TypeScript
```

## 🔧 Funcionalidades Principales

### 💬 Chat Inteligente
- Procesamiento de lenguaje natural con OpenAI
- Conversaciones contextuales y personalizadas
- Memoria de conversación por sesión

### 🎯 Enrutamiento Inteligente
- El supervisor analiza automáticamente el tipo de consulta
- Deriva a ventas o soporte según el contexto
- Manejo fluido de cambios de tema

### 📞 Integración WhatsApp
- Recepción y envío de mensajes vía Twilio
- Soporte para mensajes de texto y audio
- Procesamiento de archivos multimedia

### 🎵 Síntesis de Voz
- Conversión de texto a audio con ElevenLabs
- Respuestas en formato de audio para WhatsApp
- Voces personalizadas para cada agente

### 💾 Persistencia de Datos
- Historial de conversaciones en Supabase
- Almacenamiento de archivos en Firebase
- Gestión de sesiones y usuarios

## 🚀 Endpoints de la API

### 📨 POST `/fenix/receive-messages`
**Descripción**: Procesa mensajes de chat y retorna respuesta del agente apropiado

**Parámetros**:
```json
{
  "message": "Hola, quiero información sobre cámaras",
  "sessionId": "usuario123"
}
```

**Respuesta**:
```json
{
  "message": "¡Hola! Soy Isabela de Fenix Producciones. Te ayudo con información sobre nuestras cámaras de seguridad...",
  "threadId": "usuario123",
  "agent": "sales_service"
}
```

### 📱 Webhook Twilio
- Manejo automático de mensajes de WhatsApp
- Procesamiento de audio y archivos
- Respuestas automáticas

## 🎭 Personalidades de los Agentes

### 🛒 Isabela - Agente de Ventas
- **Objetivo**: Cerrar ventas y generar conversiones
- **Personalidad**: Motivada, profesional, empática
- **Especialidades**:
  - Información de productos y precios
  - Procesos de compra y métodos de pago
  - Instalación y servicios
- **Herramientas**: Acceso a catálogo de productos

### 🔧 Fernando - Agente de Soporte
- **Objetivo**: Resolver problemas técnicos y dar soporte
- **Personalidad**: Experto, paciente, resolutivo
- **Especialidades**:
  - Diagnóstico de problemas
  - Configuración e instalación
  - Mantenimiento preventivo
- **Herramientas**: Base de conocimientos técnica

## ⚙️ Variables de Entorno Requeridas

```env
# OpenAI
OPENAI_API_KEY=tu_clave_openai

# Supabase
SUPABASE_URL=tu_url_supabase
SUPABASE_KEY=tu_clave_supabase

# Twilio
TWILIO_ACCOUNT_SID=tu_account_sid
TWILIO_AUTH_TOKEN=tu_auth_token

# SendGrid
SENDGRID_API_KEY=tu_clave_sendgrid

# ElevenLabs
ELEVENLABS_API_KEY=tu_clave_elevenlabs

# Firebase
FIREBASE_API_KEY=tu_clave_firebase
FIREBASE_AUTH_DOMAIN=tu_dominio_firebase
FIREBASE_PROJECT_ID=tu_proyecto_firebase
# ... (más variables de Firebase)
```

## 🚀 Instalación y Ejecución

### 1. Instalación de Dependencias
```bash
npm install
```

### 2. Configuración
```bash
# Crear archivo .env con las variables necesarias
cp .env.example .env
# Editar .env con tus credenciales
```

### 3. Ejecución
```bash
# Modo desarrollo
npx tsx src/index.ts

# El servidor estará disponible en http://localhost:3023
```

## 🔄 Flujo de Conversación

1. **Cliente envía mensaje** → WhatsApp/API
2. **Supervisor analiza** → Determina tipo de consulta
3. **Enrutamiento** → Selecciona agente apropiado
4. **Agente procesa** → Ejecuta herramientas si es necesario
5. **Respuesta generada** → IA crea respuesta personalizada
6. **Entrega** → Mensaje enviado al cliente

## 🎯 Casos de Uso

### 🛒 Escenarios de Ventas
- "Quiero comprar una cámara" → **Isabela**
- "¿Cuánto cuesta la instalación?" → **Isabela**
- "¿Tienen financiación?" → **Isabela**

### 🔧 Escenarios de Soporte
- "Mi cámara no graba" → **Fernando**
- "¿Cómo configuro la alarma?" → **Fernando**
- "Problemas de conexión" → **Fernando**

## 📊 Ventajas del Sistema

### ✅ Para el Negocio
- **24/7 disponibilidad** sin costo adicional de personal
- **Escalabilidad** automática según demanda
- **Conversiones mejoradas** con agente especializado en ventas
- **Soporte técnico inmediato** reduce tickets de soporte

### ✅ Para los Clientes
- **Respuestas inmediatas** sin tiempos de espera
- **Atención especializada** según tipo de consulta
- **Experiencia natural** con personalidades definidas
- **Múltiples canales** de comunicación

## 🔧 Mantenimiento y Mejoras

### 📈 Monitoreo
- Logs de conversaciones en Supabase
- Métricas de satisfacción del cliente
- Análisis de temas más consultados

### 🔄 Actualizaciones
- Entrenamiento continuo de agentes
- Actualización de base de conocimientos
- Mejora de prompts según feedback

---

**🎯 Objetivo Final**: Proporcionar una experiencia de atención al cliente excepcional que combine la eficiencia de la IA con la calidez humana, aumentando las ventas y mejorando la satisfacción del cliente.
