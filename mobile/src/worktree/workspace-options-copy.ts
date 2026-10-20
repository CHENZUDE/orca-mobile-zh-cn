import { formatActiveFilterBadge } from '../../../src/shared/workspace-view/workspace-row-filters'
import { translate } from '../i18n/i18n'

/** The desktop's name for the control that opens these options, and for the options themselves. */
export const WORKSPACE_OPTIONS_TITLE_KEY = 'workspaceOptions.title'

/** The chip's corner badge, capped as on the desktop; null with no active filter. */
export function workspaceOptionsBadgeText(activeFilterCount: number): string | null {
  return activeFilterCount > 0 ? formatActiveFilterBadge(activeFilterCount) : null
}

/** The desktop trigger's accessibility label, word for word. */
export function workspaceOptionsAccessibilityLabel(activeFilterCount: number): string {
  const title = translate(WORKSPACE_OPTIONS_TITLE_KEY)
  return activeFilterCount > 0
    ? translate('workspaceOptions.activeFilters', {
        title,
        // The count and its plural, so a translated label reads as one phrase.
        count: activeFilterCount
      })
    : title
}

// Why: the host may be headless, so the note can't promise a desktop sidebar.
export const WORKSPACE_VIEW_SHARED_NOTE_KEY = 'workspaceView.syncedAcrossDevices'
