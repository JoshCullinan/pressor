import { Link } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { parseNumber } from '../calculator/parse';
import { useCalculator } from '../calculator/useCalculator';
import { useNow } from '../calculator/useNow';
import { Chip } from '../components/Chip';
import { NumberField } from '../components/NumberField';
import { ResultCard } from '../components/ResultCard';
import { Segmented } from '../components/Segmented';
import { Sheet } from '../components/Sheet';
import { TitrationTable } from '../components/TitrationTable';
import { doseUnitLabel, drugKey, findDrug, searchDrugs } from '../data/drugs';
import { AMOUNT_UNITS, replacedVolumeMl, sigFigs, type AmountUnit } from '../engine';
import { ageLabel, describeStrength } from '../storage/strengths';
import { TOUCH, radius, space, useColors } from '../theme';

const UNIT_OPTIONS = AMOUNT_UNITS.map((u) => ({ value: u, label: u }));
const TIME_OPTIONS = [
  { value: 'min', label: 'per min' },
  { value: 'h', label: 'per hour' },
] as const;
const DIRECTION_OPTIONS = [
  { value: 'dose-to-rate', label: 'Dose → Rate' },
  { value: 'rate-to-dose', label: 'Rate → Dose' },
] as const;
const BAG_SIZES = [50, 100, 250, 500];

export default function Calculator() {
  const c = useColors();
  const calc = useCalculator();
  const { form, patch, evaluation } = calc;
  const [showWorking, setShowWorking] = useState(false);
  const [showTitration, setShowTitration] = useState(false);
  const now = useNow();

  const toRate = form.direction === 'dose-to-rate';
  const nAmps = parseNumber(form.nAmps);
  const ampVolume = parseNumber(form.ampVolume);
  const replaced =
    nAmps !== undefined && ampVolume !== undefined && nAmps > 0 && ampVolume > 0
      ? replacedVolumeMl(nAmps, ampVolume)
      : undefined;
  const unconfirmed = !form.strengthConfirmed;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: c.bg }]} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.screen} behavior="padding">
        <View style={styles.header}>
          <Text style={[styles.title, { color: c.text }]}>Pressor</Text>
          <View style={styles.headerActions}>
            <Pressable onPress={calc.reset} accessibilityRole="button" accessibilityLabel="Reset" style={styles.headerButton}>
              <Text style={[styles.headerText, { color: c.accent }]}>Reset</Text>
            </Pressable>
            <Link href="/about" style={[styles.headerButton, styles.headerText, { color: c.accent }]}>
              About
            </Link>
          </View>
        </View>

        <ResultCard
          evaluation={evaluation}
          pumpStep={calc.pumpStep}
          onPumpStep={calc.setPumpStep}
          onShowWorking={() => setShowWorking(true)}
          onShowTitration={() => setShowTitration(true)}
        />

        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Segmented
            options={DIRECTION_OPTIONS}
            value={form.direction}
            onChange={(direction) => patch({ direction })}
            accessibilityLabel="Calculation direction"
          />

          <Heading>Drug (optional)</Heading>
          <DrugPicker label={form.drugLabel} onSelect={calc.selectDrug} />

          <Heading>Ampoule, as printed on the label</Heading>
          <View style={styles.row}>
            <NumberField
              label="Amount"
              value={form.ampAmount}
              onChangeText={(ampAmount) => calc.editStrength({ ampAmount })}
              onFocus={() => calc.setStrengthFocused(true)}
              onBlur={() => calc.setStrengthFocused(false)}
              suffix={form.ampUnit}
              placeholder="e.g. 1"
              unconfirmed={unconfirmed}
            />
            <NumberField
              label="In volume"
              value={form.ampVolume}
              onChangeText={(ampVolume) => calc.editStrength({ ampVolume })}
              onFocus={() => calc.setStrengthFocused(true)}
              onBlur={() => calc.setStrengthFocused(false)}
              suffix="mL"
              placeholder="e.g. 1"
              unconfirmed={unconfirmed}
            />
          </View>
          <Segmented
            options={UNIT_OPTIONS}
            value={form.ampUnit}
            onChange={(ampUnit: AmountUnit) => calc.editStrength({ ampUnit })}
            accessibilityLabel="Ampoule strength unit"
          />
          {unconfirmed ? (
            <View style={[styles.banner, { backgroundColor: c.warnBg, borderColor: c.warnBorder }]}>
              <Text style={[styles.bannerText, { color: c.warnText }]}>
                Last used {form.strengthUsedAt ? ageLabel(now, form.strengthUsedAt) : 'before'}. Check it matches
                your ampoule.
              </Text>
              <Pressable
                onPress={calc.confirmStrength}
                accessibilityRole="button"
                style={[styles.confirm, { backgroundColor: c.accent }]}
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

          <Heading>In the bag</Heading>
          <View style={styles.row}>
            <NumberField
              label="Ampoules added"
              value={form.nAmps}
              onChangeText={(nAmps) => patch({ nAmps })}
              placeholder="e.g. 10"
            />
            <NumberField
              label="Bag size"
              value={form.bagVolume}
              onChangeText={(bagVolume) => patch({ bagVolume })}
              suffix="mL"
              placeholder="e.g. 200"
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
            <Switch
              value={form.replaceRemoved}
              onValueChange={(replaceRemoved) => patch({ replaceRemoved })}
              accessibilityLabel="Remove the volume you add"
              trackColor={{ true: c.accent, false: c.border }}
            />
            <Text style={[styles.switchText, { color: c.text }]}>
              {form.replaceRemoved
                ? replaced !== undefined
                  ? `Remove ${sigFigs(replaced)} mL first, so the bag stays the same size`
                  : 'Remove the volume you add, so the bag stays the same size'
                : 'Add without removing anything (or set the volume removed)'}
            </Text>
          </View>
          {!form.replaceRemoved ? (
            <View style={styles.row}>
              <NumberField
                label="Volume removed"
                value={form.removedVolume}
                onChangeText={(removedVolume) => patch({ removedVolume })}
                suffix="mL"
                placeholder="0"
              />
              <View style={styles.wrap} />
            </View>
          ) : null}

          <Heading>Patient and dose</Heading>
          <View style={styles.row}>
            <NumberField
              label={form.doseUnit.perKg ? 'Weight' : 'Weight (not used)'}
              value={form.weight}
              onChangeText={(weight) => patch({ weight })}
              suffix="kg"
              placeholder="e.g. 70"
            />
            {toRate ? (
              <NumberField
                label="Dose"
                value={form.dose}
                onChangeText={(dose) => patch({ dose })}
                suffix={doseUnitLabel(form.doseUnit)}
                placeholder="e.g. 0.1"
              />
            ) : (
              <NumberField
                label="Pump rate"
                value={form.rate}
                onChangeText={(rate) => patch({ rate })}
                suffix="mL/h"
                placeholder="e.g. 8.4"
              />
            )}
          </View>
          <Text style={[styles.hint, { color: c.textMuted }]}>{toRate ? 'Dose unit' : 'Show the dose as'}</Text>
          <Segmented
            options={UNIT_OPTIONS}
            value={form.doseUnit.unit}
            onChange={(unit: AmountUnit) => calc.setDoseUnit({ unit })}
            accessibilityLabel="Dose unit"
          />
          <View style={styles.switchRow}>
            <Switch
              value={form.doseUnit.perKg}
              onValueChange={(perKg) => calc.setDoseUnit({ perKg })}
              accessibilityLabel="Dose is per kilogram"
              trackColor={{ true: c.accent, false: c.border }}
            />
            <Text style={[styles.switchText, { color: c.text }]}>Per kg of body weight</Text>
          </View>
          <Segmented
            options={TIME_OPTIONS}
            value={form.doseUnit.per}
            onChange={(per) => calc.setDoseUnit({ per })}
            accessibilityLabel="Dose time unit"
          />

          <Text style={[styles.footer, { color: c.textMuted }]}>
            A calculation aid only. Check the ampoule and verify every result.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <Sheet visible={showWorking} title="Working" onClose={() => setShowWorking(false)}>
        {evaluation.status === 'ok'
          ? evaluation.working.map((line) => (
              <Text key={line} style={[styles.workingLine, { color: c.text }]}>
                {line}
              </Text>
            ))
          : null}
      </Sheet>

      <Sheet visible={showTitration} title="Titration table" onClose={() => setShowTitration(false)}>
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
              setShowTitration(false);
            }}
          />
        ) : null}
      </Sheet>
    </SafeAreaView>
  );
}

function Heading({ children }: { children: string }) {
  const c = useColors();
  return <Text style={[styles.heading, { color: c.text }]}>{children}</Text>;
}

/** Type a drug name or tap one. Committing a different drug clears the old drug's ampoule strength. */
function DrugPicker({ label, onSelect }: { label: string; onSelect: (label: string) => void }) {
  const c = useColors();
  const [text, setText] = useState(label);
  // Follow the committed label when it changes from outside (a chip tap, Reset).
  const [seen, setSeen] = useState(label);
  if (label !== seen) {
    setSeen(label);
    setText(label);
  }

  // Once the text names a drug exactly, show them all again so switching drug is one tap.
  const matches = searchDrugs(findDrug(text) ? '' : text);
  const current = drugKey(label);

  return (
    <View style={styles.gap}>
      <TextInput
        value={text}
        onChangeText={setText}
        onEndEditing={() => onSelect(text)}
        onSubmitEditing={() => onSelect(text)}
        placeholder="Type a name, or pick one"
        placeholderTextColor={c.textMuted}
        autoCapitalize="words"
        autoCorrect={false}
        accessibilityLabel="Drug name"
        style={[styles.drugInput, { color: c.text, backgroundColor: c.surface, borderColor: c.border }]}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.chipRow}>
          {matches.map((d) => (
            <Chip
              key={d.name}
              label={d.name}
              selected={drugKey(d.name) === current}
              onPress={() => onSelect(d.name)}
              accessibilityLabel={d.aliases.length > 0 ? `${d.name} (${d.aliases.join(', ')})` : d.name}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, minHeight: TOUCH },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  headerButton: { minHeight: TOUCH, justifyContent: 'center', paddingLeft: space.lg, lineHeight: TOUCH },
  headerText: { fontSize: 17, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '800' },
  content: { padding: space.lg, gap: space.md, paddingBottom: 48 },
  heading: { fontSize: 17, fontWeight: '700', marginTop: space.md },
  hint: { fontSize: 13, fontWeight: '600' },
  row: { flexDirection: 'row', gap: space.md },
  wrap: { flex: 1 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chipRow: { flexDirection: 'row', gap: space.sm },
  gap: { gap: space.sm },
  drugInput: { minHeight: 56, borderWidth: 1.5, borderRadius: radius.md, paddingHorizontal: space.md, fontSize: 18, fontWeight: '600' },
  banner: { borderWidth: 1.5, borderRadius: radius.md, padding: space.md, gap: space.sm },
  bannerText: { fontSize: 15, fontWeight: '600', lineHeight: 21 },
  confirm: { minHeight: TOUCH, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  confirmText: { fontSize: 17, fontWeight: '700' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: TOUCH },
  switchText: { flex: 1, fontSize: 15, lineHeight: 21 },
  footer: { fontSize: 13, textAlign: 'center', marginTop: space.lg },
  workingLine: { fontSize: 16, lineHeight: 24, marginBottom: space.md, fontVariant: ['tabular-nums'] },
});
