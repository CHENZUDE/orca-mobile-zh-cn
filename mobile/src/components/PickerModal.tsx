import type { ReactNode } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Check } from 'lucide-react-native'
import { colors, spacing, typography } from '../theme/mobile-theme'
import { useTranslation } from 'react-i18next'
import { BottomDrawer } from './BottomDrawer'

export type PickerOption<T extends string = string> = {
  value: T
  label: string
  subtitle?: string
  disabled?: boolean
  renderIcon?: (selected: boolean) => ReactNode
  // Why: static option tables live in plain .ts modules, so they carry i18n keys
  // instead of resolved text and the picker resolves them at render time.
  labelKey?: string
  subtitleKey?: string
}

type Props<T extends string = string> = {
  visible: boolean
  title: string
  titleKey?: string
  subtitle?: string
  subtitleKey?: string
  options: PickerOption<T>[]
  selected: T
  onSelect: (value: T) => void
  onLongSelect?: (value: T) => void
  onClose: () => void
  onAfterClose?: () => void
  zIndex?: number
}

type PickerModalContentProps<T extends string = string> = Pick<
  Props<T>,
  'options' | 'selected' | 'onSelect' | 'onLongSelect' | 'onClose'
>

export function PickerModal<T extends string = string>({
  visible,
  title,
  titleKey,
  subtitle,
  subtitleKey,
  options,
  selected,
  onSelect,
  onLongSelect,
  onClose,
  onAfterClose,
  zIndex
}: Props<T>) {
  const { t } = useTranslation()
  const resolvedTitle = titleKey ? t(titleKey) : title
  const resolvedSubtitle = subtitleKey ? t(subtitleKey) : subtitle
  return (
    <BottomDrawer visible={visible} onClose={onClose} onAfterClose={onAfterClose} zIndex={zIndex}>
      <View style={styles.header}>
        <Text style={styles.title}>{resolvedTitle}</Text>
        {resolvedSubtitle ? <Text style={styles.subtitle}>{resolvedSubtitle}</Text> : null}
      </View>

      <PickerModalContent
        options={options}
        selected={selected}
        onSelect={onSelect}
        onLongSelect={onLongSelect}
        onClose={onClose}
      />
    </BottomDrawer>
  )
}

function PickerModalContent<T extends string = string>({
  options,
  selected,
  onSelect,
  onLongSelect,
  onClose
}: PickerModalContentProps<T>) {
  const { t } = useTranslation()
  const resolve = (fallback: string, key?: string) => (key ? t(key) : fallback)
  // Why: closed BottomDrawer instances return null, so keeping option rows in
  // this child avoids rebuilding hidden picker contents on every parent render.
  return (
    <View style={styles.group}>
      {options.map((opt, i) => {
        const isSelected = opt.value === selected
        return (
          <View key={opt.value}>
            {i > 0 && <View style={styles.separator} />}
            <Pressable
              accessible
              accessibilityRole="button"
              accessibilityState={{ disabled: Boolean(opt.disabled), selected: isSelected }}
              disabled={opt.disabled}
              style={({ pressed }) => [
                styles.row,
                pressed && !opt.disabled && styles.rowPressed,
                opt.disabled && styles.rowDisabled
              ]}
              onPress={() => {
                if (opt.disabled) {
                  return
                }
                onSelect(opt.value)
                onClose()
              }}
              onLongPress={
                onLongSelect
                  ? () => {
                      if (opt.disabled) {
                        return
                      }
                      onLongSelect(opt.value)
                      onClose()
                    }
                  : undefined
              }
            >
              {opt.renderIcon ? (
                <View style={styles.rowIcon}>{opt.renderIcon(isSelected)}</View>
              ) : null}
              <View style={styles.rowContent}>
                <Text style={[styles.rowLabel, isSelected && styles.rowLabelSelected]}>
                  {resolve(opt.label, opt.labelKey)}
                </Text>
                {opt.subtitle || opt.subtitleKey ? (
                  <Text style={styles.rowSubtitle}>
                    {resolve(opt.subtitle ?? '', opt.subtitleKey)}
                  </Text>
                ) : null}
              </View>
              {isSelected && <Check size={16} color={colors.textPrimary} />}
            </Pressable>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.sm
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted
  },
  subtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2
  },
  group: {
    backgroundColor: colors.bgPanel,
    borderRadius: 12,
    overflow: 'hidden'
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderSubtle,
    marginHorizontal: spacing.md
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md + 2
  },
  rowPressed: {
    backgroundColor: colors.bgRaised
  },
  rowDisabled: {
    opacity: 0.45
  },
  rowContent: {
    flex: 1,
    minWidth: 0
  },
  rowIcon: {
    width: 22,
    alignItems: 'center',
    marginRight: spacing.sm
  },
  rowLabel: {
    fontSize: typography.bodySize,
    color: colors.textPrimary
  },
  rowLabelSelected: {
    fontWeight: '600'
  },
  rowSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1
  }
})
