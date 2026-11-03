/*
 * GUID ↔ gRPC hi-lo conversion.
 *
 * The convention (common in .NET gRPC services): take the GUID's bytes in
 * .NET layout — the first three groups are stored little-endian — then read
 * the first 8 bytes as a little-endian signed int64 ("hi") and the last 8
 * as another ("lo").
 */

const GUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** GUID string → 16 bytes in .NET mixed-endian layout. Throws on invalid input. */
export function guidToBytes(guid: string): Uint8Array {
  const trimmed = guid.trim()
  if (!GUID_RE.test(trimmed)) throw new Error('invalid-guid')
  const hex = trimmed.replace(/-/g, '')
  const raw = new Uint8Array(16)
  for (let i = 0; i < 16; i++) raw[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)

  // .NET stores the first three groups little-endian: reverse 4, 2, 2 bytes.
  const net = new Uint8Array(16)
  for (let i = 0; i < 4; i++) net[i] = raw[3 - i]
  for (let i = 0; i < 2; i++) net[4 + i] = raw[5 - i]
  for (let i = 0; i < 2; i++) net[6 + i] = raw[7 - i]
  net.set(raw.subarray(8), 8)
  return net
}

/** 16 bytes in .NET layout → canonical GUID string. */
export function bytesToGuid(net: Uint8Array): string {
  const raw = new Uint8Array(16)
  for (let i = 0; i < 4; i++) raw[i] = net[3 - i]
  for (let i = 0; i < 2; i++) raw[4 + i] = net[5 - i]
  for (let i = 0; i < 2; i++) raw[6 + i] = net[7 - i]
  raw.set(net.subarray(8), 8)
  const hex = [...raw].map((b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function bytesToInt64LE(bytes: Uint8Array, offset: number): bigint {
  let value = 0n
  for (let i = 7; i >= 0; i--) value = (value << 8n) | BigInt(bytes[offset + i])
  return BigInt.asIntN(64, value)
}

function int64ToBytesLE(value: bigint, out: Uint8Array, offset: number): void {
  let v = BigInt.asUintN(64, value)
  for (let i = 0; i < 8; i++) {
    out[offset + i] = Number(v & 0xffn)
    v >>= 8n
  }
}

export interface HiLo {
  hi: bigint
  lo: bigint
}

export function guidToHiLo(guid: string): HiLo {
  const bytes = guidToBytes(guid)
  return { hi: bytesToInt64LE(bytes, 0), lo: bytesToInt64LE(bytes, 8) }
}

export function hiLoToGuid(hi: bigint, lo: bigint): string {
  const bytes = new Uint8Array(16)
  int64ToBytesLE(hi, bytes, 0)
  int64ToBytesLE(lo, bytes, 8)
  return bytesToGuid(bytes)
}

/** Parses a decimal int64 string, enforcing the signed 64-bit range. */
export function parseInt64(input: string): bigint {
  const trimmed = input.trim()
  if (!/^-?\d+$/.test(trimmed)) throw new Error('invalid-int64')
  const value = BigInt(trimmed)
  if (value > 9223372036854775807n || value < -9223372036854775808n) {
    throw new Error('out-of-range')
  }
  return value
}
