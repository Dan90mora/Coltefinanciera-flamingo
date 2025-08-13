#!/bin/bash

# Script para limpiar completamente archivos .md de VS Code
# Elimina archivos del filesystem y referencias en configuraciones de VS Code

WORKSPACE_PATH="/home/daniel/Documentos/Flamingo-Coltefinanciera/Coltefinanciera-flamingo-rama-mora"
cd "$WORKSPACE_PATH"

echo "🧹 Iniciando limpieza completa de archivos .md..."

# 1. Eliminar todos los archivos .md del filesystem
echo "📁 Eliminando archivos .md del filesystem..."
find . -name "*.md" -type f -delete
echo "✅ Archivos .md eliminados del filesystem"

# 2. Limpiar configuraciones de VS Code que puedan mantener referencias
VSCODE_DIR="$WORKSPACE_PATH/.vscode"

# Limpiar workspace.json si existe
if [ -f "$VSCODE_DIR/workspace.json" ]; then
    echo "🔧 Limpiando workspace.json..."
    # Remover referencias a archivos .md
    sed -i '/\.md/d' "$VSCODE_DIR/workspace.json"
fi

# Limpiar cualquier archivo de sesión temporal
if [ -d "$VSCODE_DIR" ]; then
    echo "🔧 Limpiando archivos temporales de VS Code..."
    find "$VSCODE_DIR" -name "*.session" -delete 2>/dev/null || true
    find "$VSCODE_DIR" -name "*.tmp" -delete 2>/dev/null || true
fi

# 3. Limpiar cache de VS Code (si está en ubicaciones conocidas)
echo "🗑️ Limpiando cache de VS Code..."
rm -rf ~/.config/Code/User/workspaceStorage/*/workspace.json 2>/dev/null || true
rm -rf ~/.config/Code/CachedExtensions/* 2>/dev/null || true

# 4. Forzar git a olvidar archivos .md si estaban siendo rastreados
echo "🔄 Actualizando índice de Git..."
git rm --cached *.md 2>/dev/null || true
git add .gitignore

echo ""
echo "✨ Limpieza completa de archivos .md finalizada!"
echo "📝 Para aplicar completamente los cambios:"
echo "   1. Cierra VS Code completamente"
echo "   2. Espera 5 segundos"
echo "   3. Reabre VS Code"
echo ""
echo "🎯 Los archivos .md ya no deberían aparecer como pestañas vacías"

# Mostrar estadísticas
echo ""
echo "📊 Verificación final:"
MD_COUNT=$(find . -name "*.md" -type f 2>/dev/null | wc -l)
echo "   Archivos .md restantes: $MD_COUNT"

if [ $MD_COUNT -eq 0 ]; then
    echo "✅ ¡Todos los archivos .md han sido eliminados exitosamente!"
else
    echo "⚠️ Algunos archivos .md aún existen. Revisar manualmente."
fi
