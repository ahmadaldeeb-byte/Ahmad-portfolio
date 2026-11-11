# apple-motion — local patches (reel-studio)

Copied from `.claude/skills/apple-motion/templates/remotion/` (MIT, Damir Iskakov). `tokens.ts` is untouched.

| file | change |
|---|---|
| `KineticText.tsx` | new props `fontFamily`, `dir`, `lang`. `dir="rtl"` sets `dir`/`lang` on the text block, forces `letter-spacing: 0` (tracking breaks Arabic joining), and `perLetter` splits with `splitArabicLetters` (ZWJ-joined units) instead of `Array.from`. Width is re-measured each render with the real font; cap-height cache only stores values once the web font is loaded. |
| `arabic.ts` | new: `splitArabicLetters` (from the official Remotion skill `remotion-markup/arabic-text.md`) and `isRtl`. |

`Counter` forwards `fontFamily`/`dir` through `...rest`, so it needs no patch.
Re-apply these when updating the library from upstream.
