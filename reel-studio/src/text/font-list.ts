/** Arabic fonts selectable in Studio (no side effects here; loading happens in fonts.ts). */
export const ARABIC_FONTS = ['IBM Plex Sans Arabic', 'Cairo', 'Tajawal', 'Readex Pro'] as const;
export type ArabicFont = (typeof ARABIC_FONTS)[number];
