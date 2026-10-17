// Mobile port of desktop's pill labeling
// (src/renderer/src/components/native-chat/native-chat-session-option-labels.ts),
// minus i18n — mobile renders plain strings throughout.

import {
  isDefaultServiceTier,
  type SessionOptionDescriptor,
  type SessionOptionDisabledReason,
  type SessionOptionSelectChoice
} from '../../../src/shared/native-chat-session-options'
import { translate } from '../i18n/i18n'

export function mobileSessionOptionDisabledReason(
  reason: SessionOptionDisabledReason | undefined
): string | null {
  // Exhaustive over SessionOptionDisabledReason so new keys are a compile error.
  switch (reason) {
    case 'set-when-session-starts':
      return translate('sessionOptions.setWhenSessionStarts')
    case 'available-after-session-start':
      return translate('sessionOptions.availableAfterSessionStart')
    case undefined:
      return null
  }
}

function selectedChoiceLabel(descriptor: SessionOptionDescriptor): string | null {
  if (
    descriptor.valueSource === 'unknown' ||
    descriptor.kind.type !== 'select' ||
    !descriptor.kind.currentValue
  ) {
    return null
  }
  const current = descriptor.kind.currentValue
  const choice: SessionOptionSelectChoice = descriptor.kind.choices.find(
    (candidate) => candidate.value === current
  ) ?? { value: current, label: current }
  return choice.label
}

/** Value-only pill text — the category lives on the sheet title, not the pill. */
export function mobileModelPillLabel(descriptor: SessionOptionDescriptor): string {
  return selectedChoiceLabel(descriptor) ?? translate('sessionOptions.model')
}

export function mobileSessionOptionSummaryValue(descriptor: SessionOptionDescriptor): string {
  // A boolean always has a value, so the summary states it and lets the sheet's
  // marker say whether anything confirmed it. Reading "Not set" here while the
  // sheet showed the switch on made the two screens disagree.
  if (descriptor.kind.type === 'boolean') {
    return translate(descriptor.kind.currentValue ? 'sessionOptions.on' : 'sessionOptions.off')
  }
  if (descriptor.valueSource === 'unknown') {
    return translate('sessionOptions.notSet')
  }
  return selectedChoiceLabel(descriptor) ?? translate('sessionOptions.notSet')
}

export function mobileOptionsPillLabel(descriptors: readonly SessionOptionDescriptor[]): string {
  const labels: string[] = []
  for (const descriptor of descriptors) {
    if (descriptor.valueSource === 'unknown' || isDefaultServiceTier(descriptor)) {
      continue
    }
    if (descriptor.kind.type === 'select') {
      const label = selectedChoiceLabel(descriptor)
      if (label) {
        labels.push(label)
      }
    } else if (descriptor.kind.currentValue === true) {
      labels.push(
        descriptor.id === 'fastMode' ? translate('sessionOptions.fast') : descriptor.label
      )
    }
  }
  if (labels.length > 0) {
    return labels.join(' · ')
  }
  const effort = descriptors.find((descriptor) => descriptor.id === 'effort')
  return effort ? effort.label : translate('sessionOptions.options')
}
