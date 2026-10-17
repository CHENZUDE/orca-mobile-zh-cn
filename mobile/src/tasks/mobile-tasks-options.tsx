import {
  type PickerOption,
  type TaskProvider,
  TaskProviderLogo,
  colors,
  getLinkedWorkItemSuggestedName,
  type GitHubProjectSettings
} from './mobile-tasks-dependencies'
import type { GitHubProjectSortDirection } from '../../../src/shared/github/project-types'
import type { ProjectGroup } from '../../../src/shared/github/project-group-sort'
import type {
  GitHubMode,
  GitHubPreset,
  GitHubProjectRow,
  GitLabFilter,
  GitLabView,
  LinearDisplayProperty,
  LinearFilter,
  LinearGroupBy,
  LinearOrderBy,
  LinearViewMode,
  TaskSort
} from './mobile-tasks-view-state-types'
import type { ActionableTaskItem } from './mobile-tasks-project-workspace-types'
import type { LinearIssue } from './mobile-tasks-provider-detail-types'

export const PROVIDER_OPTIONS: PickerOption<TaskProvider>[] = [
  {
    value: 'github',
    label: 'GitHub', labelKey: 'taskOptions.provider.githubLabel',
    subtitleKey: 'taskOptions.provider.githubSubtitle',
    renderIcon: (selected) => (
      <TaskProviderLogo
        provider="github"
        size={16}
        color={selected ? colors.textPrimary : colors.textSecondary}
      />
    )
  },
  {
    value: 'gitlab',
    label: 'GitLab', labelKey: 'taskOptions.provider.gitlabLabel',
    subtitleKey: 'taskOptions.provider.gitlabSubtitle',
    renderIcon: (selected) => (
      <TaskProviderLogo
        provider="gitlab"
        size={16}
        color={selected ? colors.textPrimary : colors.textSecondary}
      />
    )
  },
  {
    value: 'linear',
    label: 'Linear', labelKey: 'taskOptions.provider.linearLabel',
    subtitleKey: 'taskOptions.provider.linearSubtitle',
    renderIcon: (selected) => (
      <TaskProviderLogo
        provider="linear"
        size={16}
        color={selected ? colors.textPrimary : colors.textSecondary}
      />
    )
  }
]

export const GITLAB_FILTER_OPTIONS: PickerOption<GitLabFilter>[] = [
  {
    value: 'opened',
    label: 'Open', labelKey: 'taskOptions.filter.openLabel',
    subtitleKey: 'taskOptions.gitlabFilter.openSubtitle'
  },
  {
    value: 'merged',
    label: 'Merged', labelKey: 'taskOptions.filter.mergedLabel',
    subtitleKey: 'taskOptions.gitlabFilter.mergedSubtitle'
  },
  {
    value: 'closed',
    label: 'Closed', labelKey: 'taskOptions.filter.closedLabel',
    subtitleKey: 'taskOptions.gitlabFilter.closedSubtitle'
  },
  {
    value: 'all',
    label: 'All', labelKey: 'taskOptions.filter.allLabel',
    subtitleKey: 'taskOptions.gitlabFilter.allSubtitle'
  }
]

export const LINEAR_FILTER_OPTIONS: PickerOption<LinearFilter>[] = [
  {
    value: 'all',
    label: 'All', labelKey: 'taskOptions.filter.allLabel',
    subtitleKey: 'taskOptions.linearFilter.allSubtitle'
  },
  {
    value: 'assigned',
    label: 'My Issues', labelKey: 'taskOptions.linearFilter.assignedLabel',
    subtitleKey: 'taskOptions.linearFilter.assignedSubtitle'
  },
  {
    value: 'created',
    label: 'Created', labelKey: 'taskOptions.linearFilter.createdLabel',
    subtitleKey: 'taskOptions.linearFilter.createdSubtitle'
  },
  {
    value: 'completed',
    label: 'Completed', labelKey: 'taskOptions.linearFilter.completedLabel',
    subtitleKey: 'taskOptions.linearFilter.completedSubtitle'
  }
]

export const LINEAR_VIEW_OPTIONS: PickerOption<LinearViewMode>[] = [
  {
    value: 'list',
    label: 'List', labelKey: 'taskOptions.linearView.listLabel',
    subtitleKey: 'taskOptions.linearView.listSubtitle'
  },
  {
    value: 'board',
    label: 'Board', labelKey: 'taskOptions.linearView.boardLabel',
    subtitleKey: 'taskOptions.linearView.boardSubtitle'
  }
]

export function taskWorkspaceFallback(item: ActionableTaskItem): string {
  if (item.provider === 'github' || item.provider === 'gitlab') {
    return `${item.source.type}-${item.source.number}`
  }
  return item.source.identifier.toLowerCase()
}

export function taskWorkspaceSuggestedName(item: ActionableTaskItem): string {
  return getLinkedWorkItemSuggestedName(item) || taskWorkspaceFallback(item)
}

/**
 * Keyed by a vocabulary no provider sends: GitHub's reactions arrive as `'+1'` / `'-1'` and
 * GitLab's carry no content at all, so every real reaction misses this map and the chip renders
 * without a glyph. Left as it is on purpose — the reply reader forwards `content` untouched, so
 * fixing the map is a visible change to what the sheet draws and belongs to its own PR.
 */
export const COMMENT_REACTION_EMOJI: Record<string, string> = {
  thumbs_up: '+1',
  thumbs_down: '-1',
  laugh: 'laugh',
  confused: 'confused',
  heart: 'heart',
  hooray: 'hooray',
  rocket: 'rocket',
  eyes: 'eyes'
}

export const LINEAR_GROUP_OPTIONS: PickerOption<LinearGroupBy>[] = [
  { value: 'none', label: 'No grouping', labelKey: 'taskOptions.linearGroup.none' },
  { value: 'status', label: 'Status', labelKey: 'taskOptions.linearGroup.status' },
  { value: 'assignee', label: 'Assignee', labelKey: 'taskOptions.linearGroup.assignee' },
  { value: 'priority', label: 'Priority', labelKey: 'taskOptions.linearGroup.priority' },
  { value: 'team', label: 'Team', labelKey: 'taskOptions.linearGroup.team' }
]

export const LINEAR_ORDER_OPTIONS: PickerOption<LinearOrderBy>[] = [
  { value: 'priority', label: 'Priority', labelKey: 'taskOptions.linearOrder.priority' },
  { value: 'updated', label: 'Updated', labelKey: 'taskOptions.linearOrder.updated' },
  { value: 'identifier', label: 'Identifier', labelKey: 'taskOptions.linearOrder.identifier' }
]

export const LINEAR_DISPLAY_OPTIONS: PickerOption<LinearDisplayProperty>[] = [
  { value: 'state', label: 'Status', labelKey: 'taskOptions.linearDisplay.state' },
  { value: 'priority', label: 'Priority', labelKey: 'taskOptions.linearDisplay.priority' },
  { value: 'assignee', label: 'Assignee', labelKey: 'taskOptions.linearDisplay.assignee' },
  { value: 'team', label: 'Team', labelKey: 'taskOptions.linearDisplay.team' },
  { value: 'labels', label: 'Labels', labelKey: 'taskOptions.linearDisplay.labels' },
  { value: 'updated', label: 'Updated', labelKey: 'taskOptions.linearDisplay.updated' }
]

export const DEFAULT_LINEAR_DISPLAY_PROPERTIES: LinearDisplayProperty[] = [
  'state',
  'priority',
  'assignee',
  'team',
  'labels',
  'updated'
]

export const GITHUB_KIND_OPTIONS: PickerOption<GitHubMode>[] = [
  {
    value: 'issues',
    label: 'Issues', labelKey: 'taskOptions.githubKind.issuesLabel',
    subtitleKey: 'taskOptions.githubKind.issuesSubtitle'
  },
  {
    value: 'prs',
    label: 'PRs', labelKey: 'taskOptions.githubKind.prsLabel',
    subtitleKey: 'taskOptions.githubKind.prsSubtitle'
  },
  {
    value: 'project',
    label: 'Projects', labelKey: 'taskOptions.githubKind.projectLabel',
    subtitleKey: 'taskOptions.githubKind.projectSubtitle'
  }
]

export const ISSUE_PRESETS: PickerOption<GitHubPreset>[] = [
  {
    value: 'issues',
    label: 'Open', labelKey: 'taskOptions.filter.openLabel',
    subtitleKey: 'taskOptions.issuePresets.openSubtitle'
  },
  {
    value: 'my-issues',
    label: 'Assigned to me', labelKey: 'taskOptions.issuePresets.assignedLabel',
    subtitleKey: 'taskOptions.issuePresets.assignedSubtitle'
  }
]

export const PR_PRESETS: PickerOption<GitHubPreset>[] = [
  {
    value: 'prs',
    label: 'Open', labelKey: 'taskOptions.filter.openLabel',
    subtitleKey: 'taskOptions.prPresets.openSubtitle'
  },
  {
    value: 'my-prs',
    label: 'Mine', labelKey: 'taskOptions.prPresets.mineLabel',
    subtitleKey: 'taskOptions.prPresets.mineSubtitle'
  },
  {
    value: 'review',
    label: 'Needs review', labelKey: 'taskOptions.prPresets.reviewLabel',
    subtitleKey: 'taskOptions.prPresets.reviewSubtitle'
  }
]

export const GITLAB_VIEW_OPTIONS: PickerOption<GitLabView>[] = [
  {
    value: 'project',
    label: 'Project MRs', labelKey: 'taskOptions.gitlabView.projectLabel',
    subtitleKey: 'taskOptions.gitlabView.projectSubtitle'
  },
  {
    value: 'todos',
    label: 'My Todos', labelKey: 'taskOptions.gitlabView.todosLabel',
    subtitleKey: 'taskOptions.gitlabView.todosSubtitle'
  }
]

export const SORT_OPTIONS: PickerOption<TaskSort>[] = [
  {
    value: 'updated',
    label: 'Updated', labelKey: 'taskOptions.sort.updatedLabel',
    subtitleKey: 'taskOptions.sort.updatedSubtitle'
  },
  {
    value: 'repository',
    label: 'Repository', labelKey: 'taskOptions.sort.repositoryLabel',
    subtitleKey: 'taskOptions.sort.repositorySubtitle'
  }
]

export type ProjectSortOverride = { fieldId: string; direction: GitHubProjectSortDirection }

export type ProjectListEntry =
  | { type: 'group'; group: ProjectGroup; collapsed: boolean }
  | { type: 'row'; row: GitHubProjectRow }

export type LinearIssueSection = {
  key: string
  label: string
  color: string
  issues: LinearIssue[]
}

export type LinearListEntry =
  | { type: 'section'; section: LinearIssueSection }
  | { type: 'issue'; issue: LinearIssue }

export const PROJECT_VIEW_DEFAULT_SORT = '__view_default__'

export const GITHUB_REPO_CONCURRENCY = 3

export const MAX_RENDERED_PR_DIFF_LINES = 400

export const GITLAB_PER_PAGE = 50

export const LINEAR_LIMIT = 50

// Why: task detail drawers can launch child sheets; children must layer above
// the still-mounted parent while its dismissal animation/state remains alive.
export const TASK_SECONDARY_DRAWER_Z_INDEX = 1100

// Why: the mobile detail drawer should support quick triage and core actions.
// Desktop keeps the broad metadata editing surface for dense issue/PR work.
export const SHOW_MOBILE_DETAIL_LABEL_CHIPS = false

export const SHOW_MOBILE_DETAIL_METADATA_EDITORS = false

export const SHOW_MOBILE_DETAIL_REVIEW_PANELS = false

export const SHOW_MOBILE_LINEAR_DETAIL_TOOLS = false

export const SHOW_MOBILE_COMMENT_THREAD_TOOLS = false

export const SHOW_MOBILE_PROJECT_METADATA_EDITORS = false

export const SHOW_MOBILE_PROJECT_REVIEW_PANELS = false

export const EMPTY_GITHUB_PROJECT_SETTINGS: GitHubProjectSettings = {
  pinned: [],
  recent: [],
  lastViewByProject: {},
  activeProject: null
}
