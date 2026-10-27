import { StyleSheet, Text, TextInput, View } from 'react-native';
import { sanitizeNumberInput } from '../calculator/parse';
import { radius, space, useColors } from '../theme';

interface Props {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  suffix?: string;
  placeholder?: string;
  /** Amber styling for a value that came from memory and hasn't been checked yet. */
  unconfirmed?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  testID?: string;
}

export function NumberField({ label, value, onChangeText, suffix, placeholder, unconfirmed, onFocus, onBlur, testID }: Props) {
  const c = useColors();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: c.textMuted }]}>{label}</Text>
      <View
        style={[
          styles.box,
          {
            backgroundColor: unconfirmed ? c.warnBg : c.surface,
            borderColor: unconfirmed ? c.warnBorder : c.border,
          },
        ]}
      >
        <TextInput
          testID={testID}
          accessibilityLabel={label}
          value={value}
          onChangeText={(t) => onChangeText(sanitizeNumberInput(t))}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor={c.textMuted}
          keyboardType="decimal-pad"
          inputMode="decimal"
          selectTextOnFocus
          style={[styles.input, { color: unconfirmed ? c.warnText : c.text }]}
        />
        {suffix ? <Text style={[styles.suffix, { color: c.textMuted }]}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: space.xs },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
  },
  input: { flex: 1, fontSize: 22, fontWeight: '600', paddingVertical: 8, fontVariant: ['tabular-nums'] },
  suffix: { fontSize: 15, fontWeight: '600', marginLeft: space.sm },
});
