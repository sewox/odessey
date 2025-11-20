const Visuals = {
    scene: null,
    camera: null,
    renderer: null,
    holo: null,
    starGeo: null,
    particles: [],
    speed: 0.5, // Base cruising speed

    init: function () {
        const c = document.querySelector('#webgl-container');
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x050505, 0.02);
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 10;

        this.renderer = new THREE.WebGLRenderer({
            canvas: c,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.scene.add(new THREE.AmbientLight(0x404040, 2));
        const p = new THREE.PointLight(0xffffff, 1.5);
        p.position.set(10, 10, 10);
        this.scene.add(p);

        this.holo = new THREE.Group();
        this.scene.add(this.holo);

        // Yıldızlar
        const arr = new Float32Array(6000 * 3);
        for (let i = 0; i < 6000 * 3; i++) arr[i] = (Math.random() - 0.5) * 400;
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));

        this.starGeo = new THREE.Points(geo, new THREE.PointsMaterial({
            size: 0.2,
            color: 0xffffff
        }));
        this.scene.add(this.starGeo);

        this.animate();

        window.onresize = () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        };
    },

    animate: function () {
        requestAnimationFrame(() => this.animate());

        if (this.holo.children.length) {
            this.holo.rotation.y += 0.01;
            this.holo.rotation.x = Math.sin(Date.now() * 0.001) * 0.2;
        }

        this.updateParticles();
        this.animateStars();
        this.renderer.render(this.scene, this.camera);
    },

    animateStars: function () {
        if (!this.starGeo) return;
        const positions = this.starGeo.geometry.attributes.position.array;
        for (let i = 2; i < positions.length; i += 3) {
            positions[i] += this.speed;
            if (positions[i] > 200) {
                positions[i] = -200;
            }
        }
        this.starGeo.geometry.attributes.position.needsUpdate = true;
    },

    setSpeed: function (s) {
        this.speed = s;
    },

    updateParticles: function () {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.mesh.position.add(p.velocity);
            p.mesh.material.opacity -= 0.02;
            p.life--;

            if (p.life <= 0 || p.mesh.material.opacity <= 0) {
                this.scene.remove(p.mesh);
                this.particles.splice(i, 1);
            }
        }
    },

    createExplosion: function (color = 0xffaa00) {
        const count = 20;
        const geo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        const mat = new THREE.MeshBasicMaterial({ color: color, transparent: true });

        for (let i = 0; i < count; i++) {
            const mesh = new THREE.Mesh(geo, mat.clone());
            mesh.position.set(0, 0, 0); // Center

            // Random velocity
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5
            );

            this.scene.add(mesh);
            this.particles.push({ mesh, velocity, life: 60 });
        }
    },

    clearHolo: function () {
        while (this.holo.children.length) this.holo.remove(this.holo.children[0]);
    },

    spawnHolo: function (type) {
        this.clearHolo();
        let g, m;

        if (type === 'enemy') {
            g = new THREE.ConeGeometry(1.5, 4, 4);
            m = new THREE.MeshStandardMaterial({
                color: 0xff0055,
                wireframe: true,
                emissive: 0x550000
            });
            const mesh = new THREE.Mesh(g, m);
            mesh.rotation.x = Math.PI / 2;
            this.holo.add(mesh);
        } else if (type === 'boss') {
            const g1 = new THREE.TorusGeometry(3, 0.5, 16, 100);
            const m1 = new THREE.MeshStandardMaterial({ color: 0xff0000, wireframe: true });
            this.holo.add(new THREE.Mesh(g1, m1));

            const g2 = new THREE.SphereGeometry(1.5, 32, 32);
            const m2 = new THREE.MeshStandardMaterial({ color: 0x550000, wireframe: true });
            this.holo.add(new THREE.Mesh(g2, m2));
        } else if (type === 'crate') {
            g = new THREE.BoxGeometry(2, 2, 2);
            m = new THREE.MeshStandardMaterial({
                color: 0xffcc00,
                wireframe: true
            });
            this.holo.add(new THREE.Mesh(g, m));
        } else {
            g = new THREE.SphereGeometry(2.5, 16, 16);
            m = new THREE.MeshStandardMaterial({
                color: 0x00f3ff,
                wireframe: true,
                opacity: 0.3,
                transparent: true
            });
            this.holo.add(new THREE.Mesh(g, m));
        }
    },

    warpEffect: function (isHyper = false) {
        let fov = 75;
        const limit = isHyper ? 170 : 150;
        const speed = isHyper ? 5 : 2;

        this.setSpeed(isHyper ? 4 : 2); // Increase star speed

        const i = setInterval(() => {
            fov += speed;
            this.camera.fov = fov;
            this.camera.updateProjectionMatrix();

            if (fov > limit) {
                clearInterval(i);
                setTimeout(() => {
                    this.camera.fov = 75;
                    this.camera.updateProjectionMatrix();
                    this.setSpeed(0.5); // Reset to cruising speed
                }, 300);
            }
        }, 20);
    },

    changeEnv: function (type) {
        if (type === 'alert') this.scene.fog.color.setHex(0x220000);
        else if (type === 'nebula') this.scene.fog.color.setHex(0x220033);
        else this.scene.fog.color.setHex(0x050505);
    },

    takeDamage: function () {
        const e = document.getElementById('dmg-overlay');
        e.classList.add('damage-active');
        setTimeout(() => e.classList.remove('damage-active'), 400);
    },

    chargeEffect: function () {
        const e = document.getElementById('charge-overlay');
        e.classList.add('charging');
        setTimeout(() => e.classList.remove('charging'), 1000);
    },

    laserEffect: function (isHeavy = false) {
        const intensity = isHeavy ? 0.5 : 0.2;
        this.camera.position.x = intensity;
        setTimeout(() => this.camera.position.x = 0, 100);
    }
};
