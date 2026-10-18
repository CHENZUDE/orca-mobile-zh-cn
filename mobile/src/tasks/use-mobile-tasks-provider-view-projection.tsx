import type { PickerProjectionModel } from './use-mobile-tasks-picker-projection'
import { JIRA_FILTER_LABELS } from './mobile-jira-issue-filters'
import { jiraSiteLabel } from './jira-mobile-connection'
import { translate } from '../i18n/i18n'
import {
  type PickerOption,
  githubProjectKey,
  useCallback,
  useMemo
} from './mobile-tasks-dependencies'
import {
  GITLAB_FILTER_OPTIONS,
  ISSUE_PRESETS,
  LINEAR_FILTER_OPTIONS,
  LINEAR_GROUP_OPTIONS,
  LINEAR_ORDER_OPTIONS,
  LINEAR_VIEW_OPTIONS,
  type LinearListEntry,
  PR_PRESETS,
  type TaskItem,
  sortLinearIssues,
  groupSortedLinearIssues
} from './mobile-tasks-legacy-foundation'

export function useMobileTasksProviderViewProjection(model: PickerProjectionModel) {
  const {
    activeGitHubProject,
    defaultGitHubPreset,
    githubKind,
    githubMode,
    githubPreset,
    githubProjectPickerSearch,
    githubProjectSearch,
    githubProjectSettings,
    githubProjectTable,
    githubProjects,
    gitlabFilter,
    hostedRepos,
    items,
    linearDisplayProperties,
    linearFilter,
    jiraFilter,
    jiraConnection,
    linearGroupBy,
    linearOrderBy,
    linearTeamPropertyTouched,
    linearTeams,
    linearViewMode,
    linearWorkspaces,
    persistRepoSelection,
    selectedLinearTeamIds,
    selectedLinearWorkspaceId,
    setAppliedGithubProjectSearch,
    setSelectedRepoIds,
    effectiveRepoIds
  } = model
  const githubPresetOptions = githubKind === 'prs' ? PR_PRESETS : ISSUE_PRESETS
  const githubPresetPickerOptions = useMemo(
    () =>
      githubPresetOptions.map((option) =>
        option.value === defaultGitHubPreset
          ? {
              ...option,
              subtitle: option.subtitle
                ? translate('tasks.picker.subtitleWithDefault', { subtitle: option.subtitle })
                : translate('tasks.picker.default')
            }
          : option
      ),
    [defaultGitHubPreset, githubPresetOptions]
  )
  const githubPresetLabel =
    githubPresetOptions.find((preset) => preset.value === githubPreset)?.label ??
    translate('taskOptions.filter.openLabel')
  const gitlabFilterLabel =
    GITLAB_FILTER_OPTIONS.find((filter) => filter.value === gitlabFilter)?.label ??
    translate('taskOptions.filter.openLabel')
  const jiraFilterLabel = JIRA_FILTER_LABELS[jiraFilter]
  const jiraSelectedSite =
    jiraConnection.selection && jiraConnection.selection !== 'all'
      ? (jiraConnection.sites.find((site) => site.id === jiraConnection.selection) ?? null)
      : null
  const jiraSiteChipLabel = jiraSelectedSite
    ? jiraSiteLabel(jiraSelectedSite)
    : translate('tasks.picker.allSites')
  const linearFilterLabel =
    LINEAR_FILTER_OPTIONS.find((filter) => filter.value === linearFilter)?.label ??
    translate('taskOptions.filter.allLabel')
  const linearViewLabel =
    LINEAR_VIEW_OPTIONS.find((option) => option.value === linearViewMode)?.label ??
    translate('taskOptions.linearView.listLabel')
  const linearGroupLabel =
    LINEAR_GROUP_OPTIONS.find((option) => option.value === linearGroupBy)?.label ??
    translate('taskOptions.linearGroup.none')
  const linearOrderLabel =
    LINEAR_ORDER_OPTIONS.find((option) => option.value === linearOrderBy)?.label ??
    translate('taskOptions.linearOrder.priority')
  const linearWorkspaceLabel =
    selectedLinearWorkspaceId === 'all'
      ? translate('tasks.picker.allWorkspaces')
      : (linearWorkspaces.find((workspace) => workspace.id === selectedLinearWorkspaceId)
          ?.organizationName ??
        linearWorkspaces.find((workspace) => workspace.id === selectedLinearWorkspaceId)
          ?.displayName ??
        translate('tasks.picker.workspace'))
  const linearWorkspaceOptions = useMemo<PickerOption<string>[]>(
    () => [
      { value: 'all', label: translate('tasks.picker.allWorkspaces') },
      ...linearWorkspaces.map((workspace) => ({
        value: workspace.id,
        label: workspace.organizationName ?? workspace.displayName ?? workspace.id
      }))
    ],
    [linearWorkspaces]
  )
  const linearTeamLabel =
    selectedLinearTeamIds.size === 0 || selectedLinearTeamIds.size === linearTeams.length
      ? translate('tasks.picker.allTeams')
      : selectedLinearTeamIds.size === 1
        ? (linearTeams.find((team) => selectedLinearTeamIds.has(team.id))?.name ??
          translate('tasks.picker.oneTeam'))
        : translate('tasks.picker.teamCount', { count: selectedLinearTeamIds.size })
  const effectiveLinearDisplayProperties = useMemo(() => {
    const next = new Set(linearDisplayProperties)
    if (linearGroupBy === 'status') {
      next.delete('state')
    }
    if (linearGroupBy === 'assignee') {
      next.delete('assignee')
    }
    if (linearGroupBy === 'priority') {
      next.delete('priority')
    }
    if (linearGroupBy === 'team') {
      next.delete('team')
    }
    if (selectedLinearTeamIds.size <= 1 && !linearTeamPropertyTouched) {
      next.delete('team')
    } else if (selectedLinearTeamIds.size > 1 && !linearTeamPropertyTouched) {
      next.add('team')
    }
    return next
  }, [
    linearDisplayProperties,
    linearGroupBy,
    linearTeamPropertyTouched,
    selectedLinearTeamIds.size
  ])
  const linearIssuesForView = useMemo(
    () =>
      sortLinearIssues(
        items
          .filter(
            (item): item is Extract<TaskItem, { provider: 'linear' }> => item.provider === 'linear'
          )
          .map((item) => item.source),
        linearOrderBy
      ),
    [items, linearOrderBy]
  )
  const linearIssueSections = useMemo(
    () => groupSortedLinearIssues(linearIssuesForView, linearGroupBy),
    [linearGroupBy, linearIssuesForView]
  )
  // Why: FlatList treats data identity as meaningful; unrelated renders should
  // not rebuild the section/item wrapper array.
  const linearListEntries = useMemo<LinearListEntry[]>(
    () =>
      linearIssueSections.flatMap((section) =>
        linearGroupBy === 'none'
          ? section.issues.map((issue) => ({ type: 'issue' as const, issue }))
          : [
              { type: 'section' as const, section },
              ...section.issues.map((issue) => ({ type: 'issue' as const, issue }))
            ]
      ),
    [linearGroupBy, linearIssueSections]
  )
  // Why: every grouping but `none` produces the same sections as the list, so the
  // board reuses them; `none` still needs its own status split for columns.
  const linearBoardSections = useMemo(
    () =>
      linearGroupBy === 'none'
        ? groupSortedLinearIssues(linearIssuesForView, 'status')
        : linearIssueSections,
    [linearGroupBy, linearIssueSections, linearIssuesForView]
  )
  const githubModeLabel =
    githubMode === 'project'
      ? translate('taskOptions.githubKind.projectLabel')
      : githubKind === 'prs'
        ? translate('taskOptions.githubKind.prsLabel')
        : translate('taskOptions.githubKind.issuesLabel')
  const activeProjectLabel = githubProjectTable
    ? githubProjectTable.project.title
    : activeGitHubProject
      ? `${activeGitHubProject.owner} #${activeGitHubProject.number}`
      : translate('tasks.picker.chooseProject')
  const selectedGitHubProjectViewUrl = githubProjectTable
    ? `${githubProjectTable.project.url}/views/${githubProjectTable.selectedView.number}`
    : null
  const githubProjectsByKey = useMemo(
    () => new Map(githubProjects.map((project) => [githubProjectKey(project), project])),
    [githubProjects]
  )
  const pinnedGitHubProjects = useMemo(
    () =>
      githubProjectSettings.pinned.map((project) => ({
        ...project,
        summary: githubProjectsByKey.get(githubProjectKey(project))
      })),
    [githubProjectSettings.pinned, githubProjectsByKey]
  )
  const recentGitHubProjects = useMemo(
    () =>
      githubProjectSettings.recent
        .filter(
          (recent) =>
            !githubProjectSettings.pinned.some(
              (pinned) => githubProjectKey(pinned) === githubProjectKey(recent)
            )
        )
        .map((project) => ({
          ...project,
          summary: githubProjectsByKey.get(githubProjectKey(project))
        })),
    [githubProjectSettings.pinned, githubProjectSettings.recent, githubProjectsByKey]
  )
  const browseGitHubProjects = useMemo(() => {
    const queryText = githubProjectPickerSearch.trim().toLowerCase()
    const pinnedOrRecentKeys = new Set([
      ...githubProjectSettings.pinned.map(githubProjectKey),
      ...githubProjectSettings.recent.map(githubProjectKey)
    ])
    return githubProjects.filter((project) => {
      if (pinnedOrRecentKeys.has(githubProjectKey(project))) {
        return false
      }
      if (!queryText) {
        return true
      }
      return (
        project.title.toLowerCase().includes(queryText) ||
        project.owner.toLowerCase().includes(queryText) ||
        String(project.number).includes(queryText)
      )
    })
  }, [
    githubProjectPickerSearch,
    githubProjectSettings.pinned,
    githubProjectSettings.recent,
    githubProjects
  ])

  const toggleRepoSelection = useCallback(
    (repoId: string) => {
      // Why: an edit starts from what the user sees, so it rewrites the choice from listed repos.
      const next = new Set(effectiveRepoIds)
      if (next.has(repoId)) {
        next.delete(repoId)
      } else {
        next.add(repoId)
      }
      const normalized =
        next.size === 0 || next.size === hostedRepos.length ? new Set<string>() : next
      setSelectedRepoIds(normalized)
      persistRepoSelection(normalized, hostedRepos)
    },
    [effectiveRepoIds, hostedRepos, persistRepoSelection]
  )

  const applyGitHubProjectSearch = useCallback(() => {
    const viewFilter = githubProjectTable?.selectedView.filter ?? ''
    const next = githubProjectSearch
    setAppliedGithubProjectSearch(next === viewFilter ? undefined : next)
  }, [githubProjectSearch, githubProjectTable?.selectedView.filter])
  return Object.assign(model, {
    githubPresetOptions,
    githubPresetPickerOptions,
    githubPresetLabel,
    gitlabFilterLabel,
    jiraFilterLabel,
    jiraSiteChipLabel,
    linearFilterLabel,
    linearViewLabel,
    linearGroupLabel,
    linearOrderLabel,
    linearWorkspaceLabel,
    linearWorkspaceOptions,
    linearTeamLabel,
    effectiveLinearDisplayProperties,
    linearIssuesForView,
    linearIssueSections,
    linearListEntries,
    linearBoardSections,
    githubModeLabel,
    activeProjectLabel,
    selectedGitHubProjectViewUrl,
    githubProjectsByKey,
    pinnedGitHubProjects,
    recentGitHubProjects,
    browseGitHubProjects,
    toggleRepoSelection,
    applyGitHubProjectSearch
  })
}

export type ProviderViewProjectionModel = ReturnType<typeof useMobileTasksProviderViewProjection>
