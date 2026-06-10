/**
 * APEX-OS // simulation.js
 * Ocean Simulation — Canvas-based dynamic wave rendering with USV model
 */

'use strict';

(function SimulationModule() {

    let canvas, ctx, animId;
    let simTime = 0;
    let waveHeight = 0.8;
    let windSpeed  = 12;
    let seaState   = 3;
    let running    = false;

    // ── Ocean Render ─────────────────────────────────────────────────────────
    function initOcean() {
        canvas = document.getElementById('ocean-canvas');
        if (!canvas) return;

        function resize() {
            canvas.width  = canvas.offsetWidth  || 900;
            canvas.height = canvas.offsetHeight || 500;
        }
        resize();
        window.addEventListener('resize', () => { resize(); });
        ctx = canvas.getContext('2d');
        startRender();
        bindControls();
        ConsoleLog?.info('Ocean simulation engine initialized. Renderer: Canvas2D');
    }

    function startRender() {
        if (animId) cancelAnimationFrame(animId);
        running = true;
        renderFrame();
    }

    function stopRender() {
        running = false;
        if (animId) cancelAnimationFrame(animId);
    }

    function renderFrame() {
        if (!running || !ctx) return;
        animId = requestAnimationFrame(renderFrame);
        simTime += 0.016;
        drawOcean();
    }

    // ── Main draw ────────────────────────────────────────────────────────────
    function drawOcean() {
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        // Sky gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.45);
        skyGrad.addColorStop(0, '#01030a');
        skyGrad.addColorStop(0.5, '#020b18');
        skyGrad.addColorStop(1, '#041428');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, W, H * 0.45);

        // Stars
        drawStars(W, H);

        // Moon / light source
        drawMoon(W, H);

        // Horizon glow
        const horizonGrad = ctx.createLinearGradient(0, H*0.38, 0, H*0.55);
        horizonGrad.addColorStop(0, 'rgba(0, 80, 140, 0.5)');
        horizonGrad.addColorStop(0.5, 'rgba(0, 100, 160, 0.3)');
        horizonGrad.addColorStop(1, 'rgba(0, 120, 200, 0)');
        ctx.fillStyle = horizonGrad;
        ctx.fillRect(0, H * 0.38, W, H * 0.17);

        // Ocean body
        const oceanGrad = ctx.createLinearGradient(0, H*0.45, 0, H);
        oceanGrad.addColorStop(0, '#042030');
        oceanGrad.addColorStop(0.3, '#031825');
        oceanGrad.addColorStop(0.7, '#020e18');
        oceanGrad.addColorStop(1, '#010810');
        ctx.fillStyle = oceanGrad;
        ctx.fillRect(0, H * 0.45, W, H * 0.55);

        // Wave layers (back to front)
        const amp = waveHeight * (H * 0.025);
        drawWaveLayer(W, H, H * 0.45, amp * 0.4, 0.008, simTime * 0.6, 'rgba(0,100,160,0.3)', 3);
        drawWaveLayer(W, H, H * 0.50, amp * 0.6, 0.010, simTime * 0.8 + 1, 'rgba(0,130,200,0.25)', 2.5);
        drawWaveLayer(W, H, H * 0.55, amp * 0.8, 0.012, simTime * 1.0 + 2, 'rgba(0,160,220,0.2)', 2);
        drawWaveLayer(W, H, H * 0.62, amp * 1.0, 0.014, simTime * 1.2 + 3, 'rgba(0,180,240,0.18)', 2);
        drawWaveLayer(W, H, H * 0.70, amp * 1.2, 0.016, simTime * 1.4 + 4, 'rgba(0,200,255,0.15)', 1.5);

        // Foam crests
        drawFoam(W, H, amp);

        // Moon reflection
        drawMoonReflection(W, H);

        // USV model
        drawUSV(W, H, amp);

        // Particle spray
        drawSpray(W, H, amp);

        // Scan lines overlay
        ctx.fillStyle = 'rgba(0,0,0,0.04)';
        for (let y = 0; y < H; y += 4) {
            ctx.fillRect(0, y, W, 2);
        }

        // Update HUD numbers
        updateSimHUD();
    }

    // ── Stars ────────────────────────────────────────────────────────────────
    const STARS = Array.from({length: 120}, () => ({
        x: Math.random(), y: Math.random() * 0.42,
        r: Math.random() * 1.2 + 0.3,
        t: Math.random() * Math.PI * 2
    }));
    function drawStars(W, H) {
        STARS.forEach(s => {
            const bright = 0.5 + 0.5 * Math.sin(simTime * 1.2 + s.t);
            ctx.beginPath();
            ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200,220,255,${bright * 0.8})`;
            ctx.fill();
        });
    }

    // ── Moon ─────────────────────────────────────────────────────────────────
    function drawMoon(W, H) {
        const mx = W * 0.78, my = H * 0.12, mr = 28;
        const glow = ctx.createRadialGradient(mx, my, 0, mx, my, mr * 3);
        glow.addColorStop(0, 'rgba(200,230,255,0.12)');
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(mx, my, mr * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(mx, my, mr, 0, Math.PI * 2);
        const moonGrad = ctx.createRadialGradient(mx - 8, my - 8, 2, mx, my, mr);
        moonGrad.addColorStop(0, '#ddeeff');
        moonGrad.addColorStop(0.7, '#b8d0e8');
        moonGrad.addColorStop(1, '#8aaabb');
        ctx.fillStyle = moonGrad;
        ctx.fill();
    }

    // ── Wave Layer ───────────────────────────────────────────────────────────
    function drawWaveLayer(W, H, baseY, amp, freq, phase, color, lineW) {
        ctx.beginPath();
        ctx.moveTo(0, baseY);
        for (let x = 0; x <= W; x += 3) {
            const y = baseY
                + Math.sin(x * freq + phase) * amp
                + Math.sin(x * freq * 1.7 + phase * 1.3) * amp * 0.4
                + Math.sin(x * freq * 0.5 + phase * 0.7) * amp * 0.3;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(W, H);
        ctx.lineTo(0, H);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();

        // Wave crest line
        ctx.beginPath();
        ctx.moveTo(0, baseY);
        for (let x = 0; x <= W; x += 3) {
            const y = baseY
                + Math.sin(x * freq + phase) * amp
                + Math.sin(x * freq * 1.7 + phase * 1.3) * amp * 0.4;
            ctx.lineTo(x, y);
        }
        ctx.strokeStyle = color.replace('0.', '0.6').replace(')', ')');
        ctx.lineWidth = lineW;
        ctx.stroke();
    }

    // ── Foam Crests ──────────────────────────────────────────────────────────
    function drawFoam(W, H, amp) {
        if (amp < 3) return;
        ctx.save();
        for (let i = 0; i < 6; i++) {
            const baseY = H * (0.52 + i * 0.06);
            const phase = simTime * (0.8 + i * 0.15) + i * 1.2;
            const freq  = 0.009 + i * 0.002;
            for (let x = 0; x < W; x += 40) {
                const y = baseY + Math.sin(x * freq + phase) * amp;
                const w = 8 + Math.random() * 12;
                const opacity = 0.1 + Math.random() * 0.15;
                ctx.beginPath();
                ctx.ellipse(x + Math.random() * 20, y, w, 2, 0, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(200,240,255,${opacity})`;
                ctx.fill();
            }
        }
        ctx.restore();
    }

    // ── Moon Reflection ──────────────────────────────────────────────────────
    function drawMoonReflection(W, H) {
        const mx = W * 0.78;
        for (let i = 0; i < 12; i++) {
            const y = H * 0.47 + i * (H * 0.04);
            const w = (8 - i * 0.5) + Math.sin(simTime * 2 + i) * 4;
            ctx.beginPath();
            ctx.ellipse(mx + Math.sin(simTime * 0.5 + i) * 8, y, Math.max(w, 1), 2, 0, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(180,220,255,${0.25 - i * 0.018})`;
            ctx.fill();
        }
    }

    // ── USV Model ────────────────────────────────────────────────────────────
    function drawUSV(W, H, amp) {
        const cx = W * 0.38;
        const baseY = H * 0.60;
        const pitch = Math.sin(simTime * 0.9) * amp * 0.6;
        const roll  = Math.cos(simTime * 0.7) * 0.04;
        const bobbY = baseY + pitch;

        ctx.save();
        ctx.translate(cx, bobbY);
        ctx.rotate(roll);

        const len = Math.min(W * 0.22, 180);
        const bm  = len * 0.22;
        const dr  = len * 0.10;

        // Hull shadow
        ctx.beginPath();
        ctx.ellipse(0, dr + 6, len * 0.45, 10, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fill();

        // Hull body
        ctx.beginPath();
        ctx.moveTo(-len/2, 0);
        ctx.lineTo(len * 0.3, 0);
        ctx.quadraticCurveTo(len/2, 0, len/2, -bm * 0.3);
        ctx.lineTo(-len/2, -bm * 0.3);
        ctx.closePath();
        const hullGrad = ctx.createLinearGradient(0, -bm * 0.3, 0, dr);
        hullGrad.addColorStop(0, '#1a3050');
        hullGrad.addColorStop(0.5, '#0f2040');
        hullGrad.addColorStop(1, '#081525');
        ctx.fillStyle = hullGrad;
        ctx.fill();
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Hull keel / waterline
        ctx.beginPath();
        ctx.moveTo(-len/2, 0);
        ctx.lineTo(len * 0.3, 0);
        ctx.quadraticCurveTo(len/2, 0, len/2, -bm * 0.1);
        ctx.strokeStyle = 'rgba(0,240,255,0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Superstructure
        ctx.beginPath();
        ctx.rect(-len * 0.15, -bm * 0.3, len * 0.35, -bm * 0.55);
        ctx.fillStyle = '#0a2035';
        ctx.fill();
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Windows
        [-0.1, -0.02, 0.06].forEach(ox => {
            ctx.beginPath();
            ctx.rect((-len * 0.15) + (ox + 0.12) * len, -bm * 0.3 - bm * 0.3, len * 0.06, bm * 0.18);
            ctx.fillStyle = 'rgba(0,200,255,0.15)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,200,255,0.5)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        });

        // Radar mast
        ctx.beginPath();
        ctx.moveTo(0, -bm * 0.85);
        ctx.lineTo(0, -bm * 1.5);
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Radar dish
        ctx.beginPath();
        ctx.ellipse(0, -bm * 1.52, 12, 4, 0, 0, Math.PI * 2);
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Navigation lights
        ctx.beginPath();
        ctx.arc(len/2, -bm * 0.2, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,100,0,${0.5 + 0.5 * Math.sin(simTime * 3)})`;
        ctx.shadowColor = 'orange';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.arc(-len/2, -bm * 0.2, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,255,0,${0.5 + 0.5 * Math.sin(simTime * 3 + 1)})`;
        ctx.shadowColor = '#39ff14';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Thruster wake
        [-bm*0.12, bm*0.12].forEach(tz => {
            ctx.beginPath();
            for (let t = 0; t < 1; t += 0.08) {
                const wx = -len/2 - t * len * 0.5;
                const wy = tz + Math.sin(t * 8 + simTime * 3) * 3 * t;
                if (t === 0) ctx.moveTo(wx, wy);
                else ctx.lineTo(wx, wy);
            }
            ctx.strokeStyle = `rgba(100,200,255,${0.3 * (1 - 0.1)})`;
            ctx.lineWidth = 4;
            ctx.stroke();
        });

        ctx.restore();

        // Ship label
        ctx.font = '9px Orbitron, monospace';
        ctx.fillStyle = 'rgba(0,240,255,0.7)';
        ctx.textAlign = 'center';
        ctx.fillText('APEX-USV-01', cx, bobbY - len * 0.15 - 5);
    }

    // ── Spray Particles ───────────────────────────────────────────────────────
    const PARTICLES = Array.from({length: 40}, () => ({
        x: Math.random(), y: 0.55 + Math.random() * 0.1,
        vx: (Math.random() - 0.5) * 0.002,
        vy: -Math.random() * 0.003,
        life: Math.random(), maxLife: 0.3 + Math.random() * 0.4,
        r: 0.8 + Math.random() * 1.5
    }));

    function drawSpray(W, H, amp) {
        if (amp < 5) return;
        PARTICLES.forEach(p => {
            p.life += 0.016;
            if (p.life > p.maxLife) {
                p.x = 0.2 + Math.random() * 0.4;
                p.y = 0.55 + Math.random() * 0.08;
                p.life = 0;
                p.vx = (Math.random() - 0.5) * 0.003;
                p.vy = -Math.random() * 0.004 - 0.001;
            }
            p.x += p.vx;
            p.y += p.vy + 0.0005;

            const alpha = (1 - p.life / p.maxLife) * 0.4;
            ctx.beginPath();
            ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(180,230,255,${alpha})`;
            ctx.fill();
        });
    }

    // ── Sim HUD values ────────────────────────────────────────────────────────
    function updateSimHUD() {
        const pitchRMS = (waveHeight * 1.8 + Math.random() * 0.3).toFixed(1);
        const rollRMS  = (waveHeight * 2.8 + Math.random() * 0.5).toFixed(1);
        const resist   = (waveHeight * 12 + windSpeed * 0.4).toFixed(1);
        const speedLoss= (waveHeight * 1.2 + windSpeed * 0.03).toFixed(1);

        setElText('sim-pitch',      pitchRMS + '°');
        setElText('sim-roll',       rollRMS  + '°');
        setElText('sim-resist',     resist   + ' N');
        setElText('sim-speed-loss', speedLoss + ' kts');
        setElText('sim-wave-h',     waveHeight.toFixed(1) + ' m');
        setElText('sim-wave-t',     (waveHeight * 3.5 + 2).toFixed(1) + ' s');
        setElText('sim-wind',       windSpeed + ' kts NE');
        setElText('sim-ss',         'Beaufort ' + seaState);
    }

    function setElText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }

    // ── Controls ──────────────────────────────────────────────────────────────
    function bindControls() {
        const seaIn  = document.getElementById('sim-sea');
        const waveIn = document.getElementById('sim-wave');
        const windIn = document.getElementById('sim-wind-spd');
        const envSel = document.getElementById('sim-env-select');

        seaIn?.addEventListener('input', e => {
            seaState = parseInt(e.target.value);
            document.getElementById('sim-sea-val').textContent = seaState;
            // Auto-adjust wave height based on sea state
            const hMap = [0.1, 0.3, 0.8, 1.5, 2.5, 3.5, 5.0, 7.0];
            waveHeight = hMap[seaState] || 0.8;
            if (waveIn) { waveIn.value = waveHeight; document.getElementById('sim-wave-val').textContent = waveHeight.toFixed(1) + ' m'; }
        });

        waveIn?.addEventListener('input', e => {
            waveHeight = parseFloat(e.target.value);
            document.getElementById('sim-wave-val').textContent = waveHeight.toFixed(1) + ' m';
        });

        windIn?.addEventListener('input', e => {
            windSpeed = parseInt(e.target.value);
            document.getElementById('sim-wind-val').textContent = windSpeed + ' kts';
        });

        envSel?.addEventListener('change', e => {
            ConsoleLog?.info(`Ocean sim environment: ${e.target.options[e.target.selectedIndex].text}`);
            // Apply environment presets
            const presets = {
                0: { wave: 0.8, wind: 12, ss: 3 },
                1: { wave: 0.3, wind: 5,  ss: 1 },
                2: { wave: 1.2, wind: 18, ss: 4 },
                3: { wave: 3.5, wind: 35, ss: 6 },
                4: { wave: 0.4, wind: 8,  ss: 2 },
            };
            const p = presets[e.target.selectedIndex] || presets[0];
            waveHeight = p.wave; windSpeed = p.wind; seaState = p.ss;
            if (waveIn) waveIn.value = p.wave;
            if (seaIn)  seaIn.value  = p.ss;
            if (windIn) windIn.value = p.wind;
            setElText('sim-wave-val', p.wave.toFixed(1) + ' m');
            setElText('sim-sea-val',  p.ss.toString());
            setElText('sim-wind-val', p.wind + ' kts');
        });

        document.getElementById('sim-run-btn')?.addEventListener('click', () => {
            const btn = document.getElementById('sim-run-btn');
            btn.textContent = '⟳ Running simulation...';
            btn.disabled = true;
            ConsoleLog?.info('OpenFOAM ocean sim started. Grid: 12M cells. Sea state: Beaufort ' + seaState);
            let itr = 0;
            const iv = setInterval(() => {
                itr++;
                ConsoleLog?.info(`Ocean sim time step ${itr * 0.5}s — wave height: ${waveHeight.toFixed(1)}m — pitch: ${(waveHeight * 1.8).toFixed(1)}°`);
                if (itr >= 6) {
                    clearInterval(iv);
                    ConsoleLog?.ok('Ocean simulation complete. Results in /sim_results/ocean_run_' + Date.now() + '/');
                    btn.innerHTML = '<i data-lucide="play"></i> Run Full Ocean Simulation';
                    btn.disabled = false;
                    if (window.lucide) lucide.createIcons();
                }
            }, 700);
        });
    }

    // ── Module Init ────────────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initOcean, 300);
    });

    if (window.APEX) {
        APEX.modules['sim-tab'] = {
            onActivate() {
                if (!canvas) {
                    initOcean();
                } else {
                    canvas.width  = canvas.offsetWidth;
                    canvas.height = canvas.offsetHeight;
                    if (!running) startRender();
                }
            }
        };
    }

})();
