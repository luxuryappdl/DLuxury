"use strict";

const CACHE_NAME = "dl-luxury-v5";

const ARCHIVOS_CACHE = [
    "./",
    "./index.html",
    "./tienda.html",
    "./perfil.html",
    "./favorito.html",
    "./carrito.html",
    "./manifest.json",
    "./style.css",
    "./script.js",
    "./slider.js",
    "./imglogo.png",
    "./icono1.png",
    "./icono2.png"
];


// =========================================================
// INSTALAR SERVICE WORKER
// =========================================================

self.addEventListener("install", (event) => {

    event.waitUntil(

        caches.open(CACHE_NAME)

            .then((cache) => {

                return Promise.all(

                    ARCHIVOS_CACHE.map((archivo) => {

                        return cache.add(archivo)

                            .catch((error) => {

                                console.warn(
                                    "No se pudo guardar en caché:",
                                    archivo,
                                    error
                                );

                            });

                    })

                );

            })

            .then(() => {

                return self.skipWaiting();

            })

    );

});


// =========================================================
// ACTIVAR SERVICE WORKER
// =========================================================

self.addEventListener("activate", (event) => {

    event.waitUntil(

        caches.keys()

            .then((nombres) => {

                return Promise.all(

                    nombres.map((nombre) => {

                        if (
                            nombre.startsWith("dl-luxury-") &&
                            nombre !== CACHE_NAME
                        ) {

                            console.log(
                                "Eliminando caché antigua:",
                                nombre
                            );

                            return caches.delete(nombre);

                        }

                    })

                );

            })

            .then(() => {

                return self.clients.claim();

            })

    );

});


// =========================================================
// INTERCEPTAR PETICIONES
// =========================================================

self.addEventListener("fetch", (event) => {

    const solicitud = event.request;


    // Solo peticiones GET
    if (solicitud.method !== "GET") {
        return;
    }


    const url = new URL(solicitud.url);


    // Solo archivos del mismo dominio
    if (url.origin !== self.location.origin) {
        return;
    }


    // =====================================================
    // PÁGINAS HTML
    // =====================================================

    if (solicitud.mode === "navigate") {

        event.respondWith(

            fetch(solicitud)

                .then((respuesta) => {

                    if (respuesta.ok) {

                        const copia = respuesta.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {

                                cache.put(
                                    solicitud,
                                    copia
                                );

                            });

                    }

                    return respuesta;

                })

                .catch(async () => {

                    const paginaGuardada =
                        await caches.match(solicitud);

                    if (paginaGuardada) {
                        return paginaGuardada;
                    }

                    return caches.match(
                        "./index.html"
                    );

                })

        );

        return;
    }


    // =====================================================
    // CSS, JS, IMÁGENES Y OTROS ARCHIVOS
    // =====================================================

    event.respondWith(

        caches.match(solicitud)

            .then((guardado) => {

                if (guardado) {
                    return guardado;
                }


                return fetch(solicitud)

                    .then((respuesta) => {

                        if (respuesta.ok) {

                            const copia =
                                respuesta.clone();

                            caches.open(CACHE_NAME)
                                .then((cache) => {

                                    cache.put(
                                        solicitud,
                                        copia
                                    );

                                });

                        }

                        return respuesta;

                    });

            })

    );

});