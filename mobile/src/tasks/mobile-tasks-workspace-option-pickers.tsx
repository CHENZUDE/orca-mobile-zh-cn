import { useTranslation } from 'react-i18next'
import type { ConnectionPresentationModel } from './use-mobile-tasks-connection-presentation'
import {
  BottomDrawer,
  View,
  Text,
  TextInput,
  colors,
  Pressable,
  Check,
  ActivityIndicator,
  Pencil
} from './mobile-tasks-dependencies'
import { TASK_SECONDARY_DRAWER_Z_INDEX } from './mobile-tasks-legacy-foundation'
import { styles } from './mobile-tasks-legacy-styles'

export function renderMobileTasksWorkspaceBaseBranchPicker(model: ConnectionPresentationModel) {
  const {
    clearWorkspaceBaseBranch,
    selectWorkspaceBaseBranch,
    setShowWorkspaceBaseBranchPicker,
    setWorkspaceBaseBranchQuery,
    showWorkspaceBaseBranchPicker,
    taskUiReady,
    workspaceBaseBranch,
    workspaceBaseBranchError,
    workspaceBaseBranchLoading,
    workspaceBaseBranchQuery,
    workspaceBaseBranchResults,
    workspaceCreateDraft
  } = model
  const { t } = useTranslation()
  return (
    <BottomDrawer
      visible={taskUiReady && workspaceCreateDraft != null && showWorkspaceBaseBranchPicker}
      onClose={() => setShowWorkspaceBaseBranchPicker(false)}
      zIndex={TASK_SECONDARY_DRAWER_Z_INDEX + 1}
    >
      <View>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{t('tasks.workspace.startFrom')}</Text>
          <Text style={styles.sheetSubtitle}>{t('tasks.workspace.pickBranch')}</Text>
        </View>
        <View style={styles.detailGroup}>
          <TextInput
            style={styles.input}
            value={workspaceBaseBranchQuery}
            onChangeText={setWorkspaceBaseBranchQuery}
            placeholder={t('tasks.workspace.searchBranches')}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable
            style={styles.pickerRow}
            onPress={() => {
              clearWorkspaceBaseBranch()
            }}
          >
            <View style={styles.pickerCheck}>
              {workspaceBaseBranch === null ? <Check size={16} color={colors.textPrimary} /> : null}
            </View>
            <View style={styles.pickerContent}>
              <Text style={styles.pickerLabel}>{t('tasks.workspace.defaultBranch')}</Text>
              <Text style={styles.pickerSubtitle}>
                {t('tasks.workspace.useConfiguredBase')}
              </Text>
            </View>
          </Pressable>
          {workspaceBaseBranchLoading ? (
            <View style={styles.drawerLoadingRow}>
              <ActivityIndicator size="small" color={colors.textSecondary} />
            </View>
          ) : workspaceBaseBranchError ? (
            <Text style={styles.detailError}>{workspaceBaseBranchError}</Text>
          ) : workspaceBaseBranchQuery.trim() && workspaceBaseBranchResults.length === 0 ? (
            <Text style={styles.detailMuted}>{t('tasks.workspace.noBranchesMatch')}</Text>
          ) : null}
          {workspaceBaseBranchResults.map((branch) => (
            <View key={`${branch.refName}:${branch.localBranchName}`}>
              <View style={styles.groupSeparator} />
              <Pressable
                style={styles.pickerRow}
                onPress={() => {
                  selectWorkspaceBaseBranch(branch)
                }}
              >
                <View style={styles.pickerCheck}>
                  {workspaceBaseBranch?.refName === branch.refName ? (
                    <Check size={16} color={colors.textPrimary} />
                  ) : null}
                </View>
                <View style={styles.pickerContent}>
                  <Text style={[styles.pickerLabel, styles.monoText]} numberOfLines={1}>
                    {branch.refName}
                  </Text>
                  {branch.localBranchName !== branch.refName ? (
                    <Text style={styles.pickerSubtitle} numberOfLines={1}>
                      {t('tasks.workspace.branchName', { name: branch.localBranchName })}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            </View>
          ))}
        </View>
      </View>
    </BottomDrawer>
  )
}

export function renderMobileTasksWorkspaceSparsePicker(model: ConnectionPresentationModel) {
  const {
    setShowWorkspaceSparsePicker,
    setWorkspaceSparsePresetId,
    showWorkspaceSparsePicker,
    startEditWorkspaceSparsePreset,
    startNewWorkspaceSparsePreset,
    taskUiReady,
    workspaceCreateDraft,
    workspaceSparsePresetId,
    workspaceSparsePresets,
    workspaceSparsePresetsLoaded,
    workspaceSparsePresetsLoading
  } = model
  const { t } = useTranslation()
  return (
    <BottomDrawer
      visible={taskUiReady && workspaceCreateDraft != null && showWorkspaceSparsePicker}
      onClose={() => setShowWorkspaceSparsePicker(false)}
      zIndex={TASK_SECONDARY_DRAWER_Z_INDEX + 1}
    >
      <View>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{t('tasks.workspace.sparseCheckout')}</Text>
        </View>
        <View style={styles.detailGroup}>
          <Pressable
            style={styles.pickerRow}
            onPress={() => {
              setWorkspaceSparsePresetId(null)
              setShowWorkspaceSparsePicker(false)
            }}
          >
            <View style={styles.pickerCheck}>
              {workspaceSparsePresetId === null ? (
                <Check size={16} color={colors.textPrimary} />
              ) : null}
            </View>
            <View style={styles.pickerContent}>
              <Text style={styles.pickerLabel}>{t('tasks.workspace.fullCheckout')}</Text>
              <Text style={styles.pickerSubtitle}>{t('tasks.workspace.useWholeRepo')}</Text>
            </View>
          </Pressable>
          {workspaceSparsePresets.map((preset) => (
            <View key={preset.id}>
              <View style={styles.groupSeparator} />
              <View style={styles.pickerRowWithAction}>
                <Pressable
                  style={styles.pickerRowMain}
                  onPress={() => {
                    setWorkspaceSparsePresetId(preset.id)
                    setShowWorkspaceSparsePicker(false)
                  }}
                >
                  <View style={styles.pickerCheck}>
                    {workspaceSparsePresetId === preset.id ? (
                      <Check size={16} color={colors.textPrimary} />
                    ) : null}
                  </View>
                  <View style={styles.pickerContent}>
                    <Text style={styles.pickerLabel} numberOfLines={1}>
                      {preset.name}
                    </Text>
                    <Text style={styles.pickerSubtitle} numberOfLines={2}>
                      {preset.directories.join(', ')}
                    </Text>
                  </View>
                </Pressable>
                <Pressable
                  style={styles.iconActionButton}
                  accessibilityRole="button"
                  accessibilityLabel={t('tasks.workspace.editPresetA11y', { name: preset.name })}
                  onPress={() => startEditWorkspaceSparsePreset(preset)}
                >
                  <Pencil size={15} color={colors.textMuted} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
        <Pressable
          style={[
            styles.inlineSaveButton,
            !workspaceSparsePresetsLoaded || workspaceSparsePresetsLoading
              ? styles.fieldButtonDisabled
              : undefined
          ]}
          disabled={!workspaceSparsePresetsLoaded || workspaceSparsePresetsLoading}
          onPress={startNewWorkspaceSparsePreset}
        >
          <Text style={styles.inlineSaveText}>{t('tasks.workspace.newPreset')}</Text>
        </Pressable>
      </View>
    </BottomDrawer>
  )
}
