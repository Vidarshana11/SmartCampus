import { useEffect } from 'react'
import { BRAND_FULL_NAME } from '../constants/branding'

export function usePageTitle(title) {
  useEffect(() => {
    document.title = `${title} | ${BRAND_FULL_NAME}`
  }, [title])
}
