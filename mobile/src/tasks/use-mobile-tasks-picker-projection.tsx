import type { DetailCommentRenderersModel } from './use-mobile-tasks-detail-comment-renderers'
import { type PickerOption, View, useMemo } from './mobile-tasks-dependencies'
import {
  type GitHubRepoSources,
  type LinearTeam,
  PROJECT_VIEW_DEFAULT_SORT,
  PROVIDER_OPTIONS,
  type RepoSummary,
  SORT_OPTIONS,
  type TaskListEntry,
  sortMobileTaskItems,
  getRepoBadgeColor,
  getTaskRepoDetail,
  hasGitHubIssueSourceChoice,
  issueSourceSlug,
  taskRepositoryMeta
} from './mobile-tasks-legacy-foundation'
import { styles } from './mobile-tasks-legacy-styles'
import { PROVIDER_LABELS } from './mobile-task-view-options'
import { jiraSiteLabel } from './jira-mobile-connection'
import { translate } from '../i18n/i18n'

export function useMobileTasksPickerProjection(model: DetailCommentRenderersModel) {
  const {
    createRepoId,
    createTeamId,
    githubMode,
    githubProjectAvailableSummaryFields,
    githubProjectSortOverride,
    githubProjectSummaryFields,
    githubProjectTable,
    githubProjectViews,
    githubRepoSources,
    hostedRepos,
    items,
    jiraConnection,
    linearTeams,
    provider,
    reposById,
    selectedHostedRepos,
    effectiveRepoIds,
    repoHostLabels,
    taskSort,
    visibleProviders,
    workspaceRepos
  } = model
  const createTargetOptions = useMemo<PickerOption<string>[]>(
    () =>
      provider === 'github' || provider === 'gitlab'
        ? hostedRepos.map((repo) => ({
            value: repo.id,
            label: repo.displayName,
            subtitle: getTaskRepoDetail(repo, repoHostLabels),
            renderIcon: () => (
              <View
                style={[
                  styles.pickerRepoDot,
                  { backgroundColor: getRepoBadgeColor(repo, repo.displayName) }
                ]}
              />
            )
          }))
        : linearTeams.map((team) => ({
            value: team.id,
            label: team.name,
            subtitle: team.workspaceName
          })),
    [hostedRepos, linearTeams, provider, repoHostLabels]
  )
  const selectedCreateTarget =
    provider === 'github' || provider === 'gitlab'
      ? (hostedRepos.find((repo) => repo.id === createRepoId) ?? hostedRepos[0] ?? null)
      : (linearTeams.find((team) => team.id === createTeamId) ?? linearTeams[0] ?? null)
  const selectedCreateTargetLabel =
    provider === 'github' || provider === 'gitlab'
      ? ((selectedCreateTarget as RepoSummary | null)?.displayName ??
        translate('tasks.picker.selectTarget'))
      : ((selectedCreateTarget as LinearTeam | null)?.name ??
        translate('tasks.picker.selectTarget'))
  const providerLabel = PROVIDER_LABELS[provider]
  const showHeaderCreateTask =
    provider === 'linear' || (provider === 'github' && githubMode === 'items')
  const jiraSiteOptions = useMemo<PickerOption<string>[]>(
    () => [
      { value: 'all', label: translate('tasks.picker.allSites') },
      ...jiraConnection.sites.map((site) => ({
        value: site.id,
        label: jiraSiteLabel(site),
        subtitle: site.siteUrl
      }))
    ],
    [jiraConnection.sites]
  )
  const providerOptions = useMemo(
    () => PROVIDER_OPTIONS.filter((option) => visibleProviders.includes(option.value)),
    [visibleProviders]
  )
  const selectedCreateRepo =
    provider === 'github' || provider === 'gitlab'
      ? (selectedCreateTarget as RepoSummary | null)
      : null
  const selectedCreateGitHubSources =
    provider === 'github' && selectedCreateRepo
      ? githubRepoSources[selectedCreateRepo.id]
      : undefined
  const selectedCreateIssuePreference =
    selectedCreateRepo?.issueSourcePreference === 'origin' ||
    selectedCreateRepo?.issueSourcePreference === 'upstream'
      ? selectedCreateRepo.issueSourcePreference
      : 'upstream'
  const githubIssueSourceRows = useMemo(
    () =>
      selectedHostedRepos
        .map((repo) => ({ repo, sources: githubRepoSources[repo.id] }))
        .filter((entry): entry is { repo: RepoSummary; sources: GitHubRepoSources } =>
          hasGitHubIssueSourceChoice(entry.sources)
        ),
    [githubRepoSources, selectedHostedRepos]
  )
  const githubIssueSourceLabel =
    githubIssueSourceRows.length === 1
      ? issueSourceSlug(
          githubIssueSourceRows[0]!.repo.issueSourcePreference === 'origin'
            ? githubIssueSourceRows[0]!.sources.prs
            : githubIssueSourceRows[0]!.sources.upstreamCandidate
        )
      : translate('tasks.picker.sourceCount', { count: githubIssueSourceRows.length })
  const repoPickerLabel =
    effectiveRepoIds.size === 0 || selectedHostedRepos.length === hostedRepos.length
      ? translate('tasks.picker.allRepos')
      : selectedHostedRepos.length === 1
        ? selectedHostedRepos[0]!.displayName
        : translate('tasks.picker.repoCount', { count: selectedHostedRepos.length })
  const repoPickerSelectedRepo =
    effectiveRepoIds.size > 0 && selectedHostedRepos.length === 1 ? selectedHostedRepos[0]! : null
  const workspaceRepoOptions = useMemo<PickerOption<string>[]>(
    () =>
      workspaceRepos.map((repo) => ({
        value: repo.id,
        label: repo.displayName,
        subtitle: getTaskRepoDetail(repo, repoHostLabels),
        renderIcon: () => (
          <View
            style={[
              styles.pickerRepoDot,
              { backgroundColor: getRepoBadgeColor(repo, repo.displayName) }
            ]}
          />
        )
      })),
    [repoHostLabels, workspaceRepos]
  )
  const sortedItems = useMemo(
    () => sortMobileTaskItems(items, taskSort, reposById),
    [items, reposById, taskSort]
  )
  const displayedEntries = useMemo<TaskListEntry[]>(() => {
    if (taskSort !== 'repository') {
      return sortedItems.map((item) => ({ type: 'item', key: item.key, item }))
    }
    const entries: TaskListEntry[] = []
    let previousRepoKey = ''
    for (const item of sortedItems) {
      const repo = taskRepositoryMeta(item, reposById)
      if (repo.key !== previousRepoKey) {
        entries.push({
          type: 'section',
          key: `section:${repo.key}`,
          label: repo.label,
          color: repo.color
        })
        previousRepoKey = repo.key
      }
      entries.push({ type: 'item', key: item.key, item })
    }
    return entries
  }, [reposById, sortedItems, taskSort])
  const sortLabel =
    SORT_OPTIONS.find((option) => option.value === taskSort)?.label ??
    translate('taskOptions.sort.updatedLabel')
  const githubProjectFields = githubProjectTable?.selectedView.fields ?? []
  const githubProjectViewSort = githubProjectTable?.selectedView.sortByFields?.[0] ?? null
  const githubProjectSortField = githubProjectSortOverride
    ? githubProjectFields.find((field) => field.id === githubProjectSortOverride.fieldId)
    : githubProjectViewSort?.field
  const githubProjectSortDirection =
    githubProjectSortOverride?.direction ?? githubProjectViewSort?.direction ?? null
  const githubProjectSortLabel = githubProjectSortField
    ? translate('tasks.picker.sortField', {
        field: githubProjectSortField.name,
        direction:
          githubProjectSortDirection === 'DESC'
            ? translate('tasks.picker.descendingShort')
            : translate('tasks.picker.ascendingShort')
      })
    : translate('tasks.picker.viewOrder')
  const githubProjectFieldsLabel =
    githubProjectAvailableSummaryFields.length > 0
      ? translate('tasks.picker.fieldsCount', {
          selected: githubProjectSummaryFields.length,
          total: githubProjectAvailableSummaryFields.length
        })
      : translate('tasks.picker.fields')
  const githubProjectSortOptions = useMemo<PickerOption<string>[]>(
    () => [
      {
        value: PROJECT_VIEW_DEFAULT_SORT,
        label: translate('tasks.picker.viewOrder'),
        subtitle: githubProjectViewSort
          ? translate('tasks.picker.usesFieldSort', {
              field: githubProjectViewSort.field.name,
              direction: githubProjectViewSort.direction.toLowerCase()
            })
          : translate('tasks.picker.usesGithubRankOrder')
      },
      ...githubProjectFields.map((field) => {
        const active = githubProjectSortOverride?.fieldId === field.id
        const nextDirection =
          !active || githubProjectSortOverride.direction === 'DESC'
            ? translate('tasks.picker.ascending')
            : translate('tasks.picker.descending')
        return {
          value: field.id,
          label: field.name,
          subtitle: active
            ? translate('tasks.picker.currentDirectionTapFor', {
                direction: githubProjectSortOverride.direction.toLowerCase(),
                next: nextDirection
              })
            : translate('tasks.picker.sortAscending')
        }
      })
    ],
    [githubProjectFields, githubProjectSortOverride, githubProjectViewSort]
  )
  const githubProjectViewOptions = useMemo<PickerOption<string>[]>(
    () =>
      githubProjectViews.map((view) => ({
        value: view.id,
        label: view.name,
        subtitle:
          view.layout === 'TABLE_LAYOUT'
            ? translate('tasks.picker.viewNumber', { number: view.number })
            : translate('tasks.picker.unsupportedLayout'),
        disabled: view.layout !== 'TABLE_LAYOUT'
      })),
    [githubProjectViews]
  )
  return Object.assign(model, {
    createTargetOptions,
    selectedCreateTarget,
    selectedCreateTargetLabel,
    jiraSiteOptions,
    providerLabel,
    showHeaderCreateTask,
    providerOptions,
    selectedCreateRepo,
    selectedCreateGitHubSources,
    selectedCreateIssuePreference,
    githubIssueSourceRows,
    githubIssueSourceLabel,
    repoPickerLabel,
    repoPickerSelectedRepo,
    workspaceRepoOptions,
    sortedItems,
    displayedEntries,
    sortLabel,
    githubProjectFields,
    githubProjectViewSort,
    githubProjectSortField,
    githubProjectSortDirection,
    githubProjectSortLabel,
    githubProjectFieldsLabel,
    githubProjectSortOptions,
    githubProjectViewOptions
  })
}

export type PickerProjectionModel = ReturnType<typeof useMobileTasksPickerProjection>
