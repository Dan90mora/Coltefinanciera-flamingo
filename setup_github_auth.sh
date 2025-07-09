#!/bin/bash
# Script para configurar autenticación de GitHub

echo "=== Configuración de GitHub Authentication ==="
echo "1. Ve a: https://github.com/settings/tokens"
echo "2. Crea un nuevo token con permisos 'repo'"
echo "3. Copia el token y pégalo aquí:"
echo ""
read -p "Introduce tu Personal Access Token: " token

if [ -z "$token" ]; then
    echo "Error: No se proporcionó token"
    exit 1
fi

echo "Configurando autenticación..."
git remote set-url origin https://Dan90mora:$token@github.com/Dan90mora/Coltefinanciera-flamingo.git

echo "Probando conexión..."
if git push origin main; then
    echo "¡Éxito! El proyecto se ha subido correctamente a GitHub"
    echo "Repositorio: https://github.com/Dan90mora/Coltefinanciera-flamingo"
else
    echo "Error al hacer push. Verifica el token."
fi
