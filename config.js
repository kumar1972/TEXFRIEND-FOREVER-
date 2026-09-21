// ============================================================
// TEXFRIEND ERP
// config.js (SUPABASE CLOUD SYNC VERSION)
// ============================================================

"use strict";

// ============================================================
// INDEXED DB STORAGE SYSTEM (GLOBAL UNLIMITED STORAGE)
// ============================================================
window.StorageDB = {
    cache: {},
    db: null,
    isReady: false,
    async init() {
        return new Promise((resolve) => {
            const req = indexedDB.open("TexfriendStorageDB", 1);
            req.onupgradeneeded = (e) => {
                e.target.result.createObjectStore("store");
            };
            req.onsuccess = (e) => {
                this.db = e.target.result;
                const tx = this.db.transaction("store", "readonly");
                const cursorReq = tx.objectStore("store").openCursor();
                cursorReq.onsuccess = (e) => {
                    const cursor = e.target.result;
                    if (cursor) {
                        this.cache[cursor.key] = cursor.value;
                        cursor.continue();
                    } else {
                        this.migrateFromLocalStorage();
                        this.isReady = true;
                        resolve();
                    }
                };
                cursorReq.onerror = () => {
                    this.migrateFromLocalStorage();
                    this.isReady = true;
                    resolve();
                };
            };
            req.onerror = () => {
                this.migrateFromLocalStorage();
                this.isReady = true;
                resolve();
            };
        });
    },
    migrateFromLocalStorage() {
        let migrated = false;
        for (let i = 0; i < localStorage.length; i++) {
            let key = localStorage.key(i);
            if (this.cache[key] === undefined) {
                let val = localStorage.getItem(key);
                this.cache[key] = val;
                if(this.db) {
                    try { this.db.transaction("store", "readwrite").objectStore("store").put(val, key); } catch(e){}
                }
                migrated = true;
            }
        }
        if(migrated) console.log("✅ Migrated localStorage to IndexedDB successfully");
    },
    getItem(key) {
        if (this.cache[key] !== undefined) return this.cache[key];
        return localStorage.getItem(key);
    },
    setItem(key, value) {
        this.cache[key] = value;
        try { 
            localStorage.setItem(key, value); 
        } catch(e) {
            console.warn("localStorage quota exceeded, safely relying on IndexedDB");
        }
        if(this.db) {
            try { this.db.transaction("store", "readwrite").objectStore("store").put(value, key); } catch(e){}
        }
    },
    removeItem(key) {
        delete this.cache[key];
        try { localStorage.removeItem(key); } catch(e) {}
        if(this.db) {
            try { this.db.transaction("store", "readwrite").objectStore("store").delete(key); } catch(e){}
        }
    },
    clear() {
        this.cache = {};
        try { localStorage.clear(); } catch(e) {}
        if(this.db) {
            try { this.db.transaction("store", "readwrite").objectStore("store").clear(); } catch(e){}
        }
    }
};

window.StorageDB.init();

// ============================================================
// SUPABASE CONFIG
// ============================================================

window.TEXFRIEND_SUPABASE_CONFIG = {
    url: "https://tktkpenojgwgdakqsjqs.supabase.co", // <-- உங்கள் Supabase URL-ஐ இங்கே போடவும்
    key: "sb_publishable_FvnPcUtAr99fQq60iRamSQ_5xcaHBih"                   // <-- உங்கள் Supabase Anon Key-ஐ இங்கே போடவும்
};

// ============================================================
// GLOBAL VARIABLES
// ============================================================
window.supabaseClient = null;
window.supabaseConnected = false; 
window.cloudSyncReady = false;
window.supabaseInitializing = false;
window.supabaseInitStarted = false;
window.cloudSyncPromise = null;

window.isDemo = false;

window.localLoad = function (key, fallback = null) {
    try {
        const raw = window.StorageDB ? window.StorageDB.getItem(key) : localStorage.getItem(key);
        if (raw === null || raw === "") return fallback;
        try {
            const parsed = JSON.parse(raw);
            return parsed ?? fallback;
        } catch (error) {
            return raw;
        }
    } catch (error) {
        return fallback;
    }
};

window.localSave = function (key, data) {
    try {
        const strData = JSON.stringify(data);
        if (window.StorageDB) {
            window.StorageDB.setItem(key, strData);
        } else {
            localStorage.setItem(key, strData);
        }
        return true;
    } catch (error) {
        return false;
    }
};

window.erpCloudKeys = [
    "design_specs", "pre_design_numbers", "design_masters_data",
    "warping_issue_records", "weaving_master_data", "weaving_warp_trans",
    "weaving_weft_trans", "party_orders_data", "dyeing_issue_records",
    "dyeing_receive_records", "tex_master_weavers", "tex_master_warping_units",
    "washing_issue_records", "washing_receive_records", "tex_master_washing_units",
    "kora_stock_records", "kora_issue_records", "tex_master_mills",
    "tex_master_units", "tex_master_counts", "party_master_db",
    "user_permissions", "erp_system_users", "master_settings"
];

function getDirtyKey(key) { return "__texfriend_dirty__" + key; }
function getTimeKey(key) { return "__texfriend_local_time__" + key; }

function markLocalDirty(key) {
    try {
        if (window.StorageDB) {
            window.StorageDB.setItem(getDirtyKey(key), "1");
            window.StorageDB.setItem(getTimeKey(key), String(Date.now()));
        } else {
            localStorage.setItem(getDirtyKey(key), "1");
            localStorage.setItem(getTimeKey(key), String(Date.now()));
        }
    } catch (error) {}
}

function clearLocalDirty(key) {
    try {
        if (window.StorageDB) window.StorageDB.removeItem(getDirtyKey(key));
        else localStorage.removeItem(getDirtyKey(key));
    } catch (error) {}
}

function isLocalDirty(key) {
    try {
        const val = window.StorageDB ? window.StorageDB.getItem(getDirtyKey(key)) : localStorage.getItem(getDirtyKey(key));
        return (val === "1");
    } catch (error) {
        return false;
    }
}

window.offlineSyncQueue = window.offlineSyncQueue || {};

function queueOfflineData(key, data) {
    try {
        window.offlineSyncQueue[key] = data;
        const val = JSON.stringify(window.offlineSyncQueue);
        if (window.StorageDB) window.StorageDB.setItem("__texfriend_offline_queue__", val);
        else localStorage.setItem("__texfriend_offline_queue__", val);
    } catch (error) {}
}

function loadOfflineQueue() {
    try {
        const raw = window.StorageDB ? window.StorageDB.getItem("__texfriend_offline_queue__") : localStorage.getItem("__texfriend_offline_queue__");
        if (!raw) { window.offlineSyncQueue = {}; return; }
        window.offlineSyncQueue = JSON.parse(raw) || {};
    } catch (error) { window.offlineSyncQueue = {}; }
}

function removeQueueItem(key) {
    try {
        delete window.offlineSyncQueue[key];
        const val = JSON.stringify(window.offlineSyncQueue);
        if (window.StorageDB) window.StorageDB.setItem("__texfriend_offline_queue__", val);
        else localStorage.setItem("__texfriend_offline_queue__", val);
    } catch (error) {}
}
loadOfflineQueue();

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector('script[src="' + src + '"]');
        if (existing) { resolve(); return; }
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("SDK failed to load"));
        document.head.appendChild(script);
    });
}

// ============================================================
// INITIALIZE SUPABASE
// ============================================================
window.initializesupabase = async function (doFullSync) {
    if (doFullSync === undefined) doFullSync = true;
    if (window.supabaseInitStarted && window.cloudSyncPromise) return window.cloudSyncPromise;
    
    window.supabaseInitStarted = true;
    window.supabaseInitializing = true;

    window.cloudSyncPromise = (async function () {
        try {
            await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2");
            if (typeof supabase === "undefined") throw new Error("Supabase SDK unavailable");

            window.supabaseClient = supabase.createClient(
                window.TEXFRIEND_SUPABASE_CONFIG.url,
                window.TEXFRIEND_SUPABASE_CONFIG.key
            );

            window.supabaseConnected = true;
            window.cloudSyncReady = true;
            window.supabaseInitializing = false;

            if (navigator.onLine && doFullSync) {
                await syncAllCloudData();
                await syncOfflineQueue();
            }

            console.log("✅ TEXFRIEND Supabase Cloud initialized");
            return true;
        } catch (error) {
            console.error("❌ Supabase initialization failed:", error);
            window.supabaseConnected = false;
            window.cloudSyncReady = false;
            window.supabaseInitializing = false;
            return false;
        }
    })();
    return window.cloudSyncPromise;
};

// ============================================================
// CLOUD SAVE & LOAD (Supabase)
// ============================================================
async function cloudSave(key, data) {
    if (!window.supabaseClient || !navigator.onLine) return false;
    try {
        const { error } = await window.supabaseClient
            .from('erp_sync_data')
            .upsert({ id: key, json_data: data });

        if (error) throw error;
        clearLocalDirty(key);
        removeQueueItem(key);
        return true;
    } catch (error) {
        return false;
    }
}

async function cloudLoad(key, fallback = null) {
    if (!window.supabaseClient) return fallback;
    try {
        const { data } = await window.supabaseClient
            .from('erp_sync_data')
            .select('json_data')
            .eq('id', key)
            .single();

        if (data && data.json_data) return data.json_data;
        return fallback;
    } catch (error) {
        return fallback;
    }
}

window.supabaseSave = async function (key, data) {
    try {
        const localSaved = window.localSave(key, data);
        if (!localSaved) return false;
        markLocalDirty(key);
        queueOfflineData(key, data);

        if (navigator.onLine) {
            if (!window.supabaseClient) await initializesupabase(false);
            if (window.supabaseClient && window.supabaseConnected) {
                await cloudSave(key, data);
            }
        }
        return true;
    } catch (error) {
        return true;
    }
};

window.supabaseLoad = function (key, fallback = null) {
    return window.localLoad(key, fallback);
};

window.supabaseLoadCloud = async function (key, fallback = null) {
    try {
        if (!window.supabaseClient) await initializesupabase();
        if (window.supabaseClient && navigator.onLine) {
            const data = await cloudLoad(key, null);
            if (data !== null && data !== undefined) {
                window.localSave(key, data);
                return data;
            }
        }
    } catch (error) {}
    return window.localLoad(key, fallback);
};

async function syncAllCloudData() {
    if (!window.supabaseClient || !navigator.onLine) return false;
    for (const key of window.erpCloudKeys) {
        try {
            if (isLocalDirty(key)) continue;
            const cloudData = await cloudLoad(key, null);
            if (cloudData !== null && cloudData !== undefined) {
                window.localSave(key, cloudData);
            }
        } catch (error) {}
    }
    return true;
}

window.syncOfflineQueue = async function () {
    if (!navigator.onLine) return false;
    if (!window.supabaseClient) await initializesupabase();
    if (!window.supabaseClient) return false;

    const queue = Object.assign({}, window.offlineSyncQueue);
    for (const key of Object.keys(queue)) {
        await cloudSave(key, queue[key]);
    }
    return true;
};

// ============================================================
// NETWORK STATUS & DOM READY
// ============================================================
function updateNetworkStatus() {
    if (!document.body) return;
    const old = document.getElementById("texfriend-network-status");
    if (old) old.remove();

    const bar = document.createElement("div");
    bar.id = "texfriend-network-status";
    bar.innerHTML = window.supabaseConnected ? "🟢 ONLINE — Supabase Connected" : "📴 OFFLINE — Local Mode";
    bar.style.background = window.supabaseConnected ? "#10B981" : "#F59E0B";
    bar.style.color = "#FFFFFF";
    bar.style.position = "fixed";
    bar.style.left = "0"; bar.style.right = "0"; bar.style.top = "0";
    bar.style.padding = "6px"; bar.style.textAlign = "center";
    bar.style.fontSize = "11px"; bar.style.fontWeight = "700"; bar.style.zIndex = "999998";
    document.body.appendChild(bar);
    setTimeout(() => { if (bar && bar.parentNode) bar.remove(); }, 3000);
}

window.addEventListener("online", () => { updateNetworkStatus(); setTimeout(syncOfflineQueue, 800); });
window.addEventListener("offline", () => { window.supabaseConnected = false; updateNetworkStatus(); });

window.addEventListener("DOMContentLoaded", () => {
    updateNetworkStatus();
    setTimeout(() => { initializesupabase(); }, 300);
});
