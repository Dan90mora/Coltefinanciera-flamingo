#!/bin/bash

# Script para limpiar completamente las referencias a archivos test_ en VS Code
# y evitar que aparezcan como pestañas vacías

WORKSPACE_DIR="/home/daniel/Documentos/Flamingo-Coltefinanciera/Coltefinanciera-flamingo-rama-mora"

echo "🧹 Limpiando referencias de archivos test_ en VS Code..."

# 1. Verificar que no queden archivos test_
echo "📋 Verificando que no existan archivos test_..."
TEST_FILES=$(find "$WORKSPACE_DIR" -name "test_*" -type f 2>/dev/null | wc -l)
if [ "$TEST_FILES" -gt 0 ]; then
    echo "⚠️  Encontrados $TEST_FILES archivos test_, eliminándolos..."
    find "$WORKSPACE_DIR" -name "test_*" -type f -delete
else
    echo "✅ No se encontraron archivos test_"
fi

# 2. Limpiar posibles configuraciones de VS Code que mantengan referencias
echo "🔧 Limpiando configuraciones de VS Code..."

# 3. Crear/actualizar .vscode/settings.json con configuraciones preventivas
VSCODE_DIR="$WORKSPACE_DIR/.vscode"
mkdir -p "$VSCODE_DIR"

cat > "$VSCODE_DIR/settings.json" << 'EOF'
{
  "files.exclude": {
    "**/test_*": true
  },
  "search.exclude": {
    "**/test_*": true
  },
  "files.watcherExclude": {
    "**/test_*": true
  },
  "workbench.editor.restoreViewState": false,
  "workbench.editor.enablePreview": true,
  "workbench.editor.enablePreviewFromQuickOpen": true,
  "workbench.editor.closeEmptyGroups": true,
  "explorer.autoReveal": false,
  "files.hotExit": "off",
  "workbench.editor.closeOnFileDelete": true,
  "workbench.editor.revealIfOpen": true
}
EOF

# 4. Verificar y actualizar .gitignore
echo "📝 Actualizando .gitignore..."
if ! grep -q "test_\*" "$WORKSPACE_DIR/.gitignore" 2>/dev/null; then
    echo "" >> "$WORKSPACE_DIR/.gitignore"
    echo "# Ignorar todos los archivos de test" >> "$WORKSPACE_DIR/.gitignore"
    echo "test_*" >> "$WORKSPACE_DIR/.gitignore"
fi

# 5. Limpiar cualquier referencia en git
echo "🗂️  Limpiando referencias en Git..."
cd "$WORKSPACE_DIR"
git rm --cached test_* 2>/dev/null || echo "   No hay archivos test_ en el índice de Git"

echo ""
echo "🎉 Limpieza completada!"
echo ""
echo "📋 Resumen:"
echo "   ✅ Archivos test_ eliminados del sistema de archivos"
echo "   ✅ Configuración de VS Code actualizada"
echo "   ✅ .gitignore actualizado"
echo "   ✅ Referencias de Git limpiadas"
echo ""
echo "🔄 Para aplicar completamente:"
echo "   1. Cierra VS Code completamente"
echo "   2. Espera 5 segundos"
echo "   3. Abre VS Code nuevamente"
echo ""
echo "   Las pestañas vacías de archivos test_ ya no deberían aparecer."
