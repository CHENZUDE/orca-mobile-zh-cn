import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, radii, spacing, typography } from '../theme/mobile-theme'
import { TaskProviderLogo } from './TaskProviderLogo'

type Props = {
  credentialError: string | null
  unavailableReason: string | null
  disabled: boolean
  onCheckAgain: () => void
}

// Jira credentials are managed on the paired desktop.
export function JiraConnectPrompt({
  credentialError,
  unavailableReason,
  disabled,
  onCheckAgain
}: Props) {
  const { t } = useTranslation()
  return (
    <View style={styles.centered}>
      <TaskProviderLogo provider="jira" size={32} color={colors.textSecondary} />
      <Text style={styles.emptyText}>
        {unavailableReason ? t('jiraConnect.updateDesktop') : t('jiraConnect.connectOnDesktop')}
      </Text>
      <Text style={styles.centeredHint}>
        {unavailableReason ??
          (credentialError
            ? t('jiraConnect.unreadable', { error: credentialError })
            : t('jiraConnect.addSite'))}
      </Text>
      <Pressable
        style={styles.checkAgainButton}
        disabled={disabled}
        onPress={() => {
          if (!disabled) {
            onCheckAgain()
          }
        }}
      >
        <Text style={styles.checkAgainText}>{t('jiraConnect.checkAgain')}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.bodySize
  },
  centeredHint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: spacing.sm,
    maxWidth: 280,
    textAlign: 'center'
  },
  checkAgainButton: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgPanel,
    borderRadius: radii.input,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginTop: spacing.md,
    minWidth: 160
  },
  checkAgainText: {
    color: colors.textPrimary,
    fontSize: typography.bodySize
  }
})
