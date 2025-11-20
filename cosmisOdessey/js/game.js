const Game = {
    state: {
        hull: 100,
        shields: 50,
        energy: 100,
        credits: 500,
        torpedoes: 3,
        inventory: [],
        inCombat: false,
        enemy: null,
        distance: 100,
        gameActive: false,
        // Upgrade Stats
        maxHull: 100,
        maxShields: 50,
        dmgMod: 1,
        // Class Bonus
        shipClass: 'Standard'
    },

    init: function () {
        this.updateUI();
        if (localStorage.getItem('cosmic_save')) {
            document.getElementById('btn-continue').style.display = 'inline-block';
        }
    },

    saveGame: function () {
        if (!this.state.gameActive) return;
        localStorage.setItem('cosmic_save', JSON.stringify(this.state));
        this.log("Oyun kaydedildi.", "log-system");
    },

    loadGame: function () {
        const saved = localStorage.getItem('cosmic_save');
        if (saved) {
            this.state = JSON.parse(saved);
            document.getElementById('start-screen').style.display = 'none';
            this.log("Kayıtlı oyun yüklendi.", "log-system");
            this.updateUI();

            // Restart loop
            setInterval(() => {
                if (this.state.gameActive && !this.state.inCombat && this.state.energy < 100) {
                    this.state.energy = Math.min(100, this.state.energy + 2);
                    this.updateUI();
                }
            }, 3000);
        }
    },

    startGame: function (shipClass = 'Standard') {
        document.getElementById('start-screen').style.display = 'none';
        this.state.gameActive = true;
        this.state.shipClass = shipClass;

        // Apply Class Bonuses
        if (shipClass === 'Interceptor') {
            this.state.dmgMod = 1.2;
            this.state.torpedoes = 4;
            this.state.maxHull = 80;
            this.state.hull = 80;
            this.log("Sınıf: INTERCEPTOR. Hasar bonusu aktif.", "log-system");
        } else if (shipClass === 'Explorer') {
            this.state.energy = 120; // Overcharge
            this.state.maxShields = 40;
            this.state.shields = 40;
            this.log("Sınıf: EXPLORER. Enerji bonusu aktif.", "log-system");
        } else if (shipClass === 'Juggernaut') {
            this.state.maxHull = 150;
            this.state.hull = 150;
            this.state.maxShields = 70;
            this.state.shields = 70;
            this.state.energy = 80;
            this.log("Sınıf: JUGGERNAUT. Zırh bonusu aktif.", "log-system");
        } else {
            this.log("Sistemler başlatıldı. Görev: Federasyon Üssü'ne ulaş.", "log-system");
        }

        // Pasif Yenilenme Döngüsü
        setInterval(() => {
            if (this.state.gameActive && !this.state.inCombat && this.state.energy < 100) {
                this.state.energy = Math.min(100, this.state.energy + 2);
                this.updateUI();
            }
        }, 3000);

        this.updateUI();
    },

    updateUI: function () {
        // Barlar
        const hullPct = (this.state.hull / this.state.maxHull) * 100;
        const shieldPct = (this.state.shields / this.state.maxShields) * 100;

        document.getElementById('hull-bar').style.width = hullPct + '%';
        document.getElementById('hull-val').innerText = Math.floor(this.state.hull) + '/' + this.state.maxHull;

        document.getElementById('shield-bar').style.width = shieldPct + '%';
        document.getElementById('shield-val').innerText = Math.floor(this.state.shields) + '/' + this.state.maxShields;

        document.getElementById('energy-bar').style.width = this.state.energy + '%';
        document.getElementById('energy-val').innerText = Math.floor(this.state.energy) + '%';

        document.getElementById('torp-val').innerText = this.state.torpedoes;
        document.getElementById('credits').innerText = this.state.credits;
        document.getElementById('inv-count').innerText = this.state.inventory.length;

        // Mesafe
        document.getElementById('distance-val').innerText = this.state.distance;

        // Mod Değişimi
        document.getElementById('nav-controls').style.display = this.state.inCombat ? 'none' : 'flex';
        document.getElementById('combat-controls').style.display = this.state.inCombat ? 'flex' : 'none';
        document.getElementById('combat-hud').style.display = this.state.inCombat ? 'block' : 'none';

        if (this.state.inCombat) document.getElementById('reticle').classList.add('locked');
        else document.getElementById('reticle').classList.remove('locked');

        // Buton Kontrolleri
        document.getElementById('btn-scan').disabled = this.state.energy < 5;
        document.getElementById('btn-warp').disabled = this.state.energy < 20;
    },

    log: function (msg, type = "log-system") {
        const c = document.getElementById('log-container');
        const d = document.createElement('div');
        d.className = `log-entry`;
        if (type) d.classList.add(type);

        d.innerHTML = `<span>></span>${msg}`;
        c.insertBefore(d, c.firstChild);
        if (c.children.length > 30) c.removeChild(c.lastChild);
    },

    // --- EYLEMLER ---
    recharge: function () {
        this.state.energy = Math.min(100, this.state.energy + 40);
        this.log("Reaktörlere acil güç aktarıldı.", "log-gain");
        Visuals.chargeEffect();
        AudioController.play('powerup');

        // Eğer savaştaysak düşman saldırır (Risk)
        if (this.state.inCombat) {
            this.log("Şarj sırasında savunmasız kaldınız!", "log-alert");
            setTimeout(() => this.enemyTurn(1.2), 600); // %20 fazla hasar riski
        }

        this.updateUI();
    },

    scan: async function () {
        if (this.state.energy < 5) return;
        this.state.energy -= 5;
        this.log("Sektör taranıyor...", "log-system");
        Visuals.spawnHolo('scan');
        AudioController.play('ui_click');

        const roll = Math.random();
        if (roll < 0.30) this.startCombat();
        else if (roll < 0.50) await this.findLoot();
        else if (roll < 0.65) this.triggerEvent('distress');
        else if (roll < 0.75) this.triggerEvent('storm');
        else {
            this.log("Sektör boş. Sadece kozmik rüzgar.", "log-gemini");
            Visuals.changeEnv('normal');
        }

        this.updateUI();
    },

    triggerEvent: function (type) {
        const m = document.getElementById('event-modal');
        const t = document.getElementById('modal-title');
        const d = document.getElementById('modal-desc');
        const c = document.getElementById('modal-choices');

        m.style.display = 'block';
        c.innerHTML = '';

        if (type === 'distress') {
            t.innerText = "ACİL DURUM SİNYALİ";
            d.innerText = "Bilinmeyen bir gemiden zayıf bir yardım çağrısı alıyorsunuz. Tuzak olabilir.";

            c.innerHTML += `<button class="choice-btn" onclick="Game.resolveEvent('distress_help')">YARDIM ET (Riskli)</button>`;
            c.innerHTML += `<button class="choice-btn" onclick="Game.resolveEvent('ignore')">GÖRMEZDEN GEL</button>`;
        } else if (type === 'storm') {
            t.innerText = "İYON FIRTINASI";
            d.innerText = "Gemi yoğun bir iyon fırtınasına girdi. Kalkanlar hasar görebilir ancak enerji şarj edilebilir.";

            c.innerHTML += `<button class="choice-btn" onclick="Game.resolveEvent('storm_wait')">BEKLE (+Enerji, -Kalkan)</button>`;
            c.innerHTML += `<button class="choice-btn" onclick="Game.resolveEvent('storm_warp')">ACİL WARP (-30 Enerji)</button>`;
        }
    },

    resolveEvent: function (choice) {
        document.getElementById('event-modal').style.display = 'none';

        if (choice === 'distress_help') {
            if (Math.random() > 0.4) {
                const reward = Math.floor(Math.random() * 200) + 100;
                this.state.credits += reward;
                this.log(`Sivil gemi kurtarıldı. Ödül: ${reward} CR`, "log-gain");
            } else {
                this.log("TUZAK! Korsanlar saldırıyor!", "log-alert");
                setTimeout(() => this.startCombat(), 500);
            }
        } else if (choice === 'storm_wait') {
            this.state.energy = 100;
            const dmg = Math.floor(Math.random() * 30) + 10;
            this.state.shields = Math.max(0, this.state.shields - dmg);
            this.log(`Fırtınadan enerji toplandı. Kalkan hasarı: -${dmg}%`, "log-system");
            Visuals.chargeEffect();
        } else if (choice === 'storm_warp') {
            if (this.state.energy >= 30) {
                this.state.energy -= 30;
                this.warp();
            } else {
                this.log("Yetersiz enerji! Fırtınada kaldınız.", "log-alert");
                this.resolveEvent('storm_wait');
            }
        } else {
            this.log("Sinyal görmezden gelindi.", "log-system");
        }
        this.updateUI();
    },

    warp: function () {
        if (this.state.energy < 20) return;
        this.state.energy -= 20;

        // Mesafe Azaltma
        let dist = Math.floor(Math.random() * 5) + 8; // 8-12 IY
        if (this.state.shipClass === 'Explorer') dist += 3; // Explorer bonus

        this.state.distance = Math.max(0, this.state.distance - dist);

        this.log(`Warp motorları aktif. ${dist} Işık Yılı katedildi.`, "log-system");
        Visuals.warpEffect();
        AudioController.play('warp');
        this.saveGame();

        setTimeout(() => {
            if (this.state.distance <= 0) {
                this.startBossBattle();
                return;
            }

            // Pasif Yenilenme (Yolculuk sırasında)
            this.state.shields = Math.min(this.state.maxShields, this.state.shields + 10);
            this.state.energy = Math.min(100, this.state.energy + 20);
            Visuals.changeEnv(Math.random() > 0.5 ? 'nebula' : 'void');

            this.log(`Yeni sektöre varıldı. Hedefe ${this.state.distance} IY kaldı.`, "log-system");
            this.updateUI();
        }, 2000);
        this.updateUI();
    },

    repair: function () {
        if (this.state.credits < 100 || this.state.hull >= this.state.maxHull) return;
        this.state.credits -= 100;
        this.state.hull = Math.min(this.state.maxHull, this.state.hull + 30);
        this.log("İstasyon onarımı tamamlandı.", "log-gemini");
        AudioController.play('powerup');
        this.updateUI();
    },

    // --- SAVAŞ ---
    startCombat: async function () {
        this.state.inCombat = true;

        this.state.enemy = {
            hp: 100,
            maxHp: 100,
            name: "DÜŞMAN",
            shield: 20,
            isBoss: false
        };
        Visuals.spawnHolo('enemy');
        Visuals.changeEnv('alert');
        AudioController.play('alert');

        const name = await AI.getEnemyName();
        this.state.enemy.name = name;
        document.getElementById('enemy-name').innerText = name;
        document.getElementById('enemy-hp-bar').style.width = '100%';

        this.log(`ALARM ! ${name} tespit edildi !`, "log-combat");
        this.updateUI();
    },

    startBossBattle: function () {
        this.state.inCombat = true;
        this.state.enemy = {
            hp: 300,
            maxHp: 300,
            name: "ANA GEMİ",
            shield: 100,
            isBoss: true
        };
        Visuals.spawnHolo('boss');
        Visuals.changeEnv('alert');

        document.getElementById('enemy-name').innerText = "DÜŞMAN ANA GEMİSİ";
        document.getElementById('enemy-hp-bar').style.width = '100%';

        this.log("UYARI: FEDERASYON ÜSSÜ KUŞATMA ALTINDA!", "log-alert");
        this.log("ANA GEMİ TESPİT EDİLDİ. YOK EDİLMELİ.", "log-combat");
        this.updateUI();
    },

    firePhasers: function () {
        if (this.state.energy < 10) {
            this.log("Yetersiz enerji!", "log-alert");
            return;
        }

        this.state.energy -= 10;
        const dmg = Math.floor((Math.random() * 20 + 10) * this.state.dmgMod);
        this.state.enemy.hp -= dmg;

        this.log(`Lazer atışı: Düşmana ${dmg} hasar !`, "log-gemini");
        Visuals.laserEffect();
        Visuals.createExplosion(0xff0055); // Red sparks
        AudioController.play('laser');
        this.checkEnemyState();
    },

    fireTorpedo: function () {
        if (this.state.torpedoes <= 0) {
            this.log("Torpido kalmadı!", "log-alert");
            return;
        }

        this.state.torpedoes--;
        const dmg = 50 * this.state.dmgMod; // Yüksek hasar
        this.state.enemy.hp -= dmg;

        this.log(`FOTON TORPİDOSU ATEŞLENDİ ! KRİTİK HASAR: ${dmg} !`, "log-combat");
        Visuals.laserEffect(true); // Büyük sarsıntı
        Visuals.createExplosion(0xffaa00); // Orange explosion
        AudioController.play('explosion');

        if (this.state.enemy.hp <= 0 && this.state.enemy.maxHp === 100) { // If killed in one shot (assuming 100hp enemy)
            // Basic check, can be improved
        }
        this.checkEnemyState();
    },

    hailTarget: async function () {
        this.log("İletişim kanalı açılıyor...", "log-diplo");
        const response = await AI.diplomacy(this.state.enemy.name);

        if (response.includes("BARIŞ") || response.includes("peace") || Math.random() > 0.6) {
            this.log(`DÜŞMAN: "Ateşkes kabul edildi. Gidin burdan." `, "log-diplo");
            Achievements.unlock('pacifist');
            this.endCombat();
        } else {
            this.log(`DÜŞMAN: "Teslim olmak yok! Ateş!" `, "log-combat");
            this.enemyTurn(1.2);
        }
    },

    checkEnemyState: function () {
        if (this.state.enemy.hp <= 0) this.winCombat();
        else setTimeout(() => this.enemyTurn(), 800);
        this.updateCombatUI();
        this.updateUI();
    },

    enemyTurn: function (dmgMod = 1) {
        if (!this.state.inCombat) return;

        if (Math.random() > 0.25) {
            let dmg = Math.floor((Math.random() * 15 + 10) * dmgMod);

            if (this.state.shields > 0) {
                if (this.state.shields >= dmg) {
                    this.state.shields -= dmg;
                    dmg = 0;
                    this.log("Kalkanlar darbeyi emdi.", "log-system");
                } else {
                    dmg -= this.state.shields;
                    this.state.shields = 0;
                    this.log("KALKANLAR ÇÖKTÜ!", "log-alert");
                }
            }

            if (dmg > 0) {
                this.state.hull -= dmg;

                this.log(`GÖVDE HASARI: -${dmg}%`, "log-combat");
                Visuals.takeDamage();
                AudioController.play('explosion');
            }
        } else {
            this.log("Düşman atışı ıskaladı.", "log-system");
        }

        if (this.state.hull <= 0) {
            this.gameOver("GEMİ SAVAŞTA İMHA EDİLDİ");
        }

        this.updateUI();
    },

    gameOver: function (reason) {
        this.state.gameActive = false;
        document.getElementById('game-over-screen').style.display = 'flex';
        document.getElementById('death-reason').innerText = reason;
    },

    gameWin: function () {
        this.state.gameActive = false;
        document.getElementById('win-screen').style.display = 'flex';
        document.getElementById('final-score').innerText = this.state.credits + (this.state.hull * 10);
    },

    winCombat: async function () {
        if (this.state.enemy.isBoss) {
            this.gameWin();
            return;
        }

        this.log(`${this.state.enemy.name} imha edildi !`, "log-gemini");
        Visuals.createExplosion(0x00ff9d); // Green/Success explosion
        const loot = Math.floor(Math.random() * 150) + 50;
        this.state.credits += loot;

        Achievements.unlock('first_blood');
        if (this.state.credits >= 1000) Achievements.unlock('rich');
        if (this.state.hull < 10) Achievements.unlock('survivor');

        this.log(`${loot} Kredi enkazdan çıkarıldı.`, "log-loot");
        if (Math.random() > 0.5) this.state.torpedoes++; // Loot ammo
        this.endCombat();
    },

    endCombat: function () {
        this.state.inCombat = false;
        this.state.enemy = null;
        Visuals.clearHolo();
        Visuals.changeEnv('normal');
        this.updateUI();
    },

    updateCombatUI: function () {
        if (this.state.enemy) {
            const pct = Math.max(0, (this.state.enemy.hp / this.state.enemy.maxHp) * 100);
            document.getElementById('enemy-hp-bar').style.width = pct + '%';
        }
    },

    findLoot: async function () {
        const name = await AI.getLootName();
        const val = Math.floor(Math.random() * 300) + 50;

        this.state.inventory.push({
            name,
            value: val
        });

        this.log(`GANİMET: ${name} bulundu !`, "log-loot");
        Visuals.spawnHolo('crate');
    },

    // --- EKONOMİ ---
    sellLoot: function (index) {
        const item = this.state.inventory[index];
        this.state.credits += item.value;
        this.state.inventory.splice(index, 1);
        this.log(`${item.name} satıldı. +${item.value} CR`, "log-gain");
        this.updateUI();
        this.saveGame();
        toggleMarket(); // Refresh list
    },

    buyUpgrade: function (type) {
        let cost = 0;
        if (type === 'hull') {
            cost = 150;
            if (this.state.credits >= cost) {
                this.state.credits -= cost;
                this.state.maxHull += 50;
                this.state.hull = this.state.maxHull;
                this.log("Gövde güçlendirildi ve onarıldı.", "log-gain");
            }
        } else if (type === 'shield') {
            cost = 300;
            if (this.state.credits >= cost) {
                this.state.credits -= cost;
                this.state.maxShields += 10;
                this.state.shields = this.state.maxShields;
                this.log("Kalkan kapasitesi artırıldı.", "log-gain");
            }
        } else if (type === 'torp') {
            cost = 100;
            if (this.state.credits >= cost) {
                this.state.credits -= cost;
                this.state.torpedoes++;
                this.log("Torpido satın alındı.", "log-gain");
            }
        }
        this.updateUI();
        this.saveGame();
        toggleMarket(); // Refresh credits
    }
};

function toggleMarket() {
    const m = document.getElementById('market-modal');
    const l = document.getElementById('sell-list');
    const c = document.getElementById('market-credits');

    // Toggle display if called from button, otherwise just refresh if already open
    if (event && (event.type === 'click' || event.type === 'onclick')) {
        m.style.display = (m.style.display === 'flex') ? 'none' : 'flex';
    } else if (m.style.display !== 'flex') {
        return; // Don't refresh if closed
    }

    if (m.style.display === 'flex') {
        c.innerText = Game.state.credits;
        l.innerHTML = '';
        if (Game.state.inventory.length === 0) l.innerHTML = '<div style="text-align:center;color:#666;">Satılacak eşya yok</div>';
        else Game.state.inventory.forEach((item, idx) => {
            const d = document.createElement('div');
            d.className = 'upgrade-btn';
            d.style.borderColor = '#555';
            d.innerHTML = `<span>${item.name}</span> <span>${item.value} CR <i class="fas fa-arrow-right"></i> SAT</span>`;
            d.onclick = () => Game.sellLoot(idx);
            l.appendChild(d);
        });
    }
}

function toggleInventory() {
    const m = document.getElementById('inv-modal');
    const l = document.getElementById('inv-list');
    m.style.display = (m.style.display === 'flex') ? 'none' : 'flex';

    if (m.style.display === 'flex') {
        l.innerHTML = '';
        if (Game.state.inventory.length === 0) l.innerHTML = '<div style="text-align:center;color:#666;">BOŞ</div>';
        else Game.state.inventory.forEach(i => {
            const d = document.createElement('div');
            d.className = 'inv-item';
            d.innerHTML = `<span>${i.name}</span> <span style="color:var(--warning-color)">${i.value} CR</span>`;
            l.appendChild(d);
        });
    }
}
