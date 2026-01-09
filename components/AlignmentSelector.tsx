'use client'

import { useState } from 'react'
import { Alignment } from '@/types'
import { alignments, getAlignment } from '@/lib/alignments'

interface AlignmentSelectorProps {
  selectedAlignment?: { row: number; col: number }
  onSelect: (row: number, col: number) => void
  readOnly?: boolean
}

export default function AlignmentSelector({
  selectedAlignment,
  onSelect,
  readOnly = false,
}: AlignmentSelectorProps) {
  const [hoveredAlignment, setHoveredAlignment] = useState<{ row: number; col: number } | null>(null)

  const handleClick = (row: number, col: number) => {
    if (!readOnly) {
      onSelect(row, col)
    }
  }

  const isSelected = (row: number, col: number) => {
    return (
      selectedAlignment?.row === row && selectedAlignment?.col === col
    )
  }

  const isHovered = (row: number, col: number) => {
    return (
      hoveredAlignment?.row === row && hoveredAlignment?.col === col
    )
  }

  const currentAlignment = hoveredAlignment
    ? getAlignment(hoveredAlignment.row, hoveredAlignment.col)
    : selectedAlignment
    ? getAlignment(selectedAlignment.row, selectedAlignment.col)
    : null

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Gesinnung</h3>
        <div className="grid grid-cols-3 gap-2">
          {alignments.map((row, rowIdx) =>
            row.map((alignment, colIdx) => {
              const selected = isSelected(rowIdx, colIdx)
              const hovered = isHovered(rowIdx, colIdx)

              return (
                <button
                  key={`${rowIdx}-${colIdx}`}
                  onClick={() => handleClick(rowIdx, colIdx)}
                  onMouseEnter={() => !readOnly && setHoveredAlignment({ row: rowIdx, col: colIdx })}
                  onMouseLeave={() => setHoveredAlignment(null)}
                  disabled={readOnly}
                  className={`
                    p-3 rounded-lg border-2 transition-all text-sm text-center
                    ${selected
                      ? 'bg-green-500/30 border-green-400 text-white font-semibold'
                      : hovered && !readOnly
                      ? 'bg-white/20 border-white/40 text-white'
                      : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                    }
                    ${readOnly ? 'cursor-default' : 'cursor-pointer'}
                  `}
                >
                  <div className="font-medium">{alignment.name}</div>
                  {alignment.nameEnglish && (
                    <div className="text-xs mt-1 opacity-80">
                      {alignment.nameEnglish}
                    </div>
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>

      {currentAlignment && (
        <div className="bg-white/10 rounded-lg p-4 border border-white/20">
          <h4 className="font-semibold text-white mb-2">{currentAlignment.name}</h4>
          <p className="text-white/80 text-sm leading-relaxed">
            {currentAlignment.description}
          </p>
        </div>
      )}
    </div>
  )
}

