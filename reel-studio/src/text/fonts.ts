import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

/** Arabic fonts the reels can switch between from the Studio props panel.
 *  Files are vendored in public/fonts (OFL) so renders never depend on the network. */
import {ARABIC_FONTS, type ArabicFont} from './font-list';
export {ARABIC_FONTS, type ArabicFont};

const WEIGHTS: Record<ArabicFont, string[]> = {
  'IBM Plex Sans Arabic': ['500', '600', '700'],
  Cairo: ['500', '600', '700'],
  Tajawal: ['500', '700'],
  'Readex Pro': ['500', '600', '700'],
};

for (const family of ARABIC_FONTS) {
  for (const weight of WEIGHTS[family]) {
    // loadFont registers a delayRender until the face is ready
    loadFont({family, url: staticFile(`fonts/${family.replace(/ /g, '')}-${weight}.ttf`), weight, format: 'truetype'});
  }
}

/** CSS font stack for KineticText / Counter. */
export const arabicStack = (font: ArabicFont) => `"${font}", "Noto Sans Arabic", sans-serif`;
