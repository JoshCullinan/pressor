import { useColorScheme } from 'react-native';

/**
 * The syringe-label world: violet-tinted ground, white label stock, a violet band, ink that is never pure black.
 * Amber means only "old value, check it"; red means only a hard error.
 */
const light = {
  bg: '#F3F0F6',
  surface: '#FFFFFF',
  text: '#1C1822',
  textMuted: '#5E5668',
  border: '#D6CFDD',
  accent: '#5A2D75',
  onAccent: '#FFFFFF',
  accentSoft: '#EDE3F3',
  /** A selected chip or option: printed in ink by day, a dim violet at night so it never outshines the answer. */
  chosen: '#1C1822',
  chosenBorder: '#1C1822',
  onChosen: '#F3F0F6',
  /** The label band carrying the drug name. */
  band: '#C9A2DC',
  onBand: '#1C1822',
  /** The label stock the answer is printed on. */
  label: '#FFFFFF',
  labelText: '#1C1822',
  labelMuted: '#5E5668',
  labelLine: '#D6CFDD',
  warnBg: '#FCEFD8',
  warnBorder: '#B86A00',
  warnText: '#5C3500',
  onWarn: '#FFFFFF',
  danger: '#B3261E',
  backdrop: 'rgba(28,24,34,0.5)',
};

const dark: typeof light = {
  bg: '#131017',
  surface: '#1E1A23',
  text: '#EFEAF3',
  textMuted: '#A9A1B2',
  border: '#3A3341',
  accent: '#D4B4E6',
  onAccent: '#24132E',
  accentSoft: '#33263D',
  chosen: '#4A3558',
  chosenBorder: '#D4B4E6',
  onChosen: '#F5F1F8',
  band: '#B993CD',
  onBand: '#17121B',
  label: '#1E1A23',
  labelText: '#F5F1F8',
  labelMuted: '#B5ADBE',
  labelLine: '#3F3747',
  warnBg: '#33250F',
  warnBorder: '#E0A23C',
  warnText: '#F7D49A',
  onWarn: '#2A1B00',
  danger: '#FFB4AB',
  backdrop: 'rgba(0,0,0,0.65)',
};

export type Colors = typeof light;

/** Barlow for the interface; Barlow Condensed for what is printed on the label. */
export const font = {
  regular: 'Barlow_400Regular',
  medium: 'Barlow_500Medium',
  semibold: 'Barlow_600SemiBold',
  bold: 'Barlow_700Bold',
  label: 'BarlowCondensed_700Bold',
  labelHeavy: 'BarlowCondensed_800ExtraBold',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, control: 10, md: 12, lg: 16 } as const;
/** Minimum touch target, in dp. */
export const TOUCH = 48;

export function useColors(): Colors {
  return useColorScheme() === 'dark' ? dark : light;
}
