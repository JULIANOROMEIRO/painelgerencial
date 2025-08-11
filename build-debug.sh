#!/bin/bash

# Script para debug do build Docker
set -e

echo "🔍 Iniciando build de debug..."

# Verificar estrutura local
echo "=== ESTRUTURA LOCAL ==="
ls -la
echo "=== COMPONENTES UI LOCAIS ==="
ls -la components/ui/
echo "=== VERIFICANDO IMPORTS ==="
grep -n "@/components/ui" app/page.tsx | head -10

# Build com Dockerfile de debug
echo "🔨 Construindo com debug..."
docker build -f Dockerfile.debug -t gerenciador-debug .

echo "✅ Build de debug concluído!"
