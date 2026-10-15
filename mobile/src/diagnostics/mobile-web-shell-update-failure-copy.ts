import type { MobileWebBundleErrorCode } from '../../../src/shared/mobile-web-bundle/bundle-rpc-contract'
type Translator = (k: string, opts?: Record<string, unknown>) => string
import { BUILD_ID_PREFIX_LENGTH } from '../mobile-web-shell/mobile-web-shell-dev-facts'
import type {
  MobileWebShellUpdateFailure,
  MobileWebShellUpdateFailureOutcome,
  MobileWebShellUpdateFailureReason,
  MobileWebShellUpdateFailureWall
} from '../mobile-web-shell/mobile-web-shell-update-failure'
import { formatTimeAgo } from '../worktree/agent-row-display'

/** Each phrase restates the recorded code and nothing more: this row claims only what was written. */
function reasonCopy(t: Translator, reason: MobileWebShellUpdateFailureReason): string {
  return t(`settings.diagnostics.shell.reason.${reason}`)
}

function hostCodeCopy(t: Translator, code: MobileWebBundleErrorCode): string {
  return t(`settings.diagnostics.shell.hostCode.${code}`)
}

function wallCopy(t: Translator, wall: MobileWebShellUpdateFailureWall): string {
  return t(`settings.diagnostics.shell.wall.${wall}`)
}

function generation(buildId: string): string {
  return `${buildId.slice(0, BUILD_ID_PREFIX_LENGTH)}…`
}

function outcomeCopy(t: Translator, failure: MobileWebShellUpdateFailure): string {
  const outcome: MobileWebShellUpdateFailureOutcome = failure.outcome
  switch (outcome) {
    case 'opened-cached':
      return failure.cachedBuildId === null
        ? t('settings.diagnostics.shell.outcome.fellBack')
        : t('settings.diagnostics.shell.outcome.fellBackGeneration', { generation: generation(failure.cachedBuildId) })
    case 'wall':
      return failure.wall === null
        ? t('settings.diagnostics.shell.outcome.blocked')
        : t('settings.diagnostics.shell.outcome.blockedReason', { reason: wallCopy(t, failure.wall) })
    case 'native-route':
      return t('settings.diagnostics.shell.outcome.nativeRoute')
    case 'failed':
      return t('settings.diagnostics.shell.outcome.failed')
    case 'waiting':
      return t('settings.diagnostics.shell.outcome.waiting')
  }
}

/** "Last update from Host 1 failed 12m ago: asset checksum mismatch (generation 3f2a…)." plus what
 *  the shell showed instead. */
export function formatUpdateFailure(
  failure: MobileWebShellUpdateFailure,
  hostName: string,
  now: number,
  t: Translator
): string {
  const ago = formatTimeAgo(failure.at, now)
  const when = ago === 'just now' ? t('settings.diagnostics.shell.justNow') : t('settings.diagnostics.shell.ago', { ago })
  const reason =
    failure.hostCode === null
      ? reasonCopy(t, failure.reason)
      : hostCodeCopy(t, failure.hostCode)
  const offered =
    failure.offeredBuildId === null
      ? ''
      : t('settings.diagnostics.shell.generationSuffix', { generation: generation(failure.offeredBuildId) })
  return t('settings.diagnostics.shell.summary', {
    hostName,
    when,
    reason,
    offered,
    outcome: outcomeCopy(t, failure)
  })
}
