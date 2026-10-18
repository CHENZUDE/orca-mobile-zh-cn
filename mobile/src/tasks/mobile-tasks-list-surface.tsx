import type { ConnectionPresentationModel } from './use-mobile-tasks-connection-presentation'
import {
  View,
  Text,
  ActivityIndicator,
  colors,
  TaskProviderLogo,
  Pressable
} from './mobile-tasks-dependencies'
import { styles } from './mobile-tasks-legacy-styles'
import { renderMobileTasksGitHubProjectList } from './mobile-tasks-github-project-list'
import { renderMobileTasksLinearList } from './mobile-tasks-linear-list'
import { renderMobileTasksProviderItemList } from './mobile-tasks-provider-item-list'
import { translate } from '../i18n/i18n'
import { JiraConnectPrompt } from '../components/JiraConnectPrompt'

export function renderMobileTasksListSurface(model: ConnectionPresentationModel) {
  const {
    githubMode,
    linearConnected,
    jiraConnection,
    refreshJiraConnection,
    setError,
    provider,
    setLinearApiKeyDraft,
    setLinearConnectError,
    setLinearConnectState,
    setShowLinearConnect,
    taskUiReady,
    tasksSupported,
    tasksUnsupported
  } = model
  return !tasksSupported ? (
    tasksUnsupported ? (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>{translate('tasks.list.updateOrcaDesktop')}</Text>
        <Text style={styles.centeredHint}>
          {translate('tasks.list.needsNewerDesktopRuntime')}
        </Text>
      </View>
    ) : (
      <View style={styles.centered}>
        <ActivityIndicator size="small" color={colors.textSecondary} />
      </View>
    )
  ) : provider === 'jira' && !jiraConnection.connected ? (
    <JiraConnectPrompt
      credentialError={jiraConnection.credentialError}
      unavailableReason={jiraConnection.unavailableReason}
      disabled={!taskUiReady}
      onCheckAgain={() => {
        void refreshJiraConnection().catch((err: unknown) => {
          setError(err instanceof Error ? err.message : 'Failed to read Jira status')
        })
      }}
    />
  ) : provider === 'linear' && !linearConnected ? (
    <View style={styles.centered}>
      <TaskProviderLogo provider="linear" size={32} color={colors.textSecondary} />
      <Text style={styles.emptyText}>
        {translate('tasks.list.connectLinearAccount')}
      </Text>
      <Text style={styles.centeredHint}>
        {translate('tasks.list.browseAssignedLinearIssues')}
      </Text>
      <Pressable
        style={[styles.targetButton, styles.centerActionButton]}
        disabled={!taskUiReady}
        onPress={() => {
          if (!taskUiReady) {
            return
          }
          setLinearApiKeyDraft('')
          setLinearConnectState('idle')
          setLinearConnectError('')
          setShowLinearConnect(true)
        }}
      >
        <Text style={styles.targetButtonText}>{translate('tasks.list.connectLinear')}</Text>
      </Pressable>
    </View>
  ) : provider === 'github' && githubMode === 'project' ? (
    renderMobileTasksGitHubProjectList(model)
  ) : (
    renderMobileTasksNonProjectLists(model)
  )
}

export function renderMobileTasksNonProjectLists(model: ConnectionPresentationModel) {
  const { provider } = model
  return provider === 'linear'
    ? renderMobileTasksLinearList(model)
    : renderMobileTasksProviderItemList(model)
}
