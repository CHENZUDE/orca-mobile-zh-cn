import { Stack } from 'expo-router'
import { colors } from '../theme/mobile-theme'
import { useTranslation } from 'react-i18next'
import { HOST_STACK_SCREENS, type HostStackAnimation } from './host-stack-screens'

export function HostStack({ animation }: { animation: HostStackAnimation }) {
  const { t } = useTranslation()
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bgBase },
        // In the tablet split view the detail pane should swap instantly like
        // a desktop master-detail; the default slide animates the outgoing
        // screen and briefly reveals the one beneath it. Phones keep the slide.
        animation
      }}
    >
      {HOST_STACK_SCREENS.map(({ name, title, titleKey }) => (
        <Stack.Screen key={name} name={name} options={{ title: titleKey ? t(titleKey) : title }} />
      ))}
    </Stack>
  )
}
