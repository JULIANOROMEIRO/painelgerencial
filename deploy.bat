@echo off
REM Script de Deploy para Container (Windows)
REM Executa validação, build e deploy do projeto

echo [DEPLOY] Iniciando processo de deploy...

REM 1. Validar projeto
echo [DEPLOY] Executando validacao do projeto...
node validate-build.js
if %errorlevel% neq 0 (
    echo [ERROR] Falha na validacao. Corrija os problemas antes de continuar.
    exit /b 1
)
echo [SUCCESS] Validacao concluida com sucesso

REM 2. Parar containers existentes
echo [DEPLOY] Parando containers existentes...
docker-compose -f docker-compose.production.yml down 2>nul

REM 3. Build da nova imagem
echo [DEPLOY] Construindo nova imagem Docker...
docker-compose -f docker-compose.production.yml build --no-cache
if %errorlevel% neq 0 (
    echo [ERROR] Falha no build da imagem
    exit /b 1
)
echo [SUCCESS] Build da imagem concluido

REM 4. Iniciar container
echo [DEPLOY] Iniciando container em producao...
docker-compose -f docker-compose.production.yml up -d
if %errorlevel% neq 0 (
    echo [ERROR] Falha ao iniciar container
    exit /b 1
)
echo [SUCCESS] Container iniciado com sucesso

REM 5. Aguardar health check
echo [DEPLOY] Aguardando health check...
timeout /t 10 /nobreak >nul

REM 6. Verificar status
echo [DEPLOY] Verificando status do container...
docker-compose -f docker-compose.production.yml ps | findstr "Up" >nul
if %errorlevel% equ 0 (
    echo [SUCCESS] Container esta rodando
    
    REM Testar endpoint de health
    echo [DEPLOY] Testando endpoint de health...
    timeout /t 5 /nobreak >nul
    curl -f http://localhost:3000/api/health >nul 2>&1
    if %errorlevel% equ 0 (
        echo [SUCCESS] Health check passou - aplicacao esta funcionando!
        echo [DEPLOY] Aplicacao disponivel em: http://localhost:3000
    ) else (
        echo [WARNING] Health check falhou, mas container esta rodando
        echo [DEPLOY] Verifique os logs: docker-compose -f docker-compose.production.yml logs
    )
) else (
    echo [ERROR] Container nao esta rodando
    echo [DEPLOY] Verifique os logs: docker-compose -f docker-compose.production.yml logs
    exit /b 1
)

REM 7. Mostrar informações úteis
echo.
echo [SUCCESS] Deploy concluido com sucesso!
echo.
echo [DEPLOY] Comandos uteis:
echo   - Ver logs: docker-compose -f docker-compose.production.yml logs -f
echo   - Parar: docker-compose -f docker-compose.production.yml down
echo   - Reiniciar: docker-compose -f docker-compose.production.yml restart
echo   - Status: docker-compose -f docker-compose.production.yml ps
echo.
echo [DEPLOY] URLs importantes:
echo   - Aplicacao: http://localhost:3000
echo   - Health Check: http://localhost:3000/api/health
echo.