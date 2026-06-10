/**
 * APEX-OS // ai.js
 * AI Co-Engineer + Draft Vision module
 */

'use strict';

(function AIModule() {

    // ── AI Response Database ─────────────────────────────────────────────────
    const AI_RESPONSES = {
        'optimize-hull': {
            title: 'Hull Hydrodynamic Optimization',
            steps: [
                '→ Analyzed current hull form. L/B ratio: 2.92 (target: 3.5–4.5 for low drag)',
                '→ Deadrise angle 15° is acceptable for coastal operations.',
                '→ RECOMMENDATION: Increase hull length from 3.5m → 4.2m and reduce beam to 1.05m.',
                '→ Predicted drag reduction: 18.4% at 12 knots.',
                '→ Applying Savitsky semi-planing hull equations...',
                '→ New Froude Number Fr = 0.68 — transition to semi-planing mode confirmed.',
                '✓ Updated parameters applied to CAD model. Re-run CFD for validation.'
            ],
            params: { 'hull-length': 4.2, 'hull-beam': 1.05, 'hull-deadrise': 18 }
        },
        'bracket-gen': {
            title: 'Navigation Radar Bracket Generation',
            steps: [
                '→ Detecting available mast mounting points in assembly...',
                '→ Radar unit load: 2.4 kg. Wind drag @ 30kts: 45N lateral.',
                '→ Generating cantilever bracket in Marine Aluminum 6061-T6...',
                '→ Computing FEA boundary conditions: fixed base, distributed load.',
                '→ Topology optimization running (SIMP method)...',
                '→ Bracket mass reduced 34% via material void regions.',
                '→ Safety factor at max load: 3.8 ✓ — geometry APPROVED.',
                '✓ Bracket STL and DXF added to BOM. Part ID: BRKT-NAV-001.'
            ]
        },
        'weight-saving': {
            title: 'Lightweight Arm Structure Analysis',
            steps: [
                '→ Current arm geometry: 380mm × 30mm × 20mm solid CFRP.',
                '→ Bending moment at arm root: 12.4 N·m (hover + 1.5g gust).',
                '→ Switching to hollow tube profile (OD 25mm, wall 1.5mm)...',
                '→ Hollow CFRP tube bending stiffness: EI = 142 N·m² ✓',
                '→ Mass reduction: 18g per arm → 72g total (8.4% system mass saving).',
                '→ Checking torsional stability... resonance at 182 Hz — above motor frequency ✓',
                '✓ Hollow arm geometry generated. Export to DXF ready.'
            ]
        }
    };

    const GENERIC_RESPONSES = [
        (q) => `→ Query received: "${q}"\n→ Analyzing engineering context...\n→ This appears to be a ${detectContext(q)} design challenge.\n→ Recommended approach: parametric design with FEA validation.\n✓ APEX-AI: I suggest starting with a topology-optimized base geometry and running CFD at your target operating speed.`,
        (q) => `→ Processing: "${q}"\n→ Material database search: 847 entries scanned.\n→ For this application, Marine-grade Aluminum 5083-H111 offers the best strength-to-weight ratio.\n→ Corrosion resistance in saltwater: Excellent (ISO 12944 C5-M rated).\n✓ APEX-AI: Proceed with Al-5083. Recommend anodized surface treatment + sealant coat.`,
        (q) => `→ AI Co-Engineer analyzing: "${q}"\n→ Cross-referencing against engineering standards library...\n→ ISO 12215 (Small Craft - Hull Construction) applicable.\n→ Structural safety factor must be ≥ 2.5 for primary structure.\n→ Estimated weight penalty for compliant structure: +4.2%.\n✓ APEX-AI: Design is feasible. Recommend weld-ready geometry generation next.`,
        (q) => `→ Received: "${q}"\n→ Running manufacturability check...\n→ Detected 2 undercut features — require 5-axis CNC or EDM.\n→ Simplified geometry option available (saves ₹12,400 in machining).\n→ DFM score: 7.2/10 (Good)\n✓ APEX-AI: Minor geometry changes can achieve 9.1/10 DFM score with <2% performance loss.`
    ];

    function detectContext(q) {
        const lower = q.toLowerCase();
        if (lower.includes('hull') || lower.includes('usv')) return 'marine hull';
        if (lower.includes('drone') || lower.includes('uav') || lower.includes('arm')) return 'UAV frame';
        if (lower.includes('bracket') || lower.includes('mount')) return 'structural bracket';
        if (lower.includes('weld')) return 'welded assembly';
        return 'autonomous systems';
    }

    // ── Chat Engine ──────────────────────────────────────────────────────────
    const msgList = document.getElementById('ai-messages');
    let respIdx   = 0;

    function addMessage(role, html) {
        const div = document.createElement('div');
        div.className = `ai-message ${role}`;
        div.innerHTML = html;
        msgList?.appendChild(div);
        if (msgList) msgList.scrollTop = msgList.scrollHeight;
    }

    function typewriterResponse(lines) {
        let lineIdx = 0;
        const div = document.createElement('div');
        div.className = 'ai-message assistant';
        div.innerHTML = '<strong>APEX-AI:</strong> <span class="ai-typing"></span>';
        msgList?.appendChild(div);
        if (msgList) msgList.scrollTop = msgList.scrollHeight;
        const span = div.querySelector('.ai-typing');

        function typeLine() {
            if (lineIdx >= lines.length) return;
            setTimeout(() => {
                span.innerHTML += (lineIdx > 0 ? '<br>' : '') + lines[lineIdx];
                lineIdx++;
                if (msgList) msgList.scrollTop = msgList.scrollHeight;
                typeLine();
            }, 280);
        }
        typeLine();
    }

    async function handleCommand(cmd) {
        addMessage('user', `<strong>USER:</strong> [Tactical command: ${cmd}]`);
        ConsoleLog.info(`AI Co-Engineer: Processing command "${cmd}"...`);

        try {
            const res = await fetch(`${APEX.apiBase}/api/ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cmd: cmd })
            });
            if (!res.ok) throw new Error('API Error');
            const data = await res.json();
            typewriterResponse([`<strong style="color:var(--accent-cyan)">[${data.title}]</strong>`, ...data.steps]);
            if (data.params) {
                Object.entries(data.params).forEach(([id, val]) => {
                    const el = document.getElementById(id);
                    if (el) {
                        el.value = val;
                        el.dispatchEvent(new Event('input'));
                    }
                });
            }
        } catch(e) {
            const resp = AI_RESPONSES[cmd];
            if (!resp) return;
            typewriterResponse([`<strong style="color:var(--accent-cyan)">[${resp.title}]</strong>`, ...resp.steps]);
            if (resp.params) {
                Object.entries(resp.params).forEach(([id, val]) => {
                    const el = document.getElementById(id);
                    if (el) {
                        el.value = val;
                        el.dispatchEvent(new Event('input'));
                    }
                });
            }
        }
    }

    async function handleFreeText(text) {
        if (!text.trim()) return;
        addMessage('user', `<strong>USER:</strong> ${text}`);
        ConsoleLog.info(`AI query submitted: "${text.substring(0, 60)}..."`);

        try {
            const res = await fetch(`${APEX.apiBase}/api/ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: text })
            });
            if (!res.ok) throw new Error('API Error');
            const data = await res.json();
            typewriterResponse([`<strong style="color:var(--accent-cyan)">[${data.title}]</strong>`, ...data.steps]);
        } catch(e) {
            const fn  = GENERIC_RESPONSES[respIdx % GENERIC_RESPONSES.length];
            const ans = fn(text);
            typewriterResponse(ans.split('\n'));
            respIdx++;
        }
    }

    // ── Draft Vision ─────────────────────────────────────────────────────────
    const SVG_BLUEPRINTS = {
        usv: `
            <rect x="20" y="100" width="360" height="80" rx="5" fill="none" stroke="#00f0ff" stroke-width="1.5" stroke-dasharray="none"/>
            <path d="M20 140 Q200 80 380 140" fill="none" stroke="#00f0ff" stroke-width="1.5"/>
            <path d="M20 180 L380 180" fill="none" stroke="#39ff14" stroke-width="1" stroke-dasharray="6,3"/>
            <line x1="200" y1="100" x2="200" y2="180" stroke="#00f0ff" stroke-width="0.5" stroke-dasharray="3,3"/>
            <line x1="20" y1="140" x2="380" y2="140" stroke="#475569" stroke-width="0.5" stroke-dasharray="4,4"/>
            <circle cx="340" cy="130" r="12" fill="none" stroke="#00f0ff" stroke-width="1.5"/>
            <circle cx="60"  cy="130" r="12" fill="none" stroke="#00f0ff" stroke-width="1.5"/>
            <text x="200" y="220" text-anchor="middle" fill="#39ff14" font-size="10" font-family="Orbitron">APEX-USV-01 // HULL PROFILE</text>
            <text x="200" y="75"  text-anchor="middle" fill="#00f0ff" font-size="8"  font-family="Orbitron">L = 3500mm</text>
            <line x1="20" y1="70" x2="380" y2="70" stroke="#00f0ff" stroke-width="0.5" marker-end="url(#arrow)"/>
            <text x="20"  y="95"  fill="#475569" font-size="8" font-family="monospace">↕ 300mm draft</text>
            <rect x="150" y="105" width="100" height="40" rx="2" fill="none" stroke="#ffb700" stroke-width="1" stroke-dasharray="4,2"/>
            <text x="200" y="129" text-anchor="middle" fill="#ffb700" font-size="8" font-family="monospace">CONTROL ROOM</text>
            <text x="20" y="270" fill="#475569" font-size="7" font-family="monospace">SCALE 1:20 | MATERIAL: AL-5083 | REV: 3.2 | DATE: 2024-05-24</text>`,
        drone: `
            <circle cx="200" cy="150" r="40" fill="none" stroke="#00f0ff" stroke-width="1.5"/>
            <line x1="200" y1="150" x2="60"  y2="50"  stroke="#00f0ff" stroke-width="2"/>
            <line x1="200" y1="150" x2="340" y2="50"  stroke="#00f0ff" stroke-width="2"/>
            <line x1="200" y1="150" x2="60"  y2="250" stroke="#00f0ff" stroke-width="2"/>
            <line x1="200" y1="150" x2="340" y2="250" stroke="#00f0ff" stroke-width="2"/>
            <circle cx="60"  cy="50"  r="18" fill="none" stroke="#39ff14" stroke-width="1.5"/>
            <circle cx="340" cy="50"  r="18" fill="none" stroke="#39ff14" stroke-width="1.5"/>
            <circle cx="60"  cy="250" r="18" fill="none" stroke="#39ff14" stroke-width="1.5"/>
            <circle cx="340" cy="250" r="18" fill="none" stroke="#39ff14" stroke-width="1.5"/>
            <text x="200" y="155" text-anchor="middle" fill="#00f0ff" font-size="9" font-family="Orbitron">Ø150mm</text>
            <text x="200" y="290" text-anchor="middle" fill="#39ff14" font-size="10" font-family="Orbitron">UAV FRAME // TOP VIEW</text>
            <text x="200" y="15"  text-anchor="middle" fill="#00f0ff" font-size="8"  font-family="monospace">ARM SPAN: 760mm</text>
            <text x="20" y="270" fill="#475569" font-size="7" font-family="monospace">SCALE 1:5 | MATERIAL: CFRP | REV: 2.1 | DATE: 2024-05-24</text>`
    };

    async function activateDraftVision(type = 'usv') {
        const zone    = document.getElementById('drag-drop-zone');
        const spinner = document.getElementById('draft-spinner');
        const ph      = document.getElementById('draft-placeholder');
        const svg     = document.getElementById('draft-vector-svg');
        if (!svg) return;

        zone?.style?.setProperty?.('display', 'none');
        if (zone) zone.style.display = 'none';
        if (ph)   ph.style.display   = 'none';
        if (spinner) { spinner.style.display = 'flex'; }
        if (svg) svg.style.display = 'none';

        ConsoleLog.info('AI Draft Vision: Edge detection and geometry extraction in progress...');

        try {
            const res = await fetch(`${APEX.apiBase}/api/ai/draft-vision`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: type })
            });
            if (!res.ok) throw new Error('API Error');
            const data = await res.json();
            if (spinner) spinner.style.display = 'none';
            svg.innerHTML = data.svg;
            svg.style.display = 'block';
            ConsoleLog.ok('Draft Vision: Blueprint vectorized via Python core. DXF ready for export.');
        } catch(e) {
            setTimeout(() => {
                if (spinner) spinner.style.display = 'none';
                svg.innerHTML = SVG_BLUEPRINTS[type] || SVG_BLUEPRINTS['usv'];
                svg.style.display = 'block';
                ConsoleLog.ok('Draft Vision: Blueprint vectorized (local fallback). DXF ready for export.');
            }, 1000);
        }
    }

    // ── Bind Upload Zone ─────────────────────────────────────────────────────
    function bindDraftVision() {
        const zone = document.getElementById('drag-drop-zone');
        if (!zone) return;
        zone.addEventListener('click', () => {
            const tpl = document.getElementById('cad-template-select')?.value || 'usv-monohull';
            activateDraftVision(tpl.startsWith('uav') ? 'drone' : 'usv');
            addMessage('assistant', '<strong>APEX-AI:</strong> Image received. Running AI geometry extraction pipeline. Orthographic projection will be generated in ~2s.');
        });
        zone.addEventListener('dragover', e => { e.preventDefault(); zone.style.borderColor = 'var(--accent-cyan)'; });
        zone.addEventListener('dragleave', () => { zone.style.borderColor = ''; });
        zone.addEventListener('drop', e => {
            e.preventDefault();
            const tpl = document.getElementById('cad-template-select')?.value || 'usv-monohull';
            activateDraftVision(tpl.startsWith('uav') ? 'drone' : 'usv');
        });
    }

    // ── Component Image Scan ─────────────────────────────────────────────────
    const COMPONENT_LIBRARY = [
        { name: 'BlueRobotics T200 Thruster', confidence: '97%', details: 'Marine brushless thruster. Max thrust: 5.1kgf @ 16V. IP68 rated. Weight: 344g. $169 USD. Lead: 3–5 days.' },
        { name: 'Pixhawk 6X Flight Controller', confidence: '95%', details: 'Triple redundant IMU. STM32H753. CAN/UART/I2C. Supported by PX4 v1.14+. Weight: 59g. $249 USD.' },
        { name: 'Here3+ RTK GPS Module', confidence: '92%', details: 'Multi-constellation RTK GPS. 2cm accuracy. CAN bus. Weight: 48g. Operating: -40°C to +85°C.' },
        { name: 'Carbon Fiber Sheet 4mm', confidence: '88%', details: 'T700 3K Twill weave. 400×500mm. Density: 1.6 g/cm³. Tensile: 600 MPa. Vendor: DragonPlate.' },
        { name: 'Tattu 22000mAh 6S LiPo', confidence: '99%', details: '22.2V nominal. 15C continuous discharge. Weight: 1.85kg. Dims: 195×76×63mm. IP54 spray resistant.' },
    ];
    let compIdx = 0;

    function bindComponentScan() {
        const zone = document.getElementById('img-component-drag');
        const result = document.getElementById('scan-result-card');
        if (!zone || !result) return;

        zone.addEventListener('click', async () => {
            zone.style.borderColor = 'var(--accent-cyan)';
            ConsoleLog.info('Visual component recognition: AI model scanning image...');
            try {
                const res = await fetch(`${APEX.apiBase}/api/ai/scan-component`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ index: compIdx })
                });
                if (!res.ok) throw new Error('API Error');
                const data = await res.json();
                compIdx++;
                document.getElementById('scan-result-name').textContent = data.name;
                document.getElementById('scan-result-confidence').textContent = data.confidence;
                document.getElementById('scan-result-details').textContent = data.details;
                result.style.display = 'block';
                zone.style.borderColor = '';
                ConsoleLog.ok(`Component ID: ${data.name} — Confidence: ${data.confidence} (Python scan)`);
            } catch(e) {
                setTimeout(() => {
                    const comp = COMPONENT_LIBRARY[compIdx % COMPONENT_LIBRARY.length];
                    compIdx++;
                    document.getElementById('scan-result-name').textContent = comp.name;
                    document.getElementById('scan-result-confidence').textContent = comp.confidence + ' Match';
                    document.getElementById('scan-result-details').textContent = comp.details;
                    result.style.display = 'block';
                    zone.style.borderColor = '';
                    ConsoleLog.ok(`Component ID: ${comp.name} — Confidence: ${comp.confidence} (local fallback)`);
                }, 1000);
            }
        });
    }

    // ── Vendor URL Scan ──────────────────────────────────────────────────────
    const VENDOR_DB = {
        'mcmaster': { name: 'M8×1.25 Stainless Steel Hex Bolt', price: '$0.48', vendor: 'McMaster-Carr', lead: '1–2 days' },
        'digikey':  { name: 'STM32H753VIT6 MCU', price: '$14.20', vendor: 'DigiKey', lead: '3 days' },
        'mouser':   { name: 'CAN Bus Transceiver MCP2551', price: '$1.85', vendor: 'Mouser Electronics', lead: '5 days' },
        'robu':     { name: 'T-Motor MN5008 KV340', price: '₹14,500', vendor: 'Robu.in', lead: '2–4 days' },
        'default':  { name: 'Engineering Component (Scanned)', price: 'Auto-detected', vendor: 'Smart Vendor Connector', lead: 'Calculating...' }
    };

    function bindVendorScan() {
        document.getElementById('btn-scan-product')?.addEventListener('click', async () => {
            const url = document.getElementById('vendor-url-input')?.value || '';
            ConsoleLog.info(`Smart Vendor Connector: Scanning URL → ${url}`);
            try {
                const res = await fetch(`${APEX.apiBase}/api/ai/scan-url`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: url })
                });
                if (!res.ok) throw new Error('API Error');
                const data = await res.json();
                ConsoleLog.ok(`Product scanned: "${data.name}" @ ${data.price_str} from ${data.vendor} (Python engine)`);
                addBOMRowFromScannedData(data.name, data.vendor, data.price_str, data.lead);
            } catch(e) {
                setTimeout(() => {
                    const key = Object.keys(VENDOR_DB).find(k => url.toLowerCase().includes(k)) || 'default';
                    const item = VENDOR_DB[key];
                    ConsoleLog.ok(`Product scanned: "${item.name}" @ ${item.price} from ${item.vendor} (local fallback)`);
                    addBOMRowFromScan(item);
                }, 1000);
            }
        });
    }

    async function addBOMRowFromScannedData(name, vendor, priceStr, lead) {
        const rawPrice = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
        try {
            const res = await fetch(`${APEX.apiBase}/api/bom`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name,
                    spec: 'Auto-detected',
                    vendor: vendor,
                    qty: 1,
                    unit_cost: rawPrice,
                    weight: 0.05,
                    lead_time: lead,
                    status: 'IN STOCK'
                })
            });
            if (!res.ok) throw new Error("API Error");
            ConsoleLog.ok(`Item "${name}" successfully saved to MongoDB database!`);
            populateBOM();
        } catch(e) {
            const tbody = document.getElementById('bom-table-body');
            if (!tbody) return;
            const qty = 1;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${name}</td>
                <td>Auto-detected</td>
                <td>${vendor}</td>
                <td>${qty}</td>
                <td>${priceStr}</td>
                <td style="color:var(--accent-cyan)">${priceStr}</td>
                <td>—</td>
                <td>${lead}</td>
                <td><span class="badge badge-cyan">SCANNED</span></td>`;
            tbody.appendChild(tr);
            updateBOMTotals();
        }
    }

    async function addBOMRowFromScan(item) {
        const isUSD = item.price.startsWith('$');
        const rawPrice = parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0;
        const inrPrice = isUSD ? rawPrice * 83 : rawPrice;
        
        try {
            const res = await fetch(`${APEX.apiBase}/api/bom`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: item.name,
                    spec: 'Auto-detected',
                    vendor: item.vendor,
                    qty: 1,
                    unit_cost: inrPrice,
                    weight: 0.1,
                    lead_time: item.lead,
                    status: 'IN STOCK'
                })
            });
            if (res.ok) {
                ConsoleLog.ok(`Item "${item.name}" saved to database.`);
                populateBOM();
                return;
            }
        } catch(e) {}
        
        const tbody = document.getElementById('bom-table-body');
        if (!tbody) return;
        const qty = 1;
        const priceStr = '₹' + inrPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 });
        const totalStr = '₹' + (inrPrice * qty).toLocaleString('en-IN', { maximumFractionDigits: 2 });

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.name}</td>
            <td>Auto-detected</td>
            <td>${item.vendor}</td>
            <td>${qty}</td>
            <td>${priceStr}</td>
            <td style="color:var(--accent-cyan)">${totalStr}</td>
            <td>—</td>
            <td>${item.lead}</td>
            <td><span class="badge badge-cyan">SCANNED</span></td>`;
        tbody.appendChild(tr);
        updateBOMTotals();
    }

    function updateBOMTotals() {
        const rows  = document.querySelectorAll('#bom-table-body tr');
        let total   = 0, mass = 0;
        rows.forEach(r => {
            const cells = r.querySelectorAll('td');
            if (cells.length >= 6) total += parseFloat(cells[5].textContent.replace(/[^0-9.]/g, '')) || 0;
            if (cells.length >= 7) mass  += parseFloat(cells[6].textContent)  || 0;
        });
        setElText('bom-total-cost', '₹' + total.toLocaleString('en-IN', { minimumFractionDigits: 2 }));
        setElText('bom-total-weight', mass.toFixed(1) + ' kg');
    }

    function setElText(id, v) {
        const el = document.getElementById(id);
        if (el) el.textContent = v;
    }

    // ── PCB Canvas ───────────────────────────────────────────────────────────
    let customPCBImage = null;

    function initPCBUploader() {
        const pcbUpload = document.getElementById('pcb-upload-input');
        if (pcbUpload) {
            pcbUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = function(event) {
                    const img = new Image();
                    img.onload = function() {
                        customPCBImage = img;
                        drawPCB();
                        if (window.ConsoleLog) window.ConsoleLog.ok(`Loaded custom schematic: ${file.name}`);
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            });
        }
    }

    function drawPCB() {
        const canvas = document.getElementById('pcb-canvas');
        if (!canvas) return;
        const container = document.getElementById('pcb-container');
        canvas.width  = container?.clientWidth  || 600;
        canvas.height = container?.clientHeight || 400;
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;

        ctx.fillStyle = '#0a1020';
        ctx.fillRect(0, 0, W, H);

        if (customPCBImage) {
            // Draw uploaded schematic scaled to fit
            const scale = Math.min(W / customPCBImage.width, H / customPCBImage.height);
            const dw = customPCBImage.width * scale;
            const dh = customPCBImage.height * scale;
            const dx = (W - dw) / 2;
            const dy = (H - dh) / 2;
            ctx.drawImage(customPCBImage, dx, dy, dw, dh);
            
            // Add a slight dark overlay to make overlay nodes readable
            ctx.fillStyle = 'rgba(10, 16, 32, 0.4)';
            ctx.fillRect(0, 0, W, H);
        }

        // Grid lines
        ctx.strokeStyle = 'rgba(0,240,255,0.04)';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        const nodes = [
            { x: W*0.5,  y: H*0.45, label: 'Pixhawk 6X\nFlight Controller', w: 120, h: 70, color: '#00f0ff', type: 'mcu' },
            { x: W*0.15, y: H*0.2,  label: 'GPS\nHere3+',    w: 60, h: 45, color: '#39ff14', type: 'sensor' },
            { x: W*0.85, y: H*0.2,  label: 'IMU\nICM-42688', w: 60, h: 45, color: '#39ff14', type: 'sensor' },
            { x: W*0.15, y: H*0.75, label: 'ESC 1\n60A BL',  w: 60, h: 45, color: '#ffb700', type: 'esc' },
            { x: W*0.38, y: H*0.75, label: 'ESC 2\n60A BL',  w: 60, h: 45, color: '#ffb700', type: 'esc' },
            { x: W*0.62, y: H*0.75, label: 'ESC 3\n60A BL',  w: 60, h: 45, color: '#ffb700', type: 'esc' },
            { x: W*0.85, y: H*0.75, label: 'ESC 4\n60A BL',  w: 60, h: 45, color: '#ffb700', type: 'esc' },
            { x: W*0.5,  y: H*0.12, label: 'Telemetry\nSiK Radio', w: 70, h: 40, color: '#ff0055', type: 'radio' },
            { x: W*0.15, y: H*0.47, label: 'Power\nDist Board',  w: 60, h: 50, color: '#9ab0c0', type: 'power' },
            { x: W*0.85, y: H*0.47, label: 'CAN Bus\nAdapter',   w: 60, h: 45, color: '#a855f7', type: 'bus' },
        ];

        const connections = [
            [0, 1], [0, 2], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8], [0, 9],
            [8, 3], [8, 4], [8, 5], [8, 6], [9, 0]
        ];

        // Draw wires
        connections.forEach(([a, b]) => {
            const na = nodes[a], nb = nodes[b];
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(0,240,255,0.25)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 3]);
            ctx.moveTo(na.x, na.y);
            const mx = (na.x + nb.x) / 2;
            ctx.bezierCurveTo(mx, na.y, mx, nb.y, nb.x, nb.y);
            ctx.stroke();
            ctx.setLineDash([]);
        });

        // Draw nodes
        nodes.forEach(n => {
            ctx.fillStyle = 'rgba(7,10,14,0.9)';
            ctx.strokeStyle = n.color;
            ctx.lineWidth = 1.5;
            const rx = n.x - n.w/2, ry = n.y - n.h/2;
            roundRect(ctx, rx, ry, n.w, n.h, 4);
            ctx.fill();
            ctx.stroke();

            // Glow
            ctx.shadowColor = n.color;
            ctx.shadowBlur  = 8;
            ctx.strokeStyle = n.color;
            ctx.lineWidth = 0.5;
            roundRect(ctx, rx, ry, n.w, n.h, 4);
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Label
            ctx.fillStyle = n.color;
            ctx.font = '9px Orbitron, monospace';
            ctx.textAlign = 'center';
            const lines = n.label.split('\n');
            lines.forEach((line, li) => {
                ctx.fillText(line, n.x, n.y - 4 + li * 13);
            });
        });

        // Animate a signal dot
        animatePCBSignal(ctx, nodes, connections, W, H);
    }

    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    }

    let pcbAnimT = 0;
    function animatePCBSignal(ctx, nodes, connections, W, H) {
        pcbAnimT = 0;
        const animConn = connections[Math.floor(Math.random() * connections.length)];
        const na = nodes[animConn[0]], nb = nodes[animConn[1]];

        function step() {
            pcbAnimT += 0.015;
            if (pcbAnimT > 1) { setTimeout(() => drawPCB(), 1500); return; }
            const t  = pcbAnimT;
            const mx = (na.x + nb.x) / 2;
            // Bezier point
            const bx = (1-t)*(1-t)*na.x + 2*(1-t)*t*mx + t*t*nb.x;
            const by = (1-t)*(1-t)*na.y + 2*(1-t)*t*((na.y+nb.y)/2 - 20) + t*t*nb.y;

            ctx.beginPath();
            ctx.arc(bx, by, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#00f0ff';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.shadowBlur = 0;

            requestAnimationFrame(step);
        }
        step();
    }

    // ── Module Setup ─────────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initPCBUploader, 400);
        setTimeout(drawPCB, 500);

        // AI chat
        document.getElementById('ai-send-btn')?.addEventListener('click', () => {
            const input = document.getElementById('ai-chat-input');
            if (input?.value.trim()) {
                handleFreeText(input.value);
                input.value = '';
            }
        });
        document.getElementById('ai-chat-input')?.addEventListener('keydown', e => {
            if (e.key === 'Enter') document.getElementById('ai-send-btn')?.click();
        });

        document.querySelectorAll('.ai-prompt-chip').forEach(chip => {
            chip.addEventListener('click', () => handleCommand(chip.dataset.cmd));
        });

        bindDraftVision();
        bindComponentScan();
        bindVendorScan();
        populateBOM();

        // Manual BOM Add
        document.getElementById('btn-manual-add-bom')?.addEventListener('click', async () => {
            const nameEl = document.getElementById('bom-add-name');
            const vendorEl = document.getElementById('bom-add-vendor');
            const priceEl = document.getElementById('bom-add-price');
            const qtyEl = document.getElementById('bom-add-qty');

            const name = nameEl.value.trim();
            const vendor = vendorEl.value.trim() || 'Unknown Vendor';
            const price = parseFloat(priceEl.value) || 0;
            const qty = parseInt(qtyEl.value) || 1;

            if (!name) {
                if (window.ConsoleLog) window.ConsoleLog.warn("BOM Add: Part Name is required.");
                return;
            }

            try {
                const res = await fetch(`${window.APEX?.apiBase || ''}/api/bom`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: name,
                        spec: 'Manual Entry',
                        vendor: vendor,
                        qty: qty,
                        unit_cost: price,
                        weight: 0.1,
                        lead_time: 'Unknown',
                        status: 'IN STOCK'
                    })
                });
                if (res.ok) {
                    if (window.ConsoleLog) window.ConsoleLog.ok(`Manual item "${name}" added to BOM.`);
                    nameEl.value = '';
                    vendorEl.value = '';
                    priceEl.value = '';
                    qtyEl.value = '1';
                    populateBOM();
                } else {
                    throw new Error("API Error");
                }
            } catch (e) {
                if (window.ConsoleLog) window.ConsoleLog.error("Failed to add manual BOM item.");
            }
        });

        // PCB draw after brief delay
        setTimeout(drawPCB, 600);
    });

    APEX.modules['ai-tab'] = {
        onActivate() { setTimeout(drawPCB, 100); }
    };
    APEX.modules['embedded-tab'] = {
        onActivate() { setTimeout(drawPCB, 100); }
    };

    // ── Default BOM ──────────────────────────────────────────────────────────
    window.deleteBOMRow = async (id) => {
        try {
            const res = await fetch(`${APEX.apiBase}/api/bom/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                ConsoleLog.ok(`BOM item ID ${id} deleted from MongoDB database.`);
                populateBOM();
            }
        } catch(e) {
            ConsoleLog.warn("Failed to delete item from database.");
        }
    };

    async function populateBOM() {
        const tbody = document.getElementById('bom-table-body');
        if (!tbody) return;
        
        try {
            const res = await fetch(`${APEX.apiBase}/api/bom`);
            if (!res.ok) throw new Error("API Error");
            const items = await res.json();
            tbody.innerHTML = '';
            
            const statusMap = { 'IN STOCK': 'green', 'LOW STOCK': 'amber', 'ON ORDER': 'cyan', 'OUT OF STOCK': 'red' };
            items.forEach((item) => {
                const tr = document.createElement('tr');
                const badge = statusMap[item.status] || 'cyan';
                tr.innerHTML = `
                    <td>${item.name}</td>
                    <td style="color:var(--text-secondary);font-size:11px">${item.spec || ''}</td>
                    <td>${item.vendor}</td>
                    <td>${item.qty}</td>
                    <td>₹${item.unit_cost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                    <td style="color:var(--accent-cyan)">₹${item.total_cost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                    <td>${item.weight} kg</td>
                    <td>${item.lead_time}</td>
                    <td>
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span class="badge badge-${badge}">${item.status}</span>
                            <button onclick="deleteBOMRow(${item.id})" style="background:none; border:none; color:var(--accent-red); cursor:pointer; font-size:12px; margin-left:6px;">✕</button>
                        </div>
                    </td>`;
                tbody.appendChild(tr);
            });
            updateBOMTotals();
        } catch(e) {
            tbody.innerHTML = '';
            const items = [
                ['Hull Structure', 'Marine AL 5083-H111', 'Local Fabricator', 1, 4200, 4200, 18.5, '5 days', 'IN STOCK'],
                ['T200 Thruster x2', 'Brushless 350W each', 'BlueRobotics', 2, 12650, 25300, 0.688, '4 days', 'IN STOCK'],
                ['Pixhawk 6X', 'STM32H753 FC', 'Holybro / Robu.in', 1, 18700, 18700, 0.059, '2 days', 'LOW STOCK'],
                ['Here3+ GPS', 'RTK Multi-Constellation', 'CubePilot', 1, 8500, 8500, 0.048, '5 days', 'IN STOCK'],
                ['LiPo 22000mAh 6S', '22.2V 15C', 'Tattu', 2, 14800, 29600, 1.85, '3 days', 'IN STOCK'],
                ['CFRP Sheet 4mm', 'T700 3K Twill 500×400', 'DragonPlate', 4, 3200, 12800, 0.52, '7 days', 'IN STOCK'],
                ['ESC 60A BLHeli32', 'CAN bus enabled', 'T-Motor', 2, 3800, 7600, 0.045, '2 days', 'IN STOCK'],
                ['4G LTE Telemetry', 'Silvus StreamCaster', 'Silvus Tech', 1, 22000, 22000, 0.21, '14 days', 'ON ORDER'],
            ];
            const statusMap = { 'IN STOCK': 'green', 'LOW STOCK': 'amber', 'ON ORDER': 'cyan', 'OUT OF STOCK': 'red' };
            items.forEach(([name, spec, vendor, qty, unit, total, wt, lead, status]) => {
                const tr = document.createElement('tr');
                const badge = statusMap[status] || 'cyan';
                tr.innerHTML = `
                    <td>${name}</td>
                    <td style="color:var(--text-secondary);font-size:11px">${spec}</td>
                    <td>${vendor}</td>
                    <td>${qty}</td>
                    <td>₹${unit.toLocaleString()}</td>
                    <td style="color:var(--accent-cyan)">₹${total.toLocaleString()}</td>
                    <td>${wt} kg</td>
                    <td>${lead}</td>
                    <td><span class="badge badge-${badge}">${status}</span></td>`;
                tbody.appendChild(tr);
            });
            updateBOMTotals();
        }
    }

})();
