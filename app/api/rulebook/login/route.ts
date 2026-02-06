import { NextRequest, NextResponse } from 'next/server'
import { issueMasterCookie, validateMasterCredentials } from '../utils'

export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { playerName, password } = body || {}
    const auth = validateMasterCredentials(playerName, password)
    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      )
    }
    const response = NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } })
    issueMasterCookie(response, playerName.trim())
    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
    return NextResponse.json(
      { error: 'Login fehlgeschlagen.', details: message },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
