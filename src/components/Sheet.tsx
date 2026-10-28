import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TOUCH, font, radius, space, useColors } from '../theme';

interface Props {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** A pop-up panel from the bottom of the screen. Dismissed by Done, the backdrop or the back gesture. */
export function Sheet({ visible, title, onClose, children }: Props) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <Pressable style={[styles.backdrop, { backgroundColor: c.backdrop }]} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { backgroundColor: c.bg, paddingBottom: insets.bottom + space.lg }]}>
        <View style={[styles.grabber, { backgroundColor: c.border }]} />
        <View style={styles.header}>
          <Text style={[styles.title, { color: c.text }]} accessibilityRole="header">
            {title}
          </Text>
          <Pressable onPress={onClose} accessibilityRole="button" style={styles.close}>
            <Text style={[styles.closeText, { color: c.accent }]}>Done</Text>
          </Pressable>
        </View>
        <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  sheet: {
    maxHeight: '85%',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
  },
  grabber: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, marginBottom: space.xs },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: font.labelHeavy, fontSize: 24, textTransform: 'uppercase', letterSpacing: 0.5 },
  close: { minHeight: TOUCH, justifyContent: 'center', paddingLeft: space.lg },
  closeText: { fontFamily: font.bold, fontSize: 17 },
  body: { flexGrow: 0 },
});
