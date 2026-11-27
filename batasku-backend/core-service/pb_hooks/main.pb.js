/// <reference path="../pb_data/types.d.ts" />

// 1. Hitung ulang batas harian otomatis setiap kali profil dibuat atau diubah
onRecordAfterCreateSuccess((e) => {
    hitungBatasHarian(e.record);
    e.next();
}, "profiles");

onRecordAfterUpdateSuccess((e) => {
    hitungBatasHarian(e.record);
    e.next();
}, "profiles");

function hitungBatasHarian(profile) {
    const userId = profile.get("user");
    const age = profile.getInt("age") || 25;
    const weight = profile.getFloat("weight") || 60;
    const isPregnant = profile.getBool("is_pregnant");
    const hasDiabetes = profile.getBool("has_diabetes");
    const hasHypertension = profile.getBool("has_hypertension");

    // Acuan dasar WHO / Kemenkes
    let sugarMax = hasDiabetes ? 25 : 50;          // gram/hari
    let saltMax = hasHypertension ? 3 : 5;         // gram/hari (1 sdt = 5g)
    let fatMax = Math.round(weight * 0.9);         // gram/hari (~0.9g/kg BB)
    let caffeineMax = isPregnant ? 200 : (age < 18 ? 100 : 400); // mg/hari
    // Aturan khusus BatasKu: alkohol = 0 untuk ibu hamil, < 18 tahun, atau hipertensi/diabetes
    let alcoholMax = (isPregnant || age < 18 || hasDiabetes || hasHypertension) ? 0 : 14; // gram alkohol murni

    const col = $app.findCollectionByNameOrId("daily_limits");
    let record;
    try {
        record = $app.findFirstRecordByData("daily_limits", "user", userId);
    } catch (_) {
        record = new Record(col);
        record.set("user", userId);
    }

    record.set("sugar_max", sugarMax);
    record.set("salt_max", saltMax);
    record.set("fat_max", fatMax);
    record.set("caffeine_max", caffeineMax);
    record.set("alcohol_max", alcoholMax);
    $app.save(record);
}

// 2. Endpoint custom: GET /api/batasku/summary (Total asupan hari ini + sisa jatah + peringatan)
routerAdd("GET", "/api/batasku/summary", (e) => {
    const authRecord = e.auth;
    if (!authRecord) {
        return e.json(401, { message: "Unauthorized: token diperlukan" });
    }

    const userId = authRecord.id;
    const todayPrefix = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Ambil batas harian user
    let limit;
    try {
        limit = $app.findFirstRecordByData("daily_limits", "user", userId);
    } catch (_) {
        return e.json(404, { message: "Profil & batas harian belum diisi" });
    }

    const max = {
        sugar: limit.getFloat("sugar_max"),
        salt: limit.getFloat("salt_max"),
        fat: limit.getFloat("fat_max"),
        caffeine: limit.getFloat("caffeine_max"),
        alcohol: limit.getFloat("alcohol_max"),
    };

    // Hitung total konsumsi hari ini
    const intakes = $app.findRecordsByFilter(
        "intakes",
        "user = {:userId} && consumed_date ~ {:date}",
        "-created",
        100,
        0,
        { userId: userId, date: todayPrefix }
    );

    const consumed = { sugar: 0, salt: 0, fat: 0, caffeine: 0, alcohol: 0 };
    for (const item of intakes) {
        const portion = item.getFloat("portion") || 1;
        consumed.sugar += item.getFloat("sugar") * portion;
        consumed.salt += item.getFloat("salt") * portion;
        consumed.fat += item.getFloat("fat") * portion;
        consumed.caffeine += item.getFloat("caffeine") * portion;
        consumed.alcohol += item.getFloat("alcohol") * portion;
    }

    // Evaluasi status peringatan (aman < 80%, peringatan >= 80%, terlampaui > 100%)
    const warnings = [];
    const status = {};
    const labels = {
        sugar: "Gula",
        salt: "Garam",
        fat: "Lemak",
        caffeine: "Kafein",
        alcohol: "Alkohol",
    };

    for (const key of Object.keys(max)) {
        const m = max[key];
        const c = Number(consumed[key].toFixed(2));
        const pct = m === 0 ? (c > 0 ? 100 : 0) : Math.round((c / m) * 100);

        let level = "aman";
        if ((m === 0 && c > 0) || pct > 100) {
            level = "terlampaui";
            warnings.push({
                substance: key,
                level: "terlampaui",
                message: key === "alcohol"
                    ? "Batas risiko rendah alkohol terlampaui. Hentikan konsumsi alkohol."
                    : `Asupan ${labels[key]} sudah melewati batas harian (${c}/${m}). Pilih opsi yang lebih ringan.`,
            });
        } else if (pct >= 80) {
            level = "peringatan";
            warnings.push({
                substance: key,
                level: "peringatan",
                message: `Asupan ${labels[key]} sudah mencapai ${pct}% dari batas harian.`,
            });
        }

        status[key] = {
            consumed: c,
            max: m,
            remaining: Number(Math.max(0, m - c).toFixed(2)),
            percentage: pct,
            level: level,
        };
    }

    return e.json(200, {
        date: todayPrefix,
        summary: status,
        warnings: warnings,
        disclaimer: "Informasi ini bersifat umum dan tidak menggantikan saran medis dokter.",
    });
});