import { useEffect } from 'react'
import { useBusinessSettings } from '../features/business/settingsStore'
import { useMaterialsStore } from '../features/catalogue/store'
import { useEnquiriesStore } from '../features/enquiries/store'
import { useSessionCheck } from '../features/auth/hooks/useAuth'

/**
 * Loads the shared data from the API when a layout opens:
 * shop settings + materials for everyone, and enquiries for the business area.
 * Saved visualisations and projects load per user where they are used (useScans / useProjects);
 * favourites, compare, the quote basket and settings stay in this browser.
 */
export function useAppData(area: 'customer' | 'business') {
  useSessionCheck()
  useEffect(() => {
    void useBusinessSettings.getState().load({ force: true })
    void useMaterialsStore.getState().load(area === 'business' ? 'staff' : 'public', { force: true })
    if (area === 'business') void useEnquiriesStore.getState().load()
  }, [area])
}
