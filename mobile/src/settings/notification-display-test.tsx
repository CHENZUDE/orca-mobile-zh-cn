import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useAllHostClients } from '../transport/use-all-host-clients'
import { loadHostCatalog } from '../transport/host-store'
import { pushDeliveryTest } from '../notifications/mobile-push-delivery-test-operations'
import type { RpcFailure } from '../transport/types'
import { colors, spacing, typography } from '../theme/mobile-theme'

export function NotificationDisplayTest({ onTroubleshoot }: { onTroubleshoot: () => void }) {
  const { t } = useTranslation()
  const busy = useRef(false)
  const [hostIds, setHostIds] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const clients = useAllHostClients(hostIds)
  useEffect(() => {
    void loadHostCatalog()
      .then((hosts) => setHostIds(hosts.map((host) => host.id)))
      .catch(() => setMessage(t('settings.notifications.displayTest.errors.loadHosts')))
  }, [])
  const run = async () => {
    if (busy.current) {
      return
    }
    busy.current = true
    setSending(true)
    setMessage(null)
    try {
      if (hostIds.length === 0) {
        throw new Error(t('settings.notifications.displayTest.errors.noHost'))
      }
      const connected = clients.filter((entry) => entry.state === 'connected')
      if (connected.length === 0) {
        throw new Error(t('settings.notifications.displayTest.errors.notConnected'))
      }
      let unavailable = t('settings.notifications.displayTest.errors.outdatedDesktop')
      for (const { client } of connected) {
        const reply = await pushDeliveryTest.request(client, null, {
          timeoutMs: 20000,
          failWhenDisconnected: true
        })
        const delivered = pushDeliveryTest.interpret(reply)
        if (!delivered.accepted) {
          // oxlint-disable-next-line typescript/consistent-type-assertions -- SAFETY: this policy skips only a refusal, so an unaccepted reply is a failure envelope.
          const code = (reply as RpcFailure).error?.code
          if (code === 'forbidden' || code === 'method_not_found') {
            continue
          }
          throw new Error(t('settings.notifications.displayTest.errors.unreachable'))
        }
        const result = delivered.value
        if (result?.accepted) {
          setMessage(t('settings.notifications.displayTest.success'))
          return
        }
        if (result?.reason === 'not_registered') {
          unavailable = t('settings.notifications.displayTest.errors.notRegistered')
          continue
        }
        throw new Error(
          result?.reason === 'rate_limited'
            ? 'Too many notifications. Try again later.'
            : t('settings.notifications.displayTest.errors.sendFailed')
        )
      }
      throw new Error(unavailable)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('settings.notifications.displayTest.errors.generic'))
    } finally {
      busy.current = false
      setSending(false)
    }
  }
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('settings.notifications.displayTest.prompt')}</Text>
      <Text style={styles.detail}>{t('settings.notifications.displayTest.detail')}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={sending ? t('settings.notifications.displayTest.sending') : t('settings.notifications.displayTest.send')}
        disabled={sending}
        accessibilityState={{ disabled: sending }}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        onPress={() => void run()}
      >
        <View>
          <Text accessible={false} style={[styles.buttonText, styles.sizingLabel]}>
            {t('settings.notifications.displayTest.send')}
          </Text>
          <View pointerEvents="none" style={styles.buttonLabel}>
            <Text accessible={false} style={styles.buttonText}>
              {sending ? t('settings.notifications.displayTest.sending') : t('settings.notifications.displayTest.send')}
            </Text>
          </View>
        </View>
      </Pressable>
      <Pressable accessibilityRole="link" onPress={onTroubleshoot} style={styles.troubleshootLink}>
        <Text style={styles.linkText}>{t('settings.menu.troubleshooting')}</Text>
      </Pressable>
      {message && (
        <Text accessibilityRole="alert" style={styles.detail}>
          {message}
        </Text>
      )}
    </View>
  )
}
const styles = StyleSheet.create({
  container: { marginTop: spacing.xl, gap: spacing.sm },
  label: { color: colors.textPrimary, fontSize: typography.bodySize, fontWeight: '600' },
  detail: { color: colors.textMuted, fontSize: typography.metaSize, lineHeight: 18 },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bgRaised,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md
  },
  sizingLabel: { opacity: 0 },
  buttonLabel: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  troubleshootLink: { alignSelf: 'flex-start', paddingVertical: spacing.sm },
  linkText: {
    color: colors.textSecondary,
    fontSize: typography.metaSize,
    textDecorationLine: 'underline'
  },
  pressed: { opacity: 0.6 },
  buttonText: { color: colors.textPrimary, fontSize: typography.metaSize, fontWeight: '600' }
})
