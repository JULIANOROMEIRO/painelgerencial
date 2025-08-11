import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  console.log("🚀 [API] Iniciando busca de dados - checklist-associados")
  console.log("⏰ [API] Timeout configurado: 120 segundos por tentativa")

  const searchParams = request.nextUrl.searchParams
  const uf = searchParams.get("uf") || "SP"
  const limite = searchParams.get("limit") || "1000"

  console.log(`📋 [API] Parâmetros: UF=${uf}, Limite=${limite}`)

  const baseUrl = "https://www.centralretencao.com.br/GRelator/api/v1/relatorios/checklist-associado"
  const fullUrl = `${baseUrl}?uf=${uf}&limit=${limite}`

  console.log(`🌐 [API] URL completa: ${fullUrl}`)

  // Configuração de retry com delays progressivos
  const maxRetries = 7
  const retryDelays = [6000, 12000, 24000, 48000, 96000, 192000, 384000] // 6s, 12s, 24s, 48s, 96s, 192s, 384s

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`🔄 [API] Tentativa ${attempt}/${maxRetries}`)
    console.log(`⏱️ [API] Timeout desta tentativa: 120 segundos`)

    try {
      // AbortController com timeout de 120 segundos
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.log(`⏰ [API] TIMEOUT de 120s atingido na tentativa ${attempt}`)
        controller.abort()
      }, 120000) // 120 segundos = 120000ms

      console.log(`📡 [API] Fazendo requisição HTTPS para: ${fullUrl}`)
      const attemptStartTime = Date.now()

      const response = await fetch(fullUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "User-Agent": "GerenciadorChecklist/1.0",
          "Cache-Control": "no-cache",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const attemptDuration = (Date.now() - attemptStartTime) / 1000

      console.log(`📊 [API] Resposta recebida em ${attemptDuration.toFixed(2)}s - Status: ${response.status}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const rawData = await response.text()
      console.log(`📦 [API] Dados brutos recebidos: ${rawData.length} caracteres`)

      if (!rawData || rawData.trim() === "") {
        throw new Error("Resposta vazia da API")
      }

      let jsonData
      try {
        jsonData = JSON.parse(rawData)
      } catch (parseError) {
        console.error("❌ [API] Erro ao fazer parse do JSON:", parseError)
        throw new Error(`Erro de parse JSON: ${parseError}`)
      }

      console.log(`✅ [API] JSON parseado com sucesso`)
      console.log(`📊 [API] Tipo de dados recebidos:`, typeof jsonData)

      // Verificar se é array
      if (!Array.isArray(jsonData)) {
        console.log(`⚠️ [API] Dados não são array, convertendo...`)
        jsonData = [jsonData]
      }

      console.log(`📈 [API] Total de registros recebidos: ${jsonData.length}`)

      // Processar e mapear os dados
      const processedData = jsonData
        .map((item: any, index: number) => {
          try {
            // Extrair dados da estrutura tb_claro
            const tbClaro = item.tb_claro || {}
            const checklistDados = item.checklist_dados || []

            console.log(`🔍 [API] Processando item ${index + 1}:`, {
              id: tbClaro.id,
              login: tbClaro.novologin,
              tecnico: tbClaro.tec,
              status: tbClaro.status,
              ocorrencia: tbClaro.ocorrencia, // NOVO: Campo Ocorrencia
              checklistCount: checklistDados.length,
            })

            // Mapear para a estrutura esperada pelo frontend
            return {
              id: tbClaro.id?.toString() || `item_${index}`,
              login: tbClaro.novologin || "N/A",
              tecnico: tbClaro.tec || "N/A",
              contrato: tbClaro.contrato || "N/A",
              horario_inicio: tbClaro.início || "N/A",
              status: tbClaro.status || "N/A",
              status_coleta: tbClaro.ocorrencia || "N/A", // NOVO: Status da Coleta
              coletados: tbClaro.coletados || "N/A",
              quantidade_chips: parseInt(tbClaro.quantidadedechip) || 0,
              os_ctb: tbClaro.os_ctb || "N/A",
              uf: tbClaro.uf || uf,
              uid: tbClaro.uid || 0,
              data_importacao: tbClaro.data_importacao || "N/A",
              checklist_items: checklistDados.map((checklist: any) => ({
                pergunta: checklist.pergunta || "Pergunta não informada",
                valor_numero: parseInt(checklist.valor_numero) || 0,
                nros: checklist.nros || "N/A",
                data_criacao: checklist.data_criacao || "N/A",
                nome_tecnico: checklist.nome_tecnico || "N/A",
                uid: checklist.uid || 0,
              })),
            }
          } catch (itemError) {
            console.error(`❌ [API] Erro ao processar item ${index}:`, itemError)
            return null
          }
        })
        .filter(Boolean) // Remove itens nulos

      const totalDuration = (Date.now() - startTime) / 1000
      console.log(`🎉 [API] SUCESSO! ${processedData.length} registros processados em ${totalDuration.toFixed(2)}s`)

      // Estatísticas detalhadas
      const stats = {
        total: processedData.length,
        comChecklist: processedData.filter((item) => item && item.checklist_items && item.checklist_items.length > 0).length,
        semChecklist: processedData.filter((item) => item && item.checklist_items && item.checklist_items.length === 0).length,
        statusDistribution: processedData.reduce((acc: any, item: any) => {
          if (item && item.status) {
            const status = item.status || "sem_status"
            acc[status] = (acc[status] || 0) + 1
          }
          return acc
        }, {}),
        statusColetaDistribution: processedData.reduce((acc: any, item: any) => {
          if (item && item.status_coleta) {
            const statusColeta = item.status_coleta || "sem_status_coleta"
            acc[statusColeta] = (acc[statusColeta] || 0) + 1
          }
          return acc
        }, {}),
      }

      console.log(`📊 [API] Estatísticas:`, stats)

      return NextResponse.json(processedData, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Total-Records": processedData.length.toString(),
          "X-Processing-Time": totalDuration.toFixed(2),
          "X-Data-Source": "REAL_API",
          "X-Attempt": attempt.toString(),
        },
      })
    } catch (error) {
      const attemptDuration = (Date.now() - startTime) / 1000
      const errorMessage = error instanceof Error ? error.message : String(error)

      console.error(`❌ [API] Erro na tentativa ${attempt}/${maxRetries}:`, errorMessage)
      console.log(`⏱️ [API] Duração da tentativa: ${attemptDuration.toFixed(2)}s`)

      // Se não é a última tentativa, aguardar antes de tentar novamente
      if (attempt < maxRetries) {
        const delay = retryDelays[attempt - 1]
        console.log(`⏳ [API] Aguardando ${delay / 1000}s antes da próxima tentativa...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      } else {
        // Última tentativa falhou - retornar erro
        const totalDuration = (Date.now() - startTime) / 1000
        console.error(`💥 [API] FALHA TOTAL após ${maxRetries} tentativas em ${totalDuration.toFixed(2)}s`)

        return NextResponse.json(
          {
            error: `Falha após ${maxRetries} tentativas com timeout de 120s cada. Último erro: ${errorMessage}`,
            details: {
              attempts: maxRetries,
              timeoutPerAttempt: "120 segundos",
              totalDuration: `${totalDuration.toFixed(2)}s`,
              lastError: errorMessage,
              url: fullUrl,
            },
          },
          {
            status: 500,
            headers: {
              "X-Error": "API_UNAVAILABLE",
              "X-Attempts": maxRetries.toString(),
              "X-Total-Duration": totalDuration.toFixed(2),
            },
          },
        )
      }
    }
  }

  // Este ponto nunca deve ser alcançado, mas por segurança
  return NextResponse.json({ error: "Erro inesperado no sistema de retry" }, { status: 500 })
}
