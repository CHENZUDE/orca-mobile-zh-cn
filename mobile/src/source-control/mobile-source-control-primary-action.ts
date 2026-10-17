import {
  resolveSourceControlCommitAreaPrimaryActionDecision,
  type SourceControlCommitAreaPrimaryActionDecision,
  type SourceControlRemoteOpKind
} from '../../../src/shared/source-control-primary-action-decision'
import type { MobileGitBranchCompareResult } from './mobile-branch-compare'
import type { MobileGitStatusResult } from './mobile-git-status'

type GitStep = { method: string; params?: Record<string, unknown> }

type MobileSourceControlPrimaryActionKind = SourceControlCommitAreaPrimaryActionDecision['kind']
type MobileSourceControlPrimaryActionDecision = SourceControlCommitAreaPrimaryActionDecision
type MobileSourceControlRemoteOpKind = SourceControlRemoteOpKind

export type MobileSourceControlPrimaryAction = {
  kind: MobileSourceControlPrimaryActionKind
  /** i18n key; the caller resolves it in the reader language. */
  label: string
  accessibilityLabel: string
  accessibilityHint: string
  /** Interpolation values for the counted hint keys. */
  accessibilityHintValues?: Record<string, string | number>
  disabled: boolean
  loading: boolean
  requiresForceWithLease?: boolean
  onPress: () => void
}

export type MobileSourceControlPrimaryActionHandlers = {
  commit: () => Promise<boolean>
  stageAll: () => Promise<void>
  runActionSheetGitSequence: (actionId: string, steps: GitStep[]) => Promise<void>
  runActionSheetGitSync: () => Promise<void>
}

export type MobileSourceControlPrimaryActionArgs = {
  status: MobileGitStatusResult | null
  hasUnresolvedConflicts: boolean
  stageablePaths: readonly string[]
  stagedCount: number
  unstagedCount: number
  commitMessage: string
  busyAction: string | null
  openingPath: string | null
  openingBranchPath: string | null
  branchCompareResult: MobileGitBranchCompareResult | null
  handlers: MobileSourceControlPrimaryActionHandlers
}

export function buildMobileSourceControlPrimaryAction(
  args: MobileSourceControlPrimaryActionArgs
): MobileSourceControlPrimaryAction {
  const decision = resolveSourceControlCommitAreaPrimaryActionDecision({
    stagedCount: args.stagedCount,
    hasUnstagedChanges: args.unstagedCount > 0,
    hasStageableChanges: args.stageablePaths.length > 0,
    // Why: the commit-area decision keeps the desktop input shape, but partial
    // staging only matters to commit eligibility/dropdowns. Avoid an extra entry scan.
    hasPartiallyStagedChanges: false,
    hasMessage: args.commitMessage.trim().length > 0,
    hasUnresolvedConflicts: args.hasUnresolvedConflicts,
    isCommitting: args.busyAction === 'commit',
    isRemoteOperationActive: isMobileRemoteOperationActive(args.busyAction),
    inFlightRemoteOpKind: getInFlightRemoteOpKind(args.busyAction),
    upstreamStatus: args.status?.upstreamStatus,
    branchCommitsAhead: getMobileBranchCommitsAhead(args),
    hasCurrentBranch: Boolean(args.status?.branch)
  })
  const ioBusy =
    args.busyAction !== null || args.openingPath !== null || args.openingBranchPath !== null
  const disabled = decision.disabled || ioBusy

  return {
    kind: decision.kind,
    label: getMobilePrimaryActionLabel(decision),
    accessibilityLabel: getMobilePrimaryActionLabel(decision),
    accessibilityHint: getMobilePrimaryActionHint(decision),
    accessibilityHintValues: getMobilePrimaryActionHintValues(decision),
    disabled,
    loading: isLoadingDecision(decision, args.busyAction),
    requiresForceWithLease: decision.requiresForceWithLease,
    onPress: () => {
      if (disabled) {
        return
      }
      void runMobilePrimaryAction(decision, args.handlers)
    }
  }
}

function isMobileRemoteOperationActive(busyAction: string | null): boolean {
  return getInFlightRemoteOpKind(busyAction) !== null
}

function getInFlightRemoteOpKind(
  busyAction: string | null
): MobileSourceControlRemoteOpKind | null {
  switch (busyAction) {
    case 'push':
    case 'commit-push':
    case 'push-create-pr':
      return 'push'
    case 'force-push':
      return 'force_push'
    case 'pull':
      return 'pull'
    case 'sync':
    case 'commit-sync':
      return 'sync'
    case 'fetch':
      return 'fetch'
    case 'publish':
      return 'publish'
    case 'fast-forward':
      return 'fast_forward'
    case 'rebase':
      return 'rebase'
    default:
      return null
  }
}

function getMobileBranchCommitsAhead(
  args: MobileSourceControlPrimaryActionArgs
): number | undefined {
  const summary = args.branchCompareResult?.summary
  if (summary?.status === 'ready' && summary.commitsAhead !== undefined) {
    return summary.commitsAhead
  }
  const upstream = args.status?.upstreamStatus
  return upstream?.hasUpstream ? upstream.ahead : undefined
}

// Why: returns i18n keys so the .tsx caller localizes them; this module is a pure helper.
function getMobilePrimaryActionLabel(decision: MobileSourceControlPrimaryActionDecision): string {
  if (decision.requiresForceWithLease) {
    return 'git.primary.forcePush'
  }
  switch (decision.kind) {
    case 'commit':
      return 'git.primary.commit'
    case 'stage':
      return 'git.stageAll'
    case 'push':
      return 'git.primary.push'
    case 'pull':
      return 'git.primary.pull'
    case 'sync':
      return 'git.primary.sync'
    case 'publish':
      return 'git.primary.publishBranch'
  }
}

// Counted hints interpolate their numbers; the locale string owns the wording.
function getMobilePrimaryActionHintValues(
  decision: MobileSourceControlPrimaryActionDecision
): Record<string, string | number> | undefined {
  switch (decision.titleIntent) {
    case 'sync_counts':
      return { behind: decision.behind ?? 0, ahead: decision.ahead ?? 0 }
    case 'pull_count':
    case 'push_count':
      return { count: decision.count ?? 0 }
    default:
      return undefined
  }
}

function getMobilePrimaryActionHint(decision: MobileSourceControlPrimaryActionDecision): string {
  switch (decision.titleIntent) {
    case 'commit_in_progress':
      return 'git.primary.hintCommitInProgress'
    case 'force_push_in_progress':
      return 'git.primary.hintForcePushInProgress'
    case 'action_in_progress':
    case 'remote_operation_in_progress':
      return 'git.primary.hintRemoteInProgress'
    case 'remote_operation_blocks_commit':
      return 'git.primary.hintRemoteBlocksCommit'
    case 'resolve_conflicts_before_commit':
      return 'git.primary.hintResolveConflicts'
    case 'commit_staged_changes':
      return 'git.primary.hintCommitStaged'
    case 'enter_commit_message':
      return 'git.primary.hintEnterMessage'
    case 'stage_all_changes':
      return 'git.primary.hintStageAll'
    case 'stage_file_to_commit':
      return 'git.primary.hintStageOneFile'
    case 'checkout_branch_before_publish':
      return 'git.primary.hintCheckoutBeforePublish'
    case 'checking_review_status':
      return 'git.primary.hintCheckingReview'
    case 'review_already_merged':
      return 'git.primary.hintReviewMerged'
    case 'publish_branch':
      return 'git.primary.hintPublishBranch'
    case 'push_linked_review':
      return 'git.primary.hintPushLinkedReview'
    case 'linked_review_target_unavailable':
      return 'git.primary.hintLinkedReviewUnavailable'
    case 'force_push_with_lease':
      return 'git.primary.hintForcePushWithLease'
    case 'sync_counts':
      return 'git.primary.hintSyncCounts'
    case 'pull_count':
      return 'git.primary.hintPullCount'
    case 'push_count':
      return 'git.primary.hintPushCount'
    case 'nothing_to_commit_up_to_date':
      return 'git.primary.hintNothingToCommit'
  }
}

function isLoadingDecision(
  decision: MobileSourceControlPrimaryActionDecision,
  busyAction: string | null
): boolean {
  switch (decision.kind) {
    case 'commit':
      return busyAction === 'commit'
    case 'stage':
      return busyAction === 'stage-all'
    case 'push':
      return (
        busyAction === 'push' ||
        busyAction === 'force-push' ||
        busyAction === 'commit-push' ||
        busyAction === 'push-create-pr'
      )
    case 'pull':
      return busyAction === 'pull'
    case 'sync':
      return busyAction === 'sync' || busyAction === 'commit-sync'
    case 'publish':
      return busyAction === 'publish'
  }
}

async function runMobilePrimaryAction(
  decision: MobileSourceControlPrimaryActionDecision,
  handlers: MobileSourceControlPrimaryActionHandlers
): Promise<void> {
  switch (decision.kind) {
    case 'commit':
      await handlers.commit()
      return
    case 'stage':
      await handlers.stageAll()
      return
    case 'push': {
      const params = decision.requiresForceWithLease ? { forceWithLease: true } : undefined
      await handlers.runActionSheetGitSequence(
        decision.requiresForceWithLease ? 'force-push' : 'push',
        [{ method: 'git.push', params }]
      )
      return
    }
    case 'pull':
      await handlers.runActionSheetGitSequence('pull', [{ method: 'git.pull' }])
      return
    case 'sync':
      await handlers.runActionSheetGitSync()
      return
    case 'publish':
      await handlers.runActionSheetGitSequence('publish', [
        { method: 'git.push', params: { publish: true } }
      ])
      return
  }
}
