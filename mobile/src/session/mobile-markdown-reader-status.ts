import { formatPreviewByteLength } from '../files/mobile-file-preview-response'
import { translate } from '../i18n/i18n'
import type { MarkdownDocState } from './mobile-session-route-types'

/** The markdown floating bar's status line; a truncated preview reads like a file tab's note. */
export function markdownReaderStatusText(
  doc: Extract<MarkdownDocState, { status: 'ready' }>
): string | null {
  if (doc.saveError) {
    return doc.saveError
  }
  if (doc.truncated) {
    return doc.byteLength === undefined
      ? translate('markdownReader.previewTruncated')
      : translate('markdownReader.previewTruncatedWithSize', {
          size: formatPreviewByteLength(doc.byteLength)
        })
  }
  if (doc.readOnlyReason) {
    return translate('markdownReader.readOnly')
  }
  return doc.stale ? translate('markdownReader.changedOnDesktop') : null
}
