import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import enCatalog from './en.json'

// Why: every non-empty en leaf must have a non-empty zh counterpart. A
// rollout gate inside vitest runs on every PR, mirroring the desktop
// locale-translation-policy.mjs requirement.
function flatten(obj, prefix, out) {
  if (!obj || typeof obj !== 'object') {
  return out
}
  prefix = prefix || ''
  out = out || {}
  for (const k of Object.keys(obj)) {
    const next = prefix ? prefix + '.' + k : k
    flatten(obj[k], next, out)
  }
  return out
}

const en = enCatalog
const zh = JSON.parse(readFileSync(resolve(__dirname, 'zh.json'), 'utf8'))
const enFlat = flatten(en, '', {})
const zhFlat = flatten(zh, '', {})

describe('zh coverage', () => {
  it('mirrors every en leaf key in zh', () => {
    const missing = []
    for (const key of Object.keys(enFlat)) {
      if (enFlat[key] === '') {
      continue
    }
      if (!(key in zhFlat) || zhFlat[key] === undefined || zhFlat[key] === null) {
        missing.push(key)
      }
    }
    expect(missing, `missing zh keys: ${missing.join(', ')}`).toEqual([])
  })

  it('has no zh-only leaf keys without an en counterpart', () => {
    const extras = []
    for (const key of Object.keys(zhFlat)) {
      if (!(key in enFlat)) {
        extras.push(key)
      }
    }
    expect(extras, `extra zh keys: ${extras.join(', ')}`).toEqual([])
  })

  it('every non-empty en leaf has a non-empty zh translation', () => {
    const empty = []
    for (const key of Object.keys(enFlat)) {
      if (enFlat[key] === '') {
      continue
    }
      if (typeof zhFlat[key] !== 'string' || zhFlat[key] === '') {
        empty.push(key)
      }
    }
    expect(empty, `empty zh values: ${empty.join(', ')}`).toEqual([])
  })
})
