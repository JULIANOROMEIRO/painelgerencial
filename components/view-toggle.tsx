'use client'

import { Button } from '@/components/ui/button'
import { Table, TimerIcon as Timeline, BarChart3 } from 'lucide-react'

interface ViewToggleProps {
  currentView: 'table' | 'timeline' | 'chart'
  onViewChange: (view: 'table' | 'timeline' | 'chart') => void
}

export function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
      <Button
        variant={currentView === 'table' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('table')}
        className={`${
          currentView === 'table' 
            ? 'bg-white shadow-sm' 
            : 'hover:bg-gray-200'
        }`}
      >
        <Table className="w-4 h-4 mr-2" />
        Tabela
      </Button>
      <Button
        variant={currentView === 'timeline' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('timeline')}
        className={`${
          currentView === 'timeline' 
            ? 'bg-white shadow-sm' 
            : 'hover:bg-gray-200'
        }`}
      >
        <Timeline className="w-4 h-4 mr-2" />
        Timeline
      </Button>
      <Button
        variant={currentView === 'chart' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('chart')}
        className={`${
          currentView === 'chart' 
            ? 'bg-white shadow-sm' 
            : 'hover:bg-gray-200'
        }`}
      >
        <BarChart3 className="w-4 h-4 mr-2" />
        Gráficos
      </Button>
    </div>
  )
}
