// Hooks for feature pages: what may the signed-in user do in a section?
//   const canEdit = useCanEdit('rainfall');
//   <button disabled={!canEdit}>…</button>   + <ViewOnlyBanner sectionId="rainfall" />
import { getSectionAccess, isEditAllowed, isViewOnly } from './permissions';
import { useSession } from './session';
import type { Access } from './types';

export function useSectionAccess(sectionId: string): Access {
  return getSectionAccess(useSession(), sectionId);
}

export function useCanEdit(sectionId: string): boolean {
  return isEditAllowed(useSession(), sectionId);
}

/** True when the section must be read-only (filters/search stay usable). */
export function useViewOnly(sectionId: string): boolean {
  return isViewOnly(useSession(), sectionId);
}
