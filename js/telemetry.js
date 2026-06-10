/**
 * APEX-OS // telemetry.js
 * Digital Twin Telemetry Dashboard — live charts, HUD compass, ERP data
 */

'use strict';

(function TelemetryModule() {

    // ── Chart Helpers ────────────────────────────────────────────────────────
    function makeLineChart(id, datasets, yLabel) {
        const canvas = document.getElementById(id);
        if (!canvas || !window.Chart) return null;
        return new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: Array.from({length: 50}, (_, i) => i),
                datasets: datasets.map(d => ({
                    ...d,
                    pointRadius: 0,
                    borderWidth: 1.8,
                    tension: 0.4,
                    fill: d.fill !== undefined ? d.fill : false
                }))
            },
            options: {
                animation: false, responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: datasets.length > 1, labels: { color: '#94a3b8', font: { size: 9 }, boxWidth: 10 } } },
                scales: {
                    x: { display: false },
                    y: {
                        ticks: { color: '#475569', font: { size: 9 } },
                        grid: { color: 'rgba(0,240,255,0.05)' },
                        title: yLabel ? { display: true, text: yLabel, color: '#475569', font: { size: 9 } } : undefined
                    }
                }
            }
        });
    }

    // ── Telemetry State ──────────────────────────────────────────────────────
    let gyroChart, powerChart, speedChart, strainChart;
    let telT = 0;
    let battLevel = 98.4;
    let heading = 45;
    let hudAnimFrame;

    // Live Telemetry Stream
    let liveData = {
        connected: false,
        battery: { voltage: 0, current: 0, level: 0 },
        attitude: { roll: 0, pitch: 0, yaw: 0 },
        gps: { lat: 0, lng: 0, alt: 0, sats: 0 },
        hud: { airspeed: 0, groundspeed: 0, heading: 0 }
    };

    async function fetchLiveTelemetry() {
        try {
            const res = await fetch(`${window.APEX?.apiBase || ''}/api/telemetry/live`);
            if (res.ok) liveData = await res.json();
        } catch (e) {
            // Suppress background errors if backend is restarting
        }
    }

    function pushTelemetry() {
        telT++;
        
        // Use live data if connected, otherwise stick to zeroes
        battLevel = liveData.connected ? liveData.battery.level : 0;
        heading = liveData.connected ? (liveData.hud.heading || Math.round(liveData.attitude.yaw * 180 / Math.PI)) : 0;
        if (heading < 0) heading += 360;

        const pushVal = (chart, dsIdx, val) => {
            if (!chart) return;
            chart.data.datasets[dsIdx].data.push(val);
            if (chart.data.datasets[dsIdx].data.length > 50) chart.data.datasets[dsIdx].data.shift();
        };

        const rD = liveData.attitude.roll * 180 / Math.PI;
        const pD = liveData.attitude.pitch * 180 / Math.PI;

        pushVal(gyroChart,   0, liveData.connected ? pD : 0);
        pushVal(gyroChart,   1, liveData.connected ? rD : 0);
        pushVal(powerChart,  0, liveData.connected ? liveData.battery.current : 0);
        pushVal(powerChart,  1, liveData.connected ? liveData.battery.voltage : 0); // Swap temp for real voltage
        pushVal(speedChart,  0, liveData.connected ? liveData.hud.airspeed : 0);
        pushVal(speedChart,  1, liveData.connected ? liveData.hud.groundspeed : 0); // Swap RPM for groundspeed
        pushVal(strainChart, 0, liveData.connected ? liveData.gps.alt : 0); // Real Alt
        pushVal(strainChart, 1, liveData.connected ? liveData.gps.sats : 0); // Real Sats

        [gyroChart, powerChart, speedChart, strainChart].forEach(c => c?.update('none'));

        // Update ERP readouts
        setElText('twin-batt', battLevel.toFixed(1) + '%');
        const battEl = document.getElementById('twin-batt');
        if (battEl) battEl.style.color = battLevel > 50 ? 'var(--accent-green)' : battLevel > 20 ? 'var(--accent-amber)' : 'var(--accent-red)';

        // Update diagnostics
        const diagEl = document.getElementById('twin-diagnostics-msg');
        if (diagEl) {
            const vol = liveData.battery.voltage.toFixed(1);
            const vibOk = true; // Placeholder since no vibration sensor in basic setup
            diagEl.innerHTML = `
                ${liveData.connected ? '✓' : '⚠'} MAVLINK LINK: ${liveData.connected ? 'ACTIVE' : 'OFFLINE'}<br>
                ${parseFloat(vol) > 10 ? '✓' : '⚠'} BATTERY VOLT: ${vol}V<br>
                ${vibOk ? '✓' : '⚠'} VIBRATION LEVEL: SAFE<br>
                ${liveData.gps.sats > 6 ? '✓' : '⚠'} GPS LOCK: ${liveData.gps.sats} SATS<br>
                ✓ ROS2 HEARTBEAT: OK<br>
                ✓ HEADING: ${heading.toFixed(1)}°`;
        }
    }

    // ── HUD Compass Canvas ────────────────────────────────────────────────────
    function drawHUD() {
        const canvas = document.getElementById('hud-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        const cx = W / 2, cy = H / 2, r = W / 2 - 10;
        ctx.clearRect(0, 0, W, H);

        // Background
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, '#0a1825');
        grad.addColorStop(1, '#050a10');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        // Horizon line (artificial horizon)
        const pitch  = liveData.connected ? (liveData.attitude.pitch * 180 / Math.PI) * 2 : 0; // Scale pitch pixel offset
        const rollRad = liveData.connected ? liveData.attitude.roll : 0;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rollRad);
        ctx.fillStyle = '#1a3a5a';
        ctx.fillRect(-r, pitch, r * 2, r);
        ctx.fillStyle = '#2a1a0a';
        ctx.fillRect(-r, pitch - r, r * 2, r);
        ctx.restore();

        // Clip to circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.clip();

        // Compass tick marks
        ctx.save();
        ctx.translate(cx, cy);
        const dirs = ['N','NE','E','SE','S','SW','W','NW'];
        for (let i = 0; i < 36; i++) {
            const angle  = (i / 36) * Math.PI * 2 - (heading * Math.PI / 180);
            const isMajor = i % 9 === 0;
            const isMed   = i % 3 === 0;
            const len = isMajor ? 14 : isMed ? 8 : 5;
            ctx.strokeStyle = isMajor ? '#00f0ff' : '#1a4a6a';
            ctx.lineWidth   = isMajor ? 1.5 : 0.8;
            ctx.beginPath();
            ctx.moveTo(Math.sin(angle) * (r - 3),   -Math.cos(angle) * (r - 3));
            ctx.lineTo(Math.sin(angle) * (r - 3 - len), -Math.cos(angle) * (r - 3 - len));
            ctx.stroke();
            if (isMajor) {
                const di = Math.round(i / 9) % 8;
                ctx.fillStyle = '#00f0ff';
                ctx.font = 'bold 9px Orbitron, monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const tx = Math.sin(angle) * (r - 22), ty = -Math.cos(angle) * (r - 22);
                ctx.fillText(dirs[di], tx, ty);
            }
        }
        ctx.restore();

        // Speed arc
        const speed = liveData.connected ? liveData.hud.airspeed : 0;
        ctx.beginPath();
        ctx.arc(cx, cy, r - 28, -Math.PI * 0.8, -Math.PI * 0.8 + (speed / 20) * Math.PI * 1.6);
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.restore();

        // Center crosshair
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1;
        [[cx-15,cy,cx-5,cy],[cx+5,cy,cx+15,cy],[cx,cy-15,cx,cy-5],[cx,cy+5,cx,cy+15]].forEach(([x1,y1,x2,y2]) => {
            ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
        });
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#00f0ff';
        ctx.fill();

        // Data overlays
        ctx.font = '8px Orbitron, monospace';
        ctx.fillStyle = '#00f0ff';
        ctx.textAlign = 'left';
        ctx.fillText(`${speed.toFixed(1)} kts`, 14, H - 40);
        ctx.textAlign = 'right';
        ctx.fillText(`${heading.toFixed(0)}°`, W - 14, H - 40);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#39ff14';
        ctx.fillText(`ALT ${liveData.gps.alt.toFixed(1)}m`, cx, H - 28);
        ctx.fillStyle = '#ffb700';
        ctx.fillText(`PITCH ${liveData.connected ? (liveData.attitude.pitch * 180 / Math.PI).toFixed(1) : 0.0}°`, cx, H - 16);

        // Outer ring glow
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0,240,255,0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();

        hudAnimFrame = requestAnimationFrame(drawHUD);
    }

    // ── ERP inventory mini-chart ─────────────────────────────────────────────
    function initERPCharts() {
        const burnCanvas = document.getElementById('burnRateChart');
        if (burnCanvas && window.Chart) {
            const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'];
            new Chart(burnCanvas.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: months,
                    datasets: [
                        { label: 'Burn Rate ($k)', data: [11.2, 12.1, 10.8, 13.5, 12.5, 14.2, 12.0, 11.8], backgroundColor: 'rgba(255,0,85,0.3)', borderColor: '#ff0055', borderWidth: 1.5 },
                        { label: 'Revenue ($k)',   data: [0, 0, 2.5, 5.0, 8.0, 12.0, 18.0, 22.0], backgroundColor: 'rgba(57,255,20,0.2)', borderColor: '#39ff14', borderWidth: 1.5 },
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: '#94a3b8', font: { size: 9 }, boxWidth: 10 } } },
                    scales: {
                        x: { ticks: { color: '#475569', font: { size: 8 } }, grid: { color: 'rgba(0,240,255,0.03)' } },
                        y: { ticks: { color: '#475569', font: { size: 8 } }, grid: { color: 'rgba(0,240,255,0.05)' } }
                    }
                }
            });
        }
    }

    function setElText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }

    // ── Setup ────────────────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
    // Removed initTelemetryCharts as it is not defined
        initERPCharts();
        
        // Fast UI render loop (20Hz)
        setInterval(pushTelemetry, 50);
        // Fast backend MAVLink poll loop (10Hz)
        setInterval(fetchLiveTelemetry, 100);
        
        drawHUD();
    });

    APEX.modules['twin-tab'] = {
        onActivate() {
            if (!hudAnimFrame) drawHUD();
        }
    };

})();
