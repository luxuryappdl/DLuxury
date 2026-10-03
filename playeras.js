/* =========================================================
   DL LUXURY

   PLAYERAS - TIENDA / VENTAS
   SUPABASE + STORAGE

   ARCHIVO:
   playeras.js

   CATEGORÍA:
   Playeras = categoria_id 2

   STORAGE:
   productos/playeras

   IMPORTANTE:
   - Este archivo es EXCLUSIVO para Playeras.
   - Solo consulta categoria_id = 2.
   - No utiliza descuentos.
   - No utiliza precio_original.
   - No utiliza precio_final.
   - La página utiliza #productosTienda

   CARRITO:
   - Agrega desde tarjeta normal
   - Agrega desde modal
   - NO redirige al carrito
   - Guarda descripción
   - Guarda imagen
   - Guarda precio
   - Guarda stock
   - Guarda categoría
========================================================= */

document.addEventListener("DOMContentLoaded", async function () {

    "use strict";

    /* =====================================================
       CONFIGURACIÓN SUPABASE
    ===================================================== */

    const SUPABASE_URL =
        "https://brnyvkqwkosgtpugxcge.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_Qdae9GUtmuosAPP4kemF3A_Vr4HFo0n";

    if (!window.supabase) {
        console.error(
            "❌ Supabase no está cargado. Verifica el CDN de Supabase."
        );
        return;
    }

    const supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );


    /* =====================================================
       CONFIGURACIÓN PLAYERAS
    ===================================================== */

    const BUCKET = "productos";
    const CARPETA_PLAYERAS = "playeras";
    const CATEGORIA_PLAYERAS = 2;


    /* =====================================================
       STORAGE LOCAL
    ===================================================== */

    const STORAGE_FAVORITOS =
        "dlLuxuryFavoritos";

    const STORAGE_CARRITO =
        "dlLuxuryCarrito";


    /* =====================================================
       PLACEHOLDER
    ===================================================== */

    const PLACEHOLDER =
        "https://placehold.co/600x700?text=Sin+imagen";


    /* =====================================================
       VARIABLES
    ===================================================== */

    let productos = [];
    let productosFiltrados = [];
    let generoActual = "todos";
    let textoBusqueda = "";
    let ordenActual = "default";
    let productoModalActual = null;


    /* =====================================================
       ELEMENTOS HTML
    ===================================================== */

    const contenedorProductos =
        document.querySelector("#productosTienda");

    const buscador =
        document.querySelector("#buscarProducto");

    const filtroCategoria =
        document.querySelector("#filtroCategoria");

    const ordenarProductos =
        document.querySelector("#ordenarProductos");

    const botonesGenero =
        document.querySelectorAll(".genero-btn");

    const contadorCarrito =
        document.querySelector("#contadorCarrito");


    /* =====================================================
       MODAL
    ===================================================== */

    const modalProducto =
        document.querySelector("#modalProducto");

    const cerrarModalProducto =
        document.querySelector("#cerrarModalProducto");

    const modalProductoImagen =
        document.querySelector("#modalProductoImagen");

    const modalProductoNombre =
        document.querySelector("#modalProductoNombre");

    const modalProductoDescripcion =
        document.querySelector("#modalProductoDescripcion");

    const modalProductoPrecioOriginal =
        document.querySelector("#modalProductoPrecioOriginal");

    const modalProductoPrecio =
        document.querySelector("#modalProductoPrecio");

    const modalProductoDescuento =
        document.querySelector("#modalProductoDescuento");

    const modalProductoStock =
        document.querySelector("#modalProductoStock");

    const modalProductoComprar =
        document.querySelector("#modalProductoComprar");

    const modalProductoFavorito =
        document.querySelector("#modalProductoFavorito");

    const sinResultados =
        document.querySelector("#sinResultados");


    /* =====================================================
       INICIO
    ===================================================== */

    console.log(
        "========================================"
    );

    console.log(
        "✅ playeras.js iniciado correctamente"
    );

    console.log(
        "📦 Categoría Playeras:",
        CATEGORIA_PLAYERAS
    );

    console.log(
        "🗂️ Storage:",
        BUCKET + "/" + CARPETA_PLAYERAS
    );

    console.log(
        "🚫 Descuentos desactivados"
    );

    console.log(
        "🛒 Agregar al carrito sin redirección"
    );

    console.log(
        "========================================"
    );


    actualizarContadorCarrito();

    await obtenerProductos();

    mostrarProductosVenta();


    /* =====================================================
       OBTENER PRODUCTOS DE SUPABASE
    ===================================================== */

    async function obtenerProductos() {

        try {

            console.log(
                "🔄 Cargando SOLO PLAYERAS desde Supabase..."
            );

            const {
                data,
                error
            } = await supabaseClient
                .from("productos")
                .select(`
                    id,
                    nombre,
                    genero,
                    descripcion,
                    precio,
                    stock,
                    imagen,
                    activo,
                    categoria_id,
                    creado_en
                `)
                .eq(
                    "categoria_id",
                    CATEGORIA_PLAYERAS
                )
                .eq(
                    "activo",
                    true
                )
                .order(
                    "creado_en",
                    {
                        ascending: false
                    }
                );


            if (error) {

                console.error(
                    "❌ Error obteniendo Playeras:",
                    error
                );

                console.error(
                    "message:",
                    error.message
                );

                console.error(
                    "details:",
                    error.details
                );

                console.error(
                    "hint:",
                    error.hint
                );

                console.error(
                    "code:",
                    error.code
                );

                mostrarMensaje(
                    "No se pudieron cargar las playeras."
                );

                productos = [];
                productosFiltrados = [];

                return;
            }


            /* =================================================
               SEGURIDAD EXTRA
            ================================================= */

            productos =
                Array.isArray(data)
                    ? data.filter(
                        function (producto) {

                            return Number(
                                producto.categoria_id
                            ) ===
                                CATEGORIA_PLAYERAS;
                        }
                    )
                    : [];


            console.log(
                "✅ SOLO PLAYERAS ENCONTRADAS:",
                productos.length
            );

            console.log(
                "📦 Playeras:",
                productos
            );


            productosFiltrados =
                [...productos];

        } catch (error) {

            console.error(
                "❌ Error inesperado cargando Playeras:",
                error
            );

            productos = [];
            productosFiltrados = [];

            mostrarMensaje(
                "Ocurrió un error al cargar las playeras."
            );
        }
    }


    /* =====================================================
       MOSTRAR PRODUCTOS
    ===================================================== */

    function mostrarProductosVenta() {

        if (!contenedorProductos) {

            console.error(
                "❌ No existe #productosTienda"
            );

            return;
        }


        aplicarFiltros();

        contenedorProductos.innerHTML = "";


        if (
            productosFiltrados.length === 0
        ) {

            if (sinResultados) {

                sinResultados.style.display =
                    "block";

            } else {

                contenedorProductos.innerHTML = `
                    <div class="sin-resultados">
                        <i class="fa-solid fa-shirt"></i>

                        <h3>
                            No encontramos playeras
                        </h3>

                        <p>
                            Intenta buscar otro producto.
                        </p>
                    </div>
                `;
            }

            return;
        }


        if (sinResultados) {

            sinResultados.style.display =
                "none";
        }


        productosFiltrados.forEach(
            function (producto) {

                const tarjeta =
                    crearTarjetaProducto(
                        producto
                    );

                contenedorProductos.appendChild(
                    tarjeta
                );
            }
        );
    }


    /* =====================================================
       FILTROS
    ===================================================== */

    function aplicarFiltros() {

        const busqueda =
            textoBusqueda
                .toLowerCase()
                .trim();


        productosFiltrados =
            productos.filter(
                function (producto) {

                    if (
                        Number(
                            producto.categoria_id
                        ) !==
                        CATEGORIA_PLAYERAS
                    ) {
                        return false;
                    }


                    const nombre =
                        String(
                            producto.nombre || ""
                        )
                            .toLowerCase();


                    const descripcion =
                        String(
                            producto.descripcion || ""
                        )
                            .toLowerCase();


                    const coincideBusqueda =
                        !busqueda ||
                        nombre.includes(
                            busqueda
                        ) ||
                        descripcion.includes(
                            busqueda
                        );


                    let coincideGenero =
                        true;


                    if (
                        generoActual !==
                        "todos"
                    ) {

                        const genero =
                            String(
                                producto.genero || ""
                            )
                                .toLowerCase()
                                .trim();


                        coincideGenero =
                            genero ===
                            generoActual;
                    }


                    let coincideCategoria =
                        true;


                    if (
                        filtroCategoria &&
                        filtroCategoria.value !==
                        "todos"
                    ) {

                        coincideCategoria =
                            Number(
                                producto.categoria_id
                            ) ===
                            CATEGORIA_PLAYERAS;
                    }


                    return (
                        coincideBusqueda &&
                        coincideGenero &&
                        coincideCategoria
                    );
                }
            );


        /* =================================================
           ORDENAMIENTO
        ================================================= */

        switch (ordenActual) {

            case "precio-menor":

                productosFiltrados.sort(
                    function (a, b) {

                        return (
                            Number(
                                a.precio || 0
                            ) -
                            Number(
                                b.precio || 0
                            )
                        );
                    }
                );

                break;


            case "precio-mayor":

                productosFiltrados.sort(
                    function (a, b) {

                        return (
                            Number(
                                b.precio || 0
                            ) -
                            Number(
                                a.precio || 0
                            )
                        );
                    }
                );

                break;


            case "nombre-az":

                productosFiltrados.sort(
                    function (a, b) {

                        return String(
                            a.nombre || ""
                        ).localeCompare(
                            String(
                                b.nombre || ""
                            ),
                            "es",
                            {
                                sensitivity:
                                    "base"
                            }
                        );
                    }
                );

                break;


            case "nombre-za":

                productosFiltrados.sort(
                    function (a, b) {

                        return String(
                            b.nombre || ""
                        ).localeCompare(
                            String(
                                a.nombre || ""
                            ),
                            "es",
                            {
                                sensitivity:
                                    "base"
                            }
                        );
                    }
                );

                break;


            case "default":

            default:

                productosFiltrados.sort(
                    function (a, b) {

                        return (
                            new Date(
                                b.creado_en || 0
                            ) -
                            new Date(
                                a.creado_en || 0
                            )
                        );
                    }
                );

                break;
        }
    }


    /* =====================================================
       CREAR TARJETA
    ===================================================== */

    function crearTarjetaProducto(
        producto
    ) {

        const tarjeta =
            document.createElement(
                "div"
            );


        tarjeta.className =
            "producto-card";


        tarjeta.dataset.id =
            producto.id;


        /* =================================================
           IMAGEN
        ================================================= */

        const imagenURL =
            obtenerURLImagen(
                producto.imagen
            );


        /* =================================================
           STOCK
        ================================================= */

        const stock =
            Number(
                producto.stock || 0
            );


        let textoStock = "";
        let claseStock = "";


        if (stock <= 0) {

            textoStock =
                "Agotado";

            claseStock =
                "agotado";

        } else if (stock === 1) {

            textoStock =
                "Última unidad";

            claseStock =
                "poco-stock";

        } else if (stock <= 5) {

            textoStock =
                `Solo ${stock} disponibles`;

            claseStock =
                "poco-stock";

        } else {

            textoStock =
                `${stock} disponibles`;

            claseStock =
                "disponible";
        }


        /* =================================================
           GÉNERO
        ================================================= */

        let generoTexto =
            String(
                producto.genero || ""
            ).trim();


        if (
            generoTexto.toLowerCase() ===
            "hombre"
        ) {

            generoTexto =
                "Hombre";

        } else if (
            generoTexto.toLowerCase() ===
            "mujer"
        ) {

            generoTexto =
                "Mujer";

        } else if (
            generoTexto.toLowerCase() ===
            "unisex"
        ) {

            generoTexto =
                "Unisex";
        }


        /* =================================================
           HTML TARJETA
        ================================================= */

        tarjeta.innerHTML = `

            <div class="producto-imagen-container">

                <img
                    class="producto-imagen"
                    src="${escapeHTML(imagenURL)}"
                    alt="${escapeHTML(
            producto.nombre ||
            "Playera"
        )}"
                    loading="lazy"
                >

                <button
                    type="button"
                    class="btn-favorito"
                    title="Agregar a favoritos"
                    data-id="${producto.id}"
                >
                    <i class="fa-regular fa-heart"></i>
                </button>

            </div>


            <div class="producto-info">

                ${generoTexto
                ? `
                            <span class="producto-genero">
                                ${escapeHTML(
                    generoTexto
                )}
                            </span>
                        `
                : ""
            }


                <h3 class="producto-nombre">

                    ${escapeHTML(
                producto.nombre ||
                "Playera"
            )}

                </h3>


                ${producto.descripcion
                ? `
                            <p class="producto-descripcion">

                                ${escapeHTML(
                    producto.descripcion
                )}

                            </p>
                        `
                : ""
            }


                <div class="producto-precio">

                    Q${formatearPrecio(
                producto.precio
            )}

                </div>


                <div
                    class="producto-stock ${claseStock}"
                >

                    ${textoStock}

                </div>


                <button
                    type="button"
                    class="btn-comprar"
                    data-id="${producto.id}"
                    ${stock <= 0 ? "disabled" : ""}
                >

                    <i class="fa-solid fa-cart-shopping"></i>

                    ${stock <= 0
                ? "Agotado"
                : "Agregar al carrito"
            }

                </button>

            </div>
        `;


        /* =================================================
           ERROR IMAGEN
        ================================================= */

        const imagen =
            tarjeta.querySelector(
                ".producto-imagen"
            );


        if (imagen) {

            imagen.addEventListener(
                "error",
                function () {

                    this.onerror = null;

                    this.src =
                        PLACEHOLDER;
                }
            );
        }


        /* =================================================
           CLICK TARJETA
        ================================================= */

        tarjeta.addEventListener(
            "click",
            function (evento) {

                if (
                    evento.target.closest(
                        ".btn-favorito"
                    )
                ) {
                    return;
                }


                if (
                    evento.target.closest(
                        ".btn-comprar"
                    )
                ) {
                    return;
                }


                abrirModalProducto(
                    producto
                );
            }
        );


        /* =================================================
           FAVORITO
        ================================================= */

        const botonFavorito =
            tarjeta.querySelector(
                ".btn-favorito"
            );


        if (botonFavorito) {

            botonFavorito.addEventListener(
                "click",
                function (evento) {

                    evento.stopPropagation();

                    alternarFavorito(
                        producto.id,
                        botonFavorito
                    );
                }
            );


            actualizarEstadoFavorito(
                producto.id,
                botonFavorito
            );
        }


        /* =================================================
           AGREGAR AL CARRITO DESDE TARJETA

           IMPORTANTE:
           NO REDIRIGE A carrito.html
        ================================================= */

        const botonComprar =
            tarjeta.querySelector(
                ".btn-comprar"
            );


        if (botonComprar) {

            botonComprar.addEventListener(
                "click",
                function (evento) {

                    evento.preventDefault();
                    evento.stopPropagation();

                    if (stock <= 0) {
                        return;
                    }

                    comprarProducto(
                        producto.id,
                        false
                    );
                }
            );
        }


        return tarjeta;
    }


    /* =====================================================
       OBTENER URL DE IMAGEN
    ===================================================== */

    function obtenerURLImagen(valor) {

        if (!valor) {
            return PLACEHOLDER;
        }


        let valorTexto =
            String(valor).trim();


        if (!valorTexto) {
            return PLACEHOLDER;
        }


        /* =================================================
           DATA URL
        ================================================= */

        if (
            valorTexto.startsWith(
                "data:image/"
            )
        ) {
            return valorTexto;
        }


        /* =================================================
           URL COMPLETA
        ================================================= */

        if (
            valorTexto.startsWith(
                "http://"
            ) ||
            valorTexto.startsWith(
                "https://"
            )
        ) {

            return valorTexto;
        }


        /* =================================================
           LIMPIAR SLASH INICIAL
        ================================================= */

        let ruta =
            valorTexto.replace(
                /^\/+/,
                ""
            );


        /* =================================================
           SI VIENE COMO URL DE STORAGE
        ================================================= */

        const marcadorStorage =
            "storage/v1/object/public/";


        if (
            ruta.includes(
                marcadorStorage
            )
        ) {

            const posicion =
                ruta.indexOf(
                    marcadorStorage
                );


            ruta =
                ruta.substring(
                    posicion +
                    marcadorStorage.length
                );


            return (
                `${SUPABASE_URL}/storage/v1/object/public/${ruta}`
            );
        }


        /* =================================================
           SI VIENE CON productos/
        ================================================= */

        if (
            ruta.startsWith(
                "productos/"
            )
        ) {

            ruta =
                ruta.substring(
                    "productos/".length
                );
        }


        /* =================================================
           SI NO VIENE CON playeras/
        ================================================= */

        if (
            !ruta.startsWith(
                `${CARPETA_PLAYERAS}/`
            )
        ) {

            ruta =
                `${CARPETA_PLAYERAS}/${ruta}`;
        }


        /* =================================================
           URL FINAL
        ================================================= */

        return (
            `${SUPABASE_URL}/storage/v1/object/public/` +
            `${BUCKET}/${ruta}`
        );
    }


    /* =====================================================
       MODAL PRODUCTO
    ===================================================== */

    function abrirModalProducto(
        producto
    ) {

        if (!modalProducto) {
            return;
        }


        productoModalActual =
            producto;


        /* =================================================
           IMAGEN
        ================================================= */

        if (
            modalProductoImagen
        ) {

            modalProductoImagen.src =
                obtenerURLImagen(
                    producto.imagen
                );


            modalProductoImagen.alt =
                producto.nombre ||
                "Playera";


            modalProductoImagen.onerror =
                function () {

                    this.onerror = null;

                    this.src =
                        PLACEHOLDER;
                };
        }


        /* =================================================
           NOMBRE
        ================================================= */

        if (
            modalProductoNombre
        ) {

            modalProductoNombre.textContent =
                producto.nombre ||
                "Playera";
        }


        /* =================================================
           DESCRIPCIÓN
        ================================================= */

        if (
            modalProductoDescripcion
        ) {

            const descripcion =
                String(
                    producto.descripcion || ""
                ).trim();


            modalProductoDescripcion.textContent =
                descripcion ||
                "Sin descripción disponible.";


            modalProductoDescripcion.style.display =
                "block";
        }


        /* =================================================
           PRECIO ORIGINAL
           PLAYERAS NO TIENEN DESCUENTO
        ================================================= */

        if (
            modalProductoPrecioOriginal
        ) {

            modalProductoPrecioOriginal.textContent =
                "";

            modalProductoPrecioOriginal.style.display =
                "none";
        }


        /* =================================================
           PRECIO
        ================================================= */

        if (
            modalProductoPrecio
        ) {

            modalProductoPrecio.textContent =
                `Q${formatearPrecio(
                    producto.precio
                )}`;
        }


        /* =================================================
           DESCUENTO
        ================================================= */

        if (
            modalProductoDescuento
        ) {

            modalProductoDescuento.textContent =
                "";

            modalProductoDescuento.style.display =
                "none";
        }


        /* =================================================
           STOCK
        ================================================= */

        if (
            modalProductoStock
        ) {

            const stock =
                Number(
                    producto.stock || 0
                );


            modalProductoStock.textContent =
                stock > 0
                    ? `${stock} disponibles`
                    : "Agotado";
        }


        /* =================================================
           FAVORITO
        ================================================= */

        if (
            modalProductoFavorito
        ) {

            actualizarEstadoFavorito(
                producto.id,
                modalProductoFavorito
            );
        }


        /* =================================================
           BOTÓN AGREGAR AL CARRITO DEL MODAL
        ================================================= */

        if (
            modalProductoComprar
        ) {

            const stock =
                Number(
                    producto.stock || 0
                );


            modalProductoComprar.disabled =
                stock <= 0;


            modalProductoComprar.innerHTML =
                stock <= 0
                    ? `
                        <i class="fa-solid fa-ban"></i>
                        Agotado
                    `
                    : `
                        <i class="fa-solid fa-cart-shopping"></i>
                        Agregar al carrito
                    `;
        }


        /* =================================================
           ABRIR MODAL
        ================================================= */

        modalProducto.classList.add(
            "activo"
        );


        document.body.classList.add(
            "modal-abierto"
        );
    }


    /* =====================================================
       CERRAR MODAL
    ===================================================== */

    function cerrarModal() {

        if (!modalProducto) {
            return;
        }


        modalProducto.classList.remove(
            "activo"
        );


        document.body.classList.remove(
            "modal-abierto"
        );


        productoModalActual =
            null;
    }


    if (
        cerrarModalProducto
    ) {

        cerrarModalProducto.addEventListener(
            "click",
            cerrarModal
        );
    }


    if (
        modalProducto
    ) {

        modalProducto.addEventListener(
            "click",
            function (evento) {

                if (
                    evento.target ===
                    modalProducto
                ) {

                    cerrarModal();
                }
            }
        );
    }


    /* =====================================================
       ESCAPE
    ===================================================== */

    document.addEventListener(
        "keydown",
        function (evento) {

            if (
                evento.key ===
                "Escape"
            ) {

                cerrarModal();
            }
        }
    );


    /* =====================================================
       AGREGAR AL CARRITO DESDE MODAL

       IMPORTANTE:
       NO REDIRIGE A carrito.html
    ===================================================== */

    if (
        modalProductoComprar
    ) {

        modalProductoComprar.addEventListener(
            "click",
            function (evento) {

                evento.preventDefault();

                if (
                    !productoModalActual
                ) {
                    return;
                }


                comprarProducto(
                    productoModalActual.id,
                    false
                );
            }
        );
    }


    /* =====================================================
       FAVORITO DESDE MODAL
    ===================================================== */

    if (
        modalProductoFavorito
    ) {

        modalProductoFavorito.addEventListener(
            "click",
            function () {

                if (
                    !productoModalActual
                ) {
                    return;
                }


                alternarFavorito(
                    productoModalActual.id,
                    modalProductoFavorito
                );
            }
        );
    }


    /* =====================================================
       COMPRAR / AGREGAR AL CARRITO

       FUNCIONA DESDE:
       - TARJETA NORMAL
       - MODAL

       irAlCarrito se mantiene por compatibilidad,
       pero ahora SIEMPRE se utiliza false desde
       los botones de Playeras.
    ===================================================== */

    function comprarProducto(
        id,
        irAlCarrito = false
    ) {

        const producto =
            productos.find(
                function (item) {

                    return (
                        String(
                            item.id
                        ) ===
                        String(id)
                    );
                }
            );


        if (!producto) {

            console.error(
                "❌ Playera no encontrada:",
                id
            );

            return;
        }


        /* =================================================
           SEGURIDAD: CATEGORÍA
        ================================================= */

        if (
            Number(
                producto.categoria_id
            ) !==
            CATEGORIA_PLAYERAS
        ) {

            console.error(
                "❌ Intento de agregar producto que no es Playera:",
                producto
            );

            return;
        }


        /* =================================================
           STOCK
        ================================================= */

        const stock =
            Number(
                producto.stock || 0
            );


        if (stock <= 0) {

            mostrarMensaje(
                "Esta playera está agotada."
            );

            return;
        }


        /* =================================================
           OBTENER URL CORRECTA DE IMAGEN
        ================================================= */

        const imagenCarrito =
            obtenerURLImagen(
                producto.imagen
            );


        console.log(
            "🖼️ Imagen preparada para carrito:",
            imagenCarrito
        );


        /* =================================================
           CARRITO ACTUAL
        ================================================= */

        let carrito =
            obtenerCarrito();


        const existente =
            carrito.find(
                function (item) {

                    return (
                        String(
                            item.id
                        ) ===
                        String(
                            producto.id
                        )
                    );
                }
            );


        /* =================================================
           SI YA EXISTE
        ================================================= */

        if (existente) {

            const cantidadActual =
                Number(
                    existente.cantidad || 0
                );


            if (
                cantidadActual >= stock
            ) {

                mostrarMensaje(
                    "No puedes agregar más unidades de esta playera."
                );

                return;
            }


            existente.cantidad =
                cantidadActual + 1;


            /* =================================================
               ACTUALIZAR DATOS
            ================================================= */

            existente.nombre =
                producto.nombre || "";


            existente.precio =
                Number(
                    producto.precio || 0
                );


            existente.imagen =
                imagenCarrito;


            existente.descripcion =
                producto.descripcion || "";


            existente.stock =
                stock;


            existente.categoria_id =
                CATEGORIA_PLAYERAS;


            existente.genero =
                producto.genero || "";
        }


        /* =================================================
           SI NO EXISTE
        ================================================= */

        else {

            carrito.push({

                id:
                    producto.id,

                nombre:
                    producto.nombre || "",

                precio:
                    Number(
                        producto.precio || 0
                    ),

                imagen:
                    imagenCarrito,

                descripcion:
                    producto.descripcion || "",

                stock:
                    stock,

                cantidad:
                    1,

                categoria_id:
                    CATEGORIA_PLAYERAS,

                genero:
                    producto.genero || ""
            });
        }


        /* =================================================
           GUARDAR
        ================================================= */

        guardarCarrito(
            carrito
        );


        /* =================================================
           ACTUALIZAR CONTADOR
        ================================================= */

        actualizarContadorCarrito();


        /* =================================================
           CERRAR MODAL SI ESTÁ ABIERTO
        ================================================= */

        if (
            modalProducto &&
            modalProducto.classList.contains(
                "activo"
            )
        ) {

            cerrarModal();
        }


        /* =================================================
           MENSAJE
        ================================================= */

        mostrarMensaje(
            `${producto.nombre || "Playera"} agregada al carrito.`
        );


        /* =================================================
           LOG
        ================================================= */

        console.log(
            "🛒 Producto agregado al carrito:",
            {
                id:
                    producto.id,

                nombre:
                    producto.nombre,

                descripcion:
                    producto.descripcion,

                imagen:
                    imagenCarrito,

                precio:
                    producto.precio,

                stock:
                    stock,

                cantidad:
                    existente
                        ? existente.cantidad
                        : 1
            }
        );


        /* =================================================
           REDIRECCIÓN

           DESACTIVADA.

           Las Playeras solamente se agregan al carrito.
           NO se manda al usuario a carrito.html.
        ================================================= */

        if (irAlCarrito) {

            console.log(
                "ℹ️ Redirección al carrito desactivada para Playeras."
            );
        }
    }


    /* =====================================================
       CARRITO
    ===================================================== */

    function obtenerCarrito() {

        try {

            const datos =
                localStorage.getItem(
                    STORAGE_CARRITO
                );


            if (!datos) {
                return [];
            }


            const carrito =
                JSON.parse(
                    datos
                );


            return Array.isArray(
                carrito
            )
                ? carrito
                : [];

        } catch (error) {

            console.error(
                "❌ Error leyendo carrito:",
                error
            );

            return [];
        }
    }


    function guardarCarrito(
        carrito
    ) {

        try {

            localStorage.setItem(
                STORAGE_CARRITO,
                JSON.stringify(
                    carrito
                )
            );

        } catch (error) {

            console.error(
                "❌ Error guardando carrito:",
                error
            );
        }
    }


    /* =====================================================
       CONTADOR CARRITO
    ===================================================== */

    function actualizarContadorCarrito() {

        if (
            !contadorCarrito
        ) {
            return;
        }


        const carrito =
            obtenerCarrito();


        const cantidad =
            carrito.reduce(
                function (
                    total,
                    producto
                ) {

                    return (
                        total +
                        Number(
                            producto.cantidad || 0
                        )
                    );
                },
                0
            );


        contadorCarrito.textContent =
            cantidad;


        contadorCarrito.style.display =
            cantidad > 0
                ? "flex"
                : "none";
    }


    /* =====================================================
       FAVORITOS
    ===================================================== */

    function obtenerFavoritos() {

        try {

            const datos =
                localStorage.getItem(
                    STORAGE_FAVORITOS
                );


            if (!datos) {
                return [];
            }


            const favoritos =
                JSON.parse(
                    datos
                );


            return Array.isArray(
                favoritos
            )
                ? favoritos
                : [];

        } catch (error) {

            console.error(
                "❌ Error leyendo favoritos:",
                error
            );

            return [];
        }
    }


    function guardarFavoritos(
        favoritos
    ) {

        try {

            localStorage.setItem(
                STORAGE_FAVORITOS,
                JSON.stringify(
                    favoritos
                )
            );

        } catch (error) {

            console.error(
                "❌ Error guardando favoritos:",
                error
            );
        }
    }


    /* =====================================================
       CAMBIAR FAVORITO
    ===================================================== */

    function alternarFavorito(
        id,
        boton
    ) {

        let favoritos =
            obtenerFavoritos();


        const posicion =
            favoritos.findIndex(
                function (favorito) {

                    return (
                        String(
                            favorito
                        ) ===
                        String(id)
                    );
                }
            );


        if (
            posicion >= 0
        ) {

            favoritos.splice(
                posicion,
                1
            );


            cambiarIconoFavorito(
                boton,
                false
            );


            mostrarMensaje(
                "Eliminado de favoritos."
            );

        } else {

            favoritos.push(
                id
            );


            cambiarIconoFavorito(
                boton,
                true
            );


            mostrarMensaje(
                "Agregado a favoritos."
            );
        }


        guardarFavoritos(
            favoritos
        );


        document.dispatchEvent(
            new CustomEvent(
                "favoritosActualizados"
            )
        );
    }


    /* =====================================================
       ACTUALIZAR ESTADO FAVORITO
    ===================================================== */

    function actualizarEstadoFavorito(
        id,
        boton
    ) {

        if (!boton) {
            return;
        }


        const favoritos =
            obtenerFavoritos();


        const esFavorito =
            favoritos.some(
                function (favorito) {

                    return (
                        String(
                            favorito
                        ) ===
                        String(id)
                    );
                }
            );


        cambiarIconoFavorito(
            boton,
            esFavorito
        );
    }


    /* =====================================================
       ICONO FAVORITO
    ===================================================== */

    function cambiarIconoFavorito(
        boton,
        activo
    ) {

        if (!boton) {
            return;
        }


        if (activo) {

            boton.classList.add(
                "favorito-activo"
            );


            boton.innerHTML =
                `
                    <i class="fa-solid fa-heart"></i>
                `;


            boton.title =
                "Quitar de favoritos";

        } else {

            boton.classList.remove(
                "favorito-activo"
            );


            boton.innerHTML =
                `
                    <i class="fa-regular fa-heart"></i>
                `;


            boton.title =
                "Agregar a favoritos";
        }
    }


    /* =====================================================
       BUSCADOR
    ===================================================== */

    if (
        buscador
    ) {

        buscador.addEventListener(
            "input",
            function () {

                textoBusqueda =
                    buscador.value || "";


                mostrarProductosVenta();
            }
        );
    }


    /* =====================================================
       GÉNERO
    ===================================================== */

    botonesGenero.forEach(
        function (boton) {

            boton.addEventListener(
                "click",
                function () {

                    botonesGenero.forEach(
                        function (btn) {

                            btn.classList.remove(
                                "active"
                            );
                        }
                    );


                    boton.classList.add(
                        "active"
                    );


                    generoActual =
                        String(
                            boton.dataset.genero ||
                            "todos"
                        )
                            .toLowerCase()
                            .trim();


                    mostrarProductosVenta();
                }
            );
        }
    );


    /* =====================================================
       CATEGORÍA
    ===================================================== */

    if (
        filtroCategoria
    ) {

        filtroCategoria.addEventListener(
            "change",
            function () {

                mostrarProductosVenta();
            }
        );
    }


    /* =====================================================
       ORDENAR
    ===================================================== */

    if (
        ordenarProductos
    ) {

        ordenarProductos.addEventListener(
            "change",
            function () {

                ordenActual =
                    ordenarProductos.value ||
                    "default";


                mostrarProductosVenta();
            }
        );
    }


    /* =====================================================
       MENSAJE
    ===================================================== */

    function mostrarMensaje(
        mensaje
    ) {

        const existente =
            document.querySelector(
                ".mensaje-playeras"
            );


        if (
            existente
        ) {

            existente.remove();
        }


        const elemento =
            document.createElement(
                "div"
            );


        elemento.className =
            "mensaje-playeras";


        elemento.textContent =
            mensaje;


        document.body.appendChild(
            elemento
        );


        setTimeout(
            function () {

                elemento.classList.add(
                    "mostrar"
                );

            },
            10
        );


        setTimeout(
            function () {

                elemento.classList.remove(
                    "mostrar"
                );


                setTimeout(
                    function () {

                        if (
                            elemento.parentNode
                        ) {

                            elemento.remove();
                        }

                    },
                    300
                );

            },
            2500
        );
    }


    /* =====================================================
       FORMATO PRECIO
    ===================================================== */

    function formatearPrecio(
        precio
    ) {

        const numero =
            Number(
                precio || 0
            );


        return numero.toLocaleString(
            "es-GT",
            {
                minimumFractionDigits:
                    2,

                maximumFractionDigits:
                    2
            }
        );
    }


    /* =====================================================
       ESCAPAR HTML
    ===================================================== */

    function escapeHTML(
        texto
    ) {

        return String(
            texto ?? ""
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }


    /* =====================================================
       FUNCIONES GLOBALES
    ===================================================== */

    window.cargarPlayeras =
        async function () {

            await obtenerProductos();

            mostrarProductosVenta();
        };


    window.recargarPlayeras =
        async function () {

            await obtenerProductos();

            mostrarProductosVenta();
        };


    window.actualizarCarritoPlayeras =
        function () {

            actualizarContadorCarrito();
        };


    window.abrirProductoPlayera =
        function (id) {

            const producto =
                productos.find(
                    function (item) {

                        return (
                            String(
                                item.id
                            ) ===
                            String(id)
                        );
                    }
                );


            if (
                producto &&
                Number(
                    producto.categoria_id
                ) ===
                CATEGORIA_PLAYERAS
            ) {

                abrirModalProducto(
                    producto
                );
            }
        };


    /* =====================================================
       EVENTO DESDE ADMIN
    ===================================================== */

    document.addEventListener(
        "playerasSupabaseListo",
        async function () {

            console.log(
                "🔄 Actualizando SOLO Playeras después de cambios..."
            );


            await obtenerProductos();

            mostrarProductosVenta();
        }
    );


    /* =====================================================
       STORAGE LOCAL
    ===================================================== */

    window.addEventListener(
        "storage",
        function (evento) {

            if (
                evento.key ===
                STORAGE_CARRITO
            ) {

                actualizarContadorCarrito();
            }


            if (
                evento.key ===
                STORAGE_FAVORITOS
            ) {

                mostrarProductosVenta();
            }
        }
    );


    /* =====================================================
       ACTUALIZAR AL VOLVER A LA PÁGINA
    ===================================================== */

    document.addEventListener(
        "visibilitychange",
        function () {

            if (
                document.visibilityState ===
                "visible"
            ) {

                actualizarContadorCarrito();

                mostrarProductosVenta();
            }
        }
    );


    /* =====================================================
       FINAL
    ===================================================== */

    console.log(
        "✅ SOLO PLAYERAS listas para mostrar."
    );

    console.log(
        "🛒 Botones configurados como: Agregar al carrito"
    );

    console.log(
        "🚫 Sin redirección automática a carrito.html"
    );

});