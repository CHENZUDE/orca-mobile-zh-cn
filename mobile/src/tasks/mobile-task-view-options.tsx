import type { JiraIssueFilter } from '../../../src/shared/jira-types'
import type { TaskProvider } from '../../../src/shared/task-providers'
import type { PickerOption } from '../components/PickerModal'
import { JIRA_FILTER_LABELS } from './mobile-jira-issue-filters'

export const PROVIDER_LABELS: Record<TaskProvider, string> = {
  github: 'GitHub',
  gitlab: 'GitLab',
  linear: 'Linear',
  jira: 'Jira'
}

// Records require a label for every task provider.
export const PROVIDER_EMPTY_LABELS: Record<TaskProvider, string> = {
  github: 'No GitHub tasks',
  gitlab: 'No GitLab tasks',
  linear: 'No Linear tasks',
  jira: 'No Jira tasks'
}

export const JIRA_FILTER_OPTIONS: PickerOption<JiraIssueFilter>[] = [
  {
    value: 'assigned',
    label: JIRA_FILTER_LABELS.assigned,
    labelKey: 'taskOptions.jiraFilter.assignedLabel',
    subtitleKey: 'taskOptions.jiraFilter.assignedSubtitle'
  },
  {
    value: 'reported',
    label: JIRA_FILTER_LABELS.reported,
    labelKey: 'taskOptions.jiraFilter.reportedLabel',
    subtitleKey: 'taskOptions.jiraFilter.reportedSubtitle'
  },
  {
    value: 'all',
    label: JIRA_FILTER_LABELS.all,
    labelKey: 'taskOptions.jiraFilter.allLabel',
    subtitleKey: 'taskOptions.jiraFilter.allSubtitle'
  },
  {
    value: 'done',
    label: JIRA_FILTER_LABELS.done,
    labelKey: 'taskOptions.jiraFilter.doneLabel',
    subtitleKey: 'taskOptions.jiraFilter.doneSubtitle'
  }
]
