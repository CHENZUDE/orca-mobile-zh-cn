// Why: a single entry point for both catalog parity and coverage, runnable
// from CI and from `pnpm lint`. The two scripts use the same raw.json
// artifact so the second one is free; running them in sequence also
// surfaces both failure messages in a single CI run instead of one round
// trip per gate.
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

const here = import.meta.dirname
const REPO_ROOT = resolve(here, '..', '..')
const CATALOG = resolve(REPO_ROOT, 'mobile', 'scripts', 'verify-localization-catalog.mjs')
const COVERAGE = resolve(REPO_ROOT, 'mobile', 'scripts', 'verify-localization-coverage.mjs')

function run(scriptPath, label) {
  const res = spawnSync(process.execPath, [scriptPath], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  })
  const out = (res.stdout || '').trim()
  const err = (res.stderr || '').trim()
  if (out) {
    console.log(out)
  }
  if (err) {
    console.error(err)
  }
  if (res.status !== 0) {
    console.error(`${label} failed (exit ${res.status})`)
    process.exit(res.status)
  }
}

run(CATALOG, 'verify-localization-catalog.mjs')
run(COVERAGE, 'verify-localization-coverage.mjs')
console.log('OK localization gates: catalog parity + coverage')
