"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DetalhesChecklistModal } from "@/components/detalhes-checklist-modal"
import { PieChart } from "@/components/ui/pie-chart"
import {
  Users,
  TrendingUp,
  RefreshCw,
  Bug,
  Wifi,
  WifiOff,
  PieChartIcon,
  Timer,
  AlertTriangle,
  Car,
  Truck,
  TestTube,
  X,
} from "lucide-react"
import { TimelineView } from "@/components/timeline-view"
import { ViewToggle } from "@/components/view-toggle"

interface ChecklistItem {
  pergunta: string
  valor_numero: number
}

interface Associado {
  id: string
  login: string
  tecnico: string
  contrato: string
  horario_inicio: string
  status: string
  status_coleta: string // NOVO: Status da Coleta (campo Ocorrencia)
  coletados: string
  quantidade_chips: number
  os_ctb: string
  uf: string
  uid: number
  data_importacao: string
  checklist_items: ChecklistItem[]
}

interface ApiResponse {
  data: Associado[]
  total: number
  page: number
  limit: number
  error?: string
  fallback?: boolean
}

interface StatusCount {
  status: string
  count: number
  percentage: number
  temporalStatus: "finalizado" | "atrasado" | "pendente"
}

export default function ChecklistAssociados() {
  // Estados otimizados
  const [associados, setAssociados] = useState<Associado[]>([])
  const [loading, setLoading] = useState(false)
  const [uf, setUf] = useState("SP")
  const [limite, setLimite] = useState("1000")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [selectedAssociado, setSelectedAssociado] = useState<Associado | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [apiError, setApiError] = useState<string | null>(null)
  const [debugMode, setDebugMode] = useState(false)
  // MUDANÇA: Timeline como padrão em vez de table
  const [currentView, setCurrentView] = useState<"table" | "timeline" | "chart">("timeline")
  const [usingRealData, setUsingRealData] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("Carregando dados...")
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  // NOVO: Estado para controlar fallback de teste
  const [usingFallbackData, setUsingFallbackData] = useState(false)

  // NOVO: Ref para controlar AbortController da API
  const abortControllerRef = useRef<AbortController | null>(null)

  const itemsPerPage = 10

  // Otimização: Atualizar hora apenas quando necessário
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 300000) // 5 minutos em vez de 1 minuto

    return () => clearInterval(interval)
  }, [])

  // NOVO: Função para gerar dados de fallback COM MÚLTIPLOS CARDS POR PESSOA
  const generateFallbackData = useCallback((): Associado[] => {
    const statusOptions = ["Concluído", "Pendente", "Em Rota", "Atrasado", "Cancelado", "Finalizado"]
    const statusColetaOptions = [
      "Instalação Fibra Óptica",
      "Manutenção Preventiva",
      "Reparo de Equipamento",
      "Troca de Modem",
      "Configuração de Rede",
      "Visita Técnica",
      "Instalação Completa",
      "N/A",
    ]
    const tecnicos = [
      "João Silva Santos",
      "Maria Oliveira Costa",
      "Pedro Almeida Lima",
      "Ana Carolina Souza",
      "Carlos Eduardo Pereira",
    ]

    const data: Associado[] = []

    console.log("🚀 [FALLBACK MÚLTIPLOS] Criando dados com MÚLTIPLOS CARDS POR PESSOA...")

    // ESTRATÉGIA: Criar algumas pessoas com MÚLTIPLOS ATENDIMENTOS
    const pessoasComMultiplosCards = [
      {
        login: "joao_silva_multiplo",
        tecnico: "João Silva Santos",
        horarios: [
          { horario: "08:00", quantidade: 4 }, // 4 atendimentos às 08:00
          { horario: "14:00", quantidade: 3 }, // 3 atendimentos às 14:00
          { horario: "16:00", quantidade: 2 }, // 2 atendimentos às 16:00
        ],
      },
      {
        login: "maria_costa_multiplo",
        tecnico: "Maria Oliveira Costa",
        horarios: [
          { horario: "09:00", quantidade: 5 }, // 5 atendimentos às 09:00
          { horario: "15:00", quantidade: 3 }, // 3 atendimentos às 15:00
        ],
      },
      {
        login: "pedro_lima_multiplo",
        tecnico: "Pedro Almeida Lima",
        horarios: [
          { horario: "10:00", quantidade: 6 }, // 6 atendimentos às 10:00
          { horario: "13:00", quantidade: 2 }, // 2 atendimentos às 13:00
          { horario: "17:00", quantidade: 4 }, // 4 atendimentos às 17:00
        ],
      },
      {
        login: "ana_souza_multiplo",
        tecnico: "Ana Carolina Souza",
        horarios: [
          { horario: "11:00", quantidade: 7 }, // 7 atendimentos às 11:00 (MÁXIMO!)
          { horario: "18:00", quantidade: 2 }, // 2 atendimentos às 18:00
        ],
      },
      {
        login: "carlos_pereira_multiplo",
        tecnico: "Carlos Eduardo Pereira",
        horarios: [
          { horario: "12:00", quantidade: 3 }, // 3 atendimentos às 12:00
          { horario: "19:00", quantidade: 5 }, // 5 atendimentos às 19:00
        ],
      },
    ]

    let associadoId = 1

    // GERAR DADOS COM MÚLTIPLOS CARDS POR PESSOA
    pessoasComMultiplosCards.forEach((pessoa) => {
      console.log(`👤 [PESSOA] ${pessoa.login} - ${pessoa.tecnico}`)

      pessoa.horarios.forEach(({ horario, quantidade }) => {
        console.log(`   ⏰ ${horario}: ${quantidade} atendimentos`)

        for (let i = 0; i < quantidade; i++) {
          const status = statusOptions[Math.floor(Math.random() * statusOptions.length)]
          const statusColeta = statusColetaOptions[Math.floor(Math.random() * statusColetaOptions.length)]

          // Gerar checklist items
          const numChecklistItems = Math.floor(Math.random() * 5) + 2
          const checklistItems: ChecklistItem[] = []

          const perguntasBase = [
            "Equipamento instalado corretamente?",
            "Cliente orientado sobre uso do equipamento?",
            "Teste de velocidade realizado?",
            "Documentação entregue ao cliente?",
            "Local de instalação adequado?",
          ]

          for (let j = 0; j < numChecklistItems; j++) {
            checklistItems.push({
              pergunta: perguntasBase[j] || `Pergunta ${j + 1}`,
              valor_numero: Math.random() > 0.3 ? 1 : 0,
            })
          }

          data.push({
            id: `MULTI_${associadoId.toString().padStart(4, "0")}`,
            login: pessoa.login, // MESMO LOGIN = MESMA PESSOA
            tecnico: pessoa.tecnico, // MESMO TÉCNICO
            contrato: `MULTI${(Math.floor(Math.random() * 900000) + 100000).toString()}`,
            horario_inicio: horario,
            status: status,
            status_coleta: statusColeta,
            coletados: Math.floor(Math.random() * 10).toString(),
            quantidade_chips: Math.floor(Math.random() * 5) + 1,
            os_ctb: `MULTI${(Math.floor(Math.random() * 900000) + 100000).toString()}`,
            uf: "SP",
            uid: Math.floor(Math.random() * 90000) + 10000,
            data_importacao: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleString("pt-BR"),
            checklist_items: checklistItems,
          })

          associadoId++
        }
      })
    })

    // ADICIONAR ALGUNS DADOS NORMAIS PARA CONTRASTE
    console.log("➕ [CONTRASTE] Adicionando 10 registros normais...")
    for (let i = 0; i < 10; i++) {
      const horariosNormais = ["07:00", "20:00", "21:00", "22:00"]
      const horario = horariosNormais[Math.floor(Math.random() * horariosNormais.length)]
      const status = statusOptions[Math.floor(Math.random() * statusOptions.length)]
      const statusColeta = statusColetaOptions[Math.floor(Math.random() * statusColetaOptions.length)]
      const tecnico = tecnicos[Math.floor(Math.random() * tecnicos.length)]

      const checklistItems: ChecklistItem[] = []
      const numChecklistItems = Math.floor(Math.random() * 3) + 1

      const perguntasBase = [
        "Equipamento instalado corretamente?",
        "Cliente orientado sobre uso do equipamento?",
        "Teste de velocidade realizado?",
      ]

      for (let j = 0; j < numChecklistItems; j++) {
        checklistItems.push({
          pergunta: perguntasBase[j] || `Pergunta ${j + 1}`,
          valor_numero: Math.random() > 0.3 ? 1 : 0,
        })
      }

      data.push({
        id: `NORMAL_${associadoId.toString().padStart(4, "0")}`,
        login: `normal_user_${i.toString().padStart(2, "0")}`,
        tecnico: tecnico,
        contrato: `NORM${(Math.floor(Math.random() * 900000) + 100000).toString()}`,
        horario_inicio: horario,
        status: status,
        status_coleta: statusColeta,
        coletados: Math.floor(Math.random() * 10).toString(),
        quantidade_chips: Math.floor(Math.random() * 5) + 1,
        os_ctb: `NORM${(Math.floor(Math.random() * 900000) + 100000).toString()}`,
        uf: "SP",
        uid: Math.floor(Math.random() * 90000) + 10000,
        data_importacao: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleString("pt-BR"),
        checklist_items: checklistItems,
      })

      associadoId++
    }

    // ANÁLISE DETALHADA
    const loginCount = data.reduce((acc: Record<string, any>, item) => {
      if (!acc[item.login]) {
        acc[item.login] = { total: 0, horarios: {} }
      }
      acc[item.login].total++

      if (!acc[item.login].horarios[item.horario_inicio]) {
        acc[item.login].horarios[item.horario_inicio] = 0
      }
      acc[item.login].horarios[item.horario_inicio]++

      return acc
    }, {})

    console.log("🎉 [ANÁLISE MÚLTIPLOS] DADOS COM MÚLTIPLOS CARDS CRIADOS:")
    console.log(`📊 Total de registros: ${data.length}`)
    console.log("👥 PESSOAS COM MÚLTIPLOS ATENDIMENTOS:")

    Object.entries(loginCount).forEach(([login, info]: [string, any]) => {
      if (info.total > 1) {
        console.log(`   👤 ${login}: ${info.total} atendimentos total`)
        Object.entries(info.horarios).forEach(([horario, count]) => {
          const countNum = count as number
          if (countNum > 1) {
            console.log(`      ⏰ ${horario}: ${countNum} cards (${countNum - 1} sobrepostos) ⭐ EXPANSÃO!`)
          } else {
            console.log(`      ⏰ ${horario}: ${countNum} card`)
          }
        })
      }
    })

    console.log("📋 [INSTRUÇÕES MÚLTIPLOS] COMO ENCONTRAR:")
    console.log("   1. 🔍 Procure por: joao_silva_multiplo, maria_costa_multiplo, pedro_lima_multiplo")
    console.log("   2. 🟠 Botões laranjas aparecerão quando houver múltiplos cards no mesmo horário")
    console.log("   3. 🖱️ Clique no botão laranja para expandir os cards da mesma pessoa")
    console.log("   4. 🔢 Números nos botões mostram quantos cards estão sobrepostos")

    return data
  }, [])

  // NOVO: Função para ativar dados de fallback - SEMPRE DISPONÍVEL
  const activateFallbackData = useCallback(() => {
    console.log("🧪 [FALLBACK MÚLTIPLOS] Ativando dados com múltiplos cards por pessoa...")

    // CANCELAR qualquer requisição da API em andamento
    if (abortControllerRef.current) {
      console.log("🛑 [FALLBACK] Cancelando requisição da API em andamento...")
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    // CRÍTICO: Definir todos os estados de uma vez para evitar race conditions
    console.log("🔄 [FALLBACK] Definindo estados...")

    // Resetar tudo primeiro
    setLoading(false)
    setApiError(null)
    setUsingRealData(false)
    setHasAttemptedLoad(true)
    setUsingFallbackData(true)

    // Gerar dados imediatamente
    console.log("📊 [FALLBACK] Gerando dados com múltiplos cards por pessoa...")
    const fallbackData = generateFallbackData()

    console.log(`✅ [FALLBACK] ${fallbackData.length} registros gerados`)

    // Definir dados
    setAssociados(fallbackData)
    setTotalRecords(fallbackData.length)

    // Estatísticas
    const statusStats = fallbackData.reduce((acc: any, item: any) => {
      acc[item.status] = (acc[item.status] || 0) + 1
      return acc
    }, {})

    console.log("📊 [FALLBACK] Distribuição de Status:", statusStats)
    console.log(`🎉 [FALLBACK] SUCESSO! ${fallbackData.length} dados carregados COM MÚLTIPLOS CARDS POR PESSOA`)
  }, [generateFallbackData])

  // Função otimizada para determinar status temporal
  const getTemporalStatus = useCallback(
    (horarioInicio: string, statusAtual: string): "finalizado" | "atrasado" | "pendente" => {
      if (
        statusAtual.toLowerCase().includes("finalizado") ||
        statusAtual.toLowerCase().includes("completo") ||
        statusAtual.toLowerCase().includes("concluido")
      ) {
        return "finalizado"
      }

      if (!horarioInicio || horarioInicio === "N/A") {
        return "pendente"
      }

      try {
        const hoje = new Date()
        const [hora, minuto] = horarioInicio.split(":").map(Number)

        const horarioAgendado = new Date(hoje)
        horarioAgendado.setHours(hora, minuto, 0, 0)

        if (currentTime > horarioAgendado) {
          return "atrasado"
        }

        return "pendente"
      } catch (error) {
        return "pendente"
      }
    },
    [currentTime],
  )

  // Fetch otimizado com timeout de 120s e AbortController
  const fetchData = useCallback(async () => {
    // IMPORTANTE: Não executar se fallback está ativo
    if (usingFallbackData) {
      console.log("⚠️ [API] Fallback ativo - não executando fetchData")
      return
    }

    // CANCELAR qualquer requisição anterior
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Criar novo AbortController
    const controller = new AbortController()
    abortControllerRef.current = controller

    setLoading(true)
    setApiError(null)
    setUsingRealData(false)
    setUsingFallbackData(false) // GARANTIR que fallback está desativado
    setHasAttemptedLoad(true)
    setLoadingMessage("Conectando com a API...")

    setAssociados([])
    setTotalRecords(0)

    try {
      const progressMessages = [
        "Conectando com a API...",
        "Aguardando resposta (até 120s por tentativa)...",
        "Tentativa 1 de 7...",
        "Processando dados...",
        "Quase pronto...",
      ]

      let messageIndex = 0
      const progressInterval = setInterval(() => {
        if (messageIndex < progressMessages.length - 1) {
          messageIndex++
          setLoadingMessage(progressMessages[messageIndex])
        }
      }, 3000) // 3 segundos entre mensagens

      console.log("🚀 [FRONTEND] Iniciando fetch com timeout de 120s")
      const response = await fetch(`/api/checklist-associados?uf=${uf}&limit=${limite}`, {
        signal: controller.signal, // NOVO: Adicionar signal para cancelamento
      })

      clearInterval(progressInterval)

      // Verificar se foi cancelado
      if (controller.signal.aborted) {
        console.log("🛑 [FRONTEND] Requisição cancelada pelo usuário")
        return
      }

      console.log(`📡 [FRONTEND] Resposta recebida - Status: ${response.status}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log(`📊 [FRONTEND] Dados recebidos:`, {
        total: Array.isArray(data) ? data.length : 0,
        type: typeof data,
      })

      // Verificar se recebeu dados reais
      if (Array.isArray(data) && data.length > 0) {
        console.log("✅ [FRONTEND] Dados reais da API recebidos")
        setUsingRealData(true)
        setUsingFallbackData(false) // GARANTIR que fallback está desativado
        setAssociados(data)
        setTotalRecords(data.length)

        // Log do Status da Coleta
        const statusColetaStats = data.reduce((acc: any, item: any) => {
          const statusColeta = item.status_coleta || "N/A"
          acc[statusColeta] = (acc[statusColeta] || 0) + 1
          return acc
        }, {})

        console.log("🎯 [FRONTEND] Distribuição do Status da Coleta:", statusColetaStats)
      } else {
        throw new Error("Nenhum dado retornado da API")
      }
    } catch (error) {
      // Verificar se foi cancelado
      if (error instanceof Error && error.name === "AbortError") {
        console.log("🛑 [FRONTEND] Requisição cancelada")
        return
      }

      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error("❌ [FRONTEND] Erro ao buscar dados:", errorMessage)

      setApiError(`Erro na API: ${errorMessage}`)
      setUsingRealData(false)
      setUsingFallbackData(false) // GARANTIR que fallback está desativado
      setAssociados([])
      setTotalRecords(0)

      if (errorMessage.includes("120s")) {
        setApiError(
          'Timeout: A API demorou mais de 120 segundos para responder. Clique em "Atualizar" para tentar novamente.',
        )
      } else if (errorMessage.includes("tentativas")) {
        setApiError(
          'Múltiplas tentativas falharam. A API pode estar indisponível. Clique em "Atualizar" para tentar novamente.',
        )
      }
    } finally {
      setLoading(false)
      setLoadingMessage("Carregando dados...")
      abortControllerRef.current = null
    }
  }, [uf, limite, usingFallbackData])

  // NOVO: Função para cancelar operação em andamento
  const cancelCurrentOperation = useCallback(() => {
    console.log("🛑 [CANCEL] Cancelando operação em andamento...")

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    setLoading(false)
    setLoadingMessage("Operação cancelada")

    // Se não há dados, mostrar estado inicial
    if (!usingRealData && !usingFallbackData) {
      setApiError("Operação cancelada pelo usuário")
    }
  }, [usingRealData, usingFallbackData])

  useEffect(() => {
    // Só executar fetchData se fallback não estiver ativo
    if (!usingFallbackData) {
      fetchData()
    }
  }, [fetchData, usingFallbackData])

  // Cleanup do AbortController
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Estatísticas otimizadas com memoização
  const statusStatistics = useMemo(() => {
    if ((!usingRealData && !usingFallbackData) || !associados.length) return []

    const statusCounts = associados.reduce(
      (acc, associado) => {
        const status = associado.status || "sem_status"
        const temporalStatus = getTemporalStatus(associado.horario_inicio, associado.status)

        if (!acc[status]) {
          acc[status] = {
            count: 0,
            temporalStatus,
            finalizado: 0,
            atrasado: 0,
            pendente: 0,
          }
        }

        acc[status].count++
        acc[status][temporalStatus]++

        return acc
      },
      {} as Record<string, any>,
    )

    const total = associados.length

    const statusArray: StatusCount[] = Object.entries(statusCounts).map(([status, data]) => ({
      status,
      count: data.count,
      percentage: (data.count / total) * 100,
      temporalStatus:
        data.finalizado > data.atrasado && data.finalizado > data.pendente
          ? "finalizado"
          : data.atrasado > data.pendente
            ? "atrasado"
            : "pendente",
    }))

    return statusArray.sort((a, b) => b.count - a.count)
  }, [associados, usingRealData, usingFallbackData, getTemporalStatus])

  // NOVO: Estatísticas do Status da Coleta
  const statusColetaStatistics = useMemo(() => {
    if ((!usingRealData && !usingFallbackData) || !associados.length) return []

    const statusColetaCounts = associados.reduce(
      (acc, associado) => {
        const statusColeta = associado.status_coleta || "sem_status_coleta"
        acc[statusColeta] = (acc[statusColeta] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const total = associados.length

    return Object.entries(statusColetaCounts)
      .map(([statusColeta, count]) => ({
        statusColeta,
        count,
        percentage: (count / total) * 100,
      }))
      .sort((a, b) => b.count - a.count)
  }, [associados, usingRealData, usingFallbackData])

  // Dados do gráfico otimizados
  const pieChartData = useMemo(() => {
    if ((!usingRealData && !usingFallbackData) || !statusStatistics.length) return []

    const getTemporalColor = (temporalStatus: string) => {
      switch (temporalStatus) {
        case "finalizado":
          return "#3B82F6"
        case "atrasado":
          return "#EF4444"
        case "pendente":
          return "#F59E0B"
        default:
          return "#8B5CF6"
      }
    }

    return statusStatistics.map((stat) => ({
      status: stat.status,
      count: stat.count,
      percentage: stat.percentage,
      color: getTemporalColor(stat.temporalStatus),
      temporalStatus: stat.temporalStatus,
    }))
  }, [statusStatistics, usingRealData, usingFallbackData])

  // Funções de ícone e cor otimizadas
  const getTemporalIcon = useCallback((temporalStatus: string) => {
    switch (temporalStatus) {
      case "finalizado":
        return Car
      case "atrasado":
        return Truck
      case "pendente":
        return Car
      default:
        return Users
    }
  }, [])

  const getTemporalColor = useCallback((temporalStatus: string) => {
    switch (temporalStatus) {
      case "finalizado":
        return "bg-blue-100 text-blue-600 border-blue-200"
      case "atrasado":
        return "bg-red-100 text-red-600 border-red-200"
      case "pendente":
        return "bg-yellow-100 text-yellow-600 border-yellow-200"
      default:
        return "bg-purple-100 text-purple-600 border-purple-200"
    }
  }, [])

  const formatTemporalStatusName = useCallback((temporalStatus: string) => {
    const statusMap: Record<string, string> = {
      finalizado: "Finalizados",
      atrasado: "Atrasados",
      pendente: "Pendentes",
    }
    return statusMap[temporalStatus] || temporalStatus.charAt(0).toUpperCase() + temporalStatus.slice(1)
  }, [])

  // Filtros otimizados
  const filteredAssociados = useMemo(() => {
    if (!usingRealData && !usingFallbackData) return []

    return associados.filter((associado) => {
      const matchesSearch =
        searchTerm === "" ||
        Object.values(associado).some(
          (value) => value && value.toString().toLowerCase().includes(searchTerm.toLowerCase()),
        )

      const matchesStatus = statusFilter === "todos" || associado.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [associados, searchTerm, statusFilter, usingRealData, usingFallbackData])

  const paginatedAssociados = useMemo(() => {
    if (!usingRealData && !usingFallbackData) return []

    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAssociados.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAssociados, currentPage, usingRealData, usingFallbackData])

  const totalPages = Math.ceil(filteredAssociados.length / itemsPerPage)

  // Handlers otimizados
  const handleRowClick = useCallback(
    (associado: Associado) => {
      if (!usingRealData && !usingFallbackData) return
      setSelectedAssociado(associado)
      setModalOpen(true)
    },
    [usingRealData, usingFallbackData],
  )

  const handleCardClick = useCallback(
    (status: string) => {
      if (!usingRealData && !usingFallbackData) return

      if (status === "total") {
        setStatusFilter("todos")
      } else {
        setStatusFilter(status)
      }
      setCurrentPage(1)
      setSearchTerm("")
    },
    [usingRealData, usingFallbackData],
  )

  const handlePieChartClick = useCallback(
    (status: string) => {
      handleCardClick(status)
    },
    [handleCardClick],
  )

  const exportData = useCallback(() => {
    if ((!usingRealData && !usingFallbackData) || !associados.length) {
      alert("Não é possível exportar: nenhum dado disponível.")
      return
    }

    const csvContent = [
      [
        "ID",
        "Login",
        "Técnico",
        "Contrato",
        "Horário de Início",
        "Status",
        "Status da Coleta", // NOVO: Campo Status da Coleta
        "Status Temporal",
        "Coletados",
        "Quantidade de Chips",
        "OS CTB",
        "UF",
        "Data de Importação",
        "Fonte",
      ].join(","),
      ...filteredAssociados.map((associado) =>
        [
          associado.id,
          associado.login,
          associado.tecnico,
          associado.contrato,
          associado.horario_inicio,
          associado.status,
          associado.status_coleta, // NOVO: Incluir Status da Coleta na exportação
          getTemporalStatus(associado.horario_inicio, associado.status),
          associado.coletados,
          associado.quantidade_chips,
          associado.os_ctb,
          associado.uf,
          associado.data_importacao,
          usingRealData ? "API_REAL" : "FALLBACK_TESTE",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `acompanhamento-visitas-${usingRealData ? "REAL" : "TESTE"}-${uf}-${new Date().toISOString().split("T")[0]}.csv`,
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [usingRealData, usingFallbackData, associados.length, filteredAssociados, getTemporalStatus, uf])

  const totalRegistros = usingRealData || usingFallbackData ? associados.length : 0

  // Componente de erro otimizado
  const ErrorState = useCallback(
    () => (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Dados Indisponíveis</h3>
          <p className="text-red-700 mb-4">{apiError || "Não foi possível carregar os dados da API."}</p>
          <p className="text-sm text-red-600 mb-6">
            Este sistema exibe apenas dados reais da API com timeout de 120 segundos. Para testes, use o botão
            "Fallback".
          </p>
          <div className="flex justify-center space-x-4">
            <Button onClick={fetchData} className="bg-red-600 hover:bg-red-700 text-white" disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Tentando Conectar..." : "Tentar Novamente"}
            </Button>
            <Button
              onClick={activateFallbackData}
              className="bg-orange-600 hover:bg-orange-700 text-white"
              disabled={loading && !abortControllerRef.current} // MUDANÇA: Só desabilitar se não puder cancelar
            >
              <TestTube className="w-4 h-4 mr-2" />
              Usar Dados de Teste
            </Button>
          </div>
        </CardContent>
      </Card>
    ),
    [apiError, fetchData, loading, activateFallbackData],
  )

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      <div className="w-full space-y-4">
        {/* Header otimizado */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Acompanhamento de Visitas</h1>
              <p className="text-sm text-gray-600">
                Painel de acompanhamento das visitas técnicas - {uf} • Hora atual:{" "}
                {currentTime.toLocaleTimeString("pt-BR")}
                {usingRealData && <span className="text-green-600 font-medium"> • DADOS REAIS DA API</span>}
                {usingFallbackData && <span className="text-orange-600 font-medium"> • DADOS COM MÚLTIPLOS CARDS</span>}
                {!usingRealData && !usingFallbackData && hasAttemptedLoad && (
                  <span className="text-red-600 font-medium"> • API INDISPONÍVEL</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {(usingRealData || usingFallbackData) && (
              <ViewToggle currentView={currentView} onViewChange={setCurrentView} />
            )}
            <Button disabled variant="outline" size="sm" className="text-gray-400 cursor-not-allowed" title="Debug desabilitado">
              <Bug className="w-4 h-4 mr-2" />
              Debug
            </Button>
            {/* NOVO: Botão Fallback - SEMPRE DISPONÍVEL */}
            <Button
              onClick={activateFallbackData}
              variant="outline"
              size="sm"
              className="text-orange-600 border-orange-600 hover:bg-orange-50 bg-transparent"
              title="Criar dados com múltiplos cards por pessoa para testar expansão"
            >
              <TestTube className="w-4 h-4 mr-2" />
              Dados de Teste
            </Button>
            {/* NOVO: Botão para limpar fallback */}
            {usingFallbackData && (
              <Button
                onClick={() => {
                  console.log("🔄 [CLEAR] Limpando fallback...")
                  setUsingFallbackData(false)
                  setAssociados([])
                  setTotalRecords(0)
                  setApiError(null)
                }}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-600 hover:bg-red-50 bg-transparent"
                title="Limpar dados de teste"
              >
                <X className="w-4 h-4 mr-2" />
                Limpar Fallback
              </Button>
            )}
            {/* NOVO: Botão Cancelar - Só aparece durante loading */}
            {loading && (
              <Button
                onClick={cancelCurrentOperation}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-600 hover:bg-red-50 bg-transparent"
                title="Cancelar operação em andamento"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            )}
            <Button onClick={fetchData} disabled={loading} className="bg-orange-500 hover:bg-orange-600">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Carregando..." : "Atualizar"}
            </Button>
          </div>
        </div>

        {/* Controles da API */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-sm flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Parâmetros da Consulta API</span>
              {usingFallbackData && <Badge className="bg-orange-100 text-orange-800">MÚLTIPLOS CARDS</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado (UF)</label>
                <Select value={uf} onValueChange={setUf} disabled={usingFallbackData}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SP">São Paulo (SP)</SelectItem>
                    <SelectItem value="RJ">Rio de Janeiro (RJ)</SelectItem>
                    <SelectItem value="MG">Minas Gerais (MG)</SelectItem>
                    <SelectItem value="RS">Rio Grande do Sul (RS)</SelectItem>
                    <SelectItem value="PR">Paraná (PR)</SelectItem>
                    <SelectItem value="SC">Santa Catarina (SC)</SelectItem>
                    <SelectItem value="BA">Bahia (BA)</SelectItem>
                    <SelectItem value="GO">Goiás (GO)</SelectItem>
                    <SelectItem value="PE">Pernambuco (PE)</SelectItem>
                    <SelectItem value="CE">Ceará (CE)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Limite de Registros</label>
                <Select value={limite} onValueChange={setLimite} disabled={usingFallbackData}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o limite" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">100 registros</SelectItem>
                    <SelectItem value="300">300 registros</SelectItem>
                    <SelectItem value="500">500 registros</SelectItem>
                    <SelectItem value="1000">1000 registros (padrão)</SelectItem>
                    <SelectItem value="2000">2000 registros</SelectItem>
                    <SelectItem value="5000">5000 registros</SelectItem>
                    <SelectItem value="10000">10000 registros (máximo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="text-xs text-blue-600">
              <strong>URL da API:</strong>{" "}
              {usingFallbackData ? (
                <span className="text-orange-600">
                  DADOS MÚLTIPLOS: ana_souza_multiplo (7 cards às 11:00), pedro_lima_multiplo (6 cards às 10:00) -
                  EXPANSÃO GARANTIDA!
                </span>
              ) : (
                `https://www.centralretencao.com.br/GRelator/api/v1/relatorios/checklist-associado?uf=${uf}&limit=${limite}`
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status da API */}
        {!usingFallbackData && (
          <Card
            className={
              usingRealData
                ? "bg-green-50 border-green-200"
                : loading
                  ? "bg-blue-50 border-blue-200"
                  : "bg-red-50 border-red-200"
            }
          >
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {loading ? (
                <>
                  <Timer className="w-5 h-5 text-blue-600 animate-pulse" />
                  <span className="text-blue-800 font-medium">CARREGANDO - Aguarde até 120 segundos por tentativa</span>
                  <span className="text-blue-600 text-sm">
                    {loadingMessage} • Retry automático ativo • Use "Cancelar" ou "Fallback" para interromper
                  </span>
                </>
              ) : usingRealData ? (
                <>
                  <Wifi className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-medium">CONECTADO - Dados Reais da API</span>
                  <span className="text-green-600 text-sm">
                    {totalRegistros} registros reais carregados via HTTPS • Limite: {limite} • Timeout: 120s • Status da
                    Coleta incluído •<span className="font-bold text-green-700">TIMELINE PADRÃO</span>
                  </span>
                </>
              ) : usingFallbackData ? null : (
                <>
                  <WifiOff className="w-5 h-5 text-red-600" />
                  <span className="text-red-800 font-medium">DESCONECTADO - API Indisponível</span>
                  <span className="text-red-600 text-sm">
                    {apiError || "Erro na conexão com a API"} • Timeout: 120s • Use "Dados de Teste" para testar
                    expansão
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        )}

        {/* Debug Info otimizado */}
        {debugMode && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-sm flex items-center space-x-2">
                <Bug className="w-4 h-4" />
                <span>Informações de Debug - Status dos Dados</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <div>
                <strong>Fonte dos dados:</strong>{" "}
                {usingRealData ? "🟢 API REAL" : usingFallbackData ? "🟠 DADOS COM MÚLTIPLOS CARDS" : "🔴 NENHUM DADO"}
              </div>
              <div>
                <strong>Total de registros:</strong> {totalRegistros}
              </div>
              <div>
                <strong>Registros filtrados:</strong> {filteredAssociados.length}
              </div>
              <div>
                <strong>Página atual:</strong> {currentPage} de {totalPages}
              </div>
              <div>
                <strong>View padrão:</strong>{" "}
                <span className="text-green-600 font-bold">TIMELINE (Ultra Performance)</span>
              </div>
              <div>
                <strong>Timeout por tentativa:</strong> <span className="text-blue-600 font-bold">120 segundos</span>
              </div>
              <div>
                <strong>Status da Coleta:</strong> {statusColetaStatistics.length} valores únicos
              </div>
              <div>
                <strong>Fallback ativo:</strong> {usingFallbackData ? "✅ SIM (MÚLTIPLOS CARDS)" : "❌ NÃO"}
              </div>
              <div>
                <strong>AbortController:</strong> {abortControllerRef.current ? "🟢 ATIVO" : "🔴 INATIVO"}
              </div>
              {apiError && (
                <div>
                  <strong>Erro da API:</strong> <span className="text-red-600">{apiError}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Conteúdo principal */}
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {usingFallbackData ? "Gerando Dados com Múltiplos Cards" : "Carregando Dados Reais"}
              </h3>
              <p className="text-gray-600 mb-2">{loadingMessage}</p>
              <p className="text-sm text-green-600 font-medium">
                {usingFallbackData
                  ? "Dados com múltiplos cards por pessoa serão carregados"
                  : "Timeline será carregada automaticamente"}
              </p>
              <div className="mt-4 space-x-2">
                <Button
                  onClick={cancelCurrentOperation}
                  variant="outline"
                  size="sm"
                  className="text-red-600 bg-transparent"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                {!usingFallbackData && (
                  <Button
                    onClick={activateFallbackData}
                    variant="outline"
                    size="sm"
                    className="text-orange-600 bg-transparent"
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    Usar Dados de Teste
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : !usingRealData && !usingFallbackData && hasAttemptedLoad ? (
          <ErrorState />
        ) : (usingRealData || usingFallbackData) && associados.length > 0 ? (
          <>
            {/* Todo o conteúdo principal aqui */}
            {/* Gráfico de Pizza otimizado */}
            {pieChartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChartIcon className="w-5 h-5 text-blue-600" />
                    <span>Distribuição por Status Temporal</span>
                    <Badge className={usingRealData ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>
                      {usingRealData ? "DADOS REAIS" : "MÚLTIPLOS CARDS"}
                    </Badge>
                    {statusFilter !== "todos" && (
                      <Badge className="bg-orange-100 text-orange-800">Filtrado: {statusFilter}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <PieChart
                    data={pieChartData}
                    onSliceClick={handlePieChartClick}
                    activeStatus={statusFilter}
                    className="w-full max-w-md"
                  />
                </CardContent>
              </Card>
            )}

            {/* Cards de métricas otimizados */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Card Total */}
              <Card
                className="cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 rounded-2xl"
                onClick={() => handleCardClick("total")}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center shadow-lg">
                      <Car className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{totalRegistros}</p>
                      <p className="text-sm text-gray-600">Total de Veículos</p>
                      <p className="text-xs text-green-600">{usingRealData ? "Dados Reais" : "Múltiplos Cards"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cards dinâmicos otimizados */}
              {statusStatistics.map((stat) => {
                const IconComponent = getTemporalIcon(stat.temporalStatus)
                const isActive = statusFilter === stat.status

                const bgGradient =
                  stat.temporalStatus === "finalizado"
                    ? "from-blue-100 to-blue-200 border-blue-300"
                    : stat.temporalStatus === "atrasado"
                      ? "from-red-100 to-red-200 border-red-300"
                      : "from-yellow-100 to-yellow-200 border-yellow-300"

                return (
                  <Card
                    key={stat.status}
                    className={`cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-br ${bgGradient} border-2 rounded-2xl ${
                      isActive ? "ring-4 ring-orange-400 shadow-xl" : ""
                    }`}
                    onClick={() => handleCardClick(stat.status)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
                            stat.temporalStatus === "finalizado"
                              ? "bg-blue-600"
                              : stat.temporalStatus === "atrasado"
                                ? "bg-red-600"
                                : "bg-yellow-600"
                          }`}
                        >
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{stat.count}</p>
                          <p className="text-sm text-gray-700 font-medium">{stat.status}</p>
                          <p className="text-xs text-gray-600">{stat.percentage.toFixed(1)}% do total</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Views otimizadas - TIMELINE COMO PADRÃO */}
            {currentView === "timeline" && (
              <TimelineView associados={associados} onAssociadoClick={handleRowClick} statusFilter={statusFilter} />
            )}

            {/* Resto das views... */}
          </>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum Dado Disponível</h3>
              <p className="text-gray-600 mb-4">
                Clique em "Atualizar" para buscar dados da API ou "Dados de Teste" para dados com múltiplos cards por
                pessoa.
              </p>
              <div className="flex justify-center space-x-4">
                <Button onClick={fetchData} className="bg-orange-500 hover:bg-orange-600">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar
                </Button>
                <Button onClick={activateFallbackData} className="bg-orange-600 hover:bg-orange-700 text-white">
                  <TestTube className="w-4 h-4 mr-2" />
                  Dados de Teste
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modal otimizado */}
        {(usingRealData || usingFallbackData) && (
          <DetalhesChecklistModal associado={selectedAssociado} open={modalOpen} onOpenChange={setModalOpen} />
        )}
      </div>
    </div>
  )
}
