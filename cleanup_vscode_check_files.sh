#!/bin/bash

# Script para limpiar completamente archivos check_* de VS Code
# Elimina archivos del filesystem y referencias en configuraciones de VS Code

WORKSPACE_PATH="/home/daniel/Documentos/Flamingo-Coltefinanciera/Coltefinanciera-flamingo-rama-mora"
cd "$WORKSPACE_PATH"

echo "🧹 Iniciando limpieza completa de archivos check_*..."

# 1. Eliminar todos los archivos check_* del filesystem
echo "📁 Eliminando archivos check_* del filesystem..."
find . -name "check_*" -type f -delete
echo "✅ Archivos check_* eliminados del filesystem"

# 2. Limpiar configuraciones de VS Code que puedan mantener referencias
VSCODE_DIR="$WORKSPACE_PATH/.vscode"

# Limpiar workspace.json si existe
if [ -f "$VSCODE_DIR/workspace.json" ]; then
    echo "🔧 Limpiando workspace.json..."
    # Remover referencias a archivos check_*
    sed -i '/check_/d' "$VSCODE_DIR/workspace.json"
fi

# Limpiar cualquier archivo de sesión temporal
if [ -d "$VSCODE_DIR" ]; then
    echo "🔧 Limpiando archivos temporales de VS Code..."
    find "$VSCODE_DIR" -name "*.session" -delete 2>/dev/null || true
    find "$VSCODE_DIR" -name "*.tmp" -delete 2>/dev/null || true
fi

# 3. Limpiar cache de VS Code COMPLETAMENTE (limpieza agresiva)
echo "🗑️ Limpiando cache de VS Code COMPLETAMENTE..."
rm -rf ~/.config/Code/User/workspaceStorage/* 2>/dev/null || true
rm -rf ~/.config/Code/CachedExtensions/* 2>/dev/null || true
rm -rf ~/.config/Code/logs/* 2>/dev/null || true
rm -rf ~/.config/Code/User/History/* 2>/dev/null || true
rm -rf ~/.config/Code/User/state* 2>/dev/null || true
rm -rf ~/.vscode/extensions/.obsolete 2>/dev/null || true

# 3.1. Limpiar configuraciones específicas del workspace
WORKSPACE_HASH=$(echo "$WORKSPACE_PATH" | md5sum | cut -d' ' -f1)
rm -rf ~/.config/Code/User/workspaceStorage/*${WORKSPACE_HASH}* 2>/dev/null || true

# 4. Forzar git a olvidar archivos check_* si estaban siendo rastreados
echo "🔄 Actualizando índice de Git..."
git rm --cached check_* 2>/dev/null || true
git add .gitignore

echo ""
echo "✨ Limpieza completa de archivos check_* finalizada!"
echo "📝 Para aplicar completamente los cambios:"
echo "   1. Cierra VS Code completamente"
echo "   2. Espera 5 segundos"
echo "   3. Reabre VS Code"
echo ""
echo "🎯 Los archivos check_* ya no deberían aparecer como pestañas vacías"

# Mostrar estadísticas
echo ""
echo "📊 Verificación final:"
CHECK_COUNT=$(find . -name "check_*" -type f 2>/dev/null | wc -l)
echo "   Archivos check_* restantes: $CHECK_COUNT"

if [ $CHECK_COUNT -eq 0 ]; then
    echo "✅ ¡Todos los archivos check_* han sido eliminados exitosamente!"
else
    echo "⚠️ Algunos archivos check_* aún existen. Revisar manualmente."
fi
