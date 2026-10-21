import type { ConnectionPresentationModel } from './use-mobile-tasks-connection-presentation'
import {
  View,
  Pressable,
  ChevronLeft,
  colors,
  StatusDot,
  Text,
  RefreshCw,
  Plus
} from './mobile-tasks-dependencies'
import { MobileTasksHostSubtitle } from './mobile-tasks-host-subtitle'
import { styles } from './mobile-tasks-legacy-styles'
import { translate } from '../i18n/i18n'
import { renderMobileTasksProviderControls } from './mobile-tasks-provider-controls'
import { renderMobileTasksSearchControl } from './mobile-tasks-search-control'

// Same wording as the desktop task page's icon buttons.
function refreshLabel(provider: 'github' | 'gitlab' | 'linear' | 'jira'): string {
  return translate(`tasks.refreshLabel.${provider}`)
}

export function renderMobileTasksChrome(model: ConnectionPresentationModel) {
  const { setTaskCopyFeedbackRootRef } = model
  return (
    <View ref={setTaskCopyFeedbackRootRef} style={styles.topChrome}>
      {renderMobileTasksStatusBar(model)}

      {renderMobileTasksProviderControls(model)}

      {renderMobileTasksSearchControl(model)}
    </View>
  )
}

export function renderMobileTasksStatusBar(model: ConnectionPresentationModel) {
  const {
    connState,
    githubMode,
    githubProjectLoading,
    headerVerdict,
    hostId,
    linearConnected,
    loading,
    provider,
    refreshGitHubProject,
    refreshTasks,
    refreshing,
    router,
    setCreateBody,
    setCreateTitle,
    setLinearApiKeyDraft,
    setLinearConnectError,
    setLinearConnectState,
    setShowCreateTask,
    setShowLinearConnect,
    showHeaderCreateTask,
    taskUiReady
  } = model
  return (
    <View style={styles.statusBar}>
      <Pressable
        style={styles.backButton}
        onPress={() => router.back()}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={translate('common.back')}
      >
        <ChevronLeft size={22} color={colors.textPrimary} />
      </Pressable>
      <View style={styles.titleWrap}>
        <View style={styles.titleLine}>
          <StatusDot state={connState} verdict={headerVerdict} />
          <Text style={styles.title}>{translate('tasks.title')}</Text>
        </View>
        <MobileTasksHostSubtitle hostId={hostId} />
      </View>
      <Pressable
        style={styles.iconButton}
        disabled={!taskUiReady || loading || refreshing || githubProjectLoading}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={refreshLabel(provider)}
        onPress={() => {
          if (!taskUiReady) {
            return
          }
          if (provider === 'github' && githubMode === 'project') {
            refreshGitHubProject()
            return
          }
          refreshTasks()
        }}
      >
        <RefreshCw size={16} color={taskUiReady ? colors.textSecondary : colors.textMuted} />
      </Pressable>
      {showHeaderCreateTask ? (
        <Pressable
          style={styles.iconButton}
          disabled={!taskUiReady}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={
            provider === 'github'
              ? translate('tasks.newGithubIssue')
              : linearConnected
                ? translate('tasks.newLinearIssue')
                : translate('tasks.connectLinear')
          }
          onPress={() => {
            if (!taskUiReady) {
              return
            }
            if (provider === 'linear' && !linearConnected) {
              setLinearApiKeyDraft('')
              setLinearConnectState('idle')
              setLinearConnectError('')
              setShowLinearConnect(true)
              return
            }
            setCreateTitle('')
            setCreateBody('')
            setShowCreateTask(true)
          }}
        >
          <Plus size={16} color={taskUiReady ? colors.textSecondary : colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  )
}
