import { useEffect } from 'react'
import { BRAND_SHORT_NAME } from '../constants/branding'

export function usePageTitle(title) {
  useEffect(() => {
    document.title = `${title} | ${BRAND_SHORT_NAME}`
  }, [title])
}
