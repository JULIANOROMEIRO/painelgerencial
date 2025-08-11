#!/bin/bash

# Script para corrigir problemas de build
set -e

echo "🔧 Corrigindo problemas de build..."

# Verificar se todos os arquivos necessários existem
echo "=== VERIFICANDO ARQUIVOS NECESSÁRIOS ==="

required_files=(
    "components/ui/button.tsx"
    "components/ui/card.tsx"
    "components/ui/input.tsx"
    "components/ui/badge.tsx"
    "components/ui/select.tsx"
    "components/ui/dialog.tsx"
    "components/ui/label.tsx"
    "components/ui/separator.tsx"
    "lib/utils.ts"
    "tsconfig.json"
    "tailwind.config.ts"
)

missing_files=()

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
        echo "❌ Arquivo faltando: $file"
    else
        echo "✅ Arquivo encontrado: $file"
    fi
done

if [ ${#missing_files[@]} -gt 0 ]; then
    echo "⚠️  Arquivos faltando detectados. Verifique se todos os componentes UI estão presentes."
    exit 1
fi

# Verificar tsconfig.json
echo "=== VERIFICANDO TSCONFIG.JSON ==="
if grep -q '"@/*"' tsconfig.json; then
    echo "✅ Path mapping configurado corretamente"
else
    echo "❌ Path mapping não encontrado no tsconfig.json"
    exit 1
fi

# Limpar cache e reinstalar dependências
echo "=== LIMPANDO CACHE ==="
rm -rf node_modules .next package-lock.json
npm install

# Tentar build local
echo "=== TESTANDO BUILD LOCAL ==="
npm run build

echo "✅ Build local funcionando!"

# Agora tentar build Docker
echo "=== TESTANDO BUILD DOCKER ==="
docker build -t gerenciador-test .

echo "🎉 Todos os problemas foram corrigidos!"
