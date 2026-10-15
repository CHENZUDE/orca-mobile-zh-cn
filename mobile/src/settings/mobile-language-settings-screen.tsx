import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import { colors, spacing, typography } from '../theme/mobile-theme'
import { PickerModal, type PickerOption } from '../components/PickerModal'
import { UI_LANGUAGE_CHOICES, type UiLanguageChoice } from '../i18n/ui-language-choices'
import type { BuiltInUiLanguage } from '../../../src/shared/ui-language'
import { useUiLanguage } from '../i18n/use-ui-language'

export default function LanguageSettingsScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { language, setLanguage } = useUiLanguage()
  const [pickerOpen, setPickerOpen] = useState(false)

  // Why: the picker and the inline row should show the same label, so build
  // the option list once and let both call sites read from it. PickerOption
  // requires pre-stringified labels because BottomDrawer renders before the
  // t() context guarantees a fresh render.
  const options = useMemo<PickerOption<UiLanguageChoice['value']>[]>(
    () =>
      UI_LANGUAGE_CHOICES.map((choice) => ({
        value: choice.value,
        label: t(choice.labelKey)
      })),
    [t]
  )

  // Why: useUiLanguage returns the union UiLanguage (built-in + plugin),
  // but this picker only surfaces the seven built-in choices. The cast stays
  // safe because the picker is the only writer here and only accepts
  // BuiltInUiLanguage values.
  const selected: BuiltInUiLanguage =
    typeof language === 'string' && UI_LANGUAGE_CHOICES.some((c) => c.value === language)
      ? (language as BuiltInUiLanguage)
      : 'system'
  const selectedLabel =
    options.find((o) => o.value === selected)?.label ?? options[0]!.label

  const onSelect = useCallback(
    (next: UiLanguageChoice['value']) => {
      setPickerOpen(false)
      void setLanguage(next)
    },
    [setLanguage]
  )

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.topRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={22} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.heading}>{t('settings.appearance.language.title')}</Text>
      </View>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.description}>{t('settings.appearance.language.description')}</Text>
        <View style={styles.section}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('settings.appearance.language.title')}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => setPickerOpen(true)}
          >
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>{t('settings.appearance.language.title')}</Text>
              <Text style={styles.rowValue}>{selectedLabel}</Text>
            </View>
            <ChevronRight size={16} color={colors.textMuted} />
          </Pressable>
        </View>
      </ScrollView>
      <PickerModal<UiLanguageChoice['value']>
        visible={pickerOpen}
        title={t('settings.appearance.language.title')}
        options={options}
        selected={selected}
        onSelect={onSelect}
        onClose={() => setPickerOpen(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBase, paddingHorizontal: spacing.lg },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm
  },
  heading: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  description: {
    fontSize: typography.bodySize,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    lineHeight: 20
  },
  section: { backgroundColor: colors.bgPanel, borderRadius: 12, overflow: 'hidden' },
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
  rowValue: {
    fontSize: typography.metaSize,
    color: colors.textMuted,
    marginTop: 2
  }
})
