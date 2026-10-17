import { translate } from '../i18n/i18n'

export function mobileNativeChatToolsLabel(expanded: boolean): string {
  return translate(expanded ? 'chatTurn.collapse' : 'chatTurn.tools')
}

export function mobileNativeChatWaitingForDesktop(): string {
  return translate('chatTurn.waitingForDesktop')
}
