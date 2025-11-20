const Achievements = {
    list: [
        { id: 'first_blood', name: 'İlk Kan', desc: 'Bir düşman gemisi yok et.', unlocked: false },
        { id: 'rich', name: 'Zengin', desc: '1000 Krediye ulaş.', unlocked: false },
        { id: 'survivor', name: 'Hayatta Kalan', desc: 'Gövde %10 altındayken bir savaş kazan.', unlocked: false },
        { id: 'pacifist', name: 'Barışçıl', desc: 'Bir savaşı diplomasi ile bitir.', unlocked: false },
        { id: 'sniper', name: 'Keskin Nişancı', desc: 'Tek atışta (Torpido) bir düşmanı yok et.', unlocked: false }
    ],

    init: function () {
        const saved = localStorage.getItem('cosmic_achievements');
        if (saved) {
            const savedData = JSON.parse(saved);
            this.list.forEach(a => {
                const s = savedData.find(x => x.id === a.id);
                if (s && s.unlocked) a.unlocked = true;
            });
        }
    },

    unlock: function (id) {
        const ach = this.list.find(a => a.id === id);
        if (ach && !ach.unlocked) {
            ach.unlocked = true;
            this.showNotification(ach);
            this.save();
            AudioController.play('powerup'); // Re-use powerup sound for now
        }
    },

    save: function () {
        localStorage.setItem('cosmic_achievements', JSON.stringify(this.list));
    },

    showNotification: function (ach) {
        const c = document.getElementById('hud-layer'); // Append to HUD layer
        if (!c) return;

        const el = document.createElement('div');
        el.style.position = 'absolute';
        el.style.top = '100px';
        el.style.right = '-300px';
        el.style.background = 'rgba(0, 20, 40, 0.9)';
        el.style.border = '1px solid var(--warning-color)';
        el.style.padding = '15px';
        el.style.width = '250px';
        el.style.color = '#fff';
        el.style.fontFamily = "'Rajdhani', sans-serif";
        el.style.transition = 'right 0.5s ease-out';
        el.style.zIndex = '1000';
        el.style.boxShadow = '0 0 20px rgba(255, 204, 0, 0.2)';

        el.innerHTML = `
            <div style="color:var(--warning-color); font-weight:bold; font-size:0.9rem;">BAŞARIM AÇILDI</div>
            <div style="font-size:1.2rem; margin:5px 0;">${ach.name}</div>
            <div style="font-size:0.8rem; color:#aaa;">${ach.desc}</div>
        `;

        document.body.appendChild(el); // Append to body to ensure visibility

        // Slide in
        setTimeout(() => el.style.right = '20px', 100);

        // Slide out
        setTimeout(() => {
            el.style.right = '-300px';
            setTimeout(() => el.remove(), 500);
        }, 4000);
    }
};
