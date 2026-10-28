import { Link } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type TextInputInstance,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Direction, InputField } from '../calculator/evaluate';
import { parseNumber } from '../calculator/parse';
import { useCalculator } from '../calculator/useCalculator';
import { useNow } from '../calculator/useNow';
import { Chip } from '../components/Chip';
import { Chevron, NumberField } from '../components/NumberField';
import { OptionList } from '../components/OptionList';
import { ResultCard } from '../components/ResultCard';
import { Segmented } from '../components/Segmented';
import { Sheet } from '../components/Sheet';
import { TitrationTable } from '../components/TitrationTable';
import { DRUGS, doseUnitLabel, drugKey, findDrug } from '../data/drugs';
import { AMOUNT_UNITS, replacedVolumeMl, sigFigs, type AmountUnit } from '../engine';
import { ageLabel, describeStrength } from '../storage/strengths';
import { TOUCH, font, radius, space, useColors } from '../theme';

const UNIT_OPTIONS = AMOUNT_UNITS.map((u) => ({ value: u, label: u }));
const PER_KG_OPTIONS = [
  { value: 'kg', label: 'Per kg' },
  { value: 'total', label: 'Total' },
] as const;
const TIME_OPTIONS = [
  { value: 'min', label: 'Per minute' },
  { value: 'h', label: 'Per hour' },
] as const;
const BAG_SIZES = [50, 100, 250, 500];

type OpenSheet = 'working' | 'titration' | 'ampUnit' | 'doseUnit' | null;

export default function Calculator() {
  const c = useColors();
  const calc = useCalculator();
  const { form, patch, evaluation } = calc;
  const [sheet, setSheet] = useState<OpenSheet>(null);
  const keyboardUp = useKeyboardVisible();
  const now = useNow();
  const close = () => setSheet(null);
  // One ref per number field, so the result card can send the clinician to whatever is still missing.
  const ampAmountRef = useRef<TextInputInstance>(null);
  const ampVolumeRef = useRef<TextInputInstance>(null);
  const nAmpsRef = useRef<TextInputInstance>(null);
  const bagVolumeRef = useRef<TextInputInstance>(null);
  const weightRef = useRef<TextInputInstance>(null);
  const doseRef = useRef<TextInputInstance>(null);
  const rateRef = useRef<TextInputInstance>(null);
  const goTo = (field: InputField) => {
    const refs = {
      ampAmount: ampAmountRef,
      ampVolume: ampVolumeRef,
      nAmps: nAmpsRef,
      bagVolume: bagVolumeRef,
      weight: weightRef,
      dose: doseRef,
      rate: rateRef,
    };
    refs[field].current?.focus();
  };
  // Switching direction swaps the dose field for the pump rate field. The new one takes the cursor once it
  // has rendered, but only when it is empty: a filled one already gives an answer.
  const switchDirection = (direction: Direction) => {
    if (direction === form.direction) return;
    patch({ direction });
    const field = direction === 'dose-to-rate' ? 'dose' : 'rate';
    if (form[field] === '') requestAnimationFrame(() => goTo(field));
  };

  const toRate = form.direction === 'dose-to-rate';
  const nAmps = parseNumber(form.nAmps);
  const ampVolume = parseNumber(form.ampVolume);
  const replaced =
    nAmps !== undefined && ampVolume !== undefined && nAmps > 0 && ampVolume > 0
      ? replacedVolumeMl(nAmps, ampVolume)
      : undefined;
  const unconfirmed = !form.strengthConfirmed;
  const doseLabel = doseUnitLabel(form.doseUnit);
  const strengthFocus = {
    onFocus: () => calc.setStrengthFocused(true),
    onBlur: () => calc.setStrengthFocused(false),
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: c.bg }]} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.screen} behavior="padding">
        <View style={styles.header}>
          <Text style={[styles.brand, { color: c.text }]} accessibilityRole="header">
            Pressor
          </Text>
          <View style={styles.headerActions}>
            <Pressable
              onPress={calc.reset}
              accessibilityRole="button"
              accessibilityLabel="Reset"
              style={styles.headerButton}
            >
              <Text style={[styles.headerText, { color: c.accent }]}>Reset</Text>
            </Pressable>
            <Link href="/about" style={[styles.headerButton, styles.headerText, { color: c.accent }]}>
              About
            </Link>
          </View>
        </View>

        <ResultCard
          evaluation={evaluation}
          drugLabel={form.drugLabel}
          direction={form.direction}
          onDirection={switchDirection}
          pumpStep={calc.pumpStep}
          onPumpStep={calc.setPumpStep}
          onShowWorking={() => setSheet('working')}
          onShowTitration={() => setSheet('titration')}
          onGoTo={goTo}
          compact={keyboardUp}
        />

        <View style={styles.screen}>
          <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <Section title="Drug">
              <DrugPicker label={form.drugLabel} onSelect={calc.selectDrug} />
            </Section>

            <Section title="Ampoule label">
              <View style={styles.row}>
                <NumberField
                  ref={ampAmountRef}
                  label="Amount"
                  value={form.ampAmount}
                  onChangeText={(ampAmount) => calc.editStrength({ ampAmount })}
                  unit={{
                    label: form.ampUnit,
                    onPress: () => setSheet('ampUnit'),
                    accessibilityLabel: `Ampoule unit, ${form.ampUnit}. Change`,
                  }}
                  unconfirmed={unconfirmed}
                  {...strengthFocus}
                />
                <Text style={[styles.joiner, { color: c.textMuted }]}>in</Text>
                <NumberField
                  ref={ampVolumeRef}
                  label="Volume"
                  value={form.ampVolume}
                  onChangeText={(ampVolume) => calc.editStrength({ ampVolume })}
                  suffix="mL"
                  unconfirmed={unconfirmed}
                  {...strengthFocus}
                />
              </View>
              {unconfirmed ? (
                <View style={[styles.stamp, { backgroundColor: c.warnBg, borderColor: c.warnBorder }]}>
                  <View style={styles.stampText}>
                    <Text style={[styles.stampTitle, { color: c.warnText }]}>
                      Old · {form.strengthUsedAt ? `used ${ageLabel(now, form.strengthUsedAt)}` : 'from before'}
                    </Text>
                    <Text style={[styles.stampBody, { color: c.warnText }]}>
                      Check it against the ampoule in your hand.
                    </Text>
                  </View>
                  <Pressable
                    onPress={calc.confirmStrength}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.confirm, { backgroundColor: c.accent }, pressed && styles.pressed]}
                  >
                    <Text style={[styles.confirmText, { color: c.onAccent }]}>Matches my ampoule</Text>
                  </Pressable>
                </View>
              ) : null}
              {calc.recents.length > 0 ? (
                <View style={styles.wrapRow}>
                  {calc.recents.map((s) => (
                    <Chip
                      key={`${s.amount}-${s.unit}-${s.volumeMl}`}
                      label={`${describeStrength(s)} · ${ageLabel(now, s.usedAt)}`}
                      selected={
                        form.strengthConfirmed &&
                        parseNumber(form.ampAmount) === s.amount &&
                        parseNumber(form.ampVolume) === s.volumeMl &&
                        form.ampUnit === s.unit
                      }
                      onPress={() => calc.applyStrength(s)}
                    />
                  ))}
                </View>
              ) : null}
            </Section>

            <Section title="Bag">
              <View style={styles.row}>
                <NumberField
                  ref={nAmpsRef}
                  label="Ampoules added"
                  value={form.nAmps}
                  onChangeText={(n) => patch({ nAmps: n })}
                />
                <Text style={[styles.joiner, { color: c.textMuted }]}>into</Text>
                <NumberField
                  ref={bagVolumeRef}
                  label="Bag volume"
                  value={form.bagVolume}
                  onChangeText={(bagVolume) => patch({ bagVolume })}
                  suffix="mL"
                />
              </View>
              <View style={styles.wrapRow}>
                {BAG_SIZES.map((v) => (
                  <Chip
                    key={v}
                    label={`${v} mL`}
                    selected={parseNumber(form.bagVolume) === v}
                    onPress={() => patch({ bagVolume: String(v) })}
                  />
                ))}
              </View>
              <View style={styles.switchRow}>
                <Text style={[styles.switchText, { color: c.text }]}>
                  {form.replaceRemoved
                    ? replaced !== undefined
                      ? `Take ${sigFigs(replaced)} mL out first, so the bag stays ${form.bagVolume || 'the same'}${form.bagVolume ? ' mL' : ''}`
                      : 'Take out what you add, so the bag stays the same size'
                    : 'Nothing taken out, or enter what was'}
                </Text>
                <Switch
                  value={form.replaceRemoved}
                  onValueChange={(replaceRemoved) => patch({ replaceRemoved })}
                  accessibilityLabel="Take out the volume you add"
                  trackColor={{ true: c.accent, false: c.border }}
                  thumbColor={form.replaceRemoved ? c.onAccent : c.surface}
                />
              </View>
              {!form.replaceRemoved ? (
                <View style={styles.row}>
                  <NumberField
                    label="Volume taken out"
                    value={form.removedVolume}
                    onChangeText={(removedVolume) => patch({ removedVolume })}
                    suffix="mL"
                  />
                  <View style={styles.flex} />
                </View>
              ) : null}
            </Section>

            <Section title={toRate ? 'Patient and dose' : 'Patient and pump'}>
              <View style={styles.row}>
                {form.doseUnit.perKg ? (
                  <NumberField
                    ref={weightRef}
                    label="Weight"
                    value={form.weight}
                    onChangeText={(weight) => patch({ weight })}
                    suffix="kg"
                  />
                ) : null}
                {toRate ? (
                  <NumberField
                    flex={form.doseUnit.perKg ? 1.5 : 1}
                    ref={doseRef}
                    label="Dose"
                    value={form.dose}
                    onChangeText={(dose) => patch({ dose })}
                    unit={{
                      label: doseLabel,
                      onPress: () => setSheet('doseUnit'),
                      accessibilityLabel: `Dose unit, ${doseLabel}. Change`,
                    }}
                  />
                ) : (
                  <NumberField
                    flex={form.doseUnit.perKg ? 1.5 : 1}
                    ref={rateRef}
                    label="Pump rate"
                    value={form.rate}
                    onChangeText={(rate) => patch({ rate })}
                    suffix="mL/h"
                  />
                )}
              </View>
              {!toRate ? (
                <Pressable
                  onPress={() => setSheet('doseUnit')}
                  accessibilityRole="button"
                  accessibilityLabel={`Show the dose in ${doseLabel}. Change`}
                  style={({ pressed }) => [
                    styles.unitRow,
                    {
                      borderColor: c.border,
                      backgroundColor: pressed ? c.accentSoft : c.surface,
                    },
                  ]}
                >
                  <Text style={[styles.unitRowLabel, { color: c.textMuted }]}>Show the dose in</Text>
                  <View style={styles.unitRowValue}>
                    <Text style={[styles.unitRowText, { color: c.accent }]}>{doseLabel}</Text>
                    <Chevron color={c.accent} />
                  </View>
                </Pressable>
              ) : null}
              {!form.doseUnit.perKg ? (
                <Text style={[styles.hint, { color: c.textMuted }]}>Not weight-based, so no weight is needed.</Text>
              ) : null}
            </Section>

            <Text style={[styles.footer, { color: c.textMuted }]}>
              A calculation aid only. Check the ampoule and verify every result.
            </Text>
          </ScrollView>
          <EdgeFade color={c.bg} />
        </View>
      </KeyboardAvoidingView>

      <Sheet visible={sheet === 'working'} title="Working" onClose={close}>
        {evaluation.status === 'ok'
          ? evaluation.working.map((line) => (
              <Text key={line} style={[styles.workingLine, { color: c.text, borderColor: c.border }]}>
                {line}
              </Text>
            ))
          : null}
      </Sheet>

      <Sheet visible={sheet === 'titration'} title="Titration table" onClose={close}>
        {evaluation.status === 'ok' ? (
          <TitrationTable
            inputs={evaluation.inputs}
            summary={evaluation.summary}
            pumpStep={calc.pumpStep}
            initialMode={toRate ? 'by-dose' : 'by-rate'}
            onPick={(mode, value) => {
              patch(
                mode === 'by-dose'
                  ? { direction: 'dose-to-rate', dose: String(value) }
                  : { direction: 'rate-to-dose', rate: String(value) },
              );
              close();
            }}
          />
        ) : null}
      </Sheet>

      <Sheet visible={sheet === 'ampUnit'} title="Ampoule unit" onClose={close}>
        <Text style={[styles.sheetHint, { color: c.textMuted }]}>As printed on the label.</Text>
        <OptionList
          options={UNIT_OPTIONS}
          value={form.ampUnit}
          onChange={(ampUnit: AmountUnit) => {
            calc.editStrength({ ampUnit });
            close();
          }}
          accessibilityLabel="Ampoule unit"
        />
      </Sheet>

      <Sheet visible={sheet === 'doseUnit'} title="Dose unit" onClose={close}>
        <View style={styles.sheetBody}>
          <Text style={[styles.unitPreview, { color: c.text }]}>{doseLabel}</Text>
          <Segmented
            options={UNIT_OPTIONS}
            value={form.doseUnit.unit}
            onChange={(unit: AmountUnit) => calc.setDoseUnit({ unit })}
            accessibilityLabel="Dose amount unit"
          />
          <Segmented
            options={PER_KG_OPTIONS}
            value={form.doseUnit.perKg ? 'kg' : 'total'}
            onChange={(v) => calc.setDoseUnit({ perKg: v === 'kg' })}
            accessibilityLabel="Per kilogram of body weight, or total"
          />
          <Segmented
            options={TIME_OPTIONS}
            value={form.doseUnit.per}
            onChange={(per) => calc.setDoseUnit({ per })}
            accessibilityLabel="Dose time unit"
          />
        </View>
      </Sheet>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const c = useColors();
  return (
    <View style={styles.section}>
      <Text style={[styles.heading, { color: c.text }]} accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

/** Form content fades out as it scrolls under the label, instead of ending in sliced letters. */
function EdgeFade({ color }: { color: string }) {
  return (
    <View pointerEvents="none" style={styles.fade}>
      {FADE_STEPS.map((opacity) => (
        <View key={opacity} style={[styles.fadeStep, { backgroundColor: color, opacity }]} />
      ))}
    </View>
  );
}
const FADE_STEPS = [1, 0.85, 0.65, 0.45, 0.25, 0.1];

function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
}

/**
 * Tap a drug, or "Other" to type a name. Tapping the chosen drug again clears it.
 * Committing a different drug clears the old drug's ampoule strength.
 */
function DrugPicker({ label, onSelect }: { label: string; onSelect: (label: string) => void }) {
  const c = useColors();
  const custom = label !== '' && !findDrug(label);
  const [typing, setTyping] = useState(custom);
  const [text, setText] = useState(custom ? label : '');
  // Follow the committed label when it changes from outside (Reset, a known drug chosen).
  const [seen, setSeen] = useState(label);
  if (label !== seen) {
    setSeen(label);
    setTyping(custom);
    setText(custom ? label : '');
  }

  const current = drugKey(label);
  const commit = () => onSelect(text);

  return (
    <View style={styles.gap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={styles.bleed}
        contentContainerStyle={styles.chipRow}
      >
        {DRUGS.map((d) => {
          const selected = drugKey(d.name) === current;
          return (
            <Chip
              key={d.name}
              label={d.name}
              selected={selected}
              onPress={() => onSelect(selected ? '' : d.name)}
              accessibilityLabel={d.aliases.length > 0 ? `${d.name} (${d.aliases.join(', ')})` : d.name}
            />
          );
        })}
        <Chip
          label="Other"
          selected={typing}
          onPress={() => {
            if (typing) {
              setTyping(false);
              setText('');
              if (custom) onSelect('');
            } else {
              setTyping(true);
            }
          }}
          accessibilityLabel="Other drug: type a name"
        />
      </ScrollView>
      {typing ? (
        <TextInput
          autoFocus={!custom}
          value={text}
          onChangeText={setText}
          onEndEditing={commit}
          onSubmitEditing={commit}
          placeholder="Drug name"
          placeholderTextColor={c.textMuted}
          autoCapitalize="words"
          autoCorrect={false}
          accessibilityLabel="Drug name"
          selectionColor={c.accent}
          cursorColor={c.accent}
          style={[
            styles.drugInput,
            {
              color: c.text,
              backgroundColor: c.surface,
              borderColor: c.border,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: space.lg,
    paddingRight: space.xs,
    minHeight: TOUCH + 4,
  },
  brand: {
    fontFamily: font.labelHeavy,
    fontSize: 26,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  headerButton: {
    minHeight: TOUCH,
    justifyContent: 'center',
    paddingHorizontal: space.md,
    lineHeight: TOUCH,
  },
  headerText: { fontFamily: font.bold, fontSize: 17 },
  content: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: 56,
  },
  fade: { position: 'absolute', top: 0, left: 0, right: 0 },
  fadeStep: { height: 3 },
  section: { gap: space.md, marginTop: space.lg },
  heading: {
    fontFamily: font.label,
    fontSize: 19,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  hint: { fontFamily: font.medium, fontSize: 14, lineHeight: 20 },
  row: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-end' },
  joiner: { fontFamily: font.semibold, fontSize: 16, lineHeight: 56 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  gap: { gap: space.sm },
  bleed: { marginHorizontal: -space.lg },
  chipRow: { flexDirection: 'row', gap: space.sm, paddingHorizontal: space.lg },
  drugInput: {
    minHeight: 56,
    borderWidth: 1.5,
    borderRadius: radius.control,
    paddingHorizontal: space.md,
    fontFamily: font.semibold,
    fontSize: 19,
  },
  stamp: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: radius.control,
    padding: space.md,
    gap: space.md,
  },
  stampText: { gap: 2 },
  stampTitle: {
    fontFamily: font.labelHeavy,
    fontSize: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stampBody: { fontFamily: font.medium, fontSize: 16, lineHeight: 22 },
  confirm: {
    minHeight: TOUCH,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: { fontFamily: font.bold, fontSize: 17 },
  pressed: { opacity: 0.85 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: TOUCH,
  },
  switchText: {
    flex: 1,
    fontFamily: font.medium,
    fontSize: 16,
    lineHeight: 22,
  },
  unitRow: {
    minHeight: TOUCH + 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: radius.control,
    paddingHorizontal: space.md,
  },
  unitRowLabel: { fontFamily: font.semibold, fontSize: 16 },
  unitRowValue: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  unitRowText: { fontFamily: font.bold, fontSize: 17 },
  footer: {
    fontFamily: font.medium,
    fontSize: 14,
    textAlign: 'center',
    marginTop: space.xxl,
  },
  workingLine: {
    fontFamily: font.medium,
    fontSize: 17,
    lineHeight: 25,
    paddingVertical: space.md,
    borderBottomWidth: 1,
    fontVariant: ['tabular-nums'],
  },
  sheetHint: { fontFamily: font.medium, fontSize: 15, marginBottom: space.md },
  sheetBody: { gap: space.md, paddingBottom: space.sm },
  unitPreview: {
    fontFamily: font.labelHeavy,
    fontSize: 40,
    lineHeight: 46,
    textAlign: 'center',
    marginVertical: space.sm,
  },
});
