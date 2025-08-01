# AGENTE VIDA DEUDOR - CONFIGURACIÓN COMPLETA

## 🛡️ **AGENTE VIDA DEUDOR IMPLEMENTADO**

### **📋 DESCRIPCIÓN**
Agente especializado en seguros de Vida Deudor que proporciona información sobre protección familiar ante fallecimiento o invalidez del sostén económico.

### **🔧 COMPONENTES CREADOS**

#### **1. Agente Principal**
- **Archivo**: `src/agents/vidaDeudorAgent.ts`
- **Función**: Maneja consultas específicas sobre seguros de vida deudor
- **Herramientas**: `searchVidaDeudorDocumentsTool`

#### **2. Funciones de Búsqueda**
- **searchVidaDeudorVectors()** en `src/functions/retrievers.ts`
- **searchVidaDeudorDocuments()** en `src/functions/functions.ts`

#### **3. Herramientas**
- **searchVidaDeudorDocumentsTool**: Búsqueda directa en documentos
- **consultVidaDeudorSpecialistTool**: Para que Lucia consulte al especialista

#### **4. Configuración de Base de Datos**
- **Tabla**: `asistenciavida_documents` en Supabase
- **Funciones SQL**: 
  - `search_asistenciavida_documents_hybrid`
  - `match_asistenciavida_documents`

### **🎯 PERSONALIDAD DEL AGENTE**
- **Enfoque**: Protección familiar ante pérdida del sostén económico
- **Estrategia**: Ventas basadas en miedo emocional y responsabilidad familiar
- **Técnicas**: Urgencia, historias emotivas, beneficios económicos

### **📊 FLUJO DE TRABAJO**

#### **Cliente → Lucia → Especialista Vida Deudor**
```
1. Cliente: "¿Qué es el seguro de vida deudor?"
2. Lucia detecta palabras clave: "vida deudor"
3. Lucia usa: consultVidaDeudorSpecialistTool
4. Sistema consulta: searchVidaDeudorVectors()
5. Busca en: asistenciavida_documents (Supabase)
6. Retorna información específica
7. Lucia responde como experta en vida deudor
```

### **🔍 PALABRAS CLAVE DE ACTIVACIÓN**
- vida deudor
- seguro de vida
- protección deudas
- fallecimiento
- muerte
- invalidez
- protección familiar
- seguro vida deudor
- cobertura vida
- protección económica

### **⚙️ CONFIGURACIÓN TÉCNICA**

#### **Base de Datos Supabase:**
- **Tabla**: `asistenciavida_documents`
- **Embeddings**: OpenAI text-embedding-3-small (1536 dimensiones)
- **Búsqueda**: Híbrida (vectorial + texto) con RRF
- **Umbral**: 0.1 (permisivo para mejores resultados)

#### **Funciones SQL:**
```sql
-- Búsqueda híbrida optimizada
search_asistenciavida_documents_hybrid(
  query_text, 
  query_embedding, 
  match_threshold, 
  match_count, 
  rrf_k
)

-- Búsqueda vectorial básica
match_asistenciavida_documents(
  query_embedding, 
  match_threshold, 
  match_count
)
```

### **📁 ARCHIVOS RELACIONADOS**

#### **Core del Agente:**
- `src/agents/vidaDeudorAgent.ts`
- `src/config/constants.ts` (SYSTEM_VIDA_DEUDOR_PROMPT)

#### **Funciones de Búsqueda:**
- `src/functions/retrievers.ts` (searchVidaDeudorVectors)
- `src/functions/functions.ts` (searchVidaDeudorDocuments)

#### **Herramientas:**
- `src/tools/tools.ts` (searchVidaDeudorDocumentsTool, consultVidaDeudorSpecialistTool)

#### **Integración:**
- `src/agents/luciaServiceAgent.ts` (herramienta agregada)
- `src/supervisor.ts` (importación agregada)

#### **Configuración Base de Datos:**
- `supabase_asistenciavida_setup.sql`
- `asistenciavida_functions_only.sql`
- `check_asistenciavida_table.sql`

#### **Pruebas:**
- `test_vida_deudor_queries.ts`

### **🚀 PRÓXIMOS PASOS**

#### **1. Configurar Base de Datos:**
```bash
# Ejecutar en Supabase SQL Editor
cat supabase_asistenciavida_setup.sql
```

#### **2. Cargar Documentos:**
- Crear documentos de Vida Deudor (.docx)
- Usar patrón similar a `load_credintegral_documents.ts`
- Cargar con embeddings vectoriales

#### **3. Probar Funcionalidad:**
```bash
# Probar búsqueda vectorial
npx tsx test_vida_deudor_queries.ts

# Probar chatbot completo
npm run dev
```

#### **4. Consultas de Prueba:**
- "¿Qué es el seguro de vida deudor?"
- "¿Cuánto cuesta?"
- "¿Qué pasa si fallezco?"
- "protección familiar"

### **🎉 ESTADO ACTUAL**
✅ **Agente creado y configurado**
✅ **Integrado con Lucia**
✅ **Funciones de búsqueda implementadas**
✅ **Base de datos configurada**
✅ **Herramientas creadas**
⏳ **Pendiente**: Cargar documentos reales

### **💡 NOTAS TÉCNICAS**
- Sigue el mismo patrón que Credintegral y Dentix
- Integrado completamente con el sistema Lucia
- Búsqueda optimizada para consultas de cobertura y precios
- Personalidad de ventas enfocada en protección familiar
