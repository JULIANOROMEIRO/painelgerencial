import { Badge } from "@/components/ui/badge"
import { FieldMapping } from "@/lib/dynamic-mapper"

interface DynamicTableProps {
  data: any[]
  fields: FieldMapping[]
  onRowClick: (item: any) => void
  loading: boolean
  usingRealData: boolean
}

export function DynamicTable({ data, fields, onRowClick, loading, usingRealData }: DynamicTableProps) {
  const renderCellValue = (value: any, field: FieldMapping) => {
    if (value === null || value === undefined) return 'N/A'
    
    switch (field.type) {
      case 'status':
        return (
          <Badge className={
            value === 'completo' ? 'bg-green-100 text-green-800' :
            value === 'atrasado' ? 'bg-red-100 text-red-800' :
            value === 'cancelado' ? 'bg-gray-100 text-gray-800' :
            'bg-yellow-100 text-yellow-800'
          }>
            {value}
          </Badge>
        )
      case 'number':
        return <span className="text-center">{value}</span>
      case 'date':
        return <span className="text-sm">{value}</span>
      default:
        return <span>{value}</span>
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            {fields.map((field) => (
              <th key={field.key} className="text-left p-3 font-medium">
                {field.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={fields.length} className="text-center py-8">
                <div className="flex items-center justify-center space-x-2">
                  <span>Carregando dados reais da API...</span>
                </div>
              </td>
            </tr>
          ) : !usingRealData ? (
            <tr>
              <td colSpan={fields.length} className="text-center py-8 text-red-500">
                <span className="font-medium">API Indisponível</span>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={fields.length} className="text-center py-8 text-gray-500">
                Nenhum registro encontrado
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr 
                key={`${item.id || index}`} 
                className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onRowClick(item)}
              >
                {fields.map((field) => (
                  <td key={field.key} className="p-3">
                    {renderCellValue(item[field.key], field)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
