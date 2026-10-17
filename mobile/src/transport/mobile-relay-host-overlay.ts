import { translate } from '../i18n/i18n'
import { z } from 'zod'
import {
  MobileRelayEndpointSchema,
  type MobileRelayEndpoint
} from '../../../src/shared/mobile-relay-credential-contract'
import { relayConnectWebSocketUrl } from './mobile-relay-connect-url'

const MobileAccessEndpointSchema = z
  .object({
    id: z.string().min(1).max(128),
    kind: z.enum(['lan', 'tailscale', 'relay']),
    url: z.string().min(1).max(2048)
  })
  .strict()

/**
 * The stored record, which shipped builds also read and write. Only `relay` is authoritative here:
 * `endpoints` and `relayHostId` are derived copies kept so an older build still parses the record.
 */
export const MobileRelayHostOverlaySchema = z
  .object({
    v: z.literal(2),
    hostId: z.string().min(1),
    endpoints: z.array(MobileAccessEndpointSchema).min(1).max(16),
    relayHostId: z
      .string()
      .regex(/^[A-Za-z0-9_-]{16}$/)
      .optional(),
    relay: MobileRelayEndpointSchema.optional()
  })
  .strict()
  .superRefine((overlay, context) => {
    if ((overlay.relayHostId === undefined) !== (overlay.relay === undefined)) {
      context.addIssue({
        code: 'custom',
        message: translate('connectionHealth.relayIdentityEndpointCoexist')
      })
      return
    }
    if (overlay.relay && overlay.relay.relayHostId !== overlay.relayHostId) {
      context.addIssue({
        code: 'custom',
        path: ['relayHostId'],
        message: translate('connectionHealth.relayHostIdentityMismatch')
      })
    }
    const relayEndpointCount = overlay.endpoints.filter(({ kind }) => kind === 'relay').length
    if (relayEndpointCount !== (overlay.relay ? 1 : 0)) {
      context.addIssue({
        code: 'custom',
        path: ['endpoints'],
        message: translate('connectionHealth.expectedOneRelayEndpoint')
      })
    }
  })

export type MobileRelayHostOverlay = z.infer<typeof MobileRelayHostOverlaySchema>

// Why no direct entry: the host row owns the address, and a copy here outlived every Edit Host.
export function toStoredMobileRelayHostOverlay(
  hostId: string,
  relay: MobileRelayEndpoint
): MobileRelayHostOverlay {
  return MobileRelayHostOverlaySchema.parse({
    v: 2,
    hostId,
    endpoints: [
      {
        id: 'relay-primary',
        kind: 'relay',
        url: relayConnectWebSocketUrl(relay.cellUrl, relay.relayHostId)
      }
    ],
    relayHostId: relay.relayHostId,
    relay
  })
}
