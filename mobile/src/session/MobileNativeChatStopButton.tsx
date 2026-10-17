import { Pressable, Text } from 'react-native'
import { Square } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { colors } from '../theme/mobile-theme'
import { styles } from './mobile-native-chat-view-styles'

/** The chat header's Stop. `held`: this phone's own Stop request is still in flight. */
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
      style={({ pressed }) => [styles.stopButton, pressed && styles.pressed]}
      onPress={onStop}
      disabled={held}
      hitSlop={8}
      accessibilityLabel={held ? label : t('chatTurn.stopAgent')}
    >
      <Square size={13} color={colors.statusRed} strokeWidth={2.4} fill={colors.statusRed} />
      <Text style={styles.stopLabel}>{label}</Text>
    </Pressable>
  )
}
