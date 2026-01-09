'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import { testSupabaseConnection, checkTables } from '@/lib/supabase-debug'

export default function DebugPage() {
  const [supabaseUrl, setSupabaseUrl] = useState<string>('')
  const [supabaseKey, setSupabaseKey] = useState<string>('')
  const [connectionTest, setConnectionTest] = useState<any>(null)
  const [tablesCheck, setTablesCheck] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Prüfe Umgebungsvariablen
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'NICHT GESETZT'
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
      ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` 
      : 'NICHT GESETZT'
    
    setSupabaseUrl(url)
    setSupabaseKey(key)

    // Teste Verbindung automatisch
    testConnection()
  }, [])

  const testConnection = async () => {
    setLoading(true)
    const test = await testSupabaseConnection()
    setConnectionTest(test)
    
    if (test.success) {
      const tables = await checkTables()
      setTablesCheck(tables)
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-white mb-8">🔧 Debug-Informationen</h1>

        {/* Umgebungsvariablen */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">Umgebungsvariablen</h2>
          <div className="space-y-2">
            <div>
              <span className="text-white/70">NEXT_PUBLIC_SUPABASE_URL:</span>
              <span className={`ml-2 ${supabaseUrl === 'NICHT GESETZT' ? 'text-red-400' : 'text-green-400'}`}>
                {supabaseUrl}
              </span>
            </div>
            <div>
              <span className="text-white/70">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
              <span className={`ml-2 ${supabaseKey === 'NICHT GESETZT' ? 'text-red-400' : 'text-green-400'}`}>
                {supabaseKey}
              </span>
            </div>
          </div>
        </div>

        {/* Verbindungstest */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Supabase-Verbindung</h2>
            <button
              onClick={testConnection}
              disabled={loading}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 text-white rounded-lg"
            >
              {loading ? 'Teste...' : 'Neu testen'}
            </button>
          </div>
          
          {connectionTest && (
            <div className={`p-4 rounded-lg ${connectionTest.success ? 'bg-green-600/20 border border-green-600' : 'bg-red-600/20 border border-red-600'}`}>
              <p className={`font-semibold ${connectionTest.success ? 'text-green-400' : 'text-red-400'}`}>
                {connectionTest.success ? '✅ Verbindung erfolgreich' : '❌ Verbindung fehlgeschlagen'}
              </p>
              {connectionTest.error && (
                <p className="text-white/80 mt-2">{connectionTest.error}</p>
              )}
              {connectionTest.details && (
                <details className="mt-2">
                  <summary className="text-white/70 cursor-pointer">Details anzeigen</summary>
                  <pre className="mt-2 text-xs text-white/60 bg-black/20 p-2 rounded overflow-auto">
                    {JSON.stringify(connectionTest.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>

        {/* Tabellen-Check */}
        {tablesCheck && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">Tabellen-Status</h2>
            {tablesCheck.missing.length === 0 ? (
              <p className="text-green-400">✅ Alle Tabellen existieren</p>
            ) : (
              <div>
                <p className="text-red-400 mb-2">❌ Fehlende Tabellen:</p>
                <ul className="list-disc list-inside text-white/80">
                  {tablesCheck.missing.map((table: string) => (
                    <li key={table}>{table}</li>
                  ))}
                </ul>
                <p className="text-white/70 mt-4 text-sm">
                  💡 Führe das SQL-Schema in Supabase SQL Editor aus: <code className="bg-black/20 px-2 py-1 rounded">supabase/migrations/001_initial_schema.sql</code>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Anleitung */}
        <div className="bg-yellow-600/20 backdrop-blur-lg rounded-xl p-6 border border-yellow-600">
          <h2 className="text-2xl font-bold text-white mb-4">📋 Nächste Schritte</h2>
          <ol className="list-decimal list-inside space-y-2 text-white/80">
            <li>Prüfe ob Umgebungsvariablen in Vercel eingetragen sind</li>
            <li>Prüfe ob Supabase-Tabellen existieren</li>
            <li>Prüfe RLS-Policies in Supabase</li>
            <li>Redeploy in Vercel ausführen</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
