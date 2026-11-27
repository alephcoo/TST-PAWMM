import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Switch, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { getMyProfile, saveProfile, logoutUser } from '../services/ApiService';

export default function ProfileScreen({ user, onLogout }) {
  const [profileId, setProfileId] = useState(null);
  const [age, setAge] = useState('20');
  const [weight, setWeight] = useState('65');
  const [height, setHeight] = useState('170');
  const [hasDiabetes, setHasDiabetes] = useState(false);
  const [hasHypertension, setHasHypertension] = useState(false);
  const [hasCholesterol, setHasCholesterol] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const p = await getMyProfile(user.id);
        if (p) {
          setProfileId(p.id);
          setAge(String(p.age || 20));
          setWeight(String(p.weight || 65));
          setHeight(String(p.height || 170));
          setHasDiabetes(Boolean(p.has_diabetes));
          setHasHypertension(Boolean(p.has_hypertension));
          setHasCholesterol(Boolean(p.has_cholesterol));
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const handleSave = async () => {
    try {
      const saved = await saveProfile(
        user.id,
        {
          age: Number(age),
          weight: Number(weight),
          height: Number(height),
          has_diabetes: hasDiabetes,
          has_hypertension: hasHypertension,
          has_cholesterol: hasCholesterol,
        },
        profileId
      );
      setProfileId(saved.id);
      Alert.alert('Berhasil', 'Profil disimpan & batas harian otomatis diperbarui oleh server!');
    } catch (err) {
      Alert.alert('Gagal', err.message);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    onLogout();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Profil Kesehatan</Text>
      <Text style={styles.email}>{user.email}</Text>

      <Text style={styles.label}>Usia (tahun)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={age} onChangeText={setAge} />

      <Text style={styles.label}>Berat Badan (kg)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={weight} onChangeText={setWeight} />

      <Text style={styles.label}>Tinggi Badan (cm)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={height} onChangeText={setHeight} />

      <View style={styles.switchRow}>
        <Text>Riwayat Diabetes (Batasi Gula)</Text>
        <Switch value={hasDiabetes} onValueChange={setHasDiabetes} />
      </View>
      <View style={styles.switchRow}>
        <Text>Riwayat Hipertensi (Batasi Garam)</Text>
        <Switch value={hasHypertension} onValueChange={setHasHypertension} />
      </View>
      <View style={styles.switchRow}>
        <Text>Riwayat Kolesterol (Batasi Lemak)</Text>
        <Switch value={hasCholesterol} onValueChange={setHasCholesterol} />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>Simpan & Hitung Batas Harian</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Keluar Akun</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, backgroundColor: '#F8FAFC' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#0F172A', marginTop: 10 },
  email: { fontSize: 13, color: '#64748B', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 4 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10, marginBottom: 12 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 8, marginBottom: 8 },
  saveBtn: { backgroundColor: '#0F766E', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold' },
  logoutBtn: { padding: 14, alignItems: 'center', marginTop: 10, marginBottom: 30 },
  logoutText: { color: '#DC2626', fontWeight: 'bold' },
});