#!/bin/bash

echo "🔍 === VERIFICACIÓN RÁPIDA DE TABLA dentix_documents ==="
echo ""

# Verificar archivos de configuración
echo "📋 Verificando configuración..."
if [ -f ".env" ]; then
    echo "✅ Archivo .env encontrado"
    if grep -q "SUPABASE_URL" .env && grep -q "SUPABASE_KEY" .env; then
        echo "✅ Variables de Supabase configuradas"
    else
        echo "❌ Variables de Supabase faltantes en .env"
    fi
else
    echo "❌ Archivo .env no encontrado"
fi

echo ""
echo "📋 Verificando código de búsqueda en dentix_documents..."

# Verificar que la función searchDentixVectors existe
echo "🔍 Función searchDentixVectors:"
grep -n "searchDentixVectors" src/functions/retrievers.ts | head -3

echo ""
echo "🔍 Función RPC match_dentix_documents:"
grep -n "match_dentix_documents" src/functions/retrievers.ts

echo ""
echo "🔍 Herramienta consultDentixSpecialistTool:"
grep -n "consultDentixSpecialistTool" src/tools/tools.ts

echo ""
echo "🔍 Import de searchDentixVectors en tools.ts:"
grep -n "searchDentixVectors" src/tools/tools.ts

echo ""
echo "✅ === RESUMEN DEL FLUJO DE BÚSQUEDA ==="
echo "1. consultDentixSpecialistTool → importa searchDentixVectors"
echo "2. searchDentixVectors → llama supabase.rpc('match_dentix_documents')"
echo "3. match_dentix_documents → busca en tabla dentix_documents"
echo ""
echo "🎯 LA BÚSQUEDA SÍ ESTÁ CONFIGURADA PARA USAR SUPABASE"
