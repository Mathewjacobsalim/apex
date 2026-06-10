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
            const res = await fetch(`${window.APEX?.apiBase || ''}/api/mfg/validate`, { method: 'POST' });
            const data = await res.json();
            
            if (data.status === 'success') {
                msgEl.textContent = 'SUCCESS: Validation complete. Exporting payload...';
                msgEl.style.color = 'var(--accent-green)';
                msgEl.style.display = 'block';
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
