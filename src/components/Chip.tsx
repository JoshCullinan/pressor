import { Pressable, StyleSheet, Text } from 'react-native';
import { TOUCH, font, radius, space, useColors } from '../theme';

interface Props {
  label: string;
  selected?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}

/** A tappable pill for quick picks (bag sizes, drug names, remembered strengths). Selected chips are printed in ink. */
export function Chip({ label, selected = false, onPress, accessibilityLabel }: Props) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      hitSlop={4}
      style={({ pressed }) => [
        styles.chip,
        {
          borderColor: selected ? c.chosenBorder : c.border,
          backgroundColor: selected ? c.chosen : pressed ? c.accentSoft : c.surface,
        },
      ]}
    >
      <Text style={[styles.text, { color: selected ? c.onChosen : c.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: TOUCH - 4,
    paddingHorizontal: space.md + 2,
    justifyContent: 'center',
    borderRadius: radius.sm,
    borderWidth: 1.5,
  },
  text: { fontFamily: font.semibold, fontSize: 16 },
});
