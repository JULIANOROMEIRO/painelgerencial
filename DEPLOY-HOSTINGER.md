# Deploy na Hostinger - Guia Completo

## Problema Resolvido
O erro `npm ci` foi corrigido criando um `package-lock.json` e ajustando o Dockerfile.

## Opções de Deploy

### Opção 1: Docker Simples
\`\`\`bash
# Execute o script de deploy
chmod +x deploy-hostinger.sh
./deploy-hostinger.sh
\`\`\`

### Opção 2: Docker Compose
\`\`\`bash
# Use o docker-compose otimizado para Hostinger
docker-compose -f docker-compose.hostinger.yml up -d
\`\`\`

### Opção 3: Build Manual
\`\`\`bash
# Gerar package-lock.json
npm install --package-lock-only

# Build da imagem
docker build -t gerenciador-visitas .

# Executar
docker run -p 3000:3000 gerenciador-visitas
\`\`\`

## Configuração na Hostinger

### 1. Via Docker Hub
1. Faça push da imagem para Docker Hub
2. Na Hostinger, use a imagem do Docker Hub
3. Configure as variáveis de ambiente

### 2. Via Upload de Código
1. Faça upload dos arquivos para a Hostinger
2. Execute `npm install` no servidor
3. Execute `npm run build`
4. Execute `npm start`

## Variáveis de Ambiente Necessárias
\`\`\`
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
NEXT_TELEMETRY_DISABLED=1
\`\`\`

## Verificação de Saúde
A aplicação inclui health check em `/api/health`

## Troubleshooting

### Se ainda der erro de package-lock.json:
\`\`\`bash
rm -rf node_modules package-lock.json
npm install
\`\`\`

### Se der erro de build:
\`\`\`bash
npm run build
\`\`\`

### Se der erro de porta:
Verifique se a porta 3000 está disponível na Hostinger.
