import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Direction, Evaluation, InputField } from '../calculator/evaluate';
import type { PumpStep } from '../engine';
import { TOUCH, font, radius, space, useColors } from '../theme';
import { Segmented } from './Segmented';

const DIRECTION_OPTIONS = [
  { value: 'dose-to-rate', label: 'Find rate', accessibilityLabel: 'Find the pump rate from a dose' },
  { value: 'rate-to-dose', label: 'Find dose', accessibilityLabel: 'Find the dose from a pump rate' },
] as const;

const STEP_OPTIONS = [
  { value: '0.1', label: '0.1', accessibilityLabel: 'Round to 0.1 millilitres per hour' },
  { value: '1', label: '1', accessibilityLabel: 'Round to whole millilitres per hour' },
] as const;

interface Props {
  evaluation: Evaluation;
  drugLabel: string;
  direction: Direction;
  onDirection: (d: Direction) => void;
  pumpStep: PumpStep;
  onPumpStep: (step: PumpStep) => void;
  onShowWorking: () => void;
  onShowTitration: () => void;
  /** Take the clinician to a field that still needs a value. */
  onGoTo: (field: InputField) => void;
  /** While the keyboard is up, keep only the band and the number. */
  compact?: boolean;
}

/**
 * The answer, printed like a syringe label and pinned above the form: a violet band with the drug and its
 * concentration, the number large beneath, and every assumption on the lines under it.
 */
export function ResultCard(props: Props) {
  const { evaluation, drugLabel, direction, onDirection, pumpStep, onPumpStep, onShowWorking, onShowTitration, onGoTo, compact } = props;
  const c = useColors();
  const ok = evaluation.status === 'ok';
  const showsRate = ok && evaluation.headline.unit === 'mL/h';

  return (
    <View style={[styles.card, { backgroundColor: c.label, borderColor: c.labelLine }]}>
      <View style={[styles.band, { backgroundColor: c.band, borderBottomColor: c.onBand }]}>
        <Text style={[styles.drug, { color: c.onBand }]} numberOfLines={1} adjustsFontSizeToFit>
          {drugLabel || 'Infusion'}
        </Text>
        {ok ? <Text style={[styles.conc, { color: c.onBand }]}>{evaluation.concentration}</Text> : null}
      </View>

      <View style={styles.body} accessibilityLiveRegion="polite">
        {compact ? null : (
          <Segmented
            compact
            options={DIRECTION_OPTIONS}
            value={direction}
            onChange={onDirection}
            accessibilityLabel="What to work out"
          />
        )}

        {ok ? (
          <>
            <View style={styles.valueRow}>
              <View style={styles.valueWrap} accessible accessibilityLabel={`${evaluation.headline.label} ${evaluation.headline.value} ${evaluation.headline.unit}`}>
                <Text style={[styles.value, { color: c.labelText }]} numberOfLines={1} adjustsFontSizeToFit>
                  {evaluation.headline.value}
                </Text>
                <Text style={[styles.unit, { color: c.labelText }]}>{evaluation.headline.unit}</Text>
              </View>
              {showsRate && !compact ? (
                <View style={styles.steps}>
                  <Text style={[styles.stepsLabel, { color: c.labelMuted }]}>Pump steps</Text>
                  <Segmented
                    compact
                    options={STEP_OPTIONS}
                    value={pumpStep === 1 ? '1' : '0.1'}
                    onChange={(s) => onPumpStep(s === '1' ? 1 : 0.1)}
                    accessibilityLabel="Pump resolution"
                  />
                </View>
              ) : null}
            </View>
            <Text style={[styles.basis, { color: c.labelText }]}>{evaluation.basis}</Text>
            {compact ? null : <Text style={[styles.summary, { color: c.labelMuted }]}>{keepUnitsWhole(evaluation.summary)}</Text>}
            {evaluation.notices.map((n) => (
              <Text key={n} style={[styles.notice, { color: c.warnText, backgroundColor: c.warnBg }]}>
                {n}
              </Text>
            ))}
            {compact ? null : (
              <View style={styles.actions}>
                <Action label="Show working" onPress={onShowWorking} />
                <Action label="Titration table" onPress={onShowTitration} />
              </View>
            )}
          </>
        ) : (
          <View style={[styles.empty, compact && styles.emptyCompact]}>
            {evaluation.status === 'unconfirmed' ? (
              <>
                <Text style={[styles.emptyTitle, { color: c.labelText }]}>Check your ampoule</Text>
                <Text style={[styles.emptyText, { color: c.labelMuted }]}>
                  The strength below is from last time. Confirm it matches the ampoule in your hand.
                </Text>
              </>
            ) : evaluation.status === 'error' ? (
              <Text style={[styles.emptyTitle, { color: c.danger }]}>{evaluation.message}</Text>
            ) : (
              <>
                <Text style={[styles.emptyTitle, { color: c.labelText }]}>Still needed</Text>
                {compact ? (
                  <Text style={[styles.emptyText, { color: c.labelMuted }]}>
                    {evaluation.missing.map((m) => m.label).join(', ')}
                  </Text>
                ) : (
                  <View style={styles.missing}>
                    {evaluation.missing.map((m) => (
                      <GoTo key={m.field} label={m.label} onPress={() => onGoTo(m.field)} />
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

function Action({ label, onPress }: { label: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.action, { borderColor: c.labelLine }, pressed && { backgroundColor: c.accentSoft }]}
    >
      <Text style={[styles.actionText, { color: c.accent }]}>{label}</Text>
    </Pressable>
  );
}

/** A missing value, as a button that jumps to its field. */
function GoTo({ label, onPress }: { label: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: go to the field`}
      hitSlop={4}
      style={({ pressed }) => [styles.goTo, { borderColor: c.labelLine }, pressed && { backgroundColor: c.accentSoft }]}
    >
      <Text style={[styles.goToText, { color: c.accent }]}>{label}</Text>
      <View style={[styles.arrow, { borderColor: c.accent }]} />
    </Pressable>
  );
}

/** Keep "50 mcg/mL" on one line: a no-break space between number and unit, a word joiner after each slash. */
const keepUnitsWhole = (s: string) => s.replace(/(\d) (?=[a-zA-Z])/g, '$1\u00A0').replace(/\//g, '/\u2060');

const styles = StyleSheet.create({
  card: { marginHorizontal: space.md, borderRadius: radius.sm, borderWidth: 1, overflow: 'hidden' },
  band: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.xs + 2,
    borderBottomWidth: 2,
  },
  drug: { flexShrink: 1, fontFamily: font.labelHeavy, fontSize: 28, lineHeight: 34, textTransform: 'uppercase', letterSpacing: 0.4 },
  conc: { fontFamily: font.label, fontSize: 19, fontVariant: ['tabular-nums'] },
  body: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.md },
  valueRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: space.md, marginTop: space.xs },
  valueWrap: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm, flexShrink: 1 },
  value: { fontFamily: font.labelHeavy, fontSize: 84, lineHeight: 92, fontVariant: ['tabular-nums'], flexShrink: 1, letterSpacing: -1 },
  unit: { fontFamily: font.semibold, fontSize: 22 },
  steps: { flexShrink: 0, alignItems: 'flex-end', gap: space.xs, paddingBottom: space.md },
  stepsLabel: { fontFamily: font.semibold, fontSize: 13 },
  basis: { fontFamily: font.semibold, fontSize: 16, lineHeight: 22 },
  summary: { fontFamily: font.regular, fontSize: 15, lineHeight: 21, marginTop: 2 },
  notice: {
    fontFamily: font.semibold,
    fontSize: 15,
    marginTop: space.sm,
    padding: space.sm,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  action: { flex: 1, minHeight: TOUCH - 4, borderWidth: 1.5, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontFamily: font.bold, fontSize: 16 },
  empty: { minHeight: 132, justifyContent: 'center', paddingTop: space.md },
  emptyCompact: { minHeight: 64 },
  emptyTitle: { fontFamily: font.labelHeavy, fontSize: 30, lineHeight: 36, textTransform: 'uppercase' },
  emptyText: { fontFamily: font.medium, fontSize: 16, lineHeight: 22, marginTop: space.xs },
  missing: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
  goTo: {
    minHeight: TOUCH - 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingLeft: space.md,
    paddingRight: space.md + 2,
    borderWidth: 1.5,
    borderRadius: radius.control,
  },
  goToText: { fontFamily: font.bold, fontSize: 16 },
  arrow: { width: 7, height: 7, borderTopWidth: 2, borderRightWidth: 2, transform: [{ rotate: '45deg' }] },
});
