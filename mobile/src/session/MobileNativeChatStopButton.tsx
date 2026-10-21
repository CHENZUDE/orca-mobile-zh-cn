import { ActivityIndicator, Pressable } from 'react-native'
import { Square } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { colors } from '../theme/mobile-theme'
import { mobileNativeChatComposerStyles as styles } from './mobile-native-chat-composer-styles'

/** The composer's Stop, in Send's slot. `held`: this phone's own Stop request is still in flight. */
export function MobileNativeChatStopButton({
  onStop,
  held
}: {
  onStop?: () => void
  held: boolean
}): React.JSX.Element {
  const { t } = useTranslation()
  const label = held ? t('chatTurn.stopping') : t('chatTurn.stop')
  return (
    <Pressable
      style={({ pressed }) => [styles.controlButton, pressed && styles.pressed]}
      onPress={onStop}
      disabled={held}
      hitSlop={8}
      accessibilityLabel={held ? label : t('chatTurn.stopAgent')}
      accessibilityRole="button"
    >
      {held ? (
        <ActivityIndicator size="small" color={colors.textPrimary} />
      ) : (
        <Square size={13} color={colors.textPrimary} strokeWidth={2.4} fill={colors.textPrimary} />
      )}
    </Pressable>
  )
}
