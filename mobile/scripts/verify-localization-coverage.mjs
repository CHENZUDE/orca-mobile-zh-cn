// Why: regenerating the audit data without dynamic import. We re-run the
// audit script via spawnSync so the script's own cwd / output paths stay
// in sync with the developer workflow. Re-importing its module would
// require re-implementing its argv-driven main().

import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const here = import.meta.dirname
const REPO_ROOT = resolve(here, '..', '..')
const AUDIT_SCRIPT = resolve(REPO_ROOT, 'mobile', 'scripts', 'audit-localization-candidates.mjs')
const RAW_JSON = resolve(REPO_ROOT, '.tmp', 'mobile-i18n', 'candidates', 'raw.json')

const BRAND_ALLOWLIST = new Set(['Orca', 'onOrca.dev', 'stablyai/orca'])
const MODIFIER_ALLOWLIST = new Set(['Cmd', 'Ctrl', 'Alt', 'Shift'])
const I18N_KEY_RE = /^(common|app|pairing|home|onboarding|settings|host|diagnostics)\./
const IN_SCOPE_MODULES = new Set(['app', 'home', 'pairing', 'onboarding', 'settings', 'diagnostics', 'notifications', 'about'])

function isTestFile(file) {
  return /\.test\.[a-z]+$/.test(file) || /\.spec\.[a-z]+$/.test(file) || /__tests__\//.test(file)
}

function isAllowlisted(text) {
  return BRAND_ALLOWLIST.has(text) || MODIFIER_ALLOWLIST.has(text) || I18N_KEY_RE.test(text)
}

const res = spawnSync(process.execPath, [AUDIT_SCRIPT], {
  cwd: REPO_ROOT,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe']
})

if (res.status !== 0) {
  console.error('audit-localization-candidates.mjs failed:')
  console.error(res.stderr)
  process.exit(1)
}

const raw = await readFile(RAW_JSON, 'utf8')
const hits = JSON.parse(raw)

const failures = []
for (const h of hits) {
  if (h.priority !== 'high') {
    continue
  }
  if (!IN_SCOPE_MODULES.has(h.module)) {
    continue
  }
  if (isTestFile(h.file)) {
    continue
  }
  if (isAllowlisted(h.text)) {
    continue
  }
  failures.push({ module: h.module, file: h.file, line: h.line, pattern: h.pattern, text: h.text })
}

if (failures.length === 0) {
  console.log(`OK coverage gate: ${hits.length} candidates, 0 in-scope misses`)
  process.exit(0)
}

console.error(`Coverage gate failed: ${failures.length} in-scope high-priority literal(s) not lifted to i18n keys:`)
for (const f of failures) {
  console.error(`  ${f.file}:${f.line}  [${f.module}/${f.pattern}]  ${JSON.stringify(f.text.slice(0, 100))}`)
}
process.exit(1)
