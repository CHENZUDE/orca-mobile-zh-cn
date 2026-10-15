import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const REPO_ROOT = resolve(__dirname, '..', '..')
const CATALOG = resolve(REPO_ROOT, 'mobile', 'scripts', 'verify-localization-catalog.mjs')
const COVERAGE = resolve(REPO_ROOT, 'mobile', 'scripts', 'verify-localization-coverage.mjs')
const COMBINED = resolve(REPO_ROOT, 'mobile', 'scripts', 'verify-localization.mjs')

function run(scriptPath) {
  return spawnSync(process.execPath, [scriptPath], {
    cwd: REPO_ROOT,
    encoding: 'utf8'
  })
}

describe('mobile verify-localization scripts', () => {
  it('verify-localization-catalog.mjs exits 0 against current catalog', () => {
    const res = run(CATALOG)
    expect(res.status, res.stderr || res.stdout).toBe(0)
    expect(res.stdout).toMatch(/Checked \d+ en keys; missing=0/)
  })

  it('verify-localization-coverage.mjs exits 0 against current source', () => {
    // Why: this depends on the audit script which scans mobile/src + mobile/app.
    // If new high-priority screens add non-translatable literals, the gate
    // must fail loudly here, not just in CI.
    const res = run(COVERAGE)
    expect(res.status, res.stderr || res.stdout).toBe(0)
    expect(res.stdout).toMatch(/coverage gate: \d+ candidates, 0 in-scope misses/)
  })

  it('verify-localization.mjs runs both gates in sequence', () => {
    const res = run(COMBINED)
    expect(res.status, res.stderr || res.stdout).toBe(0)
    expect(res.stdout).toMatch(/localization gates: catalog parity \+ coverage/)
  })
})
