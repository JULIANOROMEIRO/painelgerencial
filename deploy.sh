#!/bin/bash

# Script de Deploy para Container
# Executa validação, build e deploy do projeto

set -e  # Parar em caso de erro

echo "🚀 [DEPLOY] Iniciando processo de deploy..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 1. Validar projeto
log "Executando validação do projeto..."
if node validate-build.js; then
    success "Validação concluída com sucesso"
else
    error "Falha na validação. Corrija os problemas antes de continuar."
    exit 1
fi

# 2. Parar containers existentes
log "Parando containers existentes..."
docker-compose -f docker-compose.production.yml down 2>/dev/null || true

# 3. Limpar imagens antigas (opcional)
if [ "$1" = "--clean" ]; then
    log "Limpando imagens antigas..."
    docker system prune -f
    docker image prune -f
fi

# 4. Build da nova imagem
log "Construindo nova imagem Docker..."
if docker-compose -f docker-compose.production.yml build --no-cache; then
    success "Build da imagem concluído"
else
    error "Falha no build da imagem"
    exit 1
fi

# 5. Iniciar container
log "Iniciando container em produção..."
if docker-compose -f docker-compose.production.yml up -d; then
    success "Container iniciado com sucesso"
else
    error "Falha ao iniciar container"
    exit 1
fi

# 6. Aguardar health check
log "Aguardando health check..."
sleep 10

# 7. Verificar status
log "Verificando status do container..."
if docker-compose -f docker-compose.production.yml ps | grep -q "Up"; then
    success "Container está rodando"
    
    # Testar endpoint de health
    log "Testando endpoint de health..."
    sleep 5
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        success "Health check passou - aplicação está funcionando!"
        log "Aplicação disponível em: http://localhost:3000"
    else
        warning "Health check falhou, mas container está rodando"
        log "Verifique os logs: docker-compose -f docker-compose.production.yml logs"
    fi
else
    error "Container não está rodando"
    log "Verifique os logs: docker-compose -f docker-compose.production.yml logs"
    exit 1
fi

# 8. Mostrar informações úteis
echo ""
success "Deploy concluído com sucesso!"
echo ""
log "Comandos úteis:"
echo "  - Ver logs: docker-compose -f docker-compose.production.yml logs -f"
echo "  - Parar: docker-compose -f docker-compose.production.yml down"
echo "  - Reiniciar: docker-compose -f docker-compose.production.yml restart"
echo "  - Status: docker-compose -f docker-compose.production.yml ps"
echo ""
log "URLs importantes:"
echo "  - Aplicação: http://localhost:3000"
echo "  - Health Check: http://localhost:3000/api/health"
echo ""