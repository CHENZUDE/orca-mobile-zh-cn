import type { PRCommentAudienceFilter } from '../../../../src/shared/pr-comment-audience'

// Why: labels are i18n keys; this module is a pure helper and cannot call useTranslation().
export const PR_COMMENT_AUDIENCE_FILTERS = [
  { value: 'all', labelKey: 'prComments.audienceAll' },
  { value: 'human', labelKey: 'prComments.audienceHumans' },
  { value: 'bot', labelKey: 'prComments.audienceBots' }
] satisfies { value: PRCommentAudienceFilter; labelKey: string }[]

// Why: returns an i18n key so the .tsx caller can localize it.
export function getPRCommentAudienceEmptyLabel(filter: PRCommentAudienceFilter): string {
  switch (filter) {
    case 'bot':
      return 'prComments.noBotComments'
    case 'human':
      return 'prComments.noHumanComments'
    case 'all':
      return 'prComments.noCommentsYet'
  }
}
