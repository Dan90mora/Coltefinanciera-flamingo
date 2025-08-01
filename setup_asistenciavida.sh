#!/bin/bash

echo "🛡️ CONFIGURACIÓN DE TABLA ASISTENCIAVIDA EN SUPABASE"
echo "=================================================="
echo ""

# Colores para mensajes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}⚠️ IMPORTANTE:${NC}"
echo "Este script requiere que tengas acceso a tu base de datos Supabase"
echo "Puedes ejecutar los scripts SQL de dos maneras:"
echo ""
echo "1. 📋 OPCIÓN 1 - SQL Editor de Supabase (RECOMENDADO):"
echo "   - Ve a https://supabase.com/dashboard"
echo "   - Abre tu proyecto"
echo "   - Ve a SQL Editor"
echo "   - Copia y pega el contenido de 'supabase_asistenciavida_setup.sql'"
echo "   - Ejecuta el script"
echo ""
echo "2. 🔧 OPCIÓN 2 - CLI de Supabase (SI ESTÁ CONFIGURADO):"
echo "   - Asegúrate de tener supabase CLI instalado"
echo "   - Ejecuta: supabase db push"
echo ""
echo "3. 📄 ARCHIVOS DISPONIBLES:"
echo "   - supabase_asistenciavida_setup.sql (CONFIGURACIÓN COMPLETA)"
echo "   - verify_asistenciavida_setup.sql (VERIFICACIÓN)"
echo ""

echo -e "${GREEN}✅ PASOS A SEGUIR:${NC}"
echo "1. Ejecuta 'supabase_asistenciavida_setup.sql' en Supabase"
echo "2. Ejecuta 'verify_asistenciavida_setup.sql' para verificar"
echo "3. Si todo está bien, prueba el agente de vida deudor"
echo ""

echo -e "${YELLOW}⚡ VERIFICACIÓN RÁPIDA:${NC}"
echo "¿Quieres ver el contenido del archivo de configuración? (y/n)"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    echo ""
    echo "📄 CONTENIDO DEL ARCHIVO DE CONFIGURACIÓN:"
    echo "=========================================="
    head -20 supabase_asistenciavida_setup.sql
    echo ""
    echo "... (mostrando solo las primeras 20 líneas)"
    echo ""
    echo "🔍 Para ver el archivo completo:"
    echo "cat supabase_asistenciavida_setup.sql"
fi

echo ""
echo -e "${GREEN}🚀 Una vez ejecutado el script SQL, el agente de Vida Deudor funcionará correctamente.${NC}"
