import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getDailyLimit, getTodayIntakes } from '../services/ApiService';

export default function HomeScreen({ user }) {
  const [limit, setLimit] = useState(null);
  const [intakes, setIntakes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [lim, list] = await Promise.all([
        getDailyLimit(user.id),
        getTodayIntakes(user.id),
      ]);
      setLimit(lim);
      setIntakes(list);
    } catch (err) {
      console.error(err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const totals = intakes.reduce(
    (acc, item) => {
      const f = item.expand?.food || {};
      const p = Number(item.portion || 1);
      acc.sugar += (f.sugar || 0) * p;
      acc.salt += (f.salt || 0) * p;
      acc.fat += (f.fat || 0) * p;
      acc.caffeine += (f.caffeine || 0) * p;
      return acc;
    },
    { sugar: 0, salt: 0, fat: 0, caffeine: 0 }
  );

  const maxSugar = limit?.max_sugar || 50;
  const maxSalt = limit?.max_salt || 5;
  const maxFat = limit?.max_fat || 67;
  const maxCaffeine = limit?.max_caffeine || 400;

  const renderBar = (label, current, max, unit) => {
    const ratio = max > 0 ? current / max : 0;
    const pct = Math.min(Math.round(ratio * 100), 100);
    const color = ratio >= 1 ? '#DC2626' : ratio >= 0.8 ? '#D97706' : '#0F766E';
    const status = ratio >= 1 ? 'MELEBIHI BATAS!' : ratio >= 0.8 ? 'Mendekati Batas (80%+)' : 'Aman';

    return (
      <View style={styles.card} key={label}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>{label}</Text>
          <Text style={[styles.badge, { color }]}>{status}</Text>
        </View>
        <Text style={styles.valueText}>
          {current.toFixed(1)} / {max} {unit} ({Math.round(ratio * 100)}%)
        </Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.greeting}>Halo, {user.name || user.email}</Text>
      <Text style={styles.sub}>Ringkasan Konsumsi Harian Kamu</Text>

      {!limit && (
        <View style={styles.warnBox}>
          <Text style={styles.warnText}>
            Profil kesehatan belum diisi. Buka tab Profil untuk menghitung batas otomatis sesuai kondisi tubuhmu.
          </Text>
        </View>
      )}

      {renderBar('Gula', totals.sugar, maxSugar, 'gram')}
      {renderBar('Garam', totals.salt, maxSalt, 'gram')}
      {renderBar('Lemak', totals.fat, maxFat, 'gram')}
      {renderBar('Kafein', totals.caffeine, maxCaffeine, 'mg')}

      <Text style={styles.sectionTitle}>Riwayat Hari Ini ({intakes.length})</Text>
      {intakes.map((item) => (
        <View key={item.id} style={styles.historyItem}>
          <Text style={styles.foodName}>{item.expand?.food?.name || 'Makanan'}</Text>
          <Text style={styles.portionText}>{item.portion} porsi</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, backgroundColor: '#F8FAFC' },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#0F172A', marginTop: 10 },
  sub: { fontSize: 13, color: '#64748B', marginBottom: 16 },
  warnBox: { backgroundColor: '#FEF3C7', padding: 12, borderRadius: 10, marginBottom: 14 },
  warnText: { color: '#92400E', fontSize: 13 },
  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 1 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  badge: { fontSize: 12, fontWeight: 'bold' },
  valueText: { fontSize: 14, color: '#475569', marginBottom: 8 },
  track: { height: 10, backgroundColor: '#E2E8F0', borderRadius: 6, overflow: 'hidden' },
  fill: { height: '100%' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 12, marginBottom: 8, color: '#0F172A' },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFF', padding: 12, borderRadius: 8, marginBottom: 8 },
  foodName: { fontWeight: '600', color: '#1E293B' },
  portionText: { color: '#64748B' },
});