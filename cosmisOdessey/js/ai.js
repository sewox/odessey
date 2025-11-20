const AI = {
    // Yerel Veri Havuzu (API Fallback)
    data: {
        enemies: ["Kızıl Korsan", "Sith Avcısı", "Borg Gözcüsü", "Klingon Yırtıcısı", "Void Gölgesi", "Neon Haydut", "Cyber-Mantis"],
        loot: ["Plazma Çekirdeği", "Antimadde Kapsülü", "Kuantum Çipi", "Sith Holocronu", "Yıldız Haritası", "Nöron İşlemci"],
        diplo: [
            "Barış yok, sadece savaş var!",
            "Teslim olursan canını bağışlarız... belki.",
            "Kargonu ver, gitmene izin verelim. (BARIŞ)",
            "Sinyalinizi aldık. Ateşkes kabul edildi. (BARIŞ)",
            "Federasyon köpekleri! Ölün!"
        ]
    },

    call: async function(p, sys) {
        // API Key yoksa veya hata verirse yerel veriyi kullan
        return this.localFallback(p);
    },

    localFallback: function(prompt) {
        // Basit bir anahtar kelime kontrolü ile rastgele cevap döndür
        if(prompt.includes("isim") || prompt.includes("name")) {
            if(prompt.includes("eşya") || prompt.includes("loot")) return this.getRandom(this.data.loot);
            return this.getRandom(this.data.enemies);
        }

        if(prompt.includes("iletişim") || prompt.includes("diplomacy")) {
            return this.getRandom(this.data.diplo);
        }

        return "Veri Analizi Tamamlandı.";
    },

    getRandom: function(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },

    getEnemyName: async function() {
        return this.localFallback("isim");
    },
    getLootName: async function() {
        return this.localFallback("eşya");
    },
    diplomacy: async function(enemyName) {
        return this.localFallback("iletişim");
    }
};
