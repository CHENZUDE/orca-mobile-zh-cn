import { translate } from '../i18n/i18n'

/** The banner's copy for a failed action: the host's own message, else the localized fallback. */
export function mobileSourceControlActionErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : translate('errors.sourceControlActionFailed')
}
