import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  sayBackgroundTaskEnglish,
  type BackgroundTaskCopyId,
  type BackgroundTaskSay,
  type BackgroundTaskCopyValues
} from '../../../src/shared/background-task-copy'
import { BACKGROUND_TASK_COPY_ZH } from './background-task-copy-zh'

/** The strip copy in the reader language; English stays the fallback for every other one. */
export function useBackgroundTaskSay(): BackgroundTaskSay {
  const { i18n } = useTranslation()
  return useMemo<BackgroundTaskSay>(() => {
    const table =
      i18n.language === 'zh' || i18n.language.startsWith('zh-')
        ? BACKGROUND_TASK_COPY_ZH
        : null
    if (!table) {
      return sayBackgroundTaskEnglish
    }
    return (id: BackgroundTaskCopyId, values?: BackgroundTaskCopyValues) => {
      const template = table[id]
      if (values === undefined) {
        return template
      }
      // A replacer function, so a task name containing $& is never read as a pattern.
      return template.replaceAll('{{value0}}', () => String(values.value0))
    }
  }, [i18n.language])
}
