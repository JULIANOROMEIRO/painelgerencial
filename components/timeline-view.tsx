"use client"

import React from "react"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Car, Truck, Clock, CheckCircle, XCircle, Navigation, ChevronUp } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  status_coleta: string
  coletados: string
  quantidade_chips: number
  os_ctb: string
  uf: string
  uid: number
  data_importacao: string
  checklist_items: ChecklistItem[]
}

interface TimelineActivity {
  inicio: string
  fim: string
  status: string
  tipo: string
  cor: string
  duracao: number
  temporalStatus: "finalizado" | "atrasado" | "pendente"
  contrato: string
  os_ctb: string
  id: string
  associadoCompleto: Associado
}

interface TimelineData {
  associado: Associado
  atividades: TimelineActivity[]
  statusGeral: "ativo" | "inativo" | "alerta" | "concluido"
  totalAtendimentos: number
  todosAssociados: Associado[]
}

interface TimelineViewProps {
  associados: Associado[]
  onAssociadoClick: (associado: Associado) => void
  statusFilter: string
}

interface StatusSummary {
  status: string
  count: number
  color: string
  temporalStatus: string
}

const VirtualizedTimelineRow = React.memo(
  ({
    timeline,
    rowIndex,
    cellWidth,
    horarios,
    currentPosition,
    currentTime,
    onAssociadoClick,
    getStatusIcon,
    getStatusColor,
    getStatusName,
    horarioParaPosicao,
    expandedRows,
    setExpandedRows,
    statusFilterActive,
  }: any) => {
    const isExpanded = expandedRows.has(timeline.associado.login)
    const [hoveredCard, setHoveredCard] = useState<string | null>(null)

    const statusPriority = { atrasado: 3, pendente: 2, finalizado: 1 }
    const mainStatus = useMemo(
      () =>
        timeline.atividades.reduce(
          (prev: TimelineActivity, curr: TimelineActivity) =>
            statusPriority[curr.temporalStatus] > statusPriority[prev.temporalStatus] ? curr : prev,
          timeline.atividades[0],
        ),
      [timeline.atividades],
    )

    const MainIcon = getStatusIcon(mainStatus.status)

    const atividadesPorColuna = useMemo(() => {
      const colunas: Record<string, any[]> = {}

      timeline.atividades.forEach((atividade: any, index: number) => {
        const posicaoColuna = Math.floor(horarioParaPosicao(atividade.inicio))
        const colunaKey = `col_${posicaoColuna}`

        if (!colunas[colunaKey]) colunas[colunaKey] = []
        colunas[colunaKey].push({
          ...atividade,
          originalIndex: index,
          posicaoColuna: posicaoColuna,
          cardId: `${timeline.associado.login}-${index}`,
        })
      })

      return colunas
    }, [timeline.atividades, horarioParaPosicao, timeline.associado.login])

    const { hasOverlaps, maxCardsInSameColumn } = useMemo(() => {
      const maxCards = Math.max(...Object.values(atividadesPorColuna).map((col) => col.length), 1)
      return {
        hasOverlaps: Object.values(atividadesPorColuna).some((col) => col.length > 1),
        maxCardsInSameColumn: maxCards,
      }
    }, [atividadesPorColuna])

    const totalCards = timeline.atividades.length

    const rowHeight = useMemo(() => {
      const cardHeight = 40
      const cardSpacing = 8
      const baseTopMargin = 10

      return isExpanded && hasOverlaps
        ? baseTopMargin + maxCardsInSameColumn * cardHeight + (maxCardsInSameColumn - 1) * cardSpacing + 30
        : 80
    }, [isExpanded, hasOverlaps, maxCardsInSameColumn])

    const toggleExpansion = useCallback(() => {
      if (hasOverlaps) {
        const newExpandedRows = new Set(expandedRows)
        if (isExpanded) {
          newExpandedRows.delete(timeline.associado.login)
        } else {
          newExpandedRows.add(timeline.associado.login)
        }
        setExpandedRows(newExpandedRows)
      }
    }, [hasOverlaps, isExpanded, expandedRows, setExpandedRows, timeline.associado.login])

    const handleCardMouseEnter = useCallback((cardId: string) => {
      setHoveredCard(cardId)
    }, [])

    const handleCardMouseLeave = useCallback(() => {
      setHoveredCard(null)
    }, [])

    const handleCardClick = useCallback(
      (e: React.MouseEvent, associadoCompleto: any) => {
        e.preventDefault()
        e.stopPropagation()
        onAssociadoClick(associadoCompleto)
      },
      [onAssociadoClick],
    )

    return (
      <div
        className={`flex border-b-2 transition-all duration-300 ${
          isExpanded
            ? "bg-blue-50/80 shadow-md border-blue-300 border-l-4 border-l-blue-500"
            : rowIndex % 2 === 0
              ? "bg-white hover:bg-gray-50 border-gray-300"
              : "bg-gray-25 hover:bg-gray-50 border-gray-300"
        }`}
        style={{
          transform: "translateZ(0)",
          willChange: "transform",
          minHeight: `${rowHeight}px`,
          height: `${rowHeight}px`,
        }}
      >
        <div
          className={`w-48 p-3 border-r sticky left-0 z-20 shadow-r transition-all duration-300 ${
            isExpanded ? "bg-blue-50/80 border-r-blue-300 border-r-2" : "bg-white"
          }`}
        >
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full flex-shrink-0 ${
                timeline.statusGeral === "ativo"
                  ? "bg-yellow-500"
                  : timeline.statusGeral === "concluido"
                    ? "bg-blue-500"
                    : timeline.statusGeral === "alerta"
                      ? "bg-red-500"
                      : "bg-gray-400"
              }`}
            />
            <MainIcon
              className={`w-4 h-4 flex-shrink-0 ${
                mainStatus.temporalStatus === "finalizado"
                  ? "text-blue-600"
                  : mainStatus.temporalStatus === "atrasado"
                    ? "text-red-600"
                    : "text-yellow-600"
              }`}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" title={timeline.associado.login}>
                {timeline.associado.login}
              </div>
              <div className="text-xs text-gray-500 truncate" title={timeline.associado.tecnico}>
                {timeline.associado.tecnico}
              </div>
              <div className="text-xs text-blue-600 truncate">
                {totalCards} card{totalCards > 1 ? "s" : ""}
              </div>
              <div className="text-xs text-gray-400 truncate">UF: {timeline.associado.uf}</div>
              <div className="text-xs truncate">
                {hasOverlaps ? (
                  <span className={`font-medium ${isExpanded ? "text-green-600" : "text-orange-600"}`}>
                    {isExpanded ? "EXPANDIDO" : `${maxCardsInSameColumn} sobrepostos`}
                  </span>
                ) : (
                  <span className="text-green-600">Sem sobreposição</span>
                )}
              </div>
            </div>
            {hasOverlaps && (
              <button
                className={`w-7 h-7 ${
                  isExpanded ? "bg-green-500 hover:bg-green-600" : "bg-orange-500 hover:bg-orange-600"
                } text-white rounded-full flex items-center justify-center transition-all shadow-lg ml-2 border-2 border-white`}
                onClick={toggleExpansion}
                title={`${totalCards} cards total, ${maxCardsInSameColumn} max sobrepostos
Estado: ${isExpanded ? "EXPANDIDO - Clique para colapsar" : "COLAPSADO - Clique para expandir em cascata"}`}
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-bold">{maxCardsInSameColumn}</span>
                )}
              </button>
            )}
            {isExpanded && (
              <div className="absolute -left-1 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-r"></div>
            )}
          </div>
        </div>
        <div className={`flex relative ${isExpanded ? "bg-blue-50/80" : ""}`} style={{ height: `${rowHeight}px` }}>
          {horarios.map((horario: string, colIndex: number) => (
            <div
              key={`${timeline.associado.login}-${horario}`}
              className={`border-r border-gray-100 relative ${
                isExpanded
                  ? "bg-blue-50/80"
                  : colIndex % 2 === 0
                    ? "bg-gray-50/30"
                    : "bg-white"
              }`}
              style={{
                width: `${cellWidth}px`,
                transform: "translateZ(0)",
              }}
            >
              <div className="absolute inset-0 border-r border-gray-100" />
              {(horario === "12:00" || horario === "00:00") && (
                <div className="absolute inset-0 bg-yellow-100/20 border-r-2 border-yellow-400" />
              )}
            </div>
          ))}

          {Object.entries(atividadesPorColuna).map(([colunaKey, cardsNaColuna]) => {
            const primeiroCard = cardsNaColuna[0]
            const leftPosition = primeiroCard.posicaoColuna * cellWidth + 5

            return cardsNaColuna.map((atividade: any, stackIndex: number) => {
              if (statusFilterActive && statusFilterActive !== "todos" && atividade.status !== statusFilterActive) {
                return null
              }

              const shouldShow = isExpanded || stackIndex === 0

              if (!shouldShow) {
                return null
              }

              const StatusIcon = getStatusIcon(atividade.status)
              const statusColor = getStatusColor(atividade.status, atividade.inicio)
              const statusName = getStatusName(atividade.status, atividade.inicio)

              const verticalOffset = stackIndex * 48
              const blockHeight = 40
              const blockWidth = Math.min(cellWidth - 10, 140)

              const isHovered = hoveredCard === atividade.cardId
              const hoverStyle = isHovered
                ? {
                    filter: "brightness(1.15) saturate(1.05)",
                    transform: "scale(1.03) translateY(-1px)",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
                    zIndex: 100 + stackIndex,
                  }
                : {}

              return (
                <div
                  key={atividade.cardId}
                  data-card="true"
                  className="absolute rounded-lg cursor-pointer transition-all duration-150 shadow-lg border-2 border-white/90"
                  style={{
                    left: `${leftPosition}px`,
                    width: `${blockWidth}px`,
                    top: `${10 + verticalOffset}px`,
                    height: `${blockHeight}px`,
                    backgroundColor: statusColor,
                    borderRadius: "10px",
                    willChange: "opacity, transform, filter",
                    backfaceVisibility: "hidden",
                    zIndex: 10 + stackIndex,
                    padding: "3px",
                    boxSizing: "border-box",
                    ...hoverStyle,
                  }}
                  onMouseEnter={() => handleCardMouseEnter(atividade.cardId)}
                  onMouseLeave={handleCardMouseLeave}
                  onClick={(e) => handleCardClick(e, atividade.associadoCompleto)}
                  title={`${timeline.associado.login}
Horário: ${atividade.inicio} - ${atividade.fim}
Contrato: ${atividade.contrato}
OS: ${atividade.os_ctb}
Status: ${atividade.status}
Card ${stackIndex + 1} de ${cardsNaColuna.length}
${isExpanded ? "EXPANDIDO" : stackIndex === 0 ? "VISÍVEL" : "OCULTO"}
${isHovered ? "🎯 HOVER" : "Clique para detalhes"}`}
                >
                  <div
                    className={`w-full h-full px-3 py-2 text-white text-sm flex items-center justify-center rounded-lg font-medium ${
                      isHovered ? "text-shadow" : ""
                    }`}
                    style={{
                      minHeight: `${blockHeight}px`,
                      cursor: "pointer",
                      textShadow: isHovered ? "1px 1px 2px rgba(0,0,0,0.5)" : "none",
                    }}
                  >
                    <div className="flex items-center justify-center w-full">
                      <StatusIcon className="w-5 h-5 flex-shrink-0" />
                      {cardsNaColuna.length > 1 && !isExpanded && stackIndex === 0 && (
                        <span className="absolute top-1 right-1 text-xs bg-black/50 rounded-full px-1.5 py-0.5 font-bold min-w-[18px] text-center">
                          +{cardsNaColuna.length - 1}
                        </span>
                      )}

                      {isExpanded && cardsNaColuna.length > 1 && (
                        <span className="absolute top-1 right-1 text-xs bg-black/60 rounded-full px-1.5 py-0.5 font-bold border border-white/30 min-w-[18px] text-center">
                          {stackIndex + 1}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          })}
        </div>
      </div>
    )
  },
)

VirtualizedTimelineRow.displayName = "VirtualizedTimelineRow"

function TimelineView({ associados, onAssociadoClick, statusFilter }: TimelineViewProps) {
  const [currentTime] = useState(new Date())
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 })
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 })
  const [containerHeight, setContainerHeight] = useState(600)
  const [statusFilterActive, setStatusFilterActive] = useState<string>("todos")

  const getStatusIcon = useCallback((status: string) => {
    const statusLower = status.toLowerCase()

    if (statusLower.includes("finalizado") || statusLower.includes("completo") || statusLower.includes("concluido")) {
      return CheckCircle
    }
    if (statusLower.includes("cancelado")) {
      return XCircle
    }
    if (statusLower.includes("em rota") || statusLower.includes("em_rota") || statusLower.includes("rota")) {
      return Navigation
    }
    if (statusLower.includes("pendente")) {
      return Clock
    }
    if (statusLower.includes("atrasado")) {
      return Truck
    }

    return Car
  }, [])

  const getStatusColor = useCallback((status: string, horarioInicio: string) => {
    const statusLower = status.toLowerCase()

    if (statusLower.includes("cancelado")) {
      return "#6B7280"
    }

    if (statusLower.includes("finalizado") || statusLower.includes("completo") || statusLower.includes("concluido")) {
      return "#3B82F6"
    }

    if (!horarioInicio || horarioInicio === "N/A") {
      return "#F59E0B"
    }

    try {
      const hoje = new Date()
      const [hora, minuto] = horarioInicio.split(":").map(Number)
      const horarioAgendado = new Date(hoje)
      horarioAgendado.setHours(hora, minuto, 0, 0)
      const currentTime = new Date()

      if (currentTime > horarioAgendado) {
        return "#EF4444"
      } else {
        return "#F59E0B"
      }
    } catch (error) {
      return "#F59E0B"
    }
  }, [])

  const getStatusName = useCallback((status: string, horarioInicio: string) => {
    const statusLower = status.toLowerCase()

    if (statusLower.includes("cancelado")) {
      return "Cancelado"
    }

    if (statusLower.includes("finalizado") || statusLower.includes("completo") || statusLower.includes("concluido")) {
      return "Finalizado"
    }

    if (!horarioInicio || horarioInicio === "N/A") {
      return "Pendente"
    }

    try {
      const hoje = new Date()
      const [hora, minuto] = horarioInicio.split(":").map(Number)

      const horarioAgendado = new Date(hoje)
      horarioAgendado.setHours(hora, minuto, 0, 0)
      const currentTime = new Date()

      if (currentTime > horarioAgendado) {
        return "Atrasado"
      } else {
        return "Pendente"
      }
    } catch (error) {
      return "Pendente"
    }
  }, [])

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

  const horarios = useMemo(() => {
    const hours = []
    for (let h = 6; h <= 23; h++) {
      hours.push(`${h.toString().padStart(2, "0")}:00`)
    }
    for (let h = 0; h <= 3; h++) {
      hours.push(`${h.toString().padStart(2, "0")}:00`)
    }
    return hours
  }, [])

  const horarioParaPosicao = useCallback((horario: string): number => {
    if (!horario) return 0

    const [hora, minuto] = horario.split(":").map(Number)
    let posicao = 0

    if (hora >= 6 && hora <= 23) {
      posicao = hora - 6
    } else if (hora >= 0 && hora <= 3) {
      posicao = 18 + hora
    }

    posicao += minuto / 60
    return posicao
  }, [])

  const calcularDuracao = useCallback((status: string): number => {
    switch (status.toLowerCase()) {
      case "concluido":
      case "completo":
      case "finalizado":
        return 2
      case "em_andamento":
      case "andamento":
      case "em rota":
      case "em_rota":
        return 3
      case "pendente":
        return 1.5
      case "atrasado":
        return 4
      case "cancelado":
        return 1
      default:
        return 2
    }
  }, [])

  const statusSummary: StatusSummary[] = useMemo(() => {
    const filteredAssociados = associados.filter((associado) => {
      if (statusFilter === "todos") return true
      return associado.status === statusFilter
    })

    const statusCounts: Record<string, { count: number; temporalStatus: string }> = {}

    filteredAssociados.forEach((associado) => {
      const status = associado.status || "sem_status"
      const temporalStatus = getTemporalStatus(associado.horario_inicio, associado.status)

      if (!statusCounts[status]) {
        statusCounts[status] = { count: 0, temporalStatus }
      }
      statusCounts[status].count++
    })

    return Object.entries(statusCounts)
      .map(([status, data]) => ({
        status,
        count: data.count,
        color: getStatusColor(status, "12:00"),
        temporalStatus: data.temporalStatus,
      }))
      .sort((a, b) => b.count - a.count)
  }, [associados, statusFilter, getTemporalStatus, getStatusColor])

  const timelineData: TimelineData[] = useMemo(() => {
    const filteredAssociados = associados.filter((associado) => {
      if (statusFilter === "todos") return true
      return associado.status === statusFilter
    })

    const groupedByAssociado = filteredAssociados.reduce(
      (acc, associado) => {
        const key = associado.login || "Sem Login"

        if (!acc[key]) {
          acc[key] = {
            associado: associado,
            atendimentos: [],
            todosAssociados: [],
          }
        }

        acc[key].todosAssociados.push(associado)

        const temporalStatus = getTemporalStatus(associado.horario_inicio, associado.status)
        const duracao = calcularDuracao(associado.status)

        const [horaInicio, minutoInicio] = associado.horario_inicio.split(":").map(Number)
        const totalMinutos = horaInicio * 60 + minutoInicio + duracao * 60
        const horaFim = Math.floor(totalMinutos / 60) % 24
        const minutoFim = totalMinutos % 60
        const horarioFim = `${horaFim.toString().padStart(2, "0")}:${minutoFim.toString().padStart(2, "0")}`

        acc[key].atendimentos.push({
          inicio: associado.horario_inicio,
          fim: horarioFim,
          status: associado.status,
          tipo: "checklist",
          cor: getStatusColor(associado.status, associado.horario_inicio),
          duracao,
          temporalStatus,
          contrato: associado.contrato,
          os_ctb: associado.os_ctb,
          id: associado.id,
          associadoCompleto: associado,
        })

        return acc
      },
      {} as Record<string, any>,
    )

    const result = Object.values(groupedByAssociado)
      .map((group: any) => {
        const statusCounts = group.atendimentos.reduce((acc: Record<string, number>, atendimento: any) => {
          acc[atendimento.temporalStatus] = (acc[atendimento.temporalStatus] || 0) + 1
          return acc
        }, {})

        let statusGeral: "ativo" | "inativo" | "alerta" | "concluido" = "ativo"

        if (statusCounts.finalizado > 0 && statusCounts.atrasado === 0) {
          statusGeral = "concluido"
        } else if (statusCounts.atrasado > 0) {
          statusGeral = "alerta"
        } else if (statusCounts.pendente > 0) {
          statusGeral = "ativo"
        }

        return {
          associado: group.associado,
          atividades: group.atendimentos,
          statusGeral,
          totalAtendimentos: group.atendimentos.length,
          todosAssociados: group.todosAssociados,
        }
      })
      .sort((a, b) => b.totalAtendimentos - a.totalAtendimentos)

    return result
  }, [associados, statusFilter, getTemporalStatus, calcularDuracao, getStatusColor])

  const expandableCardsInfo = useMemo(() => {
    let totalExpandableCards = 0
    let linesWithOverlaps = 0

    timelineData.forEach((timeline) => {
      const atividadesPorColuna: Record<string, any[]> = {}

      timeline.atividades.forEach((atividade: any) => {
        const posicaoColuna = Math.floor(horarioParaPosicao(atividade.inicio))
        const colunaKey = `col_${posicaoColuna}`
        if (!atividadesPorColuna[colunaKey]) atividadesPorColuna[colunaKey] = []
        atividadesPorColuna[colunaKey].push(atividade)
      })

      const hasOverlaps = Object.values(atividadesPorColuna).some((col) => col.length > 1)
      if (hasOverlaps) {
        linesWithOverlaps++
        const maxCards = Math.max(...Object.values(atividadesPorColuna).map((col) => col.length))
        totalExpandableCards += timeline.atividades.length
      }
    })

    return { totalExpandableCards, linesWithOverlaps }
  }, [timelineData, horarioParaPosicao])

  const getRowHeight = useCallback((timeline: TimelineData, isExpanded: boolean) => {
    const atividadesPorHorario: Record<string, any[]> = {}

    timeline.atividades.forEach((atividade: any) => {
      const horarioKey = atividade.inicio || "sem_horario"
      if (!atividadesPorHorario[horarioKey]) atividadesPorHorario[horarioKey] = []
      atividadesPorHorario[horarioKey].push(atividade)
    })

    const hasOverlaps = Object.values(atividadesPorHorario).some((col) => col.length > 1)
    const maxCardsInSameTime = Math.max(...Object.values(atividadesPorHorario).map((col) => col.length), 1)

    return isExpanded && hasOverlaps ? 10 + maxCardsInSameTime * 48 + 30 : 80
  }, [])

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const scrollHandler = useCallback(() => {
    if (!scrollContainerRef.current) return () => {}

    let ticking = false

    return () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const container = scrollContainerRef.current
          if (!container) return

          const { scrollLeft, scrollWidth, clientWidth, scrollTop } = container
          const maxScroll = scrollWidth - clientWidth

          const averageRowHeight = 80
          const bufferRows = 10
          const startRow = Math.max(0, Math.floor(scrollTop / averageRowHeight) - bufferRows)
          const endRow = Math.min(
            timelineData.length,
            startRow + Math.ceil(containerHeight / averageRowHeight) + bufferRows * 2,
          )

          const currentRange = visibleRange
          if (Math.abs(currentRange.start - startRow) > 5 || Math.abs(currentRange.end - endRow) > 5) {
            setVisibleRange({ start: startRow, end: endRow })
          }

          ticking = false
        })
        ticking = true
      }
    }
  }, [containerHeight, timelineData.length, visibleRange])

  const visibleTimelineData = useMemo(() => {
    return timelineData.slice(visibleRange.start, visibleRange.end)
  }, [timelineData, visibleRange])

  const currentPosition = horarioParaPosicao(`${currentTime.getHours()}:${currentTime.getMinutes()}`)
  const cellWidth = Math.max(120, 140 * zoomLevel)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return

    e.preventDefault()
    e.stopPropagation()

    const startX = e.clientX
    const startScrollLeft = scrollContainerRef.current.scrollLeft

    setIsDragging(true)
    setDragStart({ x: startX, scrollLeft: startScrollLeft })

    document.body.style.cursor = "grabbing"
    document.body.style.userSelect = "none"

    const handleMouseMove = (e: MouseEvent) => {
      if (!scrollContainerRef.current) return
      const scrollDelta = startX - e.clientX
      scrollContainerRef.current.scrollLeft = startScrollLeft + scrollDelta
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove, { passive: false })
    document.addEventListener("mouseup", handleMouseUp, { passive: false })
  }, [])

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    const optimizedScrollHandler = scrollHandler()

    scrollContainer.addEventListener("scroll", optimizedScrollHandler, {
      passive: true,
      capture: false,
    })

    optimizedScrollHandler()

    return () => {
      scrollContainer.removeEventListener("scroll", optimizedScrollHandler)
    }
  }, [scrollHandler])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height)
      }
    })

    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }, [])

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        e.preventDefault()
        e.stopPropagation()
      }
    },
    [isDragging],
  )

  const handleStatusFilter = useCallback(
    (status: string) => {
      setStatusFilterActive(status)
      if (status !== "todos") {
        const allLogins = new Set(timelineData.map((t) => t.associado.login))
        setExpandedRows(allLogins)
      } else {
        setExpandedRows(new Set())
      }
    },
    [timelineData],
  )

  const handleZoomChange = useCallback((value: string) => {
    setZoomLevel(Number.parseFloat(value))
  }, [])

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-r from-blue-50 via-yellow-50 to-red-50 border-2 border-dashed border-gray-300">
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Legenda das Cores dos Cards</h3>
            <p className="text-sm text-gray-600">Entenda o significado das cores na timeline</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex flex-col items-center space-y-3 p-4 bg-white/80 rounded-xl shadow-sm border border-blue-200">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-8 h-8 text-blue-600" />
                <div className="w-12 h-8 rounded-lg bg-blue-500 shadow-md"></div>
              </div>
              <div className="text-center">
                <div className="font-bold text-blue-800 text-lg">AZUL</div>
                <div className="text-sm text-blue-700 font-medium">Atendimento Finalizado</div>
                <div className="text-xs text-blue-600 mt-1">Visita concluída com sucesso</div>
              </div>
            </div>

            <div className="flex flex-col items-center space-y-3 p-4 bg-white/80 rounded-xl shadow-sm border border-yellow-200">
              <div className="flex items-center space-x-3">
                <Clock className="w-8 h-8 text-yellow-600" />
                <div className="w-12 h-8 rounded-lg bg-yellow-500 shadow-md"></div>
              </div>
              <div className="text-center">
                <div className="font-bold text-yellow-800 text-lg">AMARELO</div>
                <div className="text-sm text-yellow-700 font-medium">Ainda não chegou a hora</div>
                <div className="text-xs text-yellow-600 mt-1">Aguardando horário agendado</div>
              </div>
            </div>

            <div className="flex flex-col items-center space-y-3 p-4 bg-white/80 rounded-xl shadow-sm border border-red-200">
              <div className="flex items-center space-x-3">
                <Truck className="w-8 h-8 text-red-600" />
                <div className="w-12 h-8 rounded-lg bg-red-500 shadow-md"></div>
              </div>
              <div className="text-center">
                <div className="font-bold text-red-800 text-lg">VERMELHO</div>
                <div className="text-sm text-red-700 font-medium">Passou da hora (Atrasado)</div>
                <div className="text-xs text-red-600 mt-1">Visita em atraso</div>
              </div>
            </div>

            <div className="flex flex-col items-center space-y-3 p-4 bg-white/80 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center space-x-3">
                <XCircle className="w-8 h-8 text-gray-600" />
                <div className="w-12 h-8 rounded-lg bg-gray-500 shadow-md"></div>
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-800 text-lg">CINZA</div>
                <div className="text-sm text-gray-700 font-medium">Cancelado</div>
                <div className="text-xs text-gray-600 mt-1">Visita cancelada</div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-300">
            <div className="flex flex-col md:flex-row items-center justify-center space-y-2 md:space-y-0 md:space-x-8 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-4 rounded bg-blue-50 border-2 border-blue-300"></div>
                <span className="font-medium text-gray-700">Fundo azul claro = Linha expandida</span>
              </div>
              <div className="flex items-center space-x-2">
                <ChevronUp className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-700">Botão verde = Expandido</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  3
                </div>
                <span className="font-medium text-gray-700">Número = Cards sobrepostos</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>Timeline de Visitas</span>
              <Badge className="bg-green-100 text-green-800">{timelineData.length} associados</Badge>
              {statusFilterActive !== "todos" && (
                <Badge className="bg-orange-100 text-orange-800">Filtro: {statusFilterActive}</Badge>
              )}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Zoom:</span>
              <Select value={zoomLevel.toString()} onValueChange={handleZoomChange}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">50%</SelectItem>
                  <SelectItem value="0.75">75%</SelectItem>
                  <SelectItem value="1">100%</SelectItem>
                  <SelectItem value="1.25">125%</SelectItem>
                  <SelectItem value="1.5">150%</SelectItem>
                  <SelectItem value="2">200%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Visualização em timeline com scroll fluido e linhas expandidas destacadas
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative">
            <div
              ref={scrollContainerRef}
              className={`overflow-auto select-none`}
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                touchAction: "pan-x pan-y",
                maxHeight: "600px",
                willChange: "scroll-position",
                transform: "translateZ(0)",
                contain: "layout style paint",
                scrollBehavior: "smooth",
              }}
              onMouseDown={(e) => {
                const target = e.target as HTMLElement
                if (!target.closest('[data-card="true"]')) {
                  handleMouseDown(e)
                }
              }}
              onClick={handleClick}
            >
              <style jsx>{`
                div::-webkit-scrollbar {
                  display: none;
                }
              `}</style>

              <div className="min-w-max relative select-none">
                <div className="flex border-b bg-gray-50 sticky top-0 z-30 shadow-sm">
                  <div className="w-48 p-3 border-r bg-white font-medium text-sm sticky left-0 z-40 shadow-r">
                    <div className="flex items-center justify-between">
                      <span>Associados</span>
                      <span className="text-xs text-gray-500">
                        {currentTime.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="text-xs text-blue-600 mt-1 font-medium">Scroll Fluido</div>
                  </div>
                  {horarios.map((horario, index) => (
                    <div
                      key={horario}
                      className={`p-2 border-r text-center text-xs font-medium min-w-0 ${
                        horario === "22:00" ? "bg-red-100 text-red-800" : ""
                      } ${
                        horario === `${currentTime.getHours().toString().padStart(2, "0")}:00`
                          ? "bg-blue-100 text-blue-800 font-bold"
                          : ""
                      }`}
                      style={{
                        width: `${cellWidth}px`,
                        transform: "translateZ(0)",
                      }}
                    >
                      <div className="font-semibold">{horario}</div>
                      <div className="text-gray-400 text-xs">{index < 18 ? "Dia" : "Madrugada"}</div>
                    </div>
                  ))}
                </div>
                <div className="relative">
                  {currentPosition >= 0 && currentPosition <= 21 && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 opacity-75 pointer-events-none"
                      style={{
                        left: `${192 + currentPosition * cellWidth}px`,
                        transform: "translateZ(0)",
                      }}
                    >
                      <div className="absolute -top-8 -left-12 bg-red-500 text-white text-xs px-2 py-1 rounded shadow-lg">
                        Agora:{" "}
                        {currentTime.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      height: `${visibleRange.start * 80}px`,
                    }}
                  />

                  {visibleTimelineData.map((timeline, index) => {
                    const actualIndex = visibleRange.start + index

                    return (
                      <VirtualizedTimelineRow
                        key={timeline.associado.id}
                        timeline={timeline}
                        rowIndex={actualIndex}
                        cellWidth={cellWidth}
                        horarios={horarios}
                        currentPosition={currentPosition}
                        currentTime={currentTime}
                        onAssociadoClick={onAssociadoClick}
                        getStatusIcon={getStatusIcon}
                        getStatusColor={getStatusColor}
                        getStatusName={getStatusName}
                        horarioParaPosicao={horarioParaPosicao}
                        expandedRows={expandedRows}
                        setExpandedRows={setExpandedRows}
                        statusFilterActive={statusFilterActive}
                      />
                    )
                  })}

                  <div
                    style={{
                      height: `${(timelineData.length - visibleRange.end) * 80}px`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export { TimelineView }

