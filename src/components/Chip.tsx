import { Pressable, StyleSheet, Text } from 'react-native';
import { TOUCH, radius, space, useColors } from '../theme';

interface Props {
  label: string;
  selected?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}

/** A tappable pill for quick picks (bag sizes, drug names, remembered strengths). */
export function Chip({ label, selected = false, onPress, accessibilityLabel }: Props) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        { borderColor: selected ? c.accent : c.border, backgroundColor: selected ? c.accentSoft : c.surface },
      ]}
    >
      <Text style={[styles.text, { color: selected ? c.accent : c.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: TOUCH - 8,
    paddingHorizontal: space.lg,
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  text: { fontSize: 16, fontWeight: '600' },
});
