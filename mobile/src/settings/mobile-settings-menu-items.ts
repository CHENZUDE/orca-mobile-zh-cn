import { Bell, Globe, Info, MessageSquare, Mic, Terminal, Wrench } from 'lucide-react-native'
import type { MobileSettingsMenuItem } from './mobile-settings-menu'

export function mobileSettingsMenuItems(push: (route: string) => void): MobileSettingsMenuItem[] {
  return [
    { label: 'settings.menu.terminal', icon: Terminal, onPress: () => push('/terminal-settings') },
    { label: 'settings.menu.chatUi', icon: MessageSquare, onPress: () => push('/native-chat-settings') },
    { label: 'settings.menu.browser', icon: Globe, onPress: () => push('/browser-settings') },
    { label: 'settings.menu.voice', icon: Mic, onPress: () => push('/voice-settings') },
    { label: 'settings.menu.notifications', icon: Bell, onPress: () => push('/notifications') },
    { label: 'settings.menu.troubleshooting', icon: Wrench, onPress: () => push('/troubleshoot') },
    { label: 'settings.menu.about', icon: Info, onPress: () => push('/about') }
  ]
}
