'use client'

import { useState } from 'react'

interface GmGroupSelectorProps {
  onLoadGroup: () => void
  onCreateGroup: () => void
  onCancel: () => void
}

export default function GmGroupSelector({ onLoadGroup, onCreateGroup, onCancel }: GmGroupSelectorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Spielleiter
        </h2>
        
        <div className="space-y-4">
          <button
            onClick={onLoadGroup}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            Gruppe laden
          </button>
          
          <button
            onClick={onCreateGroup}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            Gruppe neu erstellen
          </button>
          
          <button
            onClick={onCancel}
            className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Zurück
          </button>
        </div>
      </div>
    </div>
  )
}
