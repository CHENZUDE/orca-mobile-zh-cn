import { useTranslation } from 'react-i18next'
import { ActionSheetModal, type ActionSheetAction } from '../components/ActionSheetModal'
import { ConfirmModal } from '../components/ConfirmModal'
import { PickerModal } from '../components/PickerModal'
import { openMobilePrUrl } from '../components/mobile-pr-url'
import { MobileBranchDiffPreviewDrawer } from './MobileBranchDiffPreviewDrawer'
import type { MobileSourceControlState } from './use-mobile-source-control-state'

type Props = {
  state: MobileSourceControlState
  actionSheetActions: ActionSheetAction[]
}

export function MobileSourceControlModals({ state, actionSheetActions }: Props) {
  const { t } = useTranslation()

  const {
    branchDiffPreview,
    setBranchDiffPreview,
    showActionSheet,
    setShowActionSheet,
    discardTarget,
    setDiscardTarget,
    showBranchPicker,
    setShowBranchPicker,
    localBranches,
    createdPrUrl,
    setCreatedPrUrl,
    createdPrWarning,
    setCreatedPrWarning,
    branchLabel,
    checkoutBranch,
    runGitAction
  } = state

  return (
    <>
      <MobileBranchDiffPreviewDrawer
        branchDiffPreview={branchDiffPreview}
        onClose={() => setBranchDiffPreview(null)}
      />

      <ActionSheetModal
        visible={showActionSheet}
        title={t('sourceControl.title')}
        message={branchLabel}
        actions={actionSheetActions}
        onClose={() => setShowActionSheet(false)}
      />

      <ConfirmModal
        visible={discardTarget !== null}
        title={t('sourceControl.discardChange')}
        message={
          discardTarget
            ? t('sourceControl.discardChangesMessage', { path: discardTarget.path })
            : undefined
        }
        confirmLabel="Discard"
        destructive
        onConfirm={() => {
          if (discardTarget) {
            void runGitAction(`discard:${discardTarget.path}`, 'git.discard', {
              filePath: discardTarget.path
            })
          }
          // Modal visibility is derived from discardTarget — clear it so it dismisses.
          setDiscardTarget(null)
        }}
        onCancel={() => setDiscardTarget(null)}
      />

      <PickerModal
        visible={showBranchPicker}
        title={t('sourceControl.switchBranch')}
        options={(localBranches?.branches ?? []).map((b) => ({
          value: b,
          label: b,
          subtitle: b === localBranches?.current ? 'current' : undefined
        }))}
        selected={localBranches?.current ?? ''}
        onSelect={(branch) => {
          if (branch !== localBranches?.current) {
            void checkoutBranch(branch)
          } else {
            setShowBranchPicker(false)
          }
        }}
        onClose={() => setShowBranchPicker(false)}
      />

      <ConfirmModal
        visible={createdPrUrl !== null}
        title={t('sourceControl.pullRequestCreated')}
        message={
          createdPrWarning
            ? t('sourceControl.openPrInBrowserWithWarning', { warning: createdPrWarning })
            : t('sourceControl.openPrInBrowser')
        }
        confirmLabel="Open"
        onConfirm={() => {
          if (createdPrUrl) {
            openMobilePrUrl(createdPrUrl)
          }
          setCreatedPrUrl(null)
          setCreatedPrWarning(null)
        }}
        onCancel={() => {
          setCreatedPrUrl(null)
          setCreatedPrWarning(null)
        }}
      />
    </>
  )
}
