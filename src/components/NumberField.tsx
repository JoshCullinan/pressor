import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { sanitizeNumberInput } from '../calculator/parse';
import { TOUCH, font, radius, space, useColors } from '../theme';

interface Props {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  /** A fixed unit printed inside the field. */
  suffix?: string;
  /** A unit the clinician can change: shown as a button inside the field. */
  unit?: { label: string; onPress: () => void; accessibilityLabel: string };
  placeholder?: string;
  /** A value that came from memory and hasn't been checked against the ampoule yet. */
  unconfirmed?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  flex?: number;
}

export function NumberField({ label, value, onChangeText, suffix, unit, placeholder, unconfirmed, onFocus, onBlur, flex = 1 }: Props) {
  const c = useColors();
  const [focused, setFocused] = useState(false);
  const borderColor = focused ? c.accent : unconfirmed ? c.warnBorder : c.border;
  return (
    <View style={{ flex }}>
      <Text style={[styles.label, { color: c.textMuted }]}>{label}</Text>
      <View
        style={[
          styles.box,
          {
            backgroundColor: unconfirmed ? c.warnBg : c.surface,
            borderColor,
            borderWidth: focused ? 2 : 1.5,
            borderStyle: unconfirmed && !focused ? 'dashed' : 'solid',
          },
        ]}
      >
        <TextInput
          accessibilityLabel={unit ? `${label}, ${unit.label}` : label}
          value={value}
          onChangeText={(t) => onChangeText(sanitizeNumberInput(t))}
          onFocus={() => {
            setFocused(true);
            onFocus?.();
          }}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          placeholder={placeholder}
          placeholderTextColor={c.textMuted}
          keyboardType="decimal-pad"
          inputMode="decimal"
          selectTextOnFocus
          selectionColor={c.accent}
          cursorColor={c.accent}
          style={[styles.input, { color: unconfirmed ? c.warnText : c.text }]}
        />
        {suffix ? <Text style={[styles.suffix, { color: c.textMuted }]}>{suffix}</Text> : null}
        {unit ? (
          <Pressable
            onPress={unit.onPress}
            accessibilityRole="button"
            accessibilityLabel={unit.accessibilityLabel}
            style={({ pressed }) => [styles.unit, { borderLeftColor: c.border }, pressed && { backgroundColor: c.accentSoft }]}
          >
            <Text style={[styles.unitText, { color: c.accent }]}>{unit.label}</Text>
            <Chevron color={c.accent} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/** A small downward chevron drawn from two borders. */
export function Chevron({ color }: { color: string }) {
  return <View style={[styles.chevron, { borderColor: color }]} />;
}

const styles = StyleSheet.create({
  label: { fontFamily: font.semibold, fontSize: 14, marginBottom: space.xs },
  box: { flexDirection: 'row', alignItems: 'center', minHeight: 56, borderRadius: radius.control, overflow: 'hidden' },
  input: {
    flex: 1,
    minWidth: 48,
    fontFamily: font.semibold,
    fontSize: 24,
    paddingVertical: 8,
    paddingHorizontal: space.md,
    fontVariant: ['tabular-nums'],
  },
  suffix: { fontFamily: font.semibold, fontSize: 16, marginRight: space.md },
  unit: {
    alignSelf: 'stretch',
    minWidth: TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    borderLeftWidth: 1,
  },
  unitText: { fontFamily: font.bold, fontSize: 16 },
  chevron: { width: 7, height: 7, borderRightWidth: 2, borderBottomWidth: 2, transform: [{ rotate: '45deg' }], marginTop: -3 },
});
