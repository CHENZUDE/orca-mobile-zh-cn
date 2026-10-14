import { WifiOff, Shield, Monitor, Clock, Globe, Bell } from 'lucide-react-native'
import { colors } from '../theme/mobile-theme'

export type TroubleshootSection = {
  id: string
  icon: React.ReactNode
  titleKey: string
  stepKeys: string[]
}

export const troubleshootCommonIssues: TroubleshootSection[] = [
  {
    id: 'notifications',
    icon: <Bell size={16} color={colors.textSecondary} />,
    titleKey: 'diagnostics.troubleshoot.commonIssues.notifications.title',
    stepKeys: [
      'diagnostics.troubleshoot.commonIssues.notifications.steps.system',
      'diagnostics.troubleshoot.commonIssues.notifications.steps.network'
    ]
  },
  {
    id: 'wifi',
    icon: <WifiOff size={16} color={colors.textSecondary} />,
    titleKey: 'diagnostics.troubleshoot.commonIssues.wifi.title',
    stepKeys: [
      'diagnostics.troubleshoot.commonIssues.wifi.steps.sameLan',
      'diagnostics.troubleshoot.commonIssues.wifi.steps.subnet',
      'diagnostics.troubleshoot.commonIssues.wifi.steps.reconnect'
    ]
  },
  {
    id: 'firewall',
    icon: <Shield size={16} color={colors.textSecondary} />,
    titleKey: 'diagnostics.troubleshoot.commonIssues.firewall.title',
    stepKeys: [
      'diagnostics.troubleshoot.commonIssues.firewall.steps.macos',
      'diagnostics.troubleshoot.commonIssues.firewall.steps.windows',
      'diagnostics.troubleshoot.commonIssues.firewall.steps.linux',
      'diagnostics.troubleshoot.commonIssues.firewall.steps.corporate'
    ]
  },
  {
    id: 'desktop',
    icon: <Monitor size={16} color={colors.textSecondary} />,
    titleKey: 'diagnostics.troubleshoot.commonIssues.desktop.title',
    stepKeys: [
      'diagnostics.troubleshoot.commonIssues.desktop.steps.mustRun',
      'diagnostics.troubleshoot.commonIssues.desktop.steps.restart',
      'diagnostics.troubleshoot.commonIssues.desktop.steps.repair'
    ]
  },
  {
    id: 'timeout',
    icon: <Clock size={16} color={colors.textSecondary} />,
    titleKey: 'diagnostics.troubleshoot.commonIssues.timeout.title',
    stepKeys: [
      'diagnostics.troubleshoot.commonIssues.timeout.steps.signal',
      'diagnostics.troubleshoot.commonIssues.timeout.steps.retry',
      'diagnostics.troubleshoot.commonIssues.timeout.steps.restart'
    ]
  },
  {
    id: 'tailscale',
    icon: <Globe size={16} color={colors.textSecondary} />,
    titleKey: 'diagnostics.troubleshoot.commonIssues.tailscale.title',
    stepKeys: [
      'diagnostics.troubleshoot.commonIssues.tailscale.steps.keepOn',
      'diagnostics.troubleshoot.commonIssues.tailscale.steps.toggle',
      'diagnostics.troubleshoot.commonIssues.tailscale.steps.awake',
      'diagnostics.troubleshoot.commonIssues.tailscale.steps.update'
    ]
  },
  {
    id: 'vpn',
    icon: <Shield size={16} color={colors.textSecondary} />,
    titleKey: 'diagnostics.troubleshoot.commonIssues.vpn.title',
    stepKeys: [
      'diagnostics.troubleshoot.commonIssues.vpn.steps.remote',
      'diagnostics.troubleshoot.commonIssues.vpn.steps.splitTunnel'
    ]
  }
]
