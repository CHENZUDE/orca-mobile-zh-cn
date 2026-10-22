import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ChevronRight, Radio } from 'lucide-react-native'
import { PickerModal, type PickerOption } from '../components/PickerModal'
import {
  loadRelayBackgroundRetention,
  saveRelayBackgroundRetention,
  type MobileRelayBackgroundRetention
} from '../storage/preferences'
import { colors, radii, spacing, typography } from '../theme/mobile-theme'

const RETENTION_VALUES = ['30s', '1m', '2m'] as const

function buildOptions(t: (key: string) => string): PickerOption<MobileRelayBackgroundRetention>[] {
  return RETENTION_VALUES.map((value) => ({
    value,
    label: t(`settings.connection.retention.${value}`)
  }))
}

function optionLabel(
  options: PickerOption<MobileRelayBackgroundRetention>[],
  value: MobileRelayBackgroundRetention
): string {
  return options.find((option) => option.value === value)?.label ?? options[0]!.label
}

export function ConnectionRetentionSettingsRows() {
  const { t } = useTranslation()
  const options = useMemo(() => buildOptions(t), [t])
  const [retention, setRetention] = useState<MobileRelayBackgroundRetention>('30s')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)

  useEffect(() => {
    let active = true
    void loadRelayBackgroundRetention().then((value) => {
      if (active) {
        setRetention(value)
      }
    })
    return () => {
      active = false
    }
  }, [])

  const selectRetention = useCallback((value: MobileRelayBackgroundRetention) => {
    setRetention(value)
    setSaveFailed(false)
    void saveRelayBackgroundRetention(value).catch(() => setSaveFailed(true))
  }, [])

  return (
    <>
      <Text style={styles.groupHeading}>{t('settings.connection.retention.group.heading')}</Text>
      <Text style={styles.groupDescription}>{t('settings.connection.retention.group.body')}</Text>
      <View style={styles.section}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('settings.connection.retention.row.label')}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          onPress={() => setPickerOpen(true)}
        >
          <Radio size={16} color={colors.textSecondary} />
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>{t('settings.connection.retention.row.label')}</Text>
            <Text style={styles.rowSublabel}>
              {saveFailed
                ? t('settings.connection.retention.errors.save')
                : optionLabel(options, retention)}
            </Text>
          </View>
          <ChevronRight size={16} color={colors.textMuted} />
        </Pressable>
      </View>

      <PickerModal<MobileRelayBackgroundRetention>
        visible={pickerOpen}
        title={t('settings.connection.retention.row.label')}
        options={options}
        selected={retention}
        onSelect={selectRetention}
        onClose={() => setPickerOpen(false)}
      />
    </>
  )
}

const styles = StyleSheet.create({
  groupHeading: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs
  },
  groupDescription: {
    fontSize: typography.bodySize - 1,
    color: colors.textSecondary,
    lineHeight: 20,
    paddingHorizontal: spacing.xs
  },
  section: {
    marginTop: spacing.sm,
    backgroundColor: colors.bgPanel,
    borderRadius: radii.card,
    overflow: 'hidden'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md + 2
  },
  rowPressed: { backgroundColor: colors.bgRaised },
  rowContent: { flex: 1 },
  rowLabel: {
    fontSize: typography.bodySize,
    fontWeight: '500',
    color: colors.textPrimary
  },
  rowSublabel: {
    marginTop: 2,
    fontSize: typography.bodySize - 2,
    color: colors.textSecondary
  }
})
