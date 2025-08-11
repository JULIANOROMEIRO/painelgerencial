import React from 'react'

interface PieChartData {
  status: string
  count: number
  percentage: number
  color: string
}

interface PieChartProps {
  data: PieChartData[]
  onSliceClick: (status: string) => void
  activeStatus: string
  className?: string
}

export function PieChart({ data, onSliceClick, activeStatus, className = "" }: PieChartProps) {
  const size = 200
  const center = size / 2
  const radius = 80

  let cumulativePercentage = 0

  const createArcPath = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(center, center, radius, endAngle)
    const end = polarToCartesian(center, center, radius, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"
    
    return [
      "M", center, center,
      "L", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "Z"
    ].join(" ")
  }

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    }
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg width={size} height={size} className="drop-shadow-sm">
        {data.map((item, index) => {
          const startAngle = cumulativePercentage * 3.6 // Convert percentage to degrees
          const endAngle = (cumulativePercentage + item.percentage) * 3.6
          cumulativePercentage += item.percentage

          const isActive = activeStatus === item.status
          const isHovered = false // You can add hover state if needed

          return (
            <path
              key={item.status}
              d={createArcPath(startAngle, endAngle)}
              fill={item.color}
              stroke="white"
              strokeWidth="2"
              className={`cursor-pointer transition-all duration-200 ${
                isActive 
                  ? 'opacity-100 drop-shadow-md transform scale-105' 
                  : 'opacity-90 hover:opacity-100 hover:drop-shadow-sm'
              }`}
              onClick={() => onSliceClick(item.status)}
              style={{
                transformOrigin: `${center}px ${center}px`
              }}
            />
          )
        })}
        
        {/* Center circle for better visual */}
        <circle
          cx={center}
          cy={center}
          r="25"
          fill="white"
          stroke="#e5e7eb"
          strokeWidth="2"
        />
        
        {/* Center text */}
        <text
          x={center}
          y={center - 5}
          textAnchor="middle"
          className="text-sm font-semibold fill-gray-700"
        >
          Total
        </text>
        <text
          x={center}
          y={center + 10}
          textAnchor="middle"
          className="text-xs fill-gray-500"
        >
          {data.reduce((sum, item) => sum + item.count, 0)}
        </text>
      </svg>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        {data.map((item) => (
          <div
            key={item.status}
            className={`flex items-center space-x-2 cursor-pointer p-2 rounded transition-colors ${
              activeStatus === item.status 
                ? 'bg-orange-50 border border-orange-200' 
                : 'hover:bg-gray-50'
            }`}
            onClick={() => onSliceClick(item.status)}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <div>
              <div className="font-medium text-gray-700">
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </div>
              <div className="text-gray-500">
                {item.count} ({item.percentage.toFixed(1)}%)
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
