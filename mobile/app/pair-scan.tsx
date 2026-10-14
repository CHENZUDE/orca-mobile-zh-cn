import { useState, useRef, useCallback } from 'react'
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Linking,
  type LayoutChangeEvent
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'expo-router'
import { ChevronLeft, Clipboard as ClipboardIcon, QrCode } from 'lucide-react-native'
import { decodePairingUrl, parsePairingCode } from '../src/transport/pairing'
import {
  startPreProfilePairing,
  type PreProfilePairingAttempt
} from '../src/transport/pre-profile-pairing-coordinator'
import type { ConnectionLogEntry, PairingOffer } from '../src/transport/types'
import { useRefreshHostClient } from '../src/transport/client-context'
import { colors, spacing } from '../src/theme/mobile-theme'
import { TextInputModal } from '../src/components/TextInputModal'
import { ConnectionLog } from '../src/components/ConnectionLog'
import {
  loadMobileOnboardingSteps,
  mobileOnboardingDestination
} from '../src/onboarding/mobile-onboarding-plan'
import { pairScanStyles as styles } from '../src/pair-scan-styles'

// Why: see pair-confirm.tsx — cap initial-pair "Connecting…" so a broken
// route surfaces as a real error with the log visible instead of a
// silent infinite spinner.
const PAIRING_OVERALL_TIMEOUT_MS = 25_000
const SCAN_RETICLE_SCALE = 0.62
const SCAN_RETICLE_MAX_SIZE = 360

function Step({ number, text }: { number: number; text: string }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepBadge}>
        <Text style={styles.stepNumber}>{number}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  )
}

export default function PairScanScreen() {
  const router = useRouter()
  const refreshHostClient = useRefreshHostClient()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()
  const [permission, requestPermission] = useCameraPermissions()
  const [status, setStatus] = useState<'scanning' | 'connecting' | 'error'>('scanning')
  const [errorMessage, setErrorMessage] = useState('')
  const [pasteVisible, setPasteVisible] = useState(false)
  const [cameraBounds, setCameraBounds] = useState({ width: 0, height: 0 })
  const [logs, setLogs] = useState<ConnectionLogEntry[]>([])
  const logsRef = useRef<ConnectionLogEntry[]>([])
  const processingRef = useRef(false)
  const mountedRef = useRef(true)
  const activePairingAttemptRef = useRef<PreProfilePairingAttempt | null>(null)

  const setPairScanRootRef = useCallback((node: View | null): void => {
    if (node !== null) {
      mountedRef.current = true
      return
    }
    // Why: pairing attempts can outlive the visible route; dispose them when
    // the scan screen detaches without a passive cleanup-only Effect.
    mountedRef.current = false
    activePairingAttemptRef.current?.dispose()
    activePairingAttemptRef.current = null
  }, [])

  const handleBarCodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (processingRef.current) {
        return
      }
      processingRef.current = true

      const offer = decodePairingUrl(data)
      if (!offer) {
        setStatus('error')
        setErrorMessage(t('pairing.scan.invalidQr'))
        processingRef.current = false
        return
      }

      void testAndSave(offer)
    },
    [router]
  )

  const handlePasteSubmit = useCallback((input: string) => {
    setPasteVisible(false)
    if (processingRef.current) {
      return
    }
    processingRef.current = true

    const offer = parsePairingCode(input)
    if (!offer) {
      setStatus('error')
        setErrorMessage(t('pairing.scan.invalidPaste'))
      processingRef.current = false
      return
    }

    void testAndSave(offer)
  }, [])

  const handleCameraLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout
    const nextBounds = {
      width: Math.round(width),
      height: Math.round(height)
    }
    setCameraBounds((currentBounds) =>
      currentBounds.width === nextBounds.width && currentBounds.height === nextBounds.height
        ? currentBounds
        : nextBounds
    )
  }, [])

  async function testAndSave(offer: PairingOffer) {
    setStatus('connecting')
    logsRef.current = []
    setLogs([])
    activePairingAttemptRef.current?.dispose()

    const attempt = startPreProfilePairing({
      offer,
      timeoutMs: PAIRING_OVERALL_TIMEOUT_MS,
      connectOptions: {
        onLog: (entry) => {
          if (!mountedRef.current || activePairingAttemptRef.current !== attempt) {
            return
          }
          logsRef.current = [...logsRef.current, entry]
          setLogs(logsRef.current)
        }
      }
    })
    activePairingAttemptRef.current = attempt
    try {
      const { hostId } = await attempt.result
      const attemptIsCurrent = activePairingAttemptRef.current === attempt
      attempt.dispose()
      if (activePairingAttemptRef.current === attempt) {
        activePairingAttemptRef.current = null
      }
      if (!mountedRef.current || !attemptIsCurrent) {
        return
      }
      // Why: re-pairing the same desktop now reuses its existing host id
      // (STA-1840 dedup), so a client cached under that id from an earlier
      // pairing would keep the stale endpoint/relay. Close it so the
      // Refresh any cached client from the newly persisted pairing profile.
      refreshHostClient(hostId)
      const onboardingSteps = await loadMobileOnboardingSteps()
      if (!mountedRef.current) {
        return
      }
      router.replace(mobileOnboardingDestination(onboardingSteps, hostId))
    } catch (err) {
      const timedOut = attempt.timedOut
      const attemptIsCurrent = activePairingAttemptRef.current === attempt
      attempt.dispose()
      if (activePairingAttemptRef.current === attempt) {
        activePairingAttemptRef.current = null
      }
      if (!mountedRef.current || !attemptIsCurrent) {
        return
      }
      console.warn('[pair] connect failed', err)
      setStatus('error')
      setErrorMessage(
        timedOut
          ? t('pairing.scan.timeout', { seconds: PAIRING_OVERALL_TIMEOUT_MS / 1000 })
          : t('pairing.scan.failed', { error: err instanceof Error ? err.message : String(err) })
      )
      processingRef.current = false
    }
  }

  function retry() {
    setStatus('scanning')
    setErrorMessage('')
    logsRef.current = []
    setLogs([])
    processingRef.current = false
  }

  // Why: bottom inset accounts for Android 3-button nav bars and iOS
  // home-indicator areas that would otherwise overlap the 'Or paste
  // pairing code' button at the bottom of the scan screen.
  const containerPadding = {
    paddingTop: insets.top + spacing.sm,
    paddingBottom: insets.bottom + spacing.sm
  }
  // Why: iPad camera previews are often rectangular, but QR guides should
  // stay square so the corners still describe the code shape.
  const reticleSize = Math.min(
    Math.round(Math.min(cameraBounds.width, cameraBounds.height) * SCAN_RETICLE_SCALE),
    SCAN_RETICLE_MAX_SIZE
  )

  if (!permission) {
    return (
      <View ref={setPairScanRootRef} style={[styles.container, containerPadding]}>
        <ActivityIndicator color={colors.textSecondary} />
      </View>
    )
  }

  if (!permission.granted) {
    const canAskAgain = permission.canAskAgain !== false
    return (
      <View ref={setPairScanRootRef} style={[styles.container, containerPadding]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={22} color={colors.textSecondary} />
        </Pressable>
        <View style={styles.centered}>
          <Text style={styles.title}>
            {canAskAgain ? t('pairing.scan.permission.title') : t('pairing.scan.permission.blocked')}
          </Text>
          <Text style={styles.subtitle}>
            {canAskAgain
              ? t('pairing.scan.permission.subtitleAllowed')
              : t('pairing.scan.permission.subtitleBlocked')}
          </Text>
          <Pressable
            style={styles.primaryButton}
            onPress={canAskAgain ? requestPermission : () => void Linking.openSettings()}
          >
            {canAskAgain && <QrCode size={16} color={colors.bgBase} />}
            <Text style={styles.primaryButtonText}>
              {canAskAgain ? t('pairing.scan.permission.continue') : t('pairing.scan.permission.openSettings')}
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.pasteButton, pressed && styles.pasteButtonPressed]}
            onPress={() => setPasteVisible(true)}
          >
            <ClipboardIcon size={16} color={colors.textSecondary} />
            <Text style={styles.pasteButtonText}>{t('pairing.pasteInstead')}</Text>
          </Pressable>
        </View>
        <TextInputModal
          visible={pasteVisible}
          title={t('pairing.scan.paste.title')}
          message={t('pairing.scan.paste.message')}
          placeholder={t('pairing.pastePlaceholder')}
          onSubmit={handlePasteSubmit}
          onCancel={() => setPasteVisible(false)}
        />
      </View>
    )
  }

  return (
    <View ref={setPairScanRootRef} style={[styles.container, containerPadding]}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <ChevronLeft size={22} color={colors.textSecondary} />
      </Pressable>

      <View style={styles.steps}>
        <Step number={1} text={t('pairing.scan.step1')} />
        <Step number={2} text={t('pairing.scan.step2')} />
        <Step number={3} text={t('pairing.scan.step3')} />
      </View>

      {status === 'scanning' && (
        <>
          {/* Why: unmount the camera while the paste sheet is open. The
              user has clearly chosen the paste path; keeping the camera
              streaming behind a sheet wastes power and looks weird if
              they cancel the sheet and the QR was scanned silently in
              the meantime. */}
          {!pasteVisible && (
            <View style={styles.cameraWrap} onLayout={handleCameraLayout}>
              <CameraView
                style={styles.camera}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={handleBarCodeScanned}
              />
              <View style={styles.reticle} pointerEvents="none">
                <View style={[styles.reticleFrame, { width: reticleSize, height: reticleSize }]}>
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />
                </View>
              </View>
            </View>
          )}
          {pasteVisible && <View style={styles.cameraPlaceholder} />}
          <Pressable
            style={({ pressed }) => [styles.pasteButton, pressed && styles.pasteButtonPressed]}
            onPress={() => setPasteVisible(true)}
          >
            <ClipboardIcon size={16} color={colors.textSecondary} />
            <Text style={styles.pasteButtonText}>{t('pairing.orPasteCode')}</Text>
          </Pressable>
        </>
      )}

      {status === 'connecting' && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.textSecondary} />
          <Text style={styles.connectingText}>{t('pairing.connecting')}</Text>
          <View style={styles.logSlot}>
            <ConnectionLog entries={logs} title={t('pairing.scan.logTitle')} />
          </View>
        </View>
      )}

      {status === 'error' && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          {logs.length > 0 && (
            <View style={styles.logSlot}>
              <ConnectionLog entries={logs} title={t('pairing.scan.logTitle')} />
            </View>
          )}
          <View style={styles.errorActions}>
            <Pressable style={styles.primaryButton} onPress={retry}>
              <Text style={styles.primaryButtonText}>{t('pairing.tryAgain')}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.pasteButtonPressed
              ]}
              onPress={() => {
                retry()
                setPasteVisible(true)
              }}
            >
              <Text style={styles.secondaryButtonText}>{t('pairing.pasteInstead')}</Text>
            </Pressable>
          </View>
        </View>
      )}

      <TextInputModal
        visible={pasteVisible}
        title={t('pairing.scan.paste.title')}
        message={t('pairing.scan.paste.message')}
        placeholder={t('pairing.pastePlaceholder')}
        onSubmit={handlePasteSubmit}
        onCancel={() => setPasteVisible(false)}
      />
    </View>
  )
}
