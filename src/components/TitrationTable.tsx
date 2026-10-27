import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CalcInputs } from '../calculator/evaluate';
import { parseNumber } from '../calculator/parse';
import { MAX_ROWS, defaultSpec, titrationTable, type TableMode } from '../calculator/titration';
import { doseUnitLabel } from '../data/drugs';
import { sigFigs, type PumpStep } from '../engine';
import { TOUCH, radius, space, useColors } from '../theme';
import { NumberField } from './NumberField';
import { Segmented } from './Segmented';

const MODE_OPTIONS = [
  { value: 'by-dose', label: 'By dose' },
  { value: 'by-rate', label: 'By pump rate' },
] as const;

interface Props {
  inputs: CalcInputs;
  summary: string;
  pumpStep: PumpStep;
  /** Open by pump rate when the calculator is working from a rate. */
  initialMode: TableMode;
  /** A row was tapped: load that dose or rate into the calculator. */
  onPick: (mode: TableMode, value: number) => void;
}

/** Mounted each time the pop-up opens, so it always starts from what is on the calculator. */
export function TitrationTable({ inputs, summary, pumpStep, initialMode, onPick }: Props) {
  const c = useColors();
  const [mode, setMode] = useState<TableMode>(initialMode);
  const [fields, setFields] = useState(() => toFields(defaultSpec(initialMode, inputs, pumpStep)));

  const switchMode = (m: TableMode) => {
    setMode(m);
    setFields(toFields(defaultSpec(m, inputs, pumpStep)));
  };

  const spec = {
    start: parseNumber(fields.start) ?? NaN,
    step: parseNumber(fields.step) ?? NaN,
    rows: parseNumber(fields.rows) ?? NaN,
  };
  const rows = titrationTable(inputs, mode, spec, pumpStep);
  const doseLabel = doseUnitLabel(inputs.doseUnit);
  const byDose = mode === 'by-dose';
  const showDelivered = byDose && pumpStep === 1;
  const weight = inputs.weightKg !== undefined ? `, ${sigFigs(inputs.weightKg)} kg` : '';
  const unit = byDose ? doseLabel : 'mL/h';

  return (
    <View style={styles.wrap}>
      <Text style={[styles.summary, { color: c.textMuted }]}>
        {summary}
        {weight}
      </Text>
      <Segmented options={MODE_OPTIONS} value={mode} onChange={switchMode} accessibilityLabel="Table mode" />
      <View style={styles.controls}>
        <NumberField label="Start" value={fields.start} onChangeText={(start) => setFields({ ...fields, start })} suffix={unit} />
        <NumberField label="Step" value={fields.step} onChangeText={(step) => setFields({ ...fields, step })} suffix={unit} />
      </View>
      <View style={styles.controls}>
        <NumberField label={`Rows (up to ${MAX_ROWS})`} value={fields.rows} onChangeText={(r) => setFields({ ...fields, rows: r })} />
        <View style={styles.flex} />
      </View>

      {rows.length === 0 ? (
        <Text style={[styles.empty, { color: c.danger }]}>
          Start and step must be greater than zero, and rows a whole number from 1 to {MAX_ROWS}.
        </Text>
      ) : (
        <View style={[styles.table, { borderColor: c.border }]}>
          <View style={[styles.row, styles.headRow, { borderColor: c.border }]}>
            <Text style={[styles.cell, styles.head, { color: c.textMuted }]}>{byDose ? `Dose\n${doseLabel}` : 'Rate\nmL/h'}</Text>
            <Text style={[styles.cell, styles.head, { color: c.textMuted }]}>{byDose ? 'Rate\nmL/h' : `Dose\n${doseLabel}`}</Text>
            {showDelivered ? (
              <Text style={[styles.cell, styles.head, { color: c.textMuted }]}>{`Delivers\n${doseLabel}`}</Text>
            ) : null}
          </View>
          {rows.map((r) => (
            <Pressable
              key={r.input}
              onPress={() => onPick(mode, r.input)}
              accessibilityRole="button"
              accessibilityLabel={
                byDose
                  ? `${r.inputText} ${doseLabel}: ${r.outputText} millilitres per hour`
                  : `${r.inputText} millilitres per hour: ${r.outputText} ${doseLabel}`
              }
              accessibilityState={{ selected: r.current }}
              style={[styles.row, { borderColor: c.border }, r.current && { backgroundColor: c.accentSoft }]}
            >
              <Text style={[styles.cell, styles.value, { color: r.current ? c.accent : c.text }]}>{r.inputText}</Text>
              <Text style={[styles.cell, styles.value, styles.strong, { color: r.current ? c.accent : c.text }]}>
                {r.outputText}
              </Text>
              {showDelivered ? (
                <Text style={[styles.cell, styles.value, { color: c.textMuted }]}>{r.deliveredText}</Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      )}
      <Text style={[styles.hint, { color: c.textMuted }]}>
        Tap a row to load it into the calculator.
        {showDelivered ? ' "Delivers" is the dose the rounded rate actually gives.' : ''}
      </Text>
    </View>
  );
}

function toFields(spec: { start: number; step: number; rows: number }) {
  return { start: String(spec.start), step: String(spec.step), rows: String(spec.rows) };
}

const styles = StyleSheet.create({
  wrap: { gap: space.md, paddingTop: space.sm, paddingBottom: space.lg },
  summary: { fontSize: 14, lineHeight: 20 },
  controls: { flexDirection: 'row', gap: space.md },
  flex: { flex: 1 },
  empty: { fontSize: 15, fontWeight: '600' },
  table: { borderWidth: 1.5, borderRadius: radius.md, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: TOUCH, borderTopWidth: 1, paddingHorizontal: space.md },
  headRow: { borderTopWidth: 0, minHeight: 52, paddingVertical: space.sm },
  cell: { flex: 1 },
  head: { fontSize: 13, fontWeight: '700' },
  value: { fontSize: 18, fontVariant: ['tabular-nums'] },
  strong: { fontWeight: '700' },
  hint: { fontSize: 13, lineHeight: 19 },
});
