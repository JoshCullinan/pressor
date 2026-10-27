import { useColorScheme } from 'react-native';

const light = {
  bg: '#F4F6F8',
  surface: '#FFFFFF',
  text: '#101418',
  textMuted: '#56626E',
  border: '#CDD3DA',
  accent: '#0B6E75',
  onAccent: '#FFFFFF',
  accentSoft: '#DCEFF0',
  resultBg: '#0B3D42',
  resultText: '#FFFFFF',
  resultMuted: '#B6D3D6',
  resultError: '#FFB4AB',
  warnBg: '#FFF1CC',
  warnBorder: '#D99A00',
  warnText: '#5E4200',
  danger: '#B3261E',
  backdrop: 'rgba(0,0,0,0.45)',
};

const dark: typeof light = {
  bg: '#0D1013',
  surface: '#171B20',
  text: '#EEF1F4',
  textMuted: '#9AA6B2',
  border: '#2D353E',
  accent: '#4DB6BD',
  onAccent: '#04181A',
  accentSoft: '#17343A',
  resultBg: '#10464C',
  resultText: '#FFFFFF',
  resultMuted: '#A9CDD1',
  resultError: '#FFB4AB',
  warnBg: '#3A2D0A',
  warnBorder: '#C48F00',
  warnText: '#FFD98A',
  danger: '#FF8A80',
  backdrop: 'rgba(0,0,0,0.65)',
};

export type Colors = typeof light;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
export const radius = { sm: 8, md: 12, lg: 16 } as const;
/** Minimum touch target, in dp. */
export const TOUCH = 48;

export function useColors(): Colors {
  return useColorScheme() === 'dark' ? dark : light;
}
