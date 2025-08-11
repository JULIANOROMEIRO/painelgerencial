#!/bin/bash

# Script de deploy otimizado para Hostinger
set -e

echo "🚀 Iniciando deploy para Hostinger..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: package.json não encontrado. Execute este script no diretório raiz do projeto."
    exit 1
fi

# Gerar package-lock.json se não existir
if [ ! -f "package-lock.json" ]; then
    echo "📦 Gerando package-lock.json..."
    npm install --package-lock-only
fi

# Limpar builds anteriores
echo "🧹 Limpando builds anteriores..."
docker system prune -f

# Build com Dockerfile otimizado
echo "🔨 Construindo imagem Docker otimizada..."
if [ -f "Dockerfile.optimized" ]; then
    docker build -f Dockerfile.optimized -t gerenciador-visitas:latest .
else
    docker build -t gerenciador-visitas:latest .
fi

# Verificar se a build foi bem-sucedida
if [ $? -eq 0 ]; then
    echo "✅ Build concluída com sucesso!"
else
    echo "❌ Erro na build. Verifique os logs acima."
    exit 1
fi

# Testar a imagem localmente
echo "🧪 Testando imagem localmente..."
docker run -d --name gerenciador-test -p 3001:3000 gerenciador-visitas:latest

# Aguardar inicialização
sleep 30

# Verificar se está funcionando
if curl -f http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ Teste local passou!"
    docker stop gerenciador-test
    docker rm gerenciador-test
else
    echo "❌ Teste local falhou. Verificando logs..."
    docker logs gerenciador-test
    docker stop gerenciador-test
    docker rm gerenciador-test
    exit 1
fi

echo "🎉 Imagem pronta para deploy na Hostinger!"
echo "📋 Próximos passos:"
echo "1. Faça push da imagem para um registry (Docker Hub, etc.)"
echo "2. Configure o deploy na Hostinger usando a imagem"
echo "3. Configure as variáveis de ambiente necessárias"

# Opcional: fazer push para Docker Hub
read -p "Deseja fazer push para Docker Hub? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Digite seu username do Docker Hub: " DOCKER_USERNAME
    docker tag gerenciador-visitas:latest $DOCKER_USERNAME/gerenciador-visitas:latest
    docker push $DOCKER_USERNAME/gerenciador-visitas:latest
    echo "✅ Push concluído! Use a imagem: $DOCKER_USERNAME/gerenciador-visitas:latest"
fi
