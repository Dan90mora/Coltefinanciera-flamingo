#!/bin/bash

# Script para verificar rápidamente el estado de la tabla credintegral_documents
# Requiere que las variables de entorno SUPABASE_URL y SUPABASE_KEY estén configuradas

echo "🔍 Verificando el estado de la tabla credintegral_documents..."

# Verificar si las variables de entorno están configuradas
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
    echo "❌ Error: Las variables de entorno SUPABASE_URL y SUPABASE_KEY deben estar configuradas"
    echo "💡 Ejecuta: export SUPABASE_URL='tu_url' && export SUPABASE_KEY='tu_key'"
    exit 1
fi

echo "📊 Consultando Supabase..."

# Hacer una consulta HTTP a Supabase para contar los documentos
RESPONSE=$(curl -s \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  "$SUPABASE_URL/rest/v1/credintegral_documents?select=count")

echo "📄 Respuesta de Supabase: $RESPONSE"

# Verificar si la respuesta contiene datos
if echo "$RESPONSE" | grep -q "count"; then
    echo "✅ La tabla credintegral_documents existe y es accesible"
else
    echo "❌ Posible problema con la tabla credintegral_documents"
    echo "🔧 Soluciones sugeridas:"
    echo "   1. Verificar que la tabla existe en Supabase"
    echo "   2. Verificar que las políticas RLS permiten el acceso"
    echo "   3. Verificar que los datos están cargados en la tabla"
fi

echo "🎯 Para un diagnóstico completo, ejecuta el archivo check_credintegral_table.sql en el editor SQL de Supabase"
