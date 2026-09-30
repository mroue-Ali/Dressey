// Dresséy design tokens — ivory, taupe and gold, from the brand's Instagram.

export const colors = {
  background: '#F6F1EB', // ivory page background (matches the logo artwork)
  surface: '#FFFDFA', // cards
  surfaceAlt: '#EFE8DF', // subtle fills, chips
  border: '#E6DDD2',

  primary: '#857060', // taupe — buttons, active tab (4.7:1 with white text)
  primaryDark: '#5E5047',
  primarySoft: '#ECE3D8',
  brand: '#A08D7D', // the lighter taupe of the brand's tagline box, decorative only
  gold: '#B89A5E', // thread-spool gold accents

  text: '#3E3631', // warm charcoal, as in the logo
  textMuted: '#766A61',
  textOnPrimary: '#FFFCF7',

  success: '#667F57',
  successSoft: '#E4EADC',
  warning: '#A8792F',
  warningSoft: '#F3E7D2',
  danger: '#A5503F',
  dangerSoft: '#F3E0DA',
  info: '#66748C',
  infoSoft: '#E3E6EC',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

// Headings: Cormorant Garamond (elegant serif, like the wordmark).
// Body: Quicksand (the rounded sans of the brand's taglines).
export const fonts = {
  logo: 'CormorantGaramond_400Regular',
  display: 'CormorantGaramond_600SemiBold',
  displayBold: 'CormorantGaramond_700Bold',
  body: 'Quicksand_500Medium',
  medium: 'Quicksand_600SemiBold',
  semibold: 'Quicksand_700Bold',
} as const;

export const type = {
  hero: { fontFamily: fonts.displayBold, fontSize: 34, color: colors.text },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.text },
  heading: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 14, color: colors.text },
  caption: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted },
} as const;

export const shadow = {
  shadowColor: '#5E5047',
  shadowOpacity: 0.06,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 4 },
  elevation: 1,
} as const;
