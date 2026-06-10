/**
 * APEX-OS // sap.js
 * SAP ERP S/4HANA Sync Logic
 */

'use strict';

(function SAPModule() {
    let isConnected = false;

    function init() {
        document.getElementById('btn-sap-connect')?.addEventListener('click', handleConnect);
        document.getElementById('btn-sap-sync-bom')?.addEventListener('click', handleSyncBom);
        document.getElementById('btn-sap-create-pr')?.addEventListener('click', handleCreatePR);
    }

    function logToConsole(msg, isError=false) {
        const consoleEl = document.getElementById('sap-log-console');
        if (!consoleEl) return;
        
        const timestamp = new Date().toISOString().split('T')[1].slice(0,8);
        const line = document.createElement('div');
        line.textContent = `[${timestamp}] ${msg}`;
        if (isError) line.style.color = 'var(--accent-red)';
        
        consoleEl.appendChild(line);
        consoleEl.scrollTop = consoleEl.scrollHeight;
    }

    async function handleConnect() {
        const btn = document.getElementById('btn-sap-connect');
        const badge = document.getElementById('sap-status-badge');
        
        if (isConnected) {
            isConnected = false;
            btn.innerHTML = `<i data-lucide="link"></i> Connect to SAP Gateway`;
            badge.textContent = 'DISCONNECTED';
            badge.className = 'badge badge-amber';
            document.getElementById('btn-sap-sync-bom').disabled = true;
            document.getElementById('btn-sap-create-pr').disabled = true;
            logToConsole('Disconnected from SAP Gateway.');
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Authenticating...';
        logToConsole('Initiating connection to SAP S/4HANA API...');

        try {
            const res = await fetch(`${window.APEX?.apiBase || ''}/api/sap/connect`, { method: 'POST' });
            const data = await res.json();
            
            if (data.status === 'success') {
                isConnected = true;
                btn.innerHTML = `<i data-lucide="unlink"></i> Disconnect`;
                btn.disabled = false;
                
                badge.textContent = 'CONNECTED';
                badge.className = 'badge badge-green';
                
                document.getElementById('btn-sap-sync-bom').disabled = false;
                document.getElementById('btn-sap-create-pr').disabled = false;
                
                logToConsole(data.message);
                if (window.ConsoleLog) window.ConsoleLog.ok(`SAP ERP Link established: ${data.sap_version}`);
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            btn.disabled = false;
            btn.innerHTML = `<i data-lucide="link"></i> Connect to SAP Gateway`;
            badge.textContent = 'ERROR';
            badge.className = 'badge badge-red';
            logToConsole(`Error: ${err.message}`, true);
        }
    }

    async function handleSyncBom() {
        const btn = document.getElementById('btn-sap-sync-bom');
        btn.disabled = true;
        logToConsole('Exporting BOM data to SAP MM Module...');

        try {
            const res = await fetch(`${window.APEX?.apiBase || ''}/api/sap/sync_bom`, { method: 'POST' });
            const data = await res.json();
            
            if (data.status === 'success') {
                logToConsole(`BOM Synced! SAP Doc: ${data.sap_doc_id}`);
                if (window.ConsoleLog) window.ConsoleLog.info(`SAP Update: Created Material Master ${data.sap_doc_id}`);
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            logToConsole(`Sync failed: ${err.message}`, true);
        } finally {
            btn.disabled = false;
        }
    }

    async function handleCreatePR() {
        const btn = document.getElementById('btn-sap-create-pr');
        btn.disabled = true;
        logToConsole('Generating Purchase Requisition (PR)...');

        try {
            const res = await fetch(`${window.APEX?.apiBase || ''}/api/sap/create_pr`, { method: 'POST' });
            const data = await res.json();
            
            if (data.status === 'success') {
                logToConsole(`PR Generated! SAP PR#: ${data.pr_number}`);
                if (window.ConsoleLog) window.ConsoleLog.info(`SAP Update: Purchase Requisition ${data.pr_number} submitted for approval.`);
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            logToConsole(`PR creation failed: ${err.message}`, true);
        } finally {
            btn.disabled = false;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
