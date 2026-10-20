import {
  WORKSPACE_AGENT_ACTIVITY_LAYOUT_CHOICES,
  WORKSPACE_CARD_DISPLAY_CHOICES,
  WORKSPACE_CARD_LAYOUT_CHOICES,
  WORKSPACE_CARD_PROPERTY_CHOICES,
  WORKSPACE_GROUP_BY_CHOICES,
  WORKSPACE_PROJECT_ORDER_CHOICES,
  WORKSPACE_SORT_BY_CHOICES,
  type WorkspaceViewChoice,
  type WorkspaceViewOptionKey,
  type WorkspaceViewSection
} from '../../../src/shared/workspace-view/workspace-view-options'
import { translate } from '../i18n/i18n'
import { phoneCardPropertyChoices } from './phone-card-property-choices'

// The shared Workspace options choices with the phone's own localized copy, mirroring the
// desktop's sidebar-workspace-option-items. Keyed on the shared ids so a choice added in
// shared fails to compile here until it has a label.

type LocalizedChoice<Id extends string> = {
  id: Id
  readonly label: string
  readonly description: string | undefined
}

function localizeChoices<Id extends string>(
  choices: readonly WorkspaceViewChoice<Id>[],
  labels: Record<Id, () => string>,
  descriptions: Partial<Record<Id, () => string>> = {}
): LocalizedChoice<Id>[] {
  return choices.map(({ id }) => ({
    id,
    get label() {
      return labels[id]()
    },
    get description() {
      return descriptions[id]?.()
    }
  }))
}

type ChoiceId<T extends readonly WorkspaceViewChoice<string>[]> = T[number]['id']

type CardPropertyChoiceId = ChoiceId<typeof WORKSPACE_CARD_PROPERTY_CHOICES>
type CardDisplayChoiceId = ChoiceId<typeof WORKSPACE_CARD_DISPLAY_CHOICES>

const projectLabel = (): string => translate('workspaceView.label.project')
const manualLabel = (): string => translate('workspaceView.label.manual')
const recentLabel = (): string => translate('workspaceView.label.recent')
const compactLabel = (): string => translate('workspaceView.label.compact')

export const GROUP_BY_OPTIONS = localizeChoices<ChoiceId<typeof WORKSPACE_GROUP_BY_CHOICES>>(
  WORKSPACE_GROUP_BY_CHOICES,
  {
    none: () => translate('workspaceView.label.none'),
    'workspace-status': () => translate('workspaceView.label.status'),
    'pr-status': () => translate('workspaceView.label.pr'),
    repo: projectLabel
  }
)

export const SORT_OPTIONS = localizeChoices<ChoiceId<typeof WORKSPACE_SORT_BY_CHOICES>>(
  WORKSPACE_SORT_BY_CHOICES,
  {
    name: () => translate('workspaceView.label.name'),
    smart: () => translate('workspaceView.label.agentActivity'),
    recent: recentLabel,
    repo: projectLabel,
    manual: manualLabel
  },
  {
    smart: () => translate('workspaceView.description.smart'),
    manual: () => translate('workspaceView.description.manualSort')
  }
)

export const PROJECT_ORDER_OPTIONS = localizeChoices<
  ChoiceId<typeof WORKSPACE_PROJECT_ORDER_CHOICES>
>(
  WORKSPACE_PROJECT_ORDER_CHOICES,
  { manual: manualLabel, recent: recentLabel },
  {
    manual: () => translate('workspaceView.description.manualProjectOrder'),
    recent: () => translate('workspaceView.description.recentProjectOrder')
  }
)

export const CARD_LAYOUT_OPTIONS = localizeChoices<ChoiceId<typeof WORKSPACE_CARD_LAYOUT_CHOICES>>(
  WORKSPACE_CARD_LAYOUT_CHOICES,
  {
    detailed: () => translate('workspaceView.label.detailed'),
    compact: compactLabel
  }
)

export const AGENT_ACTIVITY_LAYOUT_OPTIONS = localizeChoices<
  ChoiceId<typeof WORKSPACE_AGENT_ACTIVITY_LAYOUT_CHOICES>
>(WORKSPACE_AGENT_ACTIVITY_LAYOUT_CHOICES, {
  compact: compactLabel,
  full: () => translate('workspaceView.label.fullList')
})

/** The shared "Show properties" rows the phone offers, localized. */
export const CARD_PROPERTY_OPTIONS: LocalizedChoice<CardPropertyChoiceId>[] =
  phoneCardPropertyChoices(WORKSPACE_CARD_PROPERTY_CHOICES).map((choice) => ({
    id: choice.id,
    get label() {
      return propertyLabel(choice.id)
    },
    description: undefined
  }))

function propertyLabel(id: CardPropertyChoiceId | CardDisplayChoiceId): string {
  return translate(`workspaceView.cardProperty.${id}`)
}

/** "Card display" rows for the experimental card style, localized. */
export function cardDisplayOptions(hasFolderRows: boolean): LocalizedChoice<CardDisplayChoiceId>[] {
  return phoneCardPropertyChoices(WORKSPACE_CARD_DISPLAY_CHOICES).map((choice) => ({
    id: choice.id,
    get label() {
      return hasFolderRows && choice.id === 'branch'
        ? translate('workspaceView.label.branchFolderPath')
        : propertyLabel(choice.id)
    },
    description: undefined
  }))
}

/** The shared sections' headings, localized. */
export const SECTION_LABELS: Record<WorkspaceViewSection, string | null> = {
  show: translate('workspaceView.section.show'),
  group: translate('workspaceView.section.group'),
  arrange: null,
  filters: translate('workspaceView.section.filters')
}

/** The shared option rows' labels, localized. */
export const OPTION_LABELS: Record<WorkspaceViewOptionKey, string> = {
  hosts: translate('workspaceView.option.hosts'),
  projects: translate('workspaceView.option.projects'),
  groupBy: translate('workspaceView.option.groupBy'),
  sortBy: translate('workspaceView.option.sortBy'),
  projectOrderBy: translate('workspaceView.option.projectOrderBy'),
  cardLayout: translate('workspaceView.option.cardLayout'),
  cardProperties: translate('workspaceView.option.cardProperties'),
  cardDisplay: translate('workspaceView.option.cardDisplay'),
  hideSleepingWorkspaces: translate('workspaceView.filter.hideSleeping'),
  alwaysShowDefaultBranchWorkspace: translate('workspaceView.filter.exceptDefaultBranch'),
  hideDefaultBranchWorkspace: translate('workspaceView.filter.hideDefaultBranch'),
  hideAutomationGeneratedWorkspaces: translate('workspaceView.filter.hideAutomationCreated'),
  hideCliCreatedWorkspaces: translate('workspaceView.filter.hideCliCreated'),
  hideWorkspacesFromOtherDevices: translate('workspaceView.filter.hideOtherClientWorkspaces'),
  hideDetachedHeadWorkspaces: translate('workspaceView.filter.hideDetachedHead')
}
