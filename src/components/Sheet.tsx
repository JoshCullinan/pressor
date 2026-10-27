import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TOUCH, radius, space, useColors } from '../theme';

interface Props {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** A pop-up panel from the bottom of the screen. Dismissed by the Close button, the backdrop or the back gesture. */
export function Sheet({ visible, title, onClose, children }: Props) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={[styles.backdrop, { backgroundColor: c.backdrop }]} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { backgroundColor: c.surface, paddingBottom: insets.bottom + space.lg }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: c.text }]}>{title}</Text>
          <Pressable onPress={onClose} accessibilityRole="button" style={styles.close}>
            <Text style={[styles.closeText, { color: c.accent }]}>Close</Text>
          </Pressable>
        </View>
        <ScrollView style={styles.body}>{children}</ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  sheet: {
    maxHeight: '80%',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 20, fontWeight: '700' },
  close: { minHeight: TOUCH, justifyContent: 'center', paddingLeft: space.lg },
  closeText: { fontSize: 17, fontWeight: '600' },
  body: { flexGrow: 0 },
});
