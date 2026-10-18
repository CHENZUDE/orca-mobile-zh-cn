import { useTranslation } from 'react-i18next'
import { Pressable, Text, View } from 'react-native'
import { ArrowDown, ChevronsDownUp, ChevronsUpDown } from 'lucide-react-native'
import { colors } from '../theme/mobile-theme'
import { styles } from './mobile-native-chat-view-styles'
import { MobileAgentWorkingIndicator } from './MobileAgentWorkingIndicator'

/** Floats over the transcript's bottom-right so the Tools toggle and jump-to-latest take no row. */
export function MobileNativeChatFloatingControls({
  toolCallCount,
  toolsExpanded,
  bridgeWorking,
  onToggleTools,
  showJumpToTail,
  onJumpToTail
}: {
  toolCallCount: number
  toolsExpanded: boolean
  bridgeWorking: boolean
  onToggleTools: () => void
  showJumpToTail: boolean
  onJumpToTail: () => void
}): React.JSX.Element {
  const { t } = useTranslation()
  return (
    <View pointerEvents="box-none" style={styles.floatingControls}>
      {bridgeWorking ? (
        <View pointerEvents="none" style={[styles.toolsPill, styles.workingPill]}>
          <MobileAgentWorkingIndicator />
        </View>
      ) : null}
      {toolCallCount > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            toolsExpanded ? t('nativeChat.collapseToolRuns') : t('nativeChat.expandToolRuns')
          }
          style={({ pressed }) => [styles.toolsPill, pressed && styles.pressed]}
          onPress={onToggleTools}
        >
          {toolsExpanded ? (
            <ChevronsDownUp size={14} color={colors.textSecondary} strokeWidth={2} />
          ) : (
            <ChevronsUpDown size={14} color={colors.textSecondary} strokeWidth={2} />
          )}
          <Text style={styles.toolsPillLabel}>
            {toolsExpanded
              ? t('chatTurn.collapse')
              : `${t('chatTurn.tools')} · ${toolCallCount}`}
          </Text>
        </Pressable>
      ) : null}
      {showJumpToTail ? (
        <Pressable accessibilityLabel={t('nativeChat.scrollToLatest')} style={styles.fab} onPress={onJumpToTail}>
          <ArrowDown size={18} color={colors.textPrimary} strokeWidth={2.2} />
        </Pressable>
      ) : null}
    </View>
  )
}
