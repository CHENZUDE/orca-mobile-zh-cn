import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { View } from 'react-native'
import { Platform } from 'react-native'
import { loadHosts } from '../transport/host-store'
import {
  startDiagnosticFetchTimeout,
  type DiagnosticFetchTimeout
} from './diagnostic-fetch-timeout'
import { formatEndpoint, testHostReachability, unreachableHostDetail } from './host-reachability'
import type { CheckResult, DiagnosticStatus } from './troubleshoot-view'

export function useTroubleshootDiagnostics() {
  const { t } = useTranslation()
  const [diagnosticStatus, setDiagnosticStatus] = useState<DiagnosticStatus>('idle')
  const [checks, setChecks] = useState<CheckResult[]>([])
  const abortRef = useRef(false)
  const diagnosticRunRef = useRef(0)
  const activeInternetCheckRef = useRef<DiagnosticFetchTimeout | null>(null)

  const rootRef = useCallback((node: View | null): void => {
    if (node !== null) {
      return
    }
    // Why: diagnostics can outlive the screen; cancel the active run when the
    // route detaches without a passive cleanup-only Effect.
    abortRef.current = true
    diagnosticRunRef.current += 1
    activeInternetCheckRef.current?.dispose()
    activeInternetCheckRef.current = null
  }, [])

  const runDiagnostics = useCallback(async () => {
    const runId = diagnosticRunRef.current + 1
    diagnosticRunRef.current = runId
    abortRef.current = false
    activeInternetCheckRef.current?.dispose()
    activeInternetCheckRef.current = null
    setDiagnosticStatus('running')
    setChecks([])

    const results: CheckResult[] = []
    const isCurrentRun = () => !abortRef.current && diagnosticRunRef.current === runId

    try {
      const hosts = await loadHosts()
      results.push(
        hosts.length > 0
          ? { label: t('diagnostics.troubleshoot.checks.pairedHosts.label'), status: 'pass', detail: t('diagnostics.troubleshoot.checks.pairedHosts.paired', { count: hosts.length }) }
          : { label: t('diagnostics.troubleshoot.checks.pairedHosts.label'), status: 'fail', detail: t('diagnostics.troubleshoot.checks.pairedHosts.none') }
      )
    } catch {
      results.push({ label: t('diagnostics.troubleshoot.checks.pairedHosts.label'), status: 'warn', detail: t('diagnostics.troubleshoot.checks.pairedHosts.unreadable') })
    }

    if (!isCurrentRun()) {
      return
    }
    setChecks([...results])

    const internetCheck = startDiagnosticFetchTimeout(5000)
    activeInternetCheckRef.current = internetCheck
    try {
      const resp = await fetch('https://dns.google/resolve?name=example.com&type=A', {
        signal: internetCheck.signal
      })
      if (!isCurrentRun()) {
        return
      }
      results.push(
        resp.ok
          ? { label: t('diagnostics.troubleshoot.checks.internet.label'), status: 'pass', detail: t('diagnostics.troubleshoot.checks.internet.connected') }
          : { label: t('diagnostics.troubleshoot.checks.internet.label'), status: 'warn', detail: t('diagnostics.troubleshoot.checks.internet.unexpected') }
      )
    } catch {
      if (!isCurrentRun()) {
        return
      }
      results.push({ label: t('diagnostics.troubleshoot.checks.internet.label'), status: 'fail', detail: t('diagnostics.troubleshoot.checks.internet.disconnected') })
    } finally {
      internetCheck.dispose()
      if (activeInternetCheckRef.current === internetCheck) {
        activeInternetCheckRef.current = null
      }
    }

    if (!isCurrentRun()) {
      return
    }
    setChecks([...results])

    try {
      const hosts = await loadHosts()
      for (const host of hosts) {
        if (!isCurrentRun()) {
          return
        }
        const reachable = await testHostReachability(host.endpoint)
        if (!isCurrentRun()) {
          return
        }
        results.push({
          label: host.name,
          status: reachable ? 'pass' : 'fail',
          detail: reachable
            ? t('diagnostics.troubleshoot.checks.hosts.reachable', { endpoint: formatEndpoint(host.endpoint) })
            : unreachableHostDetail(host.endpoint)
        })
        setChecks([...results])
      }
    } catch {
      results.push({ label: t('diagnostics.troubleshoot.checks.hosts.label'), status: 'warn', detail: t('diagnostics.troubleshoot.checks.hosts.couldNotTest') })
    }

    if (!isCurrentRun()) {
      return
    }

    results.push({
      label: t('diagnostics.troubleshoot.checks.platform.label'),
      status: 'pass',
      detail: `${Platform.OS} ${Platform.Version ?? ''}`
    })

    setChecks([...results])
    setDiagnosticStatus('done')
  }, [t])

  return { rootRef, diagnosticStatus, checks, runDiagnostics }
}
