import type { ReactElement } from 'react'
import { ActivityIndicator, Pressable, Text } from 'react-native'
import { translate } from '../i18n/i18n'
import { colors } from '../theme/mobile-theme'
import { styles } from './mobile-native-chat-view-styles'

/** The "Load earlier messages" control, while older history remains. */
export function mobileNativeChatListHeader(
  hasMore: boolean | undefined,
  loadingEarlier: boolean | undefined,
  loadEarlier: () => void
): ReactElement | null {
  if (!hasMore) {
    return null
  }
  return (
    <Pressable style={styles.loadEarlier} onPress={loadEarlier} disabled={loadingEarlier}>
      {loadingEarlier ? (
        <ActivityIndicator size="small" color={colors.textMuted} />
      ) : (
        <Text style={styles.loadEarlierText}>{translate('nativeChat.loadEarlierMessages')}</Text>
      )}
    </Pressable>
  )
}
