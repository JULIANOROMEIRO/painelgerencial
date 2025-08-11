// Sistema de mapeamento dinâmico para adaptar-se a mudanças na API

export interface FieldMapping {
  key: string
  label: string
  type: "string" | "number" | "date" | "status" | "boolean"
  priority: number
  variants: string[]
}

export interface DynamicConfig {
  primaryFields: FieldMapping[]
  statusField: FieldMapping
  checklistField: FieldMapping
  displayFields: FieldMapping[]
}

// Configuração inteligente que detecta campos automaticamente
export const createDynamicConfig = (sampleData: any[]): DynamicConfig => {
  if (!sampleData.length) {
    return getDefaultConfig()
  }

  const firstItem = sampleData[0]
  const actualData = firstItem.tb_claro || firstItem
  const allKeys = Object.keys(actualData)

  console.log("=== DETECÇÃO AUTOMÁTICA DE CAMPOS ===")
  console.log("Campos disponíveis no actualData:", allKeys)
  console.log("ActualData completo:", JSON.stringify(actualData, null, 2))

  // Detectar campo de status automaticamente - PRIORIZANDO "status"
  const statusField = detectStatusField(actualData, allKeys)

  // Detectar campos principais
  const primaryFields = detectPrimaryFields(actualData, allKeys)

  // Detectar campo de checklist
  const checklistField = detectChecklistField(firstItem, Object.keys(firstItem))

  // Detectar campos para exibição na tabela
  const displayFields = detectDisplayFields(actualData, allKeys)

  const config: DynamicConfig = {
    primaryFields,
    statusField,
    checklistField,
    displayFields,
  }

  console.log("=== CONFIGURAÇÃO DINÂMICA GERADA ===")
  console.log("Config completa:", JSON.stringify(config, null, 2))

  return config
}

// Detectar campo de status usando heurísticas - PRIORIZANDO "status"
const detectStatusField = (item: any, keys: string[]): FieldMapping => {
  // ORDEM ALTERADA: "status" vem PRIMEIRO
  const statusVariants = [
    "status",
    "statusdaatividade",
    "estado",
    "situacao",
    "state",
    "current_status",
    "status_atual",
    "atividade_status",
  ]

  console.log("=== DETECTANDO CAMPO DE STATUS ===")
  console.log("Chaves disponíveis:", keys)
  console.log("Valores dos campos relacionados a status:")

  // Log todos os valores para debug
  statusVariants.forEach((variant) => {
    if (keys.includes(variant)) {
      console.log(`  ${variant}: ${item[variant]}`)
    }
  })

  // Procurar por campos que contenham 'status'
  keys.forEach((key) => {
    if (key.toLowerCase().includes("status")) {
      console.log(`  Campo com 'status' encontrado: ${key} = ${item[key]}`)
    }
  })

  // PRIORIZAR "status" sobre "statusdaatividade"
  for (const variant of statusVariants) {
    if (keys.includes(variant)) {
      console.log(`✅ Campo de status detectado: ${variant} com valor: ${item[variant]}`)
      return {
        key: variant,
        label: "Status",
        type: "status",
        priority: 1,
        variants: statusVariants,
      }
    }
  }

  // Fallback: procurar por campos que contenham 'status'
  const statusKey = keys.find((key) => key.toLowerCase().includes("status"))
  if (statusKey) {
    console.log(`✅ Campo de status detectado (fallback): ${statusKey} com valor: ${item[statusKey]}`)
    return {
      key: statusKey,
      label: "Status",
      type: "status",
      priority: 1,
      variants: [statusKey],
    }
  }

  // Último fallback
  console.log("⚠️ Nenhum campo de status detectado, usando fallback padrão")
  return {
    key: "status",
    label: "Status",
    type: "status",
    priority: 1,
    variants: ["status"],
  }
}

// Detectar campos principais automaticamente - AJUSTADO PARA A NOVA ESTRUTURA
const detectPrimaryFields = (item: any, keys: string[]): FieldMapping[] => {
  const fieldMappings: FieldMapping[] = [
    {
      key: detectField(keys, ["id", "identifier", "user_id", "codigo"]) || "id",
      label: "ID",
      type: "string",
      priority: 1,
      variants: ["id", "identifier", "user_id", "codigo"],
    },
    {
      key: detectField(keys, ["novologin", "login", "user_login", "username", "usuario"]) || "login",
      label: "Login",
      type: "string",
      priority: 2,
      variants: ["novologin", "login", "user_login", "username"],
    },
    {
      key: detectField(keys, ["tec", "tecnico", "téctoa", "technician", "responsavel"]) || "tecnico",
      label: "Técnico",
      type: "string",
      priority: 3,
      variants: ["tec", "tecnico", "téctoa", "technician", "responsavel"],
    },
    {
      key: detectField(keys, ["contrato", "contract", "numero_contrato"]) || "contrato",
      label: "Contrato",
      type: "string",
      priority: 4,
      variants: ["contrato", "contract", "numero_contrato"],
    },
    {
      key: detectField(keys, ["início", "horario_inicio", "inicio", "start_time", "hora_inicio"]) || "horario_inicio",
      label: "Horário de Início",
      type: "string",
      priority: 5,
      variants: ["início", "horario_inicio", "inicio", "start_time"],
    },
    {
      key: detectField(keys, ["coletados", "collected", "dados_coletados"]) || "coletados",
      label: "Coletados",
      type: "string",
      priority: 6,
      variants: ["coletados", "collected", "dados_coletados"],
    },
    {
      key:
        detectField(keys, ["quantidadedechip", "quantidade_chips", "chips_count", "total_chips"]) || "quantidade_chips",
      label: "Quantidade de Chips",
      type: "number",
      priority: 7,
      variants: ["quantidadedechip", "quantidade_chips", "chips_count"],
    },
    {
      key: detectField(keys, ["os_ctb", "ordem_servico", "service_order"]) || "os_ctb",
      label: "OS CTB",
      type: "string",
      priority: 8,
      variants: ["os_ctb", "ordem_servico", "service_order"],
    },
    {
      key: detectField(keys, ["uf", "estado", "state", "region"]) || "uf",
      label: "UF",
      type: "string",
      priority: 9,
      variants: ["uf", "estado", "state", "region"],
    },
    {
      key: detectField(keys, ["data_importacao", "created_at", "import_date", "data_criacao"]) || "data_importacao",
      label: "Data de Importação",
      type: "date",
      priority: 10,
      variants: ["data_importacao", "created_at", "import_date"],
    },
  ]

  return fieldMappings
}

// Detectar campo de checklist
const detectChecklistField = (item: any, keys: string[]): FieldMapping => {
  const checklistVariants = [
    "checklist_items",
    "checklist_dados",
    "checklist_data",
    "items",
    "dados",
    "questions",
    "perguntas",
  ]

  const checklistKey = detectField(keys, checklistVariants)

  return {
    key: checklistKey || "checklist_items",
    label: "Checklist",
    type: "string",
    priority: 1,
    variants: checklistVariants,
  }
}

// Detectar campos para exibição na tabela
const detectDisplayFields = (item: any, keys: string[]): FieldMapping[] => {
  // Pegar os campos mais importantes para a tabela
  const importantFields = [
    "id",
    "login",
    "tecnico",
    "contrato",
    "horario_inicio",
    "status",
    "coletados",
    "quantidade_chips",
    "os_ctb",
    "uf",
  ]

  return keys
    .filter((key) => {
      // Incluir campos importantes ou campos que não são objetos/arrays
      const value = item[key]
      return (
        importantFields.some((field) => key.toLowerCase().includes(field.toLowerCase())) ||
        (typeof value !== "object" && !Array.isArray(value))
      )
    })
    .slice(0, 10) // Limitar a 10 campos na tabela
    .map((key, index) => ({
      key,
      label: formatFieldLabel(key),
      type: detectFieldType(item[key]),
      priority: index + 1,
      variants: [key],
    }))
}

// Função auxiliar para detectar um campo
const detectField = (keys: string[], variants: string[]): string | null => {
  for (const variant of variants) {
    if (keys.includes(variant)) {
      return variant
    }
  }

  // Busca parcial
  for (const variant of variants) {
    const found = keys.find((key) => key.toLowerCase().includes(variant.toLowerCase()))
    if (found) return found
  }

  return null
}

// Detectar tipo do campo automaticamente
const detectFieldType = (value: any): "string" | "number" | "date" | "status" | "boolean" => {
  if (typeof value === "number") return "number"
  if (typeof value === "boolean") return "boolean"
  if (typeof value === "string") {
    // Detectar se é data
    if (value.match(/^\d{4}-\d{2}-\d{2}/) || value.match(/^\d{2}\/\d{2}\/\d{4}/)) {
      return "date"
    }
    // Detectar se é status
    if (["pendente", "completo", "concluido", "atrasado", "cancelado", "em rota"].includes(value.toLowerCase())) {
      return "status"
    }
  }
  return "string"
}

// Formatar label do campo automaticamente - ATUALIZADO
const formatFieldLabel = (key: string): string => {
  const labelMap: Record<string, string> = {
    id: "ID",
    novologin: "Login",
    login: "Login",
    tec: "Técnico",
    tecnico: "Técnico",
    téctoa: "Técnico",
    contrato: "Contrato",
    início: "Horário de Início",
    horario_inicio: "Horário de Início",
    inicio: "Horário de Início",
    status: "Status",
    statusdaatividade: "Status",
    coletados: "Coletados",
    quantidadedechip: "Quantidade de Chips",
    quantidade_chips: "Quantidade de Chips",
    os_ctb: "OS CTB",
    uf: "UF",
    uid: "UID",
    data_importacao: "Data de Importação",
  }

  if (labelMap[key]) return labelMap[key]

  // Converter snake_case para título
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

// Configuração padrão como fallback
const getDefaultConfig = (): DynamicConfig => ({
  primaryFields: [
    { key: "id", label: "ID", type: "string", priority: 1, variants: ["id"] },
    { key: "login", label: "Login", type: "string", priority: 2, variants: ["login"] },
    { key: "tecnico", label: "Técnico", type: "string", priority: 3, variants: ["tecnico"] },
    { key: "contrato", label: "Contrato", type: "string", priority: 4, variants: ["contrato"] },
    { key: "status", label: "Status", type: "status", priority: 5, variants: ["status"] },
  ],
  statusField: { key: "status", label: "Status", type: "status", priority: 1, variants: ["status"] },
  checklistField: {
    key: "checklist_items",
    label: "Checklist",
    type: "string",
    priority: 1,
    variants: ["checklist_items"],
  },
  displayFields: [
    { key: "id", label: "ID", type: "string", priority: 1, variants: ["id"] },
    { key: "login", label: "Login", type: "string", priority: 2, variants: ["login"] },
    { key: "status", label: "Status", type: "string", priority: 3, variants: ["status"] },
  ],
})

// Função para extrair valor usando o mapeamento dinâmico
export const extractValue = (item: any, field: FieldMapping, fallback: any = "N/A"): any => {
  console.log(`=== EXTRAINDO VALOR PARA CAMPO: ${field.key} ===`)
  console.log("Field mapping:", JSON.stringify(field, null, 2))
  console.log("Item disponível:", JSON.stringify(item, null, 2))

  // Tentar o campo principal
  if (item[field.key] !== undefined) {
    console.log(`✅ Valor encontrado no campo principal '${field.key}':`, item[field.key])
    return item[field.key]
  }

  // Tentar variantes
  for (const variant of field.variants) {
    if (item[variant] !== undefined) {
      console.log(`✅ Valor encontrado na variante '${variant}':`, item[variant])
      return item[variant]
    }
  }

  // Busca em objetos aninhados (como tb_claro)
  if (item.tb_claro) {
    console.log("Tentando buscar em tb_claro...")
    if (item.tb_claro[field.key] !== undefined) {
      console.log(`✅ Valor encontrado em tb_claro.${field.key}:`, item.tb_claro[field.key])
      return item.tb_claro[field.key]
    }

    for (const variant of field.variants) {
      if (item.tb_claro[variant] !== undefined) {
        console.log(`✅ Valor encontrado em tb_claro.${variant}:`, item.tb_claro[variant])
        return item.tb_claro[variant]
      }
    }
  }

  console.log(`⚠️ Nenhum valor encontrado, usando fallback:`, fallback)
  return fallback
}

// Função para detectar campos de checklist dinamicamente
export const extractChecklistItems = (item: any, checklistField: FieldMapping): any[] => {
  const checklistData = extractValue(item, checklistField, [])

  if (!Array.isArray(checklistData)) return []

  return checklistData.map((checklistItem) => {
    // Detectar campos de pergunta e valor automaticamente
    const perguntaField = detectField(Object.keys(checklistItem), ["pergunta", "question", "titulo", "title", "label"])
    const valorField = detectField(Object.keys(checklistItem), [
      "valor_numero",
      "valor",
      "value",
      "number",
      "quantidade",
      "nros",
    ])

    return {
      pergunta: perguntaField ? checklistItem[perguntaField] : "Pergunta não encontrada",
      valor_numero: valorField ? checklistItem[valorField] : 0,
    }
  })
}
