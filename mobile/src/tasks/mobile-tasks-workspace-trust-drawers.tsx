import { translate } from '../i18n/i18n'
import type { ConnectionPresentationModel } from './use-mobile-tasks-connection-presentation'
import {
  BottomDrawer,
  View,
  Text,
  TextInput,
  colors,
  Pressable,
  ActivityIndicator,
  Check,
  X
} from './mobile-tasks-dependencies'
import { TASK_SECONDARY_DRAWER_Z_INDEX, setupSourceLabel } from './mobile-tasks-legacy-foundation'
import { styles } from './mobile-tasks-legacy-styles'

export function renderMobileTasksWorkspaceSparseDrawer(model: ConnectionPresentationModel) {
  const {
    canSaveWorkspaceSparseDraft,
    saveWorkspaceSparsePreset,
    setWorkspaceSparseDraft,
    taskUiReady,
    workspaceCreateDraft,
    workspaceSparseDraft,
    workspaceSparseDraftError,
    workspaceSparseDraftParsed,
    workspaceSparseSaving
  } = model
  return (
    <BottomDrawer
      visible={taskUiReady && workspaceCreateDraft != null && workspaceSparseDraft != null}
      onClose={() => {
        if (!workspaceSparseSaving) {
          setWorkspaceSparseDraft(null)
        }
      }}
      zIndex={TASK_SECONDARY_DRAWER_Z_INDEX + 2}
    >
      {workspaceSparseDraft ? (
        <View>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              {workspaceSparseDraft.mode === 'new'
                ? translate('tasks.sparse.newPreset')
                : translate('tasks.sparse.editPreset')}
            </Text>
          </View>
          <View style={styles.detailGroup}>
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>{translate('common.nameLabel')}</Text>
              <TextInput
                style={styles.input}
                value={workspaceSparseDraft.name}
                onChangeText={(name) => setWorkspaceSparseDraft({ ...workspaceSparseDraft, name })}
                placeholder={translate('tasks.rendererUiPlaceholder')}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={80}
              />
            </View>
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>{translate('tasks.sparse.directories')}</Text>
              <TextInput
                style={[styles.input, styles.bodyInput, styles.monoInput]}
                value={workspaceSparseDraft.directoriesText}
                onChangeText={(directoriesText) =>
                  setWorkspaceSparseDraft({ ...workspaceSparseDraft, directoriesText })
                }
                placeholder={'src/renderer\npackages/ui'}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                multiline
                textAlignVertical="top"
              />
            </View>
            <Text style={workspaceSparseDraftError ? styles.detailError : styles.detailMuted}>
              {workspaceSparseDraftError ??
                (workspaceSparseDraftParsed?.directories.length === 1
                  ? translate('tasks.sparse.oneDirectory')
                  : translate('tasks.sparse.directoryCount', {
                      count: workspaceSparseDraftParsed?.directories.length ?? 0
                    }))}
            </Text>
          </View>
          <View style={styles.drawerActionRow}>
            <Pressable
              style={styles.secondaryActionButton}
              disabled={workspaceSparseSaving}
              onPress={() => setWorkspaceSparseDraft(null)}
            >
              <Text style={styles.secondaryActionText}>{translate('common.cancel')}</Text>
            </Pressable>
            <Pressable
              style={[
                styles.primaryActionButton,
                !canSaveWorkspaceSparseDraft ? styles.fieldButtonDisabled : undefined
              ]}
              disabled={!canSaveWorkspaceSparseDraft}
              onPress={() => void saveWorkspaceSparsePreset()}
            >
              {workspaceSparseSaving ? (
                <ActivityIndicator size="small" color={colors.bgBase} />
              ) : null}
              <Text style={styles.primaryActionText}>{translate('common.save')}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </BottomDrawer>
  )
}

export function renderMobileTasksSetupTrustDrawer(model: ConnectionPresentationModel) {
  const { createWorkspace, creatingKey, setSetupPrompt, setupPrompt, taskUiReady } = model
  return (
    <BottomDrawer
      visible={taskUiReady && setupPrompt != null}
      onClose={() => setSetupPrompt(null)}
      zIndex={TASK_SECONDARY_DRAWER_Z_INDEX + 1}
    >
      {setupPrompt ? (
        <View>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{translate('tasks.trust.runSetupTitle')}</Text>
            <Text style={styles.sheetSubtitle}>
              {translate('tasks.trust.runSetupBody', { repo: setupPrompt.repoName })}
            </Text>
          </View>

          <View style={styles.setupPromptBox}>
            <View style={styles.detailSectionHeader}>
              <Text style={styles.detailSectionTitle}>{setupSourceLabel(setupPrompt.source)}</Text>
            </View>
            <Text style={styles.setupPromptCommand}>{setupPrompt.command}</Text>
          </View>

          <View style={styles.actionGroup}>
            <Pressable
              style={styles.actionRow}
              disabled={creatingKey === setupPrompt.item.key}
              onPress={() =>
                void createWorkspace(
                  setupPrompt.item,
                  setupPrompt.repoIdOverride,
                  'run',
                  setupPrompt.agentOverride,
                  setupPrompt.workspaceNameOverride,
                  setupPrompt.noteOverride,
                  setupPrompt.baseBranchOverride,
                  setupPrompt.branchNameOverride,
                  setupPrompt.sparseCheckoutOverride
                )
              }
            >
              <Check size={16} color={colors.textPrimary} />
              <Text style={styles.actionText}>
                {creatingKey === setupPrompt.item.key
                  ? translate('tasks.trust.creating')
                  : translate('tasks.trust.runSetupAndCreate')}
              </Text>
            </Pressable>
            <View style={styles.actionSeparator} />
            <Pressable
              style={styles.actionRow}
              disabled={creatingKey === setupPrompt.item.key}
              onPress={() =>
                void createWorkspace(
                  setupPrompt.item,
                  setupPrompt.repoIdOverride,
                  'skip',
                  setupPrompt.agentOverride,
                  setupPrompt.workspaceNameOverride,
                  setupPrompt.noteOverride,
                  setupPrompt.baseBranchOverride,
                  setupPrompt.branchNameOverride,
                  setupPrompt.sparseCheckoutOverride
                )
              }
            >
              <X size={16} color={colors.textPrimary} />
              <Text style={styles.actionText}>{translate('tasks.trust.skipSetupAndCreate')}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </BottomDrawer>
  )
}

export function renderMobileTasksOrcaYamlTrustDrawer(model: ConnectionPresentationModel) {
  const {
    createWorkspace,
    creatingKey,
    orcaYamlTrustPrompt,
    persistSetupHookTrust,
    setError,
    setOrcaYamlTrustPrompt,
    taskUiReady
  } = model
  return (
    <BottomDrawer
      visible={taskUiReady && orcaYamlTrustPrompt != null}
      onClose={() => setOrcaYamlTrustPrompt(null)}
      zIndex={TASK_SECONDARY_DRAWER_Z_INDEX + 1}
    >
      {orcaYamlTrustPrompt ? (
        <View>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              {orcaYamlTrustPrompt.previouslyApproved
                ? translate('tasks.trust.scriptChanged', { repo: orcaYamlTrustPrompt.repoName })
                : translate('tasks.trust.runSetupFrom', { repo: orcaYamlTrustPrompt.repoName })}
            </Text>
            <Text style={styles.sheetSubtitle}>
              {translate('tasks.trust.scriptBody')}
            </Text>
          </View>

          <View style={styles.setupPromptBox}>
            <View style={styles.detailSectionHeader}>
              <Text style={styles.detailSectionTitle}>
                {orcaYamlTrustPrompt.previouslyApproved
                  ? translate('tasks.trust.newScript')
                  : translate('tasks.trust.setupScript')}
              </Text>
            </View>
            <Text style={styles.setupPromptCommand}>{orcaYamlTrustPrompt.scriptContent}</Text>
          </View>

          <View style={styles.actionGroup}>
            <Pressable
              style={styles.actionRow}
              disabled={creatingKey === orcaYamlTrustPrompt.item.key}
              onPress={() =>
                void (async () => {
                  try {
                    await persistSetupHookTrust(
                      orcaYamlTrustPrompt.repoId,
                      orcaYamlTrustPrompt.contentHash,
                      false
                    )
                    setOrcaYamlTrustPrompt(null)
                    await createWorkspace(
                      orcaYamlTrustPrompt.item,
                      orcaYamlTrustPrompt.repoIdOverride,
                      'run',
                      orcaYamlTrustPrompt.agentOverride,
                      orcaYamlTrustPrompt.workspaceNameOverride,
                      orcaYamlTrustPrompt.noteOverride,
                      orcaYamlTrustPrompt.baseBranchOverride,
                      orcaYamlTrustPrompt.branchNameOverride,
                      orcaYamlTrustPrompt.sparseCheckoutOverride,
                      orcaYamlTrustPrompt.contentHash
                    )
                  } catch (err) {
                    setError(err instanceof Error ? err.message : translate('tasks.trust.failedToTrust'))
                  }
                })()
              }
            >
              <Check size={16} color={colors.textPrimary} />
              <Text style={styles.actionText}>{translate('tasks.trust.runHooks')}</Text>
            </Pressable>
            <View style={styles.actionSeparator} />
            <Pressable
              style={styles.actionRow}
              disabled={creatingKey === orcaYamlTrustPrompt.item.key}
              onPress={() =>
                void (async () => {
                  try {
                    await persistSetupHookTrust(
                      orcaYamlTrustPrompt.repoId,
                      orcaYamlTrustPrompt.contentHash,
                      true
                    )
                    setOrcaYamlTrustPrompt(null)
                    await createWorkspace(
                      orcaYamlTrustPrompt.item,
                      orcaYamlTrustPrompt.repoIdOverride,
                      'run',
                      orcaYamlTrustPrompt.agentOverride,
                      orcaYamlTrustPrompt.workspaceNameOverride,
                      orcaYamlTrustPrompt.noteOverride,
                      orcaYamlTrustPrompt.baseBranchOverride,
                      orcaYamlTrustPrompt.branchNameOverride,
                      orcaYamlTrustPrompt.sparseCheckoutOverride,
                      orcaYamlTrustPrompt.contentHash
                    )
                  } catch (err) {
                    setError(err instanceof Error ? err.message : translate('tasks.trust.failedToTrust'))
                  }
                })()
              }
            >
              <Check size={16} color={colors.textPrimary} />
              <Text style={styles.actionText}>{translate('tasks.trust.alwaysTrustAndRun')}</Text>
            </Pressable>
            <View style={styles.actionSeparator} />
            <Pressable
              style={styles.actionRow}
              disabled={creatingKey === orcaYamlTrustPrompt.item.key}
              onPress={() => {
                const prompt = orcaYamlTrustPrompt
                setOrcaYamlTrustPrompt(null)
                void createWorkspace(
                  prompt.item,
                  prompt.repoIdOverride,
                  'skip',
                  prompt.agentOverride,
                  prompt.workspaceNameOverride,
                  prompt.noteOverride,
                  prompt.baseBranchOverride,
                  prompt.branchNameOverride,
                  prompt.sparseCheckoutOverride
                )
              }}
            >
              <X size={16} color={colors.textPrimary} />
              <Text style={styles.actionText}>{translate('tasks.trust.dontRun')}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </BottomDrawer>
  )
}
