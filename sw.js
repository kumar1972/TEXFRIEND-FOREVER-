// ============================================================
// TEXFRIEND ERP
// sw.js
// PWA + OFFLINE ALL PAGES + LOCAL-FIRST + CLOUD READY
// ============================================================
//
// ✅ All ERP HTML pages pre-cached
// ✅ CSS / JS / Images runtime cached
// ✅ Offline navigation
// ✅ Online Network First
// ✅ Offline Cache Fallback
// ✅ Supabase API NOT cached
// ✅ Old TEXFRIEND caches cleaned
// ✅ Service Worker update support
// ============================================================

"use strict";


// ============================================================
// VERSION
// ============================================================

const CACHE_VERSION = "v8"; // Updated version to trigger cache refresh

const CACHE_NAME =
    "texfriend-erp-" + CACHE_VERSION;

const APP_SHELL_CACHE =
    "texfriend-shell-" + CACHE_VERSION;


// ============================================================
// ALL ERP FILES (INCLUDES ALL DASHBOARD ICONS)
// ============================================================

const APP_SHELL = [

    "./",
    "./index.html",

    // -------------------------
    // CORE
    // -------------------------

    "./config.js",
    "./translator.js",
    "./manifest.json",
    "./style.css",

    // -------------------------
    // ICONS (MAIN)
    // -------------------------

    "./icon-192.png",
    "./icon-512.png",

    // -------------------------
    // DASHBOARD & MENU ICONS
    // -------------------------
    
    "./icon/design_master.png",
    "./icon/Party_Orders.png",
    "./icon/warp_entry.png",
    "./icon/weft_entry.png",
    "./icon/kora_yarn.png",
    "./icon/dyeing_issue.png",
    "./icon/dyeing_receive.png",
    "./icon/warping.png",
    "./icon/weaving.png",
    "./icon/weaving_receive.png",
    "./icon/washing.png",
    "./icon/Despatch.png",
    "./icon/report.png",
    "./icon/yarn_calc.png",
    "./icon/design_sheet_print.png",
    "./icon/invoice.png",
    "./icon/design_list.png",
    "./icon/process_matrix.png",

    // -------------------------
    // DASHBOARD HTML
    // -------------------------

    "./dashboard.html",

    // -------------------------
    // DESIGN
    // -------------------------

    "./design_list.html",
    "./design_master.html",
    "./design_sheet_print.html",

    // -------------------------
    // ORDERS
    // -------------------------

    "./Party_Orders.html",

    // -------------------------
    // KORA / YARN
    // -------------------------

    "./kora_yarn.html",
    "./yarn_calc.html",

    // -------------------------
    // PROCESS
    // -------------------------

    "./process_matrix.html",

    // -------------------------
    // WARP / WEFT
    // -------------------------

    "./warp_entry.html",
    "./warping.html",
    "./weft_entry.html",

    // -------------------------
    // WEAVING
    // -------------------------

    "./weaving.html",
    "./weaving_received.html",
    "./weave_3d.html",
    "./denting_editor.html", // Added missing file from dashboard

    // -------------------------
    // DYEING
    // -------------------------

    "./dyeing_issue.html",
    "./dyeing_receive.html",

    // -------------------------
    // WASHING
    // -------------------------

    "./washing.html",

    // -------------------------
    // DESPATCH
    // -------------------------

    "./Despatch.html",

    // -------------------------
    // INVOICE
    // -------------------------

    "./invoice.html",

    // -------------------------
    // REPORT
    // -------------------------

    "./report.html",

    // -------------------------
    // SETTINGS
    // -------------------------

    "./settings.html"

];


// ============================================================
// INSTALL
// ============================================================

self.addEventListener(
    "install",
    event => {

        console.log(
            "📦 TEXFRIEND ERP SW installing:",
            CACHE_NAME
        );

        event.waitUntil(
            caches.open(
                APP_SHELL_CACHE
            )
            .then(
                async cache => {
                    console.log(
                        "📥 Caching all ERP pages..."
                    );

                    for (
                        const file of APP_SHELL
                    ) {
                        try {
                            const response =
                                await fetch(
                                    file,
                                    {
                                        cache:
                                            "no-cache"
                                    }
                                );

                            if (
                                response.ok
                            ) {
                                await cache.put(
                                    file,
                                    response
                                );
                                console.log(
                                    "✅ Cached:",
                                    file
                                );
                            } else {
                                console.warn(
                                    "⚠️ Not cached:",
                                    file,
                                    response.status
                                );
                            }

                        } catch (error) {
                            console.warn(
                                "⚠️ Cache failed:",
                                file,
                                error
                            );
                        }
                    }
                }
            )
            .then(
                () => {
                    console.log(
                        "✅ TEXFRIEND ERP pages cached"
                    );
                    return self.skipWaiting();
                }
            )
            .catch(
                error => {
                    console.error(
                        "❌ Service Worker install error:",
                        error
                    );
                }
            )
        );
    }
);


// ============================================================
// ACTIVATE
// ============================================================

self.addEventListener(
    "activate",
    event => {

        console.log(
            "⚡ TEXFRIEND ERP SW activated:",
            CACHE_NAME
        );

        event.waitUntil(
            caches.keys()
            .then(
                cacheNames => {
                    return Promise.all(
                        cacheNames.map(
                            cacheName => {
                                if (
                                    cacheName.startsWith(
                                        "texfriend-"
                                    ) &&
                                    cacheName !==
                                        CACHE_NAME &&
                                    cacheName !==
                                        APP_SHELL_CACHE
                                ) {
                                    console.log(
                                        "🗑️ Removing old cache:",
                                        cacheName
                                    );
                                    return caches.delete(
                                        cacheName
                                    );
                                }
                                return Promise.resolve();
                            }
                        )
                    );
                }
            )
            .then(
                () => {
                    return self.clients.claim();
                }
            )
        );
    }
);


// ============================================================
// SAME ORIGIN CHECK
// ============================================================

function isSameOrigin(request) {
    try {
        return (
            new URL(
                request.url
            ).origin ===
            self.location.origin
        );
    } catch (error) {
        return false;
    }
}


// ============================================================
// CLOUD / API CHECK (UPDATED FOR SUPABASE)
// ============================================================

function isCloudRequest(request) {
    const url =
        request.url.toLowerCase();

    return (
        url.includes("/api/") ||
        // Supabase API endpoints
        url.includes("supabase.co") ||
        url.includes("supabase.in")
    );
}


// ============================================================
// NAVIGATION
// ============================================================

async function handleNavigation(
    request
) {
    try {
        const networkResponse =
            await fetch(
                request
            );

        if (
            networkResponse &&
            networkResponse.ok
        ) {
            const cache =
                await caches.open(
                    CACHE_NAME
                );

            await cache.put(
                request,
                networkResponse.clone()
            );

            return networkResponse;
        }
    } catch (error) {
        console.log(
            "📴 Network unavailable:",
            request.url
        );
    }

    const cached =
        await caches.match(
            request
        );

    if (cached) {
        return cached;
    }

    const shellCached =
        await caches.match(
            request,
            {
                cacheName:
                    APP_SHELL_CACHE
            }
        );

    if (shellCached) {
        return shellCached;
    }

    // 🔴 Fixed the Syntax Error here (Added closing brace '}' for the function)
    return new Response(
        "TEXFRIEND ERP: இந்தப் பக்கம் இன்னும் ஆஃப்லைனில் பதிவிறக்கம் செய்யப்படவில்லை. தயவுசெய்து இன்டர்நெட்டை ஆன் செய்து இந்தப் பக்கத்தை ஒருமுறை பார்வையிடவும்.",
        {
            status: 503,
            headers: {
                "Content-Type": "text/plain; charset=utf-8"
            }
        }
    );
} // <-- This brace was missing in your code!


// ============================================================
// STATIC FILE REQUEST
// ============================================================

async function handleStaticRequest(
    request
) {
    try {
        const networkResponse =
            await fetch(
                request
            );

        if (
            networkResponse &&
            networkResponse.status ===
                200 &&
            networkResponse.type ===
                "basic"
        ) {
            const cache =
                await caches.open(
                    CACHE_NAME
                );

            await cache.put(
                request,
                networkResponse.clone()
            );
        }

        return networkResponse;
    } catch (error) {
        console.log(
            "📴 Offline resource:",
            request.url
        );

        const cached =
            await caches.match(
                request
            );

        if (cached) {
            return cached;
        }

        return new Response(
            "TEXFRIEND ERP offline.\n\n" +
            "This resource is not cached.",
            {
                status: 503,
                headers: {
                    "Content-Type":
                        "text/plain; charset=utf-8"
                    }
            }
        );
    }
}


// ============================================================
// FETCH
// ============================================================

self.addEventListener(
    "fetch",
    event => {
        const request =
            event.request;

        if (
            request.method !== "GET"
        ) {
            return;
        }

        if (
            !request.url.startsWith(
                "http"
            )
        ) {
            return;
        }

        if (
            isCloudRequest(
                request
            )
        ) {
            return;
        }

        if (
            !isSameOrigin(
                request
            )
        ) {
            return;
        }

        if (
            request.mode ===
                "navigate" ||
            request.destination ===
                "document"
        ) {
            event.respondWith(
                handleNavigation(
                    request
                )
            );
            return;
        }

        event.respondWith(
            handleStaticRequest(
                request
            )
        );
    }
);


// ============================================================
// MESSAGE HANDLER
// ============================================================

self.addEventListener(
    "message",
    event => {
        if (
            !event.data
        ) {
            return;
        }

        if (
            event.data.type ===
            "SKIP_WAITING"
        ) {
            console.log(
                "🔄 TEXFRIEND: Force update"
            );
            self.skipWaiting();
        }

        if (
            event.data.type ===
            "CLEAR_TEXFRIEND_CACHE"
        ) {
            event.waitUntil(
                caches.keys()
                .then(
                    cacheNames => {
                        return Promise.all(
                            cacheNames
                                .filter(
                                    name =>
                                        name.startsWith(
                                            "texfriend-"
                                        )
                                )
                                .map(
                                    name =>
                                        caches.delete(
                                            name
                                        )
                                )
                        );
                    }
                )
                .then(
                    () => {
                        console.log(
                            "🧹 TEXFRIEND caches cleared"
                        );
                    }
                )
            );
        }
    }
);


// ============================================================
// ERROR
// ============================================================

self.addEventListener(
    "error",
    event => {
        console.error(
            "❌ TEXFRIEND SW Error:",
            event.error
        );
    }
);


// ============================================================
// UNHANDLED PROMISE
// ============================================================

self.addEventListener(
    "unhandledrejection",
    event => {
        console.error(
            "❌ TEXFRIEND SW Promise Error:",
            event.reason
        );
    }
);


// ============================================================
// READY
// ============================================================

console.log(
    "🚀 TEXFRIEND ERP Service Worker Ready:",
    CACHE_NAME
);
