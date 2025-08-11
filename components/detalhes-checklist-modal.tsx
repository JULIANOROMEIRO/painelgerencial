"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  User,
  MapPin,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Hash,
  Truck,
  Wifi,
  Activity,
} from "lucide-react"

interface ChecklistItem {
  pergunta: string
  valor_numero: number
  nros?: string
  data_criacao?: string
  nome_tecnico?: string
  uid?: number
}

interface Associado {
  id: string
  login: string
  tecnico: string
  contrato: string
  horario_inicio: string
  status: string
  status_coleta: string // NOVO: Status da Coleta
  coletados: string
  quantidade_chips: number
  os_ctb: string
  uf: string
  uid: number
  data_importacao: string
  checklist_items: ChecklistItem[]
}

interface DetalhesChecklistModalProps {
  associado: Associado | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DetalhesChecklistModal({ associado, open, onOpenChange }: DetalhesChecklistModalProps) {
  if (!associado) return null

  // Função para determinar status temporal
  const getTemporalStatus = (horarioInicio: string, status: string) => {
    if (status.toLowerCase().includes("finalizado") || status.toLowerCase().includes("completo")) {
      return { status: "finalizado", color: "text-blue-600", bg: "bg-blue-100", icon: CheckCircle }
    }

    if (!horarioInicio || horarioInicio === "N/A") {
      return { status: "pendente", color: "text-yellow-600", bg: "bg-yellow-100", icon: AlertCircle }
    }

    try {
      const hoje = new Date()
      const [hora, minuto] = horarioInicio.split(":").map(Number)
      const horarioAgendado = new Date(hoje)
      horarioAgendado.setHours(hora, minuto, 0, 0)
      const currentTime = new Date()

      if (currentTime > horarioAgendado) {
        return { status: "atrasado", color: "text-red-600", bg: "bg-red-100", icon: XCircle }
      } else {
        return { status: "pendente", color: "text-yellow-600", bg: "bg-yellow-100", icon: AlertCircle }
      }
    } catch (error) {
      return { status: "pendente", color: "text-yellow-600", bg: "bg-yellow-100", icon: AlertCircle }
    }
  }

  const temporalInfo = getTemporalStatus(associado.horario_inicio, associado.status)
  const TemporalIcon = temporalInfo.icon

  // Estatísticas do checklist
  const checklistStats = {
    total: associado.checklist_items.length,
    respondidas: associado.checklist_items.filter((item) => item.valor_numero === 1).length,
    naoRespondidas: associado.checklist_items.filter((item) => item.valor_numero === 0).length,
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-600" />
            <span>Detalhes da Visita - {associado.login}</span>
            <Badge className={`${temporalInfo.bg} ${temporalInfo.color}`}>{temporalInfo.status.toUpperCase()}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informações do Associado */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>Informações do Associado</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Hash className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">ID:</span>
                  <span className="text-sm text-blue-600 font-mono">{associado.id}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">Login:</span>
                  <span className="text-sm">{associado.login}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Truck className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">Técnico:</span>
                  <span className="text-sm">{associado.tecnico}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">Contrato:</span>
                  <span className="text-sm text-blue-600">{associado.contrato}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">UF:</span>
                  <Badge className="bg-blue-100 text-blue-800">{associado.uf}</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Hash className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">UID:</span>
                  <span className="text-sm font-mono">{associado.uid}</span>
                </div>
              </CardContent>
            </Card>

            {/* Informações da Visita */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span>Informações da Visita</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">Horário de Início:</span>
                  <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{associado.horario_inicio}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TemporalIcon className={`w-4 h-4 ${temporalInfo.color}`} />
                  <span className="text-sm font-medium">Status Temporal:</span>
                  <Badge className={`${temporalInfo.bg} ${temporalInfo.color}`}>{temporalInfo.status}</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">Status Original:</span>
                  <Badge className="bg-gray-100 text-gray-800">{associado.status}</Badge>
                </div>
                {/* NOVO: Status da Coleta */}
                <div className="flex items-center space-x-2">
                  <Wifi className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium">Status da Coleta:</span>
                  <Badge className="bg-purple-100 text-purple-800">{associado.status_coleta}</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">OS CTB:</span>
                  <span className="text-sm text-blue-600">{associado.os_ctb}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Hash className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">Coletados:</span>
                  <span className="text-sm">{associado.coletados}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Wifi className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">Quantidade de Chips:</span>
                  <Badge className="bg-green-100 text-green-800">{associado.quantidade_chips}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informações de Coleta - NOVO CARD DESTACADO */}
          <Card className="bg-purple-50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wifi className="w-4 h-4 text-purple-600" />
                <span>Informações de Coleta</span>
                <Badge className="bg-purple-100 text-purple-800">CAMPO OCORRENCIA</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-lg border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600">{associado.status_coleta}</div>
                  <div className="text-sm text-purple-700 font-medium">Status da Coleta</div>
                  <div className="text-xs text-purple-600 mt-1">Campo Ocorrencia da API</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600">{associado.coletados}</div>
                  <div className="text-sm text-purple-700 font-medium">Dados Coletados</div>
                  <div className="text-xs text-purple-600 mt-1">Quantidade coletada</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600">{associado.quantidade_chips}</div>
                  <div className="text-sm text-purple-700 font-medium">Chips</div>
                  <div className="text-xs text-purple-600 mt-1">Quantidade de chips</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Estatísticas do Checklist */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Estatísticas do Checklist</span>
                <Badge className="bg-blue-100 text-blue-800">{checklistStats.total} perguntas</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-3xl font-bold text-green-600">{checklistStats.respondidas}</div>
                  <div className="text-sm text-green-700 font-medium">Respondidas (Sim)</div>
                  <div className="text-xs text-green-600">
                    {checklistStats.total > 0
                      ? `${((checklistStats.respondidas / checklistStats.total) * 100).toFixed(1)}%`
                      : "0%"}
                  </div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-3xl font-bold text-red-600">{checklistStats.naoRespondidas}</div>
                  <div className="text-sm text-red-700 font-medium">Não Respondidas (Não)</div>
                  <div className="text-xs text-red-600">
                    {checklistStats.total > 0
                      ? `${((checklistStats.naoRespondidas / checklistStats.total) * 100).toFixed(1)}%`
                      : "0%"}
                  </div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-3xl font-bold text-blue-600">{checklistStats.total}</div>
                  <div className="text-sm text-blue-700 font-medium">Total de Perguntas</div>
                  <div className="text-xs text-blue-600">Checklist completo</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista do Checklist */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-orange-600" />
                <span>Detalhes do Checklist</span>
                {associado.checklist_items.length === 0 && (
                  <Badge className="bg-yellow-100 text-yellow-800">Sem checklist</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {associado.checklist_items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p>Nenhum item de checklist encontrado para esta visita.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {associado.checklist_items.map((item, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        item.valor_numero === 1
                          ? "bg-green-50 border-green-200 hover:bg-green-100"
                          : "bg-red-50 border-red-200 hover:bg-red-100"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {item.valor_numero === 1 ? (
                              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            )}
                            <span className="font-medium text-gray-900">Pergunta {index + 1}</span>
                            <Badge
                              className={
                                item.valor_numero === 1 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }
                            >
                              {item.valor_numero === 1 ? "SIM" : "NÃO"}
                            </Badge>
                          </div>
                          <p className="text-gray-700 mb-3">{item.pergunta}</p>

                          {/* Informações adicionais do checklist */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
                            {item.nros && (
                              <div className="flex items-center space-x-1">
                                <Hash className="w-3 h-3" />
                                <span>OS: {item.nros}</span>
                              </div>
                            )}
                            {item.data_criacao && (
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>Data: {item.data_criacao}</span>
                              </div>
                            )}
                            {item.nome_tecnico && (
                              <div className="flex items-center space-x-1">
                                <User className="w-3 h-3" />
                                <span>Técnico: {item.nome_tecnico}</span>
                              </div>
                            )}
                            {item.uid && (
                              <div className="flex items-center space-x-1">
                                <Hash className="w-3 h-3" />
                                <span>UID: {item.uid}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <div
                            className={`text-2xl font-bold ${
                              item.valor_numero === 1 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {item.valor_numero}
                          </div>
                          <div className="text-xs text-gray-500">Valor</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações de Sistema */}
          <Card className="bg-gray-50 border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <span>Informações de Sistema</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Data de Importação:</span>
                  <div className="text-gray-600 font-mono">{associado.data_importacao}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Última Atualização:</span>
                  <div className="text-gray-600">{new Date().toLocaleString("pt-BR")}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
