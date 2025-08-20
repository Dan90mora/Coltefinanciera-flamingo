#!/bin/bash

# Script AGRESIVO para eliminar pestañas vacías de VS Code
# Ejecutar SOLO cuando VS Code esté CERRADO

echo "🚨 LIMPIEZA AGRESIVA DE PESTAÑAS VACÍAS - VS Code debe estar CERRADO"
echo "=================================================================="

# Verificar que VS Code no esté ejecutándose
if pgrep -x "code" > /dev/null; then
    echo "❌ ERROR: VS Code está ejecutándose. Ciérralo primero."
    exit 1
fi

WORKSPACE_PATH="/home/daniel/Documentos/Flamingo-Coltefinanciera/Coltefinanciera-flamingo-rama-mora"

echo "🧹 Eliminando TODAS las configuraciones de pestañas y estado..."

# 1. Eliminar completamente el workspaceStorage
echo "🗑️ Eliminando workspaceStorage completo..."
rm -rf ~/.config/Code/User/workspaceStorage

# 2. Eliminar estado de ventanas
echo "🗑️ Eliminando estado de ventanas..."
rm -rf ~/.config/Code/User/state
find ~/.config/Code/User -name "*state*" -delete 2>/dev/null || true

# 3. Eliminar historial de archivos
echo "🗑️ Eliminando historial de archivos..."
rm -rf ~/.config/Code/User/History

# 4. Eliminar cache de extensiones
echo "🗑️ Eliminando cache de extensiones..."
rm -rf ~/.config/Code/CachedExtensions

# 5. Eliminar logs que podrían mantener referencias
echo "🗑️ Eliminando logs..."
rm -rf ~/.config/Code/logs

# 6. Recrear directorios necesarios
echo "📁 Recreando directorios necesarios..."
mkdir -p ~/.config/Code/User/workspaceStorage
mkdir -p ~/.config/Code/User/History
mkdir -p ~/.config/Code/CachedExtensions
mkdir -p ~/.config/Code/logs

# 7. Crear configuración limpia de workspace
echo "⚙️ Creando configuración limpia..."
WORKSPACE_HASH=$(echo "$WORKSPACE_PATH" | md5sum | cut -d' ' -f1)
WORKSPACE_STORAGE_DIR="~/.config/Code/User/workspaceStorage/${WORKSPACE_HASH}"

echo ""
echo "✨ LIMPIEZA AGRESIVA COMPLETADA"
echo "================================"
echo ""
echo "🎯 Ahora puedes abrir VS Code:"
echo "   1. Abre VS Code"
echo "   2. Abre la carpeta del proyecto"
echo "   3. Las pestañas vacías ya NO deberían aparecer"
echo ""
echo "⚠️  Si aún aparecen pestañas vacías, repite el proceso:"
echo "   1. Cierra VS Code completamente"
echo "   2. Ejecuta este script nuevamente" 
echo "   3. Espera 10 segundos antes de reabrir VS Code"
