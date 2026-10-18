import type { PickerOption } from '../components/PickerModal'
import type {
  WorkspaceGroupBy,
  WorkspaceSortBy
} from '../../../src/shared/workspace-view/workspace-view-options'

// Why: the host may be headless, so the note can't promise a desktop sidebar.
export const WORKSPACE_VIEW_SHARED_NOTE_KEY = 'workspaceView.syncedAcrossDevices'

export const WORKSPACE_SORT_OPTIONS: PickerOption<WorkspaceSortBy>[] = [
  // Why: desktop and persisted state keep the `smart` key, while mobile shows the product label.
  {
    value: 'smart',
    label: 'Agent activity',
    labelKey: 'workspaceView.sort.smartLabel',
    subtitleKey: 'workspaceView.sort.smartSubtitle'
  },
  { value: 'name', label: 'Name', labelKey: 'workspaceView.sort.nameLabel', subtitleKey: 'workspaceView.sort.nameSubtitle' },
  { value: 'recent', label: 'Recent', labelKey: 'workspaceView.sort.recentLabel', subtitleKey: 'workspaceView.sort.recentSubtitle' },
  { value: 'repo', label: 'Repo', labelKey: 'workspaceView.sort.repoLabel', subtitleKey: 'workspaceView.sort.repoSubtitle' },
  { value: 'manual', label: 'Manual', labelKey: 'workspaceView.sort.manualLabel', subtitleKey: 'workspaceView.sort.manualSubtitle' }
]

export const WORKSPACE_GROUP_OPTIONS: PickerOption<WorkspaceGroupBy>[] = [
  { value: 'none', label: 'No Grouping', labelKey: 'workspaceView.group.noneLabel' },
  { value: 'workspace-status', label: 'Status', labelKey: 'workspaceView.group.statusLabel' },
  { value: 'repo', label: 'Repository', labelKey: 'workspaceView.group.repoLabel' },
  { value: 'pr-status', label: 'PR Status', labelKey: 'workspaceView.group.prStatusLabel' }
]
