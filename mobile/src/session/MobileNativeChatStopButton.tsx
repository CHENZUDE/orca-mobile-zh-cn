import { ActivityIndicator, Pressable, StyleSheet } from 'react-native'
import { Square } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { colors } from '../theme/mobile-theme'

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
      style={({ pressed }) => [styles.stopButton, pressed && styles.pressed]}
      onPress={onStop}
      disabled={held}
      hitSlop={8}
      accessibilityLabel={held ? label : t('chatTurn.stopAgent')}
      accessibilityRole="button"
    >
      {held ? (
        <ActivityIndicator size="small" color={colors.statusRed} />
      ) : (
        <Square size={16} color={colors.statusRed} strokeWidth={2.4} fill={colors.statusRed} />
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  stopButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgRaised
  },
  pressed: {
    opacity: 0.7
  }
})
