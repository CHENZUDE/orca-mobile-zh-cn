import { useTranslation } from 'react-i18next'
import type { ConnectionPresentationModel } from './use-mobile-tasks-connection-presentation'
import {
  View,
  Pressable,
  Plus,
  colors,
  Text,
  Linking,
  ExternalLink,
  Copy,
  RefreshCw,
  X,
  GitBranch
} from './mobile-tasks-dependencies'
import { styles } from './mobile-tasks-legacy-styles'
import {
  taskExternalOpenLabel,
  type TaskItem,
  taskStatusActionLabel,
  isGitHubPrMergeBlocked
} from './mobile-tasks-legacy-foundation'

// Composes "verb kind" from the two i18n keys the pure helper returns, separated by '|'.
function LocalizedTaskStatusLabel({ value }: { value: string }): React.JSX.Element | null {
  const { t } = useTranslation()
  if (!value) {
    return null
  }
  const [verbKey, kindKey] = value.split('|')
  if (!verbKey || !kindKey) {
    return null
  }
  return <>{`${t(verbKey)} ${t(kindKey)}`}</>
}

export function renderMobileTasksItemActions(model: ConnectionPresentationModel) {
  const {
    actionItem,
    copiedLinkKey,
    copyTaskLink,
    copyTextToClipboard,
    creatingKey,
    mutatingStatus,
    openWorkspaceCreate,
    setLinearStatusPickerItem,
    setMergeMethodTaskItem,
    setPendingHostedStateChange,
    setWorkspaceRepoPickerItem,
    workspaceRepos
  } = model
  const { t } = useTranslation()
  if (!actionItem) {
    return null
  }
  return (
    <View style={styles.actionGroup}>
      <Pressable
        style={styles.actionRow}
        disabled={creatingKey === actionItem.key}
        onPress={() => {
          if (actionItem.provider === 'linear' && workspaceRepos.length > 1) {
            setWorkspaceRepoPickerItem(actionItem)
            return
          }
          openWorkspaceCreate(actionItem)
        }}
      >
        <Plus size={16} color={colors.textPrimary} />
        <Text style={styles.actionText}>
          {creatingKey === actionItem.key
            ? t('tasks.trust.creating')
            : t('tasks.project.createWorkspace')}
        </Text>
      </Pressable>

      <View style={styles.actionSeparator} />
      <Pressable
        style={styles.actionRow}
        onPress={() => void Linking.openURL(actionItem.source.url)}
      >
        <ExternalLink size={16} color={colors.textPrimary} />
        <Text style={styles.actionText}>{t(taskExternalOpenLabel(actionItem))}</Text>
      </Pressable>

      {actionItem.provider === 'linear' ? (
        <>
          <View style={styles.actionSeparator} />
          <Pressable
            style={styles.actionRow}
            onPress={() =>
              void copyTextToClipboard(`linear-url:${actionItem.key}`, actionItem.source.url)
            }
          >
            <Copy size={16} color={colors.textPrimary} />
            <Text style={styles.actionText}>
              {copiedLinkKey === `linear-url:${actionItem.key}`
                ? t('tasks.project.copied')
                : t('tasks.itemActions.copyLinearLink')}
            </Text>
          </Pressable>
        </>
      ) : null}

      {actionItem.provider === 'github' ? (
        <>
          <View style={styles.actionSeparator} />
          <Pressable
            style={styles.actionRow}
            onPress={() => void copyTaskLink(`task:${actionItem.key}`, actionItem.source.url)}
          >
            <Copy size={16} color={colors.textPrimary} />
            <Text style={styles.actionText}>
              {copiedLinkKey === `task:${actionItem.key}`
                ? t('tasks.project.copied')
                : t('tasks.project.copyGithubLink')}
            </Text>
          </Pressable>
        </>
      ) : null}

      {actionItem.provider === 'github' && actionItem.source.state !== 'merged' ? (
        <>
          <View style={styles.actionSeparator} />
          <Pressable
            style={styles.actionRow}
            disabled={mutatingStatus}
            onPress={() => {
              const githubItem = actionItem as Extract<TaskItem, { provider: 'github' }>
              setPendingHostedStateChange({
                source: 'task',
                item: githubItem,
                nextState: githubItem.source.state === 'closed' ? 'open' : 'closed'
              })
            }}
          >
            {actionItem.source.state === 'closed' ? (
              <RefreshCw size={16} color={colors.textPrimary} />
            ) : (
              <X size={16} color={colors.textPrimary} />
            )}
            <Text style={styles.actionText}>
              <LocalizedTaskStatusLabel value={taskStatusActionLabel(actionItem)} />
            </Text>
          </Pressable>
        </>
      ) : null}

      {actionItem.provider === 'github' &&
      actionItem.source.type === 'pr' &&
      actionItem.source.state === 'open' ? (
        <>
          <View style={styles.actionSeparator} />
          <Pressable
            style={styles.actionRow}
            disabled={mutatingStatus || isGitHubPrMergeBlocked(actionItem)}
            onPress={() =>
              setMergeMethodTaskItem(actionItem as Extract<TaskItem, { provider: 'github' }>)
            }
          >
            <GitBranch size={16} color={colors.textPrimary} />
            <Text style={styles.actionText}>{t('tasks.project.mergePullRequest')}</Text>
          </Pressable>
          {isGitHubPrMergeBlocked(actionItem) ? (
            <Text style={styles.emptyInlineText}>
              {t('tasks.itemActions.mergeConflicts')}
            </Text>
          ) : null}
        </>
      ) : null}

      {actionItem.provider === 'gitlab' &&
      actionItem.source.state !== 'merged' &&
      actionItem.source.state !== 'locked' ? (
        <>
          <View style={styles.actionSeparator} />
          <Pressable
            style={styles.actionRow}
            disabled={mutatingStatus}
            onPress={() => {
              const gitlabItem = actionItem as Extract<TaskItem, { provider: 'gitlab' }>
              setPendingHostedStateChange({
                source: 'task',
                item: gitlabItem,
                nextState: gitlabItem.source.state === 'closed' ? 'opened' : 'closed'
              })
            }}
          >
            {actionItem.source.state === 'closed' ? (
              <RefreshCw size={16} color={colors.textPrimary} />
            ) : (
              <X size={16} color={colors.textPrimary} />
            )}
            <Text style={styles.actionText}>
              <LocalizedTaskStatusLabel value={taskStatusActionLabel(actionItem)} />
            </Text>
          </Pressable>
        </>
      ) : null}

      {actionItem.provider === 'gitlab' &&
      actionItem.source.type === 'mr' &&
      actionItem.source.state === 'opened' ? (
        <>
          <View style={styles.actionSeparator} />
          <Pressable
            style={styles.actionRow}
            disabled={mutatingStatus}
            onPress={() =>
              setMergeMethodTaskItem(actionItem as Extract<TaskItem, { provider: 'gitlab' }>)
            }
          >
            <GitBranch size={16} color={colors.textPrimary} />
            <Text style={styles.actionText}>{t('tasks.itemActions.mergeMergeRequest')}</Text>
          </Pressable>
        </>
      ) : null}

      {actionItem.provider === 'linear' ? (
        <>
          <View style={styles.actionSeparator} />
          <Pressable
            style={styles.actionRow}
            disabled={mutatingStatus}
            onPress={() => {
              setLinearStatusPickerItem(actionItem as Extract<TaskItem, { provider: 'linear' }>)
            }}
          >
            <GitBranch size={16} color={colors.textPrimary} />
            <Text style={styles.actionText}>{t('tasks.filters.changeStatus')}</Text>
          </Pressable>
        </>
      ) : null}
    </View>
  )
}
