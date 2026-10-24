import { StyleSheet, Text, View } from 'react-native';

export default function Calculator() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pressor</Text>
      <Text>Calculator screen coming next.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: '600', marginBottom: 8 },
});
