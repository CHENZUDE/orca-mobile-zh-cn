// Accessibility labels for the native chat composer. Kept in one module so the
// composer file stays inside its line budget.
export function nativeChatComposerLabel(
  t: (key: string) => string,
  kind: 'removeImage' | 'attachImage' | 'sendMessage' | 'dictation' | 'stopDictation',
  micActive = false
): string {
  if (kind === 'dictation' || kind === 'stopDictation') {
    return micActive ? t('nativeChat.stopDictation') : t('nativeChat.dictate')
  }
  return t(`nativeChat.${kind}`)
}
