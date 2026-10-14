import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { View, Text, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, Copy, Check, Send } from 'lucide-react-native'
import { colors, spacing } from '../theme/mobile-theme'
import { ConnectionLog } from '../components/ConnectionLog'
import { connectionDiagnosticsScreenStyles as styles } from './connection-diagnostics-screen-styles'
import type { ConnectionLogEntry, ConnectionState } from '../transport/types'
import type { ConnectionDiagnosis } from './connection-diagnostics-analysis'
import type { DiagnosticsSubmissionState } from './connection-diagnostics-screen-data'

export function ConnectionDiagnosticsView({
  hostPicker,
  hasHost,
  hostName,
  state,
  reconnectAttempts,
  copied,
  copyDiagnostics,
  diagnosis,
  submissionState,
  sendDiagnostics,
  entries,
  onBack
}: {
  hostPicker?: ReactNode
  hasHost: boolean
  hostName: string
  state: ConnectionState
  reconnectAttempts: number
  copied: boolean
  copyDiagnostics: () => Promise<void>
  diagnosis: ConnectionDiagnosis | null
  submissionState: DiagnosticsSubmissionState | 'idle'
  sendDiagnostics: () => Promise<void>
  entries: readonly ConnectionLogEntry[]
  onBack: () => void
}) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.topRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          style={styles.backButton}
          onPress={onBack}
        >
          <ChevronLeft size={22} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.heading}>{t('diagnostics.connection.heading')}</Text>
      </View>

      {hostPicker}
      {hasHost ? (
        <>
          <View style={styles.statusRow}>
            <Text style={styles.statusText}>
              {state}{reconnectAttempts > 0 ? ` \u00b7 ${t('diagnostics.connection.attempt', { count: reconnectAttempts })}` : ''}
            </Text>
            <Pressable style={styles.copyButton} onPress={() => void copyDiagnostics()}>
              {copied ? (
                <Check size={14} color={colors.statusGreen} />
              ) : (
                <Copy size={14} color={colors.textSecondary} />
              )}
              <Text style={styles.copyButtonText}>{copied ? t('diagnostics.connection.copied') : t('diagnostics.connection.copyReport')}</Text>
            </Pressable>
          </View>
          {diagnosis && (
            <View style={styles.diagnosisCard}>
            <Text style={styles.diagnosisHeading}>{t('diagnostics.connection.diagnosisHeading')}</Text>
              <Text style={styles.diagnosisText}>{diagnosis.likelyCause}</Text>
              <Text style={styles.diagnosisNext}>{diagnosis.nextStep}</Text>
              {diagnosis.reportability === 'orca-relay' && (
                <>
                  <Text style={styles.privacyHint}>
                    {t('diagnostics.connection.privacyHint')}
                  </Text>
                  <Pressable
                    style={styles.sendButton}
                    onPress={() => void sendDiagnostics()}
                    disabled={submissionState === 'sending'}
                  >
                    {submissionState === 'sent' ? (
                      <Check size={14} color={colors.statusGreen} />
                    ) : (
                      <Send size={14} color={colors.textPrimary} />
                    )}
                    <Text style={styles.sendButtonText}>
                      {submissionState === 'sending'
                        ? t('diagnostics.connection.sending')
                        : submissionState === 'sent'
                          ? t('diagnostics.connection.sent')
                          : submissionState === 'failed'
                            ? t('diagnostics.connection.retry')
                            : t('diagnostics.connection.send')}
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          )}
          {entries.length > 0 ? (
            <ConnectionLog entries={[...entries]} title={hostName} fillAvailableHeight />
          ) : (
            <Text style={styles.emptyText}>
              {t('diagnostics.connection.noEvents')}
            </Text>
          )}
        </>
      ) : (
        <Text style={styles.emptyText}>{t('diagnostics.connection.noHosts')}</Text>
      )}
    </View>
  )
}
