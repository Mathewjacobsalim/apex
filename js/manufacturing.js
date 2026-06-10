/**
 * APEX-OS // manufacturing.js
 * Manufacturing Reliability Validation Logic
 */

'use strict';

(function ManufacturingModule() {
    function init() {
        const btnExport = document.getElementById('btn-export-dxf');
        if (btnExport) {
            btnExport.addEventListener('click', validateAndExport);
        }
    }

    async function validateAndExport() {
        const btn = document.getElementById('btn-export-dxf');
        const msgEl = document.getElementById('mfg-validation-msg');
        
        // Hide previous errors
        msgEl.style.display = 'none';

        // Check toggles
        const yieldOk = document.getElementById('chk-mfg-yield')?.checked;
        const tolOk = document.getElementById('chk-mfg-tol')?.checked;
        const wearOk = document.getElementById('chk-mfg-wear')?.checked;
        const sfOk = document.getElementById('chk-mfg-sf')?.checked;

        if (!yieldOk || !tolOk || !wearOk || !sfOk) {
            msgEl.textContent = 'ERROR: All reliability and QA checks must pass before exporting G-Code to production.';
            msgEl.style.color = 'var(--accent-red)';
            msgEl.style.display = 'block';
            if (window.ConsoleLog) window.ConsoleLog.error('Export blocked: Reliability checks failed.');
            return;
        }

        btn.disabled = true;
        btn.innerHTML = `<i data-lucide="loader"></i> Validating with Backend...`;
        
        try {
            const fileInput = document.getElementById('stl-upload-input');
            const file = fileInput && fileInput.files[0];
            
            if (!file) {
                throw new Error("Please upload an STL file first.");
            }
            
            const formData = new FormData();
            formData.append('file', file);
            
            const res = await fetch(`${window.APEX?.apiBase || ''}/api/mfg/slice`, { 
                method: 'POST',
                body: formData
            });
            
            const data = await res.json();
            
            if (data.status === 'success') {
                msgEl.textContent = 'SUCCESS: STL Sliced! Downloading G-Code...';
                msgEl.style.color = 'var(--accent-green)';
                msgEl.style.display = 'block';
                
                // Update console
                const consoleEl = document.getElementById('gcode-console');
                if (consoleEl) {
                    consoleEl.value = data.gcode;
                }
                
                // Download file
                const blob = new Blob([data.gcode], { type: 'text/plain' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = data.filename || 'sliced.gcode';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                if (window.ConsoleLog) window.ConsoleLog.ok('Manufacturing Reliability checks passed. G-Code exported.');
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            msgEl.textContent = `SERVER ERROR: ${err.message}`;
            msgEl.style.color = 'var(--accent-red)';
            msgEl.style.display = 'block';
            if (window.ConsoleLog) window.ConsoleLog.error(`Mfg Validation failed: ${err.message}`);
        } finally {
            // Restore button
            setTimeout(() => {
                btn.disabled = false;
                btn.innerHTML = `<i data-lucide="shield-check"></i> Validate & Export G-Code`;
            }, 2000);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
