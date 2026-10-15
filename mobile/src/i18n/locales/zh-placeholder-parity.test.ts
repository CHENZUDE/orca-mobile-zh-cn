import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import enCatalog from './en.json'

// Why: i18next interpolates {{name}} / {{count}} at runtime. A zh translation
// that drops or renames a placeholder renders "undefined" or stale text on the
// user's screen. Locking the placeholder set per leaf at test time so the
// verify-localization-catalog.mjs gate and this vitest run cover the same
// invariant through two independent paths.
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

function placeholders(s) {
  const re = /\{\{([^}]+)\}\}/g
  const set = new Set()
  let m
  while ((m = re.exec(s))) {
    set.add(m[1])
  }
  return [...set].sort()
}

const en = enCatalog
const zh = JSON.parse(readFileSync(resolve(__dirname, 'zh.json'), 'utf8'))
const enFlat = flatten(en, '', {})
const zhFlat = flatten(zh, '', {})

describe('zh placeholder parity', () => {
  it('matches en placeholder set per leaf', () => {
    const mismatches = []
    for (const key of Object.keys(enFlat)) {
      if (enFlat[key] === '') {
        continue
      }
      if (typeof zhFlat[key] !== 'string') {
        continue
      }
      const enPh = placeholders(enFlat[key]).join(',')
      const zhPh = placeholders(zhFlat[key]).join(',')
      if (enPh !== zhPh) {
        mismatches.push(`${key}: en={${enPh}} zh={${zhPh}}`)
      }
    }
    expect(mismatches, mismatches.join('\n')).toEqual([])
  })

  it('keeps the plural suffix set consistent between en and zh', () => {
    // Why: en declares plural forms {x, x_other} or {x_one, x_other};
    // whatever en declares, zh must declare the same set, otherwise i18next
    // falls back to en for the missing branch and the user sees English
    // when the count is in the missing range.
    function pluralBase(k) {
      return k.replace(/_(one|other|few|many|zero|two)$/, '')
    }
    const enPlurals = new Set(
      Object.keys(enFlat).filter((k) => /_(one|other|few|many|zero|two)$/.test(k)).map(pluralBase)
    )
    const zhPlurals = new Set(
      Object.keys(zhFlat).filter((k) => /_(one|other|few|many|zero|two)$/.test(k)).map(pluralBase)
    )
    const missingInZh = []
    for (const b of enPlurals) {
      if (!zhPlurals.has(b)) {
        missingInZh.push(b)
      }
    }
    const extraInZh = []
    for (const b of zhPlurals) {
      if (!enPlurals.has(b)) {
        extraInZh.push(b)
      }
    }
    expect({ missingInZh, extraInZh }).toEqual({ missingInZh: [], extraInZh: [] })
  })
})
