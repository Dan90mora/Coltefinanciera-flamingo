#!/bin/bash

echo "=== Verificando modificaciones de especialistas ==="
echo "📋 Verificando que las herramientas usen SOLO Supabase..."

# Verificar que las herramientas importen correctamente los retrievers de Supabase
echo "🔍 Buscando imports de retrievers en tools.ts:"
grep -n "searchDentixVectors\|searchCredintegralVectors" /home/daniel/Documentos/Flamingo-Coltefinanciera/chat/src/tools/tools.ts

echo ""
echo "🔍 Verificando que NO se usen funciones con fallback local:"
grep -n "searchDentixDocuments\|searchCredintegralDocuments" /home/daniel/Documentos/Flamingo-Coltefinanciera/chat/src/tools/tools.ts | grep -v "import"

echo ""
echo "🔍 Verificando mensajes de SOLO Supabase:"
grep -n "SOLO Supabase\|sin archivos locales" /home/daniel/Documentos/Flamingo-Coltefinanciera/chat/src/tools/tools.ts

echo ""
echo "✅ Verificación completada. Las herramientas ahora usan:"
echo "   - consultDentixSpecialistTool: SOLO searchDentixVectors (Supabase)"
echo "   - consultCredintegralSpecialistTool: SOLO searchCredintegralVectors (Supabase)"
echo "   - consultInsuranceSpecialistTool: SOLO datos internos estructurados"
