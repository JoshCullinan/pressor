import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TOUCH, font, radius, useColors } from '../theme';

interface Props<T extends string> {
  options: readonly { value: T; label: string; accessibilityLabel?: string }[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
  /** Shorter, for use inside the result label. The touch area stays 48 dp. */
  compact?: boolean;
}

/** One choice out of a few, always visible. */
export function Segmented<T extends string>({ options, value, onChange, accessibilityLabel, compact }: Props<T>) {
  const c = useColors();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={[styles.row, compact && styles.compactRow, { borderColor: c.border }]}
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityLabel={o.accessibilityLabel ?? o.label}
            accessibilityState={{ selected }}
            hitSlop={compact ? { top: 6, bottom: 6 } : undefined}
            style={[styles.item, compact && styles.compactItem, selected && { backgroundColor: c.accent }]}
          >
            <Text style={[styles.text, compact && styles.compactText, { color: selected ? c.onAccent : c.text }]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', borderWidth: 1.5, borderRadius: radius.control, overflow: 'hidden', padding: 2, gap: 2 },
  compactRow: { borderWidth: 1 },
  item: { flex: 1, minHeight: TOUCH - 4, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, borderRadius: radius.sm },
  compactItem: { minHeight: 36, minWidth: 48, paddingHorizontal: 12 },
  text: { fontFamily: font.semibold, fontSize: 16 },
  compactText: { fontSize: 15 },
});
