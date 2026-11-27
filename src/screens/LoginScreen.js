import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { loginUser, registerUser } from '../services/ApiService';

export default function LoginScreen({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password || (isRegister && !name)) {
      return Alert.alert('Validasi', 'Semua kolom wajib diisi.');
    }
    setLoading(true);
    try {
      if (isRegister) {
        await registerUser(name, email, password);
      }
      const res = await loginUser(email, password);
      onLoginSuccess(res.record);
    } catch (err) {
      Alert.alert('Gagal', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BatasKu</Text>
      <Text style={styles.subtitle}>
        {isRegister ? 'Buat Akun Baru' : 'Kendalikan Batas Gula, Garam & Lemakmu'}
      </Text>

      {isRegister && (
        <TextInput
          style={styles.input}
          placeholder="Nama Lengkap"
          value={name}
          onChangeText={setName}
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password (min. 8 karakter)"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.btnText}>
          {loading ? 'Memproses...' : isRegister ? 'Daftar & Masuk' : 'Masuk'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
        <Text style={styles.switchText}>
          {isRegister ? 'Sudah punya akun? Masuk di sini' : 'Belum punya akun? Daftar sekarang'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#F8FAFC' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#0F766E', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 28, marginTop: 4 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, padding: 14, marginBottom: 12 },
  btn: { backgroundColor: '#0F766E', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 6 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  switchText: { color: '#0F766E', textAlign: 'center', marginTop: 18, fontWeight: '500' },
});