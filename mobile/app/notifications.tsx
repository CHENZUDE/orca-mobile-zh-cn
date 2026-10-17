import { NotificationDisplayTest } from '../src/settings/notification-display-test'
import { NativeNotificationDeliverySettings } from '../src/settings/native-notification-delivery-settings'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import NotificationsScreen from '../src/settings/notification-settings-screen'
import { nativeNotificationSettingsOperations } from '../src/settings/native-notification-settings-operations'
export default function NativeNotificationsRoute() {
  const router = useRouter()
  const { t } = useTranslation()
  return (
    <NotificationsScreen
      operations={nativeNotificationSettingsOperations}
      onBack={() => router.back()}
      description={t('app.notifications.nativeDescription')}
    >
      {(enabled) => (
        <>
          <NativeNotificationDeliverySettings enabled={enabled} />
          <NotificationDisplayTest onTroubleshoot={() => router.push('/troubleshoot')} />
        </>
      )}
    </NotificationsScreen>
  )
}
