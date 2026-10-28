import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TOUCH, font, radius, space, useColors } from '../theme';

interface Props<T extends string> {
  options: readonly { value: T; label: string; hint?: string }[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}

/** A radio list for sheets: one big row per choice, the chosen one printed in ink. */
export function OptionList<T extends string>({ options, value, onChange, accessibilityLabel }: Props<T>) {
  const c = useColors();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel} style={styles.list}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityLabel={o.label}
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.row,
              { borderColor: selected ? c.chosenBorder : c.border, backgroundColor: selected ? c.chosen : pressed ? c.accentSoft : c.surface },
            ]}
          >
            <Text style={[styles.label, { color: selected ? c.onChosen : c.text }]}>{o.label}</Text>
            {o.hint ? <Text style={[styles.hint, { color: selected ? c.onChosen : c.textMuted }]}>{o.hint}</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.sm },
  row: {
    minHeight: TOUCH + 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: radius.control,
    paddingHorizontal: space.lg,
  },
  label: { fontFamily: font.semibold, fontSize: 18 },
  hint: { fontFamily: font.medium, fontSize: 14 },
});
