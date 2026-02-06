import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const MASTER_NAME = 'Flori'
const COOKIE_NAME = 'rbm_auth'
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7

const getSecret = () => process.env.RBM_PASSWORD || ''

const signToken = (payload: string, secret: string) => {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

const timingSafeEqual = (a: string, b: string) => {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return crypto.timingSafeEqual(aBuf, bBuf)
}

const verifyToken = (token: string, secret: string) => {
  const parts = token.split(':')
  if (parts.length !== 3) return false
  const [playerName, exp, sig] = parts
  if (!playerName || !exp || !sig) return false
  if (playerName !== MASTER_NAME) return false
  const expValue = Number(exp)
  if (!Number.isFinite(expValue) || expValue <= Date.now()) return false
  const expectedSig = signToken(`${playerName}:${exp}`, secret)
  return timingSafeEqual(expectedSig, sig)
}

export const validateMasterCredentials = (playerName?: string | null, password?: string | null) => {
  const expected = getSecret()
  if (!expected) {
    return { ok: false, error: 'RBM_PASSWORD fehlt in der Umgebung.' }
  }
  if (!playerName || playerName.trim() !== MASTER_NAME) {
    return { ok: false, error: 'Nicht als Rule-Book-Master angemeldet.' }
  }
  if (!password || password !== expected) {
    return { ok: false, error: 'Rule-Book-Master-Passwort ist falsch.' }
  }
  return { ok: true }
}

export const validateMasterFromRequest = (request: NextRequest) => {
  const expected = getSecret()
  if (!expected) {
    return { ok: false, error: 'RBM_PASSWORD fehlt in der Umgebung.' }
  }
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token || !verifyToken(token, expected)) {
    return { ok: false, error: 'Nicht als Rule-Book-Master angemeldet.' }
  }
  return { ok: true }
}

export const issueMasterCookie = (response: NextResponse, playerName: string) => {
  const secret = getSecret()
  if (!secret) {
    throw new Error('RBM_PASSWORD fehlt in der Umgebung.')
  }
  const expiresAt = Date.now() + TOKEN_TTL_SECONDS * 1000
  const payload = `${playerName}:${expiresAt}`
  const signature = signToken(payload, secret)
  const token = `${payload}:${signature}`
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: TOKEN_TTL_SECONDS,
    path: '/',
  })
}
