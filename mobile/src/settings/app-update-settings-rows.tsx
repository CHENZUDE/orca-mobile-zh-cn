import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import type { KnownAppUpdate } from '../storage/app-update-preferences'
import { colors, spacing, typography } from '../theme/mobile-theme'
import { formatTimeAgo } from '../worktree/agent-row-display'

export type AppUpdateCheckRowStatus = 'idle' | 'checking' | 'up-to-date' | 'failed'

function checkRowValue(
  t: (k: string, opts?: Record<string, unknown>) => string,
  status: AppUpdateCheckRowStatus,
  lastCheckedAt: number | null,
  now: number
): string {
  if (status === 'checking') {
    return t('settings.appUpdate.check.checking')
  }
  if (status === 'up-to-date') {
    return t('settings.appUpdate.check.upToDate')
  }
  if (status === 'failed') {
    return t('settings.appUpdate.check.failed')
  }
  if (lastCheckedAt === null) {
    return t('settings.appUpdate.check.never')
  }
  const ago = formatTimeAgo(lastCheckedAt, now)
  return t('settings.appUpdate.check.lastChecked', { ago })
}

/** Settings' version row and manual check; the update row stays after the home card is dismissed. */
export function AppUpdateSettingsRows(props: {
  installedVersion: string | null
  available: KnownAppUpdate | null
  lastCheckedAt: number | null
  now: number
  checkStatus: AppUpdateCheckRowStatus
  onUpdate: (url: string) => void
  onCheck: () => void
}) {
  const { t } = useTranslation()
  const checkValue = checkRowValue(t, props.checkStatus, props.lastCheckedAt, props.now)
  const { available, installedVersion, onUpdate } = props
  const versionRow = available ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('settings.appUpdate.update.a11y', { version: available.version })}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={() => onUpdate(available.url)}
    >
      <Text style={styles.rowLabel}>{t('settings.appUpdate.update.label', { version: available.version })}</Text>
      <Text style={styles.actionValue}>{t('settings.appUpdate.update.cta')}</Text>
    </Pressable>
  ) : installedVersion ? (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{t('settings.appUpdate.version', { version: installedVersion })}</Text>
    </View>
  ) : null
  return (
    <View style={styles.section}>
      {versionRow}
      {versionRow && <View style={styles.separator} />}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('settings.appUpdate.check.a11y', { value: checkValue })}
        accessibilityState={{ busy: props.checkStatus === 'checking' }}
        disabled={props.checkStatus === 'checking'}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        onPress={props.onCheck}
      >
        <Text style={styles.rowLabel}>{t('settings.appUpdate.check.label')}</Text>
        <Text style={styles.rowValue}>{checkValue}</Text>
      </Pressable>
    </View>
  )
}

// Same panel, rows and separator as MobileSettingsSection.
const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.bgPanel,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: spacing.md
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md + 2
  },
  rowPressed: { backgroundColor: colors.bgRaised },
  rowLabel: {
    flex: 1,
    fontSize: typography.bodySize,
    fontWeight: '500',
    color: colors.textPrimary
  },
  rowValue: { fontSize: typography.metaSize, color: colors.textSecondary },
  actionValue: { fontSize: typography.bodySize, fontWeight: '600', color: colors.textPrimary },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderSubtle,
    marginHorizontal: spacing.md
  }
})
