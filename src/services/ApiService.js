import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

async function request(path, options = {}) {
  const { method = 'GET', body, auth = false } = options;
  if (!BASE_URL) {
    throw new Error('EXPO_PUBLIC_API_URL belum diatur di file .env');
  }

  const token = auth ? await AsyncStorage.getItem('pb_token') : null;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;
  const data = await res.json();

  if (!res.ok) {
    const field = Object.values(data.data || {})[0];
    throw new Error(field?.message || data.message || `Error ${res.status}`);
  }
  return data;
}

// ---- 1. AUTH (users) ----
export async function registerUser(name, email, password) {
  return request('/auth/records', {
    method: 'POST',
    body: { name, email, password, passwordConfirm: password },
  });
}

export async function loginUser(email, password) {
  const data = await request('/auth/auth-with-password', {
    method: 'POST',
    body: { identity: email, password },
  });
  await AsyncStorage.setItem('pb_token', data.token);
  await AsyncStorage.setItem('pb_user', JSON.stringify(data.record));
  return data;
}

export async function logoutUser() {
  await AsyncStorage.removeItem('pb_token');
  await AsyncStorage.removeItem('pb_user');
}

export async function getCurrentUser() {
  const raw = await AsyncStorage.getItem('pb_user');
  return raw ? JSON.parse(raw) : null;
}

// ---- 2. PROFILES & DAILY LIMITS ----
export async function getMyProfile(userId) {
  const filter = encodeURIComponent(`user='${userId}'`);
  const data = await request(`/profiles?filter=${filter}`, { auth: true });
  return data.items?.[0] || null;
}

export async function saveProfile(userId, payload, existingId = null) {
  if (existingId) {
    return request(`/profiles/${existingId}`, {
      method: 'PATCH',
      auth: true,
      body: payload,
    });
  }
  return request('/profiles', {
    method: 'POST',
    auth: true,
    body: { user: userId, ...payload },
  });
}

export async function getDailyLimit(userId) {
  const filter = encodeURIComponent(`user='${userId}'`);
  const data = await request(`/daily_limits?filter=${filter}&sort=-created`, { auth: true });
  return data.items?.[0] || null;
}

// ---- 3. FOODS (Katalog Makanan) ----
export async function getFoods(search = '') {
  const query = search
    ? `?filter=${encodeURIComponent(`name~'${search.replace(/'/g, '')}'`)}&perPage=50`
    : '?perPage=50&sort=name';
  const data = await request(`/foods${query}`);
  return data.items || [];
}

// ---- 4. INTAKES (Catat & Ringkasan Asupan) ----
export async function getTodayIntakes(userId) {
  const today = new Date().toISOString().split('T')[0];
  const filter = encodeURIComponent(`user='${userId}' && created>='${today} 00:00:00'`);
  const data = await request(`/intakes?filter=${filter}&expand=food&sort=-created`, { auth: true });
  return data.items || [];
}

export async function logIntake(userId, foodId, portion = 1, notes = '') {
  return request('/intakes', {
    method: 'POST',
    auth: true,
    body: {
      user: userId,
      food: foodId,
      portion: Number(portion),
      notes,
    },
  });
}