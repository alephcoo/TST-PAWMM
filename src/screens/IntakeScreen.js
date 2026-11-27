import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { getFoods, logIntake } from '../services/ApiService';

export default function IntakeScreen({ user }) {
  const [foods, setFoods] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedFood, setSelectedFood] = useState(null);
  const [portion, setPortion] = useState('1');
  const [submitting, setSubmitting] = useState(false);

  const fetchFoods = async (q = '') => {
    try {
      const items = await getFoods(q);
      setFoods(items);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  const handleSearch = (text) => {
    setSearch(text);
    fetchFoods(text);
  };

  const handleSave = async () => {
    if (!selectedFood) return Alert.alert('Pilih Makanan', 'Klik salah satu makanan di daftar.');
    setSubmitting(true);
    try {
      const res = await logIntake(user.id, selectedFood.id, Number(portion || 1));
      Alert.alert(
        'Tercatat!',
        res?.warning_message || `${selectedFood.name} (${portion} porsi) berhasil disimpan.`
      );
      setSelectedFood(null);
      setPortion('1');
    } catch (err) {
      Alert.alert('Gagal Menyimpan', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Catat Asupan</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Cari makanan/minuman (mis. Nasi Goreng, Kopi)..."
        value={search}
        onChangeText={handleSearch}
      />

      <FlatList
        data={foods}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const active = selectedFood?.id === item.id;
          return (
            <TouchableOpacity
              style={[styles.foodCard, active && styles.foodCardActive]}
              onPress={() => setSelectedFood(item)}
            >
              <Text style={styles.foodName}>{item.name} ({item.portion_label})</Text>
              <Text style={styles.nutrientText}>
                Gula: {item.sugar}g · Garam: {item.salt}g · Lemak: {item.fat}g · Kafein: {item.caffeine}mg
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {selectedFood && (
        <View style={styles.bottomPanel}>
          <Text style={styles.selectedLabel}>Dipilih: {selectedFood.name}</Text>
          <View style={styles.row}>
            <TextInput
              style={styles.portionInput}
              keyboardType="numeric"
              value={portion}
              onChangeText={setPortion}
              placeholder="Porsi"
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={submitting}>
              <Text style={styles.saveBtnText}>
                {submitting ? 'Menyimpan...' : 'Simpan Asupan'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, backgroundColor: '#F8FAFC' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#0F172A', marginTop: 10, marginBottom: 12 },
  searchInput: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, padding: 12, marginBottom: 12 },
  foodCard: { backgroundColor: '#FFF', padding: 14, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  foodCardActive: { borderColor: '#0F766E', backgroundColor: '#F0FDFA' },
  foodName: { fontSize: 15, fontWeight: 'bold', color: '#1E293B' },
  nutrientText: { fontSize: 12, color: '#64748B', marginTop: 4 },
  bottomPanel: { backgroundColor: '#FFF', padding: 14, borderRadius: 12, borderTopWidth: 1, borderColor: '#CBD5E1' },
  selectedLabel: { fontWeight: 'bold', color: '#0F766E', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 10 },
  portionInput: { width: 80, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10, textAlign: 'center' },
  saveBtn: { flex: 1, backgroundColor: '#0F766E', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: 'bold' },
});