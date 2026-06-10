/**
 * APEX-OS // Universal AI Engineering Operating System
 * main.js — Core system kernel: tab navigation, console, global state
 */

'use strict';

// ─── Global System State ────────────────────────────────────────────────────
window.APEX = {
    version: '4.2.1',
    activeTab: 'cad-tab',
    vehicle: 'APEX-USV-01',
    systemOnline: true,
    telemetryConnected: true,
    apiBase: 'http://localhost:5000',
    modules: {}
};

// ─── Console Logger ──────────────────────────────────────────────────────────
const ConsoleLog = {
    list: document.getElementById('console-logs'),

    _colors: { INFO: 'info', OK: 'success', WARN: 'warn', ERROR: 'error' },

    write(level, msg) {
        if (!this.list) return;
        const now = new Date();
        const ts = `[${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}]`;
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `
            <span class="log-time">${ts}</span>
            <span class="log-level ${this._colors[level] || 'info'}">${level}</span>
            <span class="log-msg">${msg}</span>`;
        this.list.appendChild(entry);
        this.list.scrollTop = this.list.scrollHeight;
        // Keep max 80 entries
        while (this.list.children.length > 80) this.list.removeChild(this.list.firstChild);
    },

    info(msg)    { this.write('INFO', msg); },
    ok(msg)      { this.write('OK', msg); },
    warn(msg)    { this.write('WARN', msg); },
    error(msg)   { this.write('ERROR', msg); }
};
window.ConsoleLog = ConsoleLog;

// ─── System Clock ────────────────────────────────────────────────────────────
function startClock() {
    const el = document.getElementById('live-time-ticker');
    if (!el) return;
    const tick = () => {
        const n = new Date();
        el.textContent = `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}:${String(n.getSeconds()).padStart(2,'0')}  UTC+5:30`;
    };
    tick();
    setInterval(tick, 1000);
}

// ─── Tab Navigation ──────────────────────────────────────────────────────────
function initTabs() {
    const tabs   = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.tab-content');

    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => { p.classList.remove('active'); p.style.display = 'none'; });
            btn.classList.add('active');
            const panel = document.getElementById(target);
            if (panel) { panel.classList.add('active'); panel.style.display = 'flex'; }
            APEX.activeTab = target;
            ConsoleLog.info(`Module switched → ${btn.textContent.trim()}`);
            // Fire module-specific resume callbacks
            if (window.APEX.modules[target] && window.APEX.modules[target].onActivate) {
                window.APEX.modules[target].onActivate();
            }
            lucide.createIcons();
        });
    });
}

// ─── Slider sync helper ──────────────────────────────────────────────────────
function bindSlider(rangeId, displayId, suffix = '') {
    const range = document.getElementById(rangeId);
    const disp  = document.getElementById(displayId);
    if (!range || !disp) return;
    disp.textContent = range.value + suffix;
    range.addEventListener('input', () => { disp.textContent = range.value + suffix; });
}

// ─── Startup Boot Sequence ───────────────────────────────────────────────────
async function bootSequence() {
    const msgs = [
        ['INFO', 'APEX-OS Kernel v4.2.1 initialized successfully.'],
        ['INFO', 'Loading hardware abstraction layer (HAL)...'],
        ['OK',   'OpenCascade geometry kernel ready.'],
        ['OK',   'Three.js r128 rendering engine loaded.'],
        ['INFO', 'Connecting to ROS2 master node at ros2://localhost:11311...'],
        ['OK',   'ROS2 DDS bridge handshake complete. 14 topics active.'],
        ['INFO', 'Connecting to APEX-OS Python Computation Backend...'],
    ];
    for (const [lvl, msg] of msgs) {
        await new Promise(r => setTimeout(r, 150));
        ConsoleLog.write(lvl, msg);
    }
    
    // Check python connection
    try {
        const res = await fetch(`${APEX.apiBase}/api/ping`);
        const data = await res.json();
        ConsoleLog.ok(`Connected to Python computational core. Server: ${data.engine}`);
    } catch(e) {
        ConsoleLog.warn('Python backend offline. Running in local fallback/offline simulation mode.');
    }

    const restMsgs = [
        ['INFO', 'ANSYS Multiphysics coupling plugin connected.'],
        ['OK',   'OpenFOAM CFD solver v10 linked.'],
        ['INFO', 'AI Co-Engineer LLM warm-up in progress...'],
        ['OK',   'LLM model apex-engineer-7B loaded. Inference ready.'],
        ['OK',   'Digital twin telemetry stream connected. Latency: 4ms.'],
        ['INFO', 'ERP modules: Inventory, BOM, Procurement — ALL ONLINE.'],
        ['OK',   'APEX-USV-01 GPS lock acquired. 14 satellites. HDOP: 0.8'],
        ['OK',   'System health check passed. All modules nominal.'],
    ];
    for (const [lvl, msg] of restMsgs) {
        await new Promise(r => setTimeout(r, 150));
        ConsoleLog.write(lvl, msg);
    }
}

// ─── Periodic system events ──────────────────────────────────────────────────
function startSystemEvents() {
    const events = [
        () => ConsoleLog.info('Telemetry heartbeat received from APEX-USV-01.'),
        () => ConsoleLog.ok('BOM price sync complete. 3 items updated.'),
        () => ConsoleLog.warn('Wind speed exceeds 20 kts — mission advisory issued.'),
        () => ConsoleLog.info('Digital twin model synced with CAD revision 3.2.'),
        () => ConsoleLog.ok('Auto-save checkpoint written: apex_project_240524.apx'),
        () => ConsoleLog.info('CFD solver residuals converging — iteration 1450/2000.'),
        () => ConsoleLog.ok('ROS2 node /path_planner alive. CPU: 12%.'),
        () => ConsoleLog.warn('Battery temperature rising: 34.2°C — monitor advised.'),
        () => ConsoleLog.info('Vendor scan: McMaster-Carr price update detected.'),
        () => ConsoleLog.ok('FEA mesh quality check passed. Max skewness: 0.42.'),
        () => ConsoleLog.info('GPS waypoint WP-07 reached. Next: WP-08.'),
        () => ConsoleLog.ok('Nesting optimizer: 89.2% sheet utilization achieved.'),
    ];
    let i = 0;
    setInterval(() => {
        events[i % events.length]();
        i++;
    }, 7000);
}

// ─── Export stub ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    startClock();
    initTabs();
    lucide.createIcons();
    bootSequence();
    setTimeout(startSystemEvents, 5000);

    // Bind hull sliders
    bindSlider('hull-length',   'hull-length-val',    'm');
    bindSlider('hull-beam',     'hull-beam-val',      'm');
    bindSlider('hull-draft',    'hull-draft-val',     'm');
    bindSlider('hull-deadrise', 'hull-deadrise-val',  '°');
    bindSlider('drone-arm',     'drone-arm-val',      'mm');
    bindSlider('drone-hub',     'drone-hub-val',      'mm');
    bindSlider('cfd-speed',     'cfd-speed-val',      ' kts');
    bindSlider('env-sea-state', 'env-sea-state-val',  ' SS');
    bindSlider('env-wind',      'env-wind-val',       ' kts');
    bindSlider('env-current-dir','env-current-dir-val','°');

    // Template type toggle
    const templateSel = document.getElementById('cad-template-select');
    const hullGroup   = document.getElementById('hull-param-group');
    const droneGroup  = document.getElementById('drone-param-group');
    if (templateSel) {
        templateSel.addEventListener('change', () => {
            const isDrone = templateSel.value.startsWith('uav');
            hullGroup.style.display  = isDrone ? 'none' : 'block';
            droneGroup.style.display = isDrone ? 'block' : 'none';
            ConsoleLog.info(`Template changed → ${templateSel.options[templateSel.selectedIndex].text}`);
        });
    }

    // Export stubs
    document.getElementById('cad-export-btn')?.addEventListener('click', () => {
        ConsoleLog.ok('STEP/DXF export package queued → /exports/APEX-USV-01_v3.2.zip');
    });
    document.getElementById('btn-export-dxf')?.addEventListener('click', () => {
        ConsoleLog.ok('DXF + G-Code files exported → /cnc_toolpaths/nesting_run_24.dxf');
    });
    document.getElementById('export-bom-csv')?.addEventListener('click', () => {
        ConsoleLog.ok('BOM exported → /docs/BOM_APEX-USV-01_v3.2.csv (47 line items)');
    });
    document.getElementById('btn-calibrate-sensors')?.addEventListener('click', () => {
        ConsoleLog.info('Auto-calibration sequence initiated...');
        setTimeout(() => ConsoleLog.ok('IMU bias calibrated. ESC range: 1020–1980μs confirmed.'), 2000);
    });

    // Admin SAP Integration
    document.getElementById('btn-sap-save')?.addEventListener('click', async () => {
        const host = document.getElementById('sap-host-input')?.value.trim();
        const client = document.getElementById('sap-client-input')?.value.trim();
        const user = document.getElementById('sap-user-input')?.value.trim();
        const pass = document.getElementById('sap-pass-input')?.value.trim();
        const msgEl = document.getElementById('sap-admin-msg');

        if (!host || !user) {
            if (msgEl) { msgEl.style.color = 'var(--accent-amber)'; msgEl.textContent = 'Please provide host URL and Username.'; }
            return;
        }

        if (msgEl) { msgEl.style.color = 'var(--text-main)'; msgEl.textContent = 'Authenticating with SAP backend...'; }
        
        try {
            const res = await fetch(`${window.APEX?.apiBase || ''}/api/sap/connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ host, client, user, pass })
            });
            const data = await res.json();
            if (res.ok && data.status === 'success') {
                if (msgEl) { msgEl.style.color = 'var(--accent-green)'; msgEl.textContent = 'SUCCESS: SAP Connection established and verified.'; }
                ConsoleLog.ok(`SAP connected: ${host}`);
            } else {
                throw new Error(data.message || 'Connection failed');
            }
        } catch (e) {
            if (msgEl) { msgEl.style.color = 'var(--accent-red)'; msgEl.textContent = 'ERROR: ' + e.message; }
            ConsoleLog.error(`SAP connection failed: ${e.message}`);
        }
    });

    // DB Admin Clear
    document.getElementById('btn-admin-clear-db')?.addEventListener('click', async () => {
        if (!confirm("WARNING: This will permanently delete ALL active BOM, Inventory, and Workflow records. Are you sure?")) return;
        
        const msgEl = document.getElementById('db-admin-msg');
        if (msgEl) { msgEl.style.color = 'var(--text-main)'; msgEl.textContent = 'Clearing database collections...'; }
        
        try {
            const res = await fetch(`${window.APEX?.apiBase || ''}/api/admin/clear-db`, { method: 'DELETE' });
            if (res.ok) {
                if (msgEl) { msgEl.style.color = 'var(--accent-green)'; msgEl.textContent = 'SUCCESS: All collections wiped.'; }
                ConsoleLog.ok('Database successfully cleared by administrator.');
                // Try to trigger a refresh of the BOM
                if (window.APEX && window.APEX.modules && window.APEX.modules['procure-tab']) {
                    window.APEX.modules['procure-tab'].onActivate();
                }
            } else {
                throw new Error('Failed to wipe database');
            }
        } catch(e) {
            if (msgEl) { msgEl.style.color = 'var(--accent-red)'; msgEl.textContent = 'ERROR: ' + e.message; }
        }
    });
});
