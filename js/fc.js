/**
 * APEX-OS // fc.js
 * Flight Controller (ArduPilot/MAVLink) Integration Logic
 */

'use strict';

(function FCModule() {
    let isConnected = false;

    function init() {
        const btnConnect = document.getElementById('btn-fc-connect');
        if (btnConnect) {
            btnConnect.addEventListener('click', handleConnect);
        }

        // Bind calibration buttons
        document.getElementById('btn-cal-accel')?.addEventListener('click', () => runCalibration('accel', 'Accelerometer'));
        document.getElementById('btn-cal-compass')?.addEventListener('click', () => runCalibration('compass', 'Compass/Mag'));
        document.getElementById('btn-cal-radio')?.addEventListener('click', () => runCalibration('radio', 'Radio RC'));
    }

    async function handleConnect() {
        const btn = document.getElementById('btn-fc-connect');
        const portSelect = document.getElementById('fc-port-select');
        const statusBadge = document.getElementById('fc-status-badge');
        
        if (isConnected) {
            // Disconnect logic
            isConnected = false;
            btn.textContent = 'Connect';
            btn.className = 'btn-primary';
            portSelect.disabled = false;
            
            statusBadge.textContent = 'DISCONNECTED';
            statusBadge.className = 'badge badge-amber';
            
            toggleCalibrationButtons(false);
            if (window.ConsoleLog) window.ConsoleLog.warn('Disconnected from Flight Controller.');
            return;
        }

        const port = portSelect.value;
        btn.textContent = 'Connecting...';
        btn.disabled = true;
        
        if (window.ConsoleLog) window.ConsoleLog.info(`Establishing MAVLink connection on ${port}...`);

        try {
            const res = await fetch(`${window.APEX?.apiBase || ''}/api/fc/connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ port })
            });
            
            if (!res.ok) throw new Error('Backend FC service unavailable');
            const data = await res.json();
            
            if (data.status === 'success') {
                isConnected = true;
                btn.textContent = 'Disconnect';
                btn.className = 'btn-secondary';
                btn.disabled = false;
                portSelect.disabled = true;
                
                statusBadge.textContent = 'CONNECTED';
                statusBadge.className = 'badge badge-green';
                
                toggleCalibrationButtons(true);
                
                if (window.ConsoleLog) {
                    window.ConsoleLog.ok(`MAVLink Heartbeat detected! ${data.fc_type} [SysID:${data.sysid}]`);
                }
            }
        } catch (err) {
            btn.textContent = 'Connect';
            btn.disabled = false;
            statusBadge.textContent = 'ERROR';
            statusBadge.className = 'badge badge-red';
            if (window.ConsoleLog) window.ConsoleLog.error(`FC Connection failed: ${err.message}`);
        }
    }

    function toggleCalibrationButtons(enable) {
        const btns = ['btn-cal-accel', 'btn-cal-compass', 'btn-cal-radio'];
        const statuses = ['status-cal-accel', 'status-cal-compass', 'status-cal-radio'];
        
        btns.forEach(id => {
            const b = document.getElementById(id);
            if (b) b.disabled = !enable;
        });
        
        statuses.forEach(id => {
            const s = document.getElementById(id);
            if (s) {
                s.textContent = enable ? 'Ready' : 'Pending Connection...';
                s.style.color = enable ? 'var(--accent-cyan)' : 'var(--text-muted)';
            }
        });
    }

    async function runCalibration(sensorId, sensorName) {
        const btn = document.getElementById(`btn-cal-${sensorId}`);
        const progBar = document.getElementById(`prog-cal-${sensorId}`);
        const statusText = document.getElementById(`status-cal-${sensorId}`);
        
        if (!btn || !progBar || !statusText) return;

        btn.disabled = true;
        statusText.textContent = 'Initializing...';
        statusText.style.color = 'var(--text-primary)';
        progBar.style.width = '10%';
        progBar.style.background = 'var(--accent-amber)';

        if (window.ConsoleLog) window.ConsoleLog.info(`Requesting ${sensorName} calibration sequence...`);

        try {
            const res = await fetch(`${window.APEX?.apiBase || ''}/api/fc/calibrate/${sensorId}`, {
                method: 'POST'
            });
            const data = await res.json();
            
            if (data.status === 'success') {
                statusText.textContent = 'Calibrating... Do not move vehicle.';
                
                // Simulate progress bar based on estimated duration
                let progress = 10;
                const durationMs = (data.estimated_duration || 3) * 1000;
                const intervalMs = 200;
                const steps = durationMs / intervalMs;
                const increment = 90 / steps;
                
                const interval = setInterval(() => {
                    progress += increment;
                    if (progress >= 100) {
                        clearInterval(interval);
                        progress = 100;
                        
                        // Finish calibration
                        progBar.style.width = '100%';
                        progBar.style.background = 'var(--accent-green)';
                        statusText.textContent = 'Calibration Successful';
                        statusText.style.color = 'var(--accent-green)';
                        btn.disabled = false;
                        
                        if (window.ConsoleLog) window.ConsoleLog.ok(`${sensorName} calibration complete and saved to EEPROM.`);
                    } else {
                        progBar.style.width = `${progress}%`;
                    }
                }, intervalMs);

            } else {
                throw new Error(data.message || 'Calibration rejected by FC');
            }
        } catch (err) {
            btn.disabled = false;
            progBar.style.width = '100%';
            progBar.style.background = 'var(--accent-red)';
            statusText.textContent = `Error: ${err.message}`;
            statusText.style.color = 'var(--accent-red)';
            if (window.ConsoleLog) window.ConsoleLog.error(`${sensorName} Calibration failed: ${err.message}`);
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
