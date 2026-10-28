import { Stack } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { font, space, useColors } from '../theme';

const REPO = 'https://github.com/JoshCullinan/pressor';

export default function About() {
  const c = useColors();
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: '',
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: c.bg },
          headerTintColor: c.text,
          headerTitleStyle: { fontFamily: font.labelHeavy, fontSize: 24 },
          headerShadowVisible: false,
        }}
      />
      <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: c.text }]}>Pressor</Text>
        <Text style={[styles.body, { color: c.text }]}>
          A free, open-source, offline calculator that turns what is in the bag into a pump rate, or a pump rate into a
          dose. It collects nothing, needs no account and never connects to the internet.
        </Text>

        <Text style={[styles.heading, { color: c.text }]}>Read this first</Text>
        <Text style={[styles.body, { color: c.text }]}>
          Pressor is a calculation aid. It is not a medical device and gives no clinical advice. It contains no drug
          strengths and no dose ranges.
        </Text>
        <Text style={[styles.body, { color: c.text }]}>
          Always enter the strength from the ampoule in your hand. A strength the app remembers from last time is only a
          convenience and must be checked against the ampoule every time. Verify every result independently and follow
          your local protocols.
        </Text>
        <Text style={[styles.body, { color: c.text }]}>
          You are responsible for every clinical decision. The software is provided as is, without warranty of any kind.
        </Text>

        <Text style={[styles.heading, { color: c.text }]}>Open source</Text>
        <Text style={[styles.body, { color: c.text }]}>Licensed under the Apache License 2.0.</Text>
        <Pressable onPress={() => Linking.openURL(REPO)} accessibilityRole="link">
          <Text style={[styles.link, { color: c.accent }]}>{REPO}</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.md },
  title: { fontFamily: font.labelHeavy, fontSize: 34, textTransform: 'uppercase', letterSpacing: 1.5 },
  heading: { fontFamily: font.label, fontSize: 20, textTransform: 'uppercase', letterSpacing: 1, marginTop: space.md },
  body: { fontFamily: font.regular, fontSize: 17, lineHeight: 25, maxWidth: 640 },
  link: { fontFamily: font.semibold, fontSize: 16, textDecorationLine: 'underline' },
});
