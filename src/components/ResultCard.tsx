import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Evaluation } from '../calculator/evaluate';
import type { PumpStep } from '../engine';
import { TOUCH, radius, space, useColors } from '../theme';

interface Props {
  evaluation: Evaluation;
  pumpStep: PumpStep;
  onPumpStep: (step: PumpStep) => void;
  onShowWorking: () => void;
  onShowTitration: () => void;
}

/** The answer, pinned above the form so it stays in view while the clinician edits. */
export function ResultCard({ evaluation, pumpStep, onPumpStep, onShowWorking, onShowTitration }: Props) {
  const c = useColors();
  const showsRate = evaluation.status === 'ok' && evaluation.headline.unit === 'mL/h';

  return (
    <View style={[styles.card, { backgroundColor: c.resultBg }]} accessibilityLiveRegion="polite">
      {evaluation.status === 'ok' ? (
        <>
          <View style={styles.topRow}>
            <Text style={[styles.label, { color: c.resultMuted }]}>{evaluation.headline.label.toUpperCase()}</Text>
            {showsRate ? <PumpStepToggle value={pumpStep} onChange={onPumpStep} /> : null}
          </View>
          <View style={styles.valueRow}>
            <Text style={[styles.value, { color: c.resultText }]} adjustsFontSizeToFit numberOfLines={1}>
              {evaluation.headline.value}
            </Text>
            <Text style={[styles.unit, { color: c.resultText }]}>{evaluation.headline.unit}</Text>
          </View>
          <Text style={[styles.summary, { color: c.resultMuted }]}>{evaluation.summary}</Text>
          {evaluation.notices.map((n) => (
            <Text key={n} style={[styles.notice, { color: c.warnText, backgroundColor: c.warnBg }]}>
              {n}
            </Text>
          ))}
          <View style={styles.links}>
            <Pressable onPress={onShowWorking} accessibilityRole="button" accessibilityLabel="Show working" style={styles.working}>
              <Text style={[styles.workingText, { color: c.resultText }]}>Show working</Text>
            </Pressable>
            <Pressable onPress={onShowTitration} accessibilityRole="button" accessibilityLabel="Titration table" style={styles.working}>
              <Text style={[styles.workingText, { color: c.resultText }]}>Titration table</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <View style={styles.empty}>
          {evaluation.status === 'unconfirmed' ? (
            <>
              <Text style={[styles.emptyTitle, { color: c.resultText }]}>Check your ampoule</Text>
              <Text style={[styles.emptyText, { color: c.resultMuted }]}>
                The strength below is from last time. Confirm it matches the ampoule in your hand.
              </Text>
            </>
          ) : evaluation.status === 'error' ? (
            <Text style={[styles.emptyTitle, { color: c.resultError }]}>{evaluation.message}</Text>
          ) : (
            <>
              <Text style={[styles.emptyTitle, { color: c.resultText }]}>Enter the numbers below</Text>
              <Text style={[styles.emptyText, { color: c.resultMuted }]}>Still needed: {listOf(evaluation.missing)}</Text>
            </>
          )}
        </View>
      )}
    </View>
  );
}

function listOf(items: string[]): string {
  if (items.length <= 2) return items.join(' and ');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function PumpStepToggle({ value, onChange }: { value: PumpStep; onChange: (s: PumpStep) => void }) {
  const c = useColors();
  return (
    <View style={styles.stepRow} accessibilityLabel="Pump resolution">
      <Text style={[styles.stepLabel, { color: c.resultMuted }]}>Pump steps</Text>
      {([0.1, 1] as const).map((s) => (
        <Pressable
          key={s}
          onPress={() => onChange(s)}
          accessibilityRole="button"
          accessibilityLabel={`Round to ${s} millilitres per hour`}
          accessibilityState={{ selected: value === s }}
          style={[styles.step, value === s && { backgroundColor: c.resultText }]}
        >
          <Text style={[styles.stepText, { color: value === s ? c.resultBg : c.resultText }]}>{s}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: space.lg, marginBottom: space.md, borderRadius: radius.lg, padding: space.lg },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  value: { fontSize: 64, lineHeight: 72, fontWeight: '700', fontVariant: ['tabular-nums'], flexShrink: 1 },
  unit: { fontSize: 22, fontWeight: '600' },
  summary: { fontSize: 14, lineHeight: 20, marginTop: space.xs },
  notice: { fontSize: 14, fontWeight: '600', marginTop: space.sm, padding: space.sm, borderRadius: radius.sm, overflow: 'hidden' },
  links: { flexDirection: 'row', gap: space.xl },
  working: { alignSelf: 'flex-start', minHeight: TOUCH - 8, justifyContent: 'center', marginTop: space.xs },
  workingText: { fontSize: 15, fontWeight: '600', textDecorationLine: 'underline' },
  empty: { minHeight: 110, justifyContent: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptyText: { fontSize: 15, lineHeight: 21, marginTop: space.xs },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  stepLabel: { fontSize: 12, marginRight: space.xs },
  step: { minWidth: 40, minHeight: 32, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  stepText: { fontSize: 14, fontWeight: '700' },
});
