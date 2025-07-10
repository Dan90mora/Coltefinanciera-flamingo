# SOLUCIÓN COMPLETA PARA CREDINTEGRAL_DOCUMENTS

## 🎯 PROBLEMA IDENTIFICADO

La tabla `credintegral_documents` en Supabase tiene:
- ✅ 11 documentos con contenido de texto
- ❌ **Embeddings vectoriales NULL** (por eso no funciona la búsqueda)
- ✅ Funciones de búsqueda correctas (`search_credintegral_documents_hybrid`, `match_credintegral_documents`)

## 🔧 SOLUCIÓN IMPLEMENTADA

### Paso 1: Vaciar la tabla
```bash
# Ejecutar en el editor SQL de Supabase:
# Archivo: empty_credintegral_table.sql
DELETE FROM credintegral_documents;
```

### Paso 2: Cargar documentos CON embeddings
```bash
# Ejecutar en la terminal:
cd /path/to/proyecto
npx tsx load_credintegral_documents.ts
```

## 📋 ARCHIVOS CREADOS

1. **`empty_credintegral_table.sql`** - Script SQL para vaciar la tabla
2. **`load_credintegral_documents.ts`** - Script Node.js para cargar documentos con embeddings
3. **`CREDINTEGRAL_FIX_GUIDE.md`** - Esta guía de solución

## 🚀 EJECUCIÓN PASO A PASO

### 1. Vaciar tabla (en Supabase)
1. Ve al dashboard de Supabase
2. Abre el editor SQL
3. Copia y ejecuta el contenido de `empty_credintegral_table.sql`

### 2. Cargar documentos con embeddings
```bash
# En la terminal del proyecto:
npx tsx load_credintegral_documents.ts
```

### 3. Verificar funcionamiento
```bash
# Probar el sistema:
npm run dev
# Enviar mensaje: "Credintegral" y debería funcionar
```

## 📄 DOCUMENTOS DE EJEMPLO INCLUIDOS

El script `load_credintegral_documents.ts` incluye 3 documentos de ejemplo:

1. **COBERTURAS** - Servicios incluidos en el seguro
2. **PROPUESTA ECONÓMICA** - Precios ($34.500/mes por persona)
3. **INFORMACIÓN GENERAL** - Detalles del seguro

## 🔄 PERSONALIZACIÓN

Para agregar tus propios documentos de Credintegral:

1. Edita `load_credintegral_documents.ts`
2. Reemplaza el array `credintegralDocuments` con tu contenido
3. Ejecuta el script nuevamente

### Formato de documento:
```typescript
{
    content: "Texto completo del documento...",
    metadata: {
        fileName: "NOMBRE_ARCHIVO.docx",
        source: "./documents/NOMBRE_ARCHIVO.docx",
        section: "cobertura" | "propuesta_economica" | "informacion_general"
    }
}
```

## ✅ RESULTADO ESPERADO

Después de ejecutar ambos scripts:

1. ✅ Tabla `credintegral_documents` con documentos Y embeddings
2. ✅ Búsqueda vectorial funcionando
3. ✅ Sistema respondiendo a consultas como "Credintegral", "precio", "cobertura"
4. ✅ Agente Lucia funcionando correctamente

## 🆘 RESOLUCIÓN DE PROBLEMAS

### Error: "No se puede conectar a Supabase"
- Verificar variables de entorno en `.env`
- Verificar permisos de la API key

### Error: "Función no encontrada"
- Ejecutar `supabase_credintegral_setup.sql` primero
- Verificar que las funciones existan en Supabase

### Error: "OpenAI API Key"
- Verificar `OPENAI_API_KEY` en `.env`
- Verificar límites de uso de OpenAI

## 📞 SOPORTE

Si encuentras problemas:
1. Ejecuta `debug_credintegral.sql` en Supabase para diagnosticar
2. Revisa los logs del script Node.js
3. Verifica que todas las variables de entorno estén configuradas
