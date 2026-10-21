import * as ExpoCrypto from 'expo-crypto'
import type { ConnectionLogSink, ForegroundNudgeReason, HostProfile } from './types'
import type { MobileRelayEndpoint } from '../../../src/shared/mobile-relay-credential-contract'
import { connect } from './rpc-client'
import { MobileEndpointSupervisor } from './mobile-endpoint-supervisor'
import { connectMobileRelayRpcSession } from './mobile-relay-rpc-session'
import { resolveMobileRelayEndpoint } from './mobile-relay-resume-director'
import {
  readMobileRelayCredentialBundle,
  writeMobileRelayCredentialBundle
} from './mobile-relay-credential-bundle'
import { setRelayRouting } from './host-store'
import { upgradeDirectMobileRelay } from './mobile-relay-direct-upgrade'
import { directPathForEndpoint } from './mobile-direct-endpoint-probe'
import { MobileRelayDirectUpgradeController } from './mobile-relay-direct-upgrade-controller'
import { defaultCancelTimer, defaultScheduleTimer } from './timer-scheduler'
import { setRelayBackgroundGraceMs } from './mobile-endpoint-supervisor-support'
import type { StableLogicalRpcClient } from './stable-logical-rpc-client'

type EndpointLifecycle = {
  setForeground(foreground: boolean): void
  setRelayBackgroundGraceMs(graceMs: number): void
  nudge(reason: ForegroundNudgeReason): void
  stop(): void
}

type EndpointOwner = Omit<EndpointLifecycle, 'setRelayBackgroundGraceMs'> & {
  start(): Promise<void>
  /** The background-grace holder the retention setting is forwarded to. */
  backgroundGrace: { setGraceMs(graceMs: number): void }
}

export function startMobileEndpointLifecycle(
  logical: StableLogicalRpcClient,
  initialHost: HostProfile,
  onLog: ConnectionLogSink
): EndpointLifecycle {
  let stopped = false
  let foreground = true
  let relayBackgroundGraceMs: number | null = null
  let owner: EndpointOwner

  const startSupervisor = async (relay: MobileRelayEndpoint): Promise<void> => {
    if (stopped) {
      return
    }
    const supervisor = createSupervisor(logical, initialHost, relay, onLog)
    if (relayBackgroundGraceMs != null) {
      setRelayBackgroundGraceMs(supervisor.backgroundGrace, relayBackgroundGraceMs)
    }
    owner.stop()
    owner = supervisor
    supervisor.setForeground(foreground)
    await supervisor.start()
  }

  if (initialHost.relay) {
    owner = createSupervisor(logical, initialHost, initialHost.relay, onLog)
    if (relayBackgroundGraceMs != null) {
      setRelayBackgroundGraceMs(owner.backgroundGrace, relayBackgroundGraceMs)
    }
    void owner.start()
  } else {
    owner = new MobileRelayDirectUpgradeController(logical, initialHost, {
      upgrade: (client, host) =>
        upgradeDirectMobileRelay({
          client,
          host,
          dependencies: { randomBytes: ExpoCrypto.getRandomBytes }
        }),
      onUpgraded: ({ relay }) => startSupervisor(relay)
    })
    void owner.start()
  }

  return {
    setForeground(next) {
      foreground = next
      owner.setForeground(next)
    },
    setRelayBackgroundGraceMs(graceMs) {
      relayBackgroundGraceMs = graceMs
      setRelayBackgroundGraceMs(owner.backgroundGrace, graceMs)
    },
    nudge(reason) {
      // Why: a focus nudge can precede the AppState listener; keep the closure in
      // sync or a later supervisor swap would start with a stale background flag.
      if (reason !== 'network-change') {
        foreground = true
      }
      owner.nudge(reason)
    },
    stop() {
      stopped = true
      owner.stop()
    }
  }
}

function createSupervisor(
  logical: StableLogicalRpcClient,
  host: HostProfile,
  relay: MobileRelayEndpoint,
  onLog: ConnectionLogSink
): MobileEndpointSupervisor {
  return new MobileEndpointSupervisor(logical, host.id, relay, {
    openDirect: () => connect(host.endpoint, host.deviceToken, host.publicKeyB64, { onLog }),
    directPath: directPathForEndpoint(host.endpoint),
    openRelay: (relay, credential, confirmReqId, onHostCloseReason) =>
      connectMobileRelayRpcSession({
        relay,
        resumeToken: credential.token,
        resumeCredentialVersion: credential.version,
        resumeConfirmReqId: confirmReqId,
        deviceToken: host.deviceToken,
        desktopPublicKeyB64: host.publicKeyB64,
        onHostCloseReason,
        onLog
      }),
    resolveRelay: resolveMobileRelayEndpoint,
    readBundle: readMobileRelayCredentialBundle,
    writeBundle: writeMobileRelayCredentialBundle,
    setRelayRouting,
    onLog,
    now: Date.now,
    randomBytes: ExpoCrypto.getRandomBytes,
    setTimer: defaultScheduleTimer,
    clearTimer: defaultCancelTimer
  })
}
