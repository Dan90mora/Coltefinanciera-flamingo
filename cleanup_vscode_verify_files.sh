#!/bin/bash

echo "🧹 LIMPIEZA COMPLETA DE ARCHIVOS verify_* EN VS CODE"
echo "=================================================="

# Paso 1: Eliminar archivos del filesystem
echo "1️⃣ Eliminando archivos verify_* del filesystem..."
find . -name "verify_*" -type f -delete 2>/dev/null
echo "   ✅ Archivos eliminados del filesystem"

# Paso 2: Limpiar referencias de Git
echo "2️⃣ Limpiando referencias de Git..."
git rm --cached verify_* 2>/dev/null || echo "   ✅ Referencias de Git ya limpiadas"

# Paso 3: Actualizar .gitignore
echo "3️⃣ Actualizando .gitignore..."
if ! grep -q "verify_\*" .gitignore; then
    echo "" >> .gitignore
    echo "# Archivos de verificación y testing (no indispensables)" >> .gitignore
    echo "verify_*" >> .gitignore
    echo "   ✅ .gitignore actualizado"
else
    echo "   ✅ .gitignore ya contiene exclusión para verify_*"
fi

# Paso 4: Configurar VS Code para cerrar pestañas de archivos eliminados
echo "4️⃣ Configurando VS Code..."
mkdir -p .vscode
if [ -f .vscode/settings.json ]; then
    # Archivo existe, agregar configuraciones si no están
    if ! grep -q "workbench.editor.closeOnFileDelete" .vscode/settings.json; then
        # Remover la llave de cierre y agregar nuevas configuraciones
        sed -i '$ s/}//' .vscode/settings.json
        echo '  ,"workbench.editor.closeOnFileDelete": true' >> .vscode/settings.json
        echo '  ,"workbench.editor.closeEmptyGroups": true' >> .vscode/settings.json
        echo '}' >> .vscode/settings.json
        echo "   ✅ Configuraciones de VS Code actualizadas"
    else
        echo "   ✅ VS Code ya configurado"
    fi
else
    # Crear archivo settings.json nuevo
    cat > .vscode/settings.json << 'VSEOF'
{
  "workbench.editor.closeOnFileDelete": true,
  "workbench.editor.closeEmptyGroups": true,
  "files.hotExit": "off",
  "workbench.editor.restoreViewState": false
}
VSEOF
    echo "   ✅ Archivo .vscode/settings.json creado"
fi

echo ""
echo "🎯 LIMPIEZA COMPLETADA"
echo "====================="
echo "📁 Archivos verify_* eliminados del filesystem"
echo "🔄 Referencias de Git limpiadas"
echo "�� .gitignore actualizado para prevenir futuros archivos verify_*"
echo "⚙️  VS Code configurado para cerrar pestañas de archivos eliminados"
echo ""
echo "🔄 SIGUIENTE PASO: Cerrar completamente VS Code y reabrirlo"
