import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TOUCH, radius, useColors } from '../theme';

interface Props<T extends string> {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
}

/** One choice out of a few, always visible. */
export function Segmented<T extends string>({ options, value, onChange, accessibilityLabel }: Props<T>) {
  const c = useColors();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={[styles.row, { borderColor: c.border, backgroundColor: c.surface }]}
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityLabel={o.label}
            accessibilityState={{ selected }}
            style={[styles.item, selected && { backgroundColor: c.accent }]}
          >
            <Text style={[styles.text, { color: selected ? c.onAccent : c.text }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', borderWidth: 1.5, borderRadius: radius.md, overflow: 'hidden' },
  item: { flex: 1, minHeight: TOUCH, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  text: { fontSize: 16, fontWeight: '600' },
});
