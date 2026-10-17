import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import { KeyboardAvoidingView, Pressable, Text, TextInput, View } from 'react-native'
import { Check, Copy, FileText, Plus, Send, Trash2, X } from 'lucide-react-native'
import type { DiffComment } from '../../../src/shared/diff-comment-types'
import { colors } from '../theme/mobile-theme'
import type { ActionSheetAction } from './ActionSheetModal'
import { ActionSheetContent } from './ActionSheetModal'
import { ConfirmContent } from './ConfirmModal'
import { KeyedBottomDrawer } from './keyed-bottom-drawer'
import { AGENT_LAUNCH_STATUS_UNREADABLE_MESSAGE } from '../session/mobile-existing-agent-launch'
import {
  mobileReviewCountLabel,
  type ComposerState,
  type SendSheetState
} from '../session/mobile-diff-review-screen-model'
import { reviewSheetKey, type ReviewSheet } from '../session/mobile-diff-review-sheets'
import type { useMobileDiffReviewController } from '../session/use-mobile-diff-review-controller'
import { mobileDiffReviewStyles as styles } from './mobile-diff-review-screen-styles'
import { hostOs } from '../platform/host-os'
import { useWorkspaceOnPairedHost } from '../navigation/workspace-execution-host'

type Props = {
  controller: ReturnType<typeof useMobileDiffReviewController>
}

export function MobileDiffReviewDrawers({ controller }: Props) {
  // One drawer for every review sheet: iOS cannot present a sheet while another is still closing.
  return (
    <KeyedBottomDrawer
      sheet={controller.sheet}
      sheetKey={reviewSheetKey}
      onClose={(presented) => controller.closeSheet(presented.kind)}
    >
      {(presented) => <ReviewSheetContent controller={controller} sheet={presented} />}
    </KeyedBottomDrawer>
  )
}

function ReviewSheetContent({ controller, sheet }: Props & { sheet: ReviewSheet }) {
  const { t } = useTranslation()

  switch (sheet.kind) {
    case 'actions':
      return <ReviewActionsContent controller={controller} />
    case 'send':
      return <SendNotesContent controller={controller} load={sheet.load} />
    case 'discard':
      return (
        <ConfirmContent
          title={t('diffReview.drawers.discardTitle')}
          message={t('diffReview.drawers.discardMessage', { path: sheet.target.filePath })}
          confirmLabel={t('diffReview.footer.discard')}
          destructive
          onConfirm={() => {
            controller.closeSheet('discard')
            void controller.runGitMutation('git.discard', sheet.target)
          }}
          onCancel={() => controller.closeSheet('discard')}
        />
      )
    case 'composer':
      return <NoteComposerContent controller={controller} composer={sheet.composer} />
    case 'completion':
      return <CompletionContent controller={controller} />
  }
}

function ReviewActionsContent({ controller }: Props) {
  const { t } = useTranslation()

  const overflowActions = useOverflowActions(controller)
  return (
    <ActionSheetContent
      title={t('diffReview.drawers.reviewActions')}
      message={
        controller.reviewedUnstagedCount > 0
          ? t('diffReview.drawers.reviewedUnstagedCanStage', {
              count: controller.reviewedUnstagedCount
            })
          : undefined
      }
      actions={overflowActions}
      onClose={() => controller.closeSheet('actions')}
    />
  )
}

function SendNotesContent({ controller, load }: Props & { load: SendSheetState }) {
  const { t } = useTranslation()

  const sendActions = useSendActions(controller, load)
  return (
    <ActionSheetContent
      title={t('diffReview.drawers.sendNotes')}
      message={sendSheetMessage(controller, load, t)}
      actions={sendActions}
      onClose={() => controller.closeSheet('send')}
    />
  )
}

function useSendActions(
  controller: ReturnType<typeof useMobileDiffReviewController>,
  load: SendSheetState
) {
  const { t } = useTranslation()
  return useMemo<ActionSheetAction[]>(() => {

    const comments = controller.unsentComments
    const terminalActions =
      load.kind === 'ready' || load.kind === 'error'
        ? load.terminals.map((terminal) => ({
            label: `${terminal.title || t('diffReview.drawers.terminal')} (${terminal.terminal.slice(0, 6)})`,
            icon: Send,
            disabled: comments.length === 0,
            skipAutoClose: true,
            onPress: () => void controller.sendPromptToTerminal(terminal.terminal, comments)
          }))
        : []
    return [
      ...terminalActions,
      {
        label: t('diffReview.drawers.newAgentSession'),
        icon: Plus,
        disabled: comments.length === 0 || controller.agentLaunchAvailability !== 'available',
        ...(controller.agentLaunchAvailability === 'update-required'
          ? { hint: t('diffReview.drawers.updateOrcaOnComputer') }
          : controller.agentLaunchAvailability === 'unverified'
            ? { hint: AGENT_LAUNCH_STATUS_UNREADABLE_MESSAGE }
            : {}),
        skipAutoClose: true,
        onPress: () => void controller.createTerminalAndSend(comments)
      },
      {
        label: t('diffReview.drawers.copyNotes'),
        icon: Copy,
        disabled:
          controller.screenState.kind !== 'ready' || controller.screenState.comments.length === 0,
        onPress: () => void controller.copyNotes()
      }
    ]
  }, [controller, load])
}

function useOverflowActions(controller: ReturnType<typeof useMobileDiffReviewController>) {
  const sessionTabsAvailable = useWorkspaceOnPairedHost()
  const { t } = useTranslation()

  return useMemo<ActionSheetAction[]>(
    () => [
      {
        label: t('diffReview.drawers.copyNotes'),
        icon: Copy,
        disabled:
          controller.screenState.kind !== 'ready' || controller.screenState.comments.length === 0,
        onPress: () => void controller.copyNotes()
      },
      {
        label: t('diffReview.drawers.sendUnsentNotes'),
        icon: Send,
        disabled: controller.unsentComments.length === 0,
        onPress: () => void controller.openSendSheet()
      },
      {
        label: t('diffReview.drawers.clearSentNotes'),
        icon: Trash2,
        disabled:
          controller.screenState.kind !== 'ready' ||
          controller.screenState.comments.every((comment) => comment.sentAt === undefined),
        skipAutoClose: true,
        onPress: () => void controller.clearSentNotes()
      },
      {
        label: t('diffReview.drawers.stageReviewedFiles'),
        icon: Check,
        disabled: controller.reviewedUnstagedCount === 0 || controller.busyAction !== null,
        skipAutoClose: true,
        onPress: () => void controller.stageReviewedFiles()
      },
      {
        label: t('diffReview.drawers.markUnreviewed'),
        icon: X,
        disabled:
          controller.screenState.kind !== 'ready' ||
          !controller.currentItem ||
          !controller.currentItem.isReviewed,
        skipAutoClose: true,
        onPress: () => void controller.markUnreviewed()
      },
      ...(sessionTabsAvailable
        ? [
            {
              label: t('diffReview.drawers.openInSession'),
              icon: FileText,
              disabled: !controller.currentItem || controller.currentItem.scope === 'branch',
              onPress: () => void controller.openInSession()
            }
          ]
        : [])
    ],
    [controller, sessionTabsAvailable]
  )
}

function sendSheetMessage(
  controller: ReturnType<typeof useMobileDiffReviewController>,
  load: SendSheetState,
  t: (key: string, opts?: { count: number }) => string
): string | undefined {
  return load.kind === 'loading'
    ? t('diffReview.drawers.loadingAgentSessions')
    : load.kind === 'error'
      ? load.message
      : t('diffReview.drawers.unsentNoteCount', { count: controller.unsentComments.length })
}

function NoteComposerContent({ controller, composer }: Props & { composer: ComposerState }) {
  const { t } = useTranslation()

  return (
    <KeyboardAvoidingView behavior={hostOs() === 'ios' ? 'padding' : undefined}>
      <View style={styles.composerHeader}>
        <View>
          <Text style={styles.drawerTitle}>
            {composer.mode === 'edit'
              ? t('diffReview.drawers.editNote')
              : t('diffReview.drawers.addNote')}
          </Text>
          <Text style={styles.drawerSubtitle}>
            {composer.mode === 'create' && composer.lineNumber > 0
              ? t('diffReview.drawers.lineNumber', { line: composer.lineNumber })
              : t('diffReview.drawers.fileNote')}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
          onPress={controller.closeComposer}
          accessibilityRole="button"
          accessibilityLabel={t('diffReview.drawers.cancelNote')}
        >
          <X size={18} color={colors.textPrimary} strokeWidth={2.2} />
        </Pressable>
      </View>
      <TextInput
        style={styles.composerInput}
        value={controller.composerBody}
        onChangeText={controller.setComposerBody}
        multiline
        autoFocus
        placeholder={t('diffReview.drawers.reviewNote')}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={localizedComposerLabel(t, composer)}
      />
      <View style={styles.drawerButtonRow}>
        {composer.mode === 'edit' ? <DeleteNoteButton onPress={controller.deleteComment} /> : null}
        <SaveNoteButton controller={controller} composer={composer} />
      </View>
    </KeyboardAvoidingView>
  )
}

type ComposerLabelKey = { key: string; line?: number }

function composerLabel(
  composer: { mode: 'create'; lineNumber: number } | { mode: 'edit'; comment: DiffComment } | null
): ComposerLabelKey {
  return composer?.mode === 'create' && composer.lineNumber > 0
    ? { key: 'diffReview.drawers.saveNoteOnLine', line: composer.lineNumber }
    : { key: 'diffReview.drawers.reviewNote' }
}

function localizedComposerLabel(
  t: (key: string, opts?: { line: number }) => string,
  composer: { mode: 'create'; lineNumber: number } | { mode: 'edit'; comment: DiffComment } | null
): string {
  const { key, line } = composerLabel(composer)
  return line === undefined ? t(key) : t(key, { line })
}

function DeleteNoteButton({ onPress }: { onPress: () => Promise<void> }) {
  const { t } = useTranslation()

  return (
    <Pressable
      style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
      onPress={() => void onPress()}
      accessibilityRole="button"
      accessibilityLabel={t('diffReview.drawers.deleteNote')}
    >
      <Trash2 size={14} color={colors.statusRed} strokeWidth={2.2} />
      <Text style={styles.destructiveText}>{t('common.delete')}</Text>
    </Pressable>
  )
}

function SaveNoteButton({
  controller,
  composer
}: {
  controller: ReturnType<typeof useMobileDiffReviewController>
  composer: ReturnType<typeof useMobileDiffReviewController>['composer']
}) {
  const disabled = controller.composerBody.trim().length === 0
  const { t } = useTranslation()

  return (
    <Pressable
      style={({ pressed }) => [
        styles.primaryButton,
        disabled && styles.buttonDisabled,
        pressed && styles.buttonPressed
      ]}
      disabled={disabled}
      onPress={() => void controller.saveComposer()}
      accessibilityRole="button"
      accessibilityLabel={localizedComposerLabel(t, composer)}
    >
      <Check size={14} color={colors.bgBase} strokeWidth={2.2} />
      <Text style={styles.primaryButtonText}>{t('common.save')}</Text>
    </Pressable>
  )
}

function CompletionContent({ controller }: Props) {
  const { t } = useTranslation()
  const noteCount =

    controller.screenState.kind === 'ready' ? controller.screenState.comments.length : 0
  return (
    <>
      <Text style={styles.drawerTitle}>{t('diffReview.drawers.reviewComplete')}</Text>
      <Text style={styles.drawerSubtitle}>
        {mobileReviewCountLabel(controller.queue.length, 'file', 'files')} reviewed,{' '}
        {mobileReviewCountLabel(noteCount, 'note', 'notes')}
      </Text>
      <View style={styles.drawerButtonRow}>
        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
          disabled={controller.reviewedUnstagedCount === 0}
          onPress={() => void controller.stageReviewedFiles()}
          accessibilityRole="button"
          accessibilityLabel={t('diffReview.drawers.stageReviewedFiles')}
        >
          <Check size={14} color={colors.textSecondary} strokeWidth={2.2} />
          <Text style={styles.secondaryButtonText}>{t('diffReview.drawers.stageReviewed')}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
          disabled={controller.unsentComments.length === 0}
          onPress={() => void controller.openSendSheet()}
          accessibilityRole="button"
          accessibilityLabel={t('diffReview.drawers.sendNotesToAgent')}
        >
          <Send size={14} color={colors.bgBase} strokeWidth={2.2} />
          <Text style={styles.primaryButtonText}>{t('diffReview.drawers.sendNotes')}</Text>
        </Pressable>
      </View>
    </>
  )
}
