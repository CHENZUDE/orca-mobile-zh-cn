import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { SquareChevronRight } from 'lucide-react-native'

import { MobileSessionHeaderIconButton } from './MobileSessionHeaderIconButton'
import { styles } from './mobile-session-styles'

type Props = {
  disabled: boolean
  onPress: () => void
}

export function QuickCommandsTabButton({ disabled, onPress }: Props) {
  const { t } = useTranslation()

  return (
    <>
      <View style={styles.tabActionDivider} />
      <MobileSessionHeaderIconButton
        disabled={disabled}
        onPress={onPress}
        accessibilityLabel={t('quickCommands.title')}
        icon={SquareChevronRight}
      />
    </>
  )
}
