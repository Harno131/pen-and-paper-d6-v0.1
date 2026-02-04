'use client'

import { useEffect, useMemo, useState } from 'react'
import { getSkillsByAttribute } from '@/lib/skills'
import { getAvailableSkills } from '@/lib/data'
import { getAvailableSkillsFromSupabase, getGroupSettings } from '@/lib/supabase-data'

const ATTRIBUTES = ['Reflexe', 'Koordination', 'Stärke', 'Wissen', 'Wahrnehmung', 'Ausstrahlung', 'Magie']
const EQUIPMENT_SLOTS = [
  { id: 'head', label: 'Kopf' },
  { id: 'neck', label: 'Hals' },
  { id: 'ears', label: 'Ohren' },
  { id: 'torso', label: 'Oberkoerper' },
  { id: 'legs', label: 'Unterkoerper' },
  { id: 'feet', label: 'Fuesse' },
  { id: 'back', label: 'Ruecken' },
  { id: 'finger_l', label: 'Finger (L)' },
  { id: 'finger_r', label: 'Finger (R)' },
  { id: 'wrists', label: 'Handgelenke' },
  { id: 'ankles', label: 'Fussgelenke' },
  { id: 'main_hand', label: 'Rechte Hand' },
  { id: 'off_hand', label: 'Linke Hand' },
  { id: 'belt', label: 'Guertel' },
]

const stripSkillOrder = (name: string) => {
  const trimmed = name.trim()
  const match = trimmed.match(/^\s*\d+[\).\s-]+(.+)$/)
  return match ? match[1].trim() : trimmed
}
const buildSkillRows = (skills: string[]) => {
  const rows = skills.map((name) => ({ name: stripSkillOrder(name) }))
  const blanks = Array.from({ length: 5 }, () => ({ name: '______________' }))
  return [...rows, ...blanks]
}

const printStyles = `
@page {
  size: A4;
  margin: 12mm;
}
@media print {
  .no-print { display: none !important; }
  .page {
    page-break-after: always;
  }
}
* { box-sizing: border-box; }
body { margin: 0; font-family: Arial, sans-serif; color: #111; }
.page { width: 100%; min-height: 297mm; }
.section { border: 1px solid #222; padding: 8px; margin-bottom: 10px; }
.section-title { font-weight: 700; font-size: 14px; margin-bottom: 6px; }
.fields { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
.field { border-bottom: 1px solid #333; min-height: 22px; }
.matrix { width: 100%; border-collapse: collapse; font-size: 11px; table-layout: fixed; }
.matrix th, .matrix td { border: 1px solid #333; padding: 2px; height: 16px; }
.matrix th { background: #f2f2f2; }
.matrix-wrapper { break-inside: avoid; page-break-inside: avoid; }
.header-center { text-align: center; }
.a4-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 10px; }
.paperdoll { position: relative; height: 320px; border: 1px solid #222; }
.silhouette { position: absolute; left: 50%; top: 40px; transform: translateX(-50%); width: 120px; height: 220px; border: 1px dashed #666; }
.slot { position: absolute; width: 160px; font-size: 10px; }
.slot .line { border-top: 1px solid #333; margin-top: 2px; }
.checkboxes { display: inline-grid; grid-auto-flow: column; gap: 4px; margin-left: 4px; }
.note-box { border: 1px solid #333; min-height: 70px; }
.footer { display: grid; grid-template-columns: 2fr 1fr; gap: 8px; }
`

export default function PrintPage() {
  const [printNotes, setPrintNotes] = useState('')
  const [printTitle, setPrintTitle] = useState('')
  const [skillsByAttribute, setSkillsByAttribute] = useState<Record<string, string[]>>({})

  useEffect(() => {
    const load = async () => {
      const now = new Date()
      const yy = String(now.getFullYear()).slice(-2)
      const mm = String(now.getMonth() + 1).padStart(2, '0')
      const dd = String(now.getDate()).padStart(2, '0')
      const title = `Char-${yy}${mm}${dd}`
      setPrintTitle(title)
      if (typeof document !== 'undefined') {
        document.title = title
      }
      const groupId = typeof window !== 'undefined' ? localStorage.getItem('groupId') : null
      if (!groupId) return
      const settings = await getGroupSettings(groupId)
      setPrintNotes(settings?.printNotes || '')
      const supabaseSkills = await getAvailableSkillsFromSupabase(groupId)
      if (supabaseSkills.length > 0) {
        const grouped: Record<string, string[]> = {}
        supabaseSkills.forEach((skill) => {
          const attr = skill.attribute
          if (!grouped[attr]) grouped[attr] = []
          grouped[attr].push(skill.name)
        })
        Object.keys(grouped).forEach((attr) => {
          grouped[attr] = grouped[attr].sort((a, b) => a.localeCompare(b, 'de'))
        })
        setSkillsByAttribute(grouped)
        return
      }
      const localSkills = getAvailableSkills()
      if (localSkills.length > 0) {
        const grouped: Record<string, string[]> = {}
        localSkills.forEach((skill) => {
          const attr = skill.attribute
          if (!grouped[attr]) grouped[attr] = []
          grouped[attr].push(skill.name)
        })
        Object.keys(grouped).forEach((attr) => {
          grouped[attr] = grouped[attr].sort((a, b) => a.localeCompare(b, 'de'))
        })
        setSkillsByAttribute(grouped)
      }
    }
    load()
  }, [])

  const matrix = useMemo(() => {
    return ATTRIBUTES.map((attr) => ({
      attr,
      rows: buildSkillRows(skillsByAttribute[attr] || getSkillsByAttribute(attr)),
    }))
  }, [skillsByAttribute])

  return (
    <div>
      <style>{printStyles}</style>
      <div className="no-print" style={{ padding: 12, display: 'flex', gap: 8 }}>
        <button
          onClick={() => window.print()}
          style={{
            padding: '8px 12px',
            borderRadius: 6,
            background: '#1d4ed8',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Als PDF drucken
        </button>
        <div style={{ fontSize: 12, color: '#555', alignSelf: 'center' }}>
          Vorschlag Dateiname: {printTitle}
        </div>
      </div>
      <div className="page">
        <div className="section" style={{ textAlign: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/fallcrest-logo.png"
            alt="Fallcrest"
            style={{ maxHeight: '32mm', width: 'auto' }}
          />
        </div>
        <div className="section">
          <div className="fields">
            <div>Name: <div className="field" /></div>
            <div>Volk: <div className="field" /></div>
            <div>Klasse: <div className="field" /></div>
            <div>Alter: <div className="field" /></div>
            <div>Aussehen: <div className="field" /></div>
          </div>
        </div>

        <div className="section">
          {matrix.map((group) => (
            <div key={group.attr} className="matrix-wrapper">
              <table className="matrix">
                <colgroup>
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <col key={`${group.attr}-col-${idx}`} />
                  ))}
                </colgroup>
                <thead>
                  <tr>
                    <th colSpan={8}>{group.attr}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th colSpan={2} style={{ textAlign: 'left' }}>Fertigkeit</th>
                    <th className="header-center">Steigerung</th>
                    <th className="header-center">Kosten</th>
                    <th className="header-center">Wert (Basis)</th>
                    <th className="header-center">Boni</th>
                    <th className="header-center">Mali</th>
                    <th className="header-center">AKTUELL</th>
                  </tr>
                  <tr>
                    <td colSpan={2} style={{ textAlign: 'left' }}>
                      Attributwert: {group.attr}
                    </td>
                    <td />
                    <td />
                    <td />
                    <td />
                    <td />
                    <td />
                  </tr>
                  {group.rows.map((row, idx) => (
                    <tr key={`${group.attr}-${idx}`}>
                      <td colSpan={2} style={{ textAlign: 'left' }}>
                        <div>{row.name}</div>
                      </td>
                      <td />
                      <td />
                      <td />
                      <td />
                      <td />
                      <td />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>

      <div className="page">
        <div className="section">
          <div className="section-title">Ausrüstung (Seite 2)</div>
          <div className="a4-grid">
            <div className="paperdoll">
              <div className="silhouette" />
              {EQUIPMENT_SLOTS.map((slot, idx) => {
                const top = 10 + idx * 20
                return (
                  <div key={slot.id} className="slot" style={{ left: idx % 2 === 0 ? 4 : 'auto', right: idx % 2 === 0 ? 'auto' : 4, top }}>
                    <div>{slot.label}:</div>
                    <div className="line" />
                  </div>
                )
              })}
            </div>
            <div>
              <div className="section-title">Slot-Details</div>
              {EQUIPMENT_SLOTS.map((slot) => (
                <div key={`detail-${slot.id}`} style={{ marginBottom: 6 }}>
                  <strong>{slot.label}</strong>
                  <div>Gegenstand: _______________________</div>
                  <div>RS: ________  Boni: __________________</div>
                  <div>
                    Laediert:
                    <span className="checkboxes">
                      <span>[ ]</span><span>[ ]</span><span>[ ]</span>
                    </span>
                    Verwundet:
                    <span className="checkboxes">
                      <span>[ ]</span><span>[ ]</span><span>[ ]</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="section footer">
          <div>
            <div className="section-title">Notizen & Artefakte</div>
            <div className="note-box" />
            {printNotes && (
              <div style={{ marginTop: 8, fontSize: 11 }}>
                <strong>Stand:</strong> {printNotes}
              </div>
            )}
          </div>
          <div>
            <div className="section-title">Waehrung</div>
            <div>1g = 10s = 100k</div>
          </div>
        </div>
      </div>
    </div>
  )
}
