/* =========================================================
   DL LUXURY
   GORRAS - TIENDA / VENTAS
   SUPABASE + STORAGE

   ARCHIVO:
   gorras.js

   CATEGORÍA:
   Gorras = categoria_id 1

   STORAGE:
   productos/gorras

   IMPORTANTE:
   - Este archivo maneja EXCLUSIVAMENTE GORRAS.
   - No usa descuentos.
   - No modifica productos.
   - No usa precio_final.
   - Agregar al carrito NO redirige a carrito.html.

   FILTRO DE GÉNERO:
   - Todos     → Hombre + Mujer + Unisex
   - Para él   → Hombre + Unisex
   - Para ella → Mujer + Unisex
   - Unisex    → Unisex
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       CONFIGURACIÓN SUPABASE
    ===================================================== */

    const SUPABASE_URL =
        "https://brnyvkqwkosgtpugxcge.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_Qdae9GUtmuosAPP4kemF3A_Vr4HFo0n";

    const CATEGORIA_GORRAS = 1;

    const STORAGE_BUCKET = "productos";

    const STORAGE_CARPETA = "gorras";

    const STORAGE_FAVORITOS =
        "dlLuxuryFavoritos";

    const STORAGE_CARRITO =
        "dlLuxuryCarrito";

    const PLACEHOLDER =
        "https://placehold.co/600x700?text=Sin+imagen";


    /* =====================================================
       SUPABASE
    ===================================================== */

    if (!window.supabase) {

        console.error(
            "DL Luxury: Supabase no está cargado."
        );

        return;
    }

    const supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );

    window.gorrasSupabase =
        supabaseClient;


    /* =====================================================
       ELEMENTOS HTML
    ===================================================== */

    const productosTienda =
        document.getElementById(
            "productosTienda"
        );

    const sinResultados =
        document.getElementById(
            "sinResultados"
        );

    const buscarProducto =
        document.getElementById(
            "buscarProducto"
        );

    const filtroCategoria =
        document.getElementById(
            "filtroCategoria"
        );

    const ordenarProductos =
        document.getElementById(
            "ordenarProductos"
        );

    const botonesGenero =
        document.querySelectorAll(
            ".genero-btn"
        );


    /* =====================================================
       MODAL
    ===================================================== */

    const modalProducto =
        document.getElementById(
            "modalProducto"
        );

    const cerrarModalProducto =
        document.getElementById(
            "cerrarModalProducto"
        );

    const modalProductoImagen =
        document.getElementById(
            "modalProductoImagen"
        );

    const modalProductoNombre =
        document.getElementById(
            "modalProductoNombre"
        );

    const modalProductoDescripcion =
        document.getElementById(
            "modalProductoDescripcion"
        );

    const modalProductoPrecioOriginal =
        document.getElementById(
            "modalProductoPrecioOriginal"
        );

    const modalProductoPrecio =
        document.getElementById(
            "modalProductoPrecio"
        );

    const modalProductoDescuento =
        document.getElementById(
            "modalProductoDescuento"
        );

    const modalProductoStock =
        document.getElementById(
            "modalProductoStock"
        );

    const modalProductoComprar =
        document.getElementById(
            "modalProductoComprar"
        );

    const modalProductoFavorito =
        document.getElementById(
            "modalProductoFavorito"
        );


    /* =====================================================
       VARIABLES
    ===================================================== */

    let productos = [];

    let productosFiltrados = [];

    let generoActual = "todos";

    let productoModalActual = null;


    /* =====================================================
       FUNCIÓN URL DE IMAGEN

       Permite trabajar con:

       imagen.jpg
       gorras/imagen.jpg
       productos/gorras/imagen.jpg
       URL completa de Supabase Storage
       data:image/...
    ===================================================== */

    function obtenerURLImagen(imagen) {

        if (!imagen) {
            return PLACEHOLDER;
        }

        const valor =
            String(imagen).trim();

        if (!valor) {
            return PLACEHOLDER;
        }


        /* =================================================
           DATA URL
        ================================================= */

        if (
            valor.startsWith("data:image/")
        ) {
            return valor;
        }


        /* =================================================
           URL COMPLETA
        ================================================= */

        if (
            valor.startsWith("http://") ||
            valor.startsWith("https://")
        ) {
            return valor;
        }


        let ruta = valor;


        /* =================================================
           QUITAR SLASH INICIAL
        ================================================= */

        ruta = ruta.replace(/^\/+/, "");


        /* =================================================
           SI VIENE COMO URL DE STORAGE
        ================================================= */

        const marcadorStorage =
            "/storage/v1/object/public/";

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
        }


        /* =================================================
           QUITAR SLASH INICIAL NUEVAMENTE
        ================================================= */

        ruta = ruta.replace(/^\/+/, "");


        /* =================================================
           QUITAR BUCKET

           productos/gorras/foto.jpg

           pasa a:

           gorras/foto.jpg
        ================================================= */

        if (
            ruta.startsWith(
                `${STORAGE_BUCKET}/`
            )
        ) {

            ruta =
                ruta.substring(
                    `${STORAGE_BUCKET}/`.length
                );
        }


        /* =================================================
           SI VIENE COMO:

           productos/gorras/imagen.jpg
        ================================================= */

        if (
            ruta.startsWith(
                "productos/gorras/"
            )
        ) {

            ruta =
                ruta.substring(
                    "productos/".length
                );
        }


        /* =================================================
           SI SOLAMENTE VIENE:

           imagen.jpg
        ================================================= */

        if (!ruta.includes("/")) {

            ruta =
                `${STORAGE_CARPETA}/${ruta}`;
        }


        /* =================================================
           SI NO COMIENZA CON:

           gorras/
        ================================================= */

        if (
            !ruta.startsWith(
                `${STORAGE_CARPETA}/`
            )
        ) {

            ruta =
                `${STORAGE_CARPETA}/${ruta}`;
        }


        /* =================================================
           URL FINAL
        ================================================= */

        return (
            `${SUPABASE_URL}/storage/v1/object/public/` +
            `${STORAGE_BUCKET}/${ruta}`
        );
    }


    /* =====================================================
       FAVORITOS
    ===================================================== */

    function obtenerFavoritos() {

        try {

            const favoritos =
                JSON.parse(
                    localStorage.getItem(
                        STORAGE_FAVORITOS
                    )
                );

            return Array.isArray(favoritos)
                ? favoritos
                : [];

        } catch (error) {

            console.error(
                "Error leyendo favoritos:",
                error
            );

            return [];
        }
    }


    function guardarFavoritos(
        favoritos
    ) {

        localStorage.setItem(
            STORAGE_FAVORITOS,
            JSON.stringify(favoritos)
        );
    }


    function esFavorito(id) {

        const favoritos =
            obtenerFavoritos();

        return favoritos.some(
            favorito =>
                String(
                    favorito.id ?? favorito
                ) === String(id)
        );
    }


    function alternarFavorito(
        producto
    ) {

        if (
            !producto ||
            !producto.id
        ) {
            return;
        }

        let favoritos =
            obtenerFavoritos();

        const indice =
            favoritos.findIndex(
                favorito =>
                    String(
                        favorito.id ?? favorito
                    ) ===
                    String(producto.id)
            );


        if (indice >= 0) {

            favoritos.splice(
                indice,
                1
            );

            mostrarMensaje(
                "Producto eliminado de favoritos"
            );

        } else {

            favoritos.push({

                id:
                    producto.id,

                nombre:
                    producto.nombre,

                precio:
                    producto.precio,

                imagen:
                    obtenerURLImagen(
                        producto.imagen
                    ),

                genero:
                    producto.genero,

                categoria_id:
                    producto.categoria_id
            });

            mostrarMensaje(
                "Producto agregado a favoritos"
            );
        }


        guardarFavoritos(
            favoritos
        );

        actualizarCorazones();

        actualizarFavoritoModal();
    }


    /* =====================================================
       CARRITO
    ===================================================== */

    function obtenerCarrito() {

        try {

            const carrito =
                JSON.parse(
                    localStorage.getItem(
                        STORAGE_CARRITO
                    )
                );

            return Array.isArray(carrito)
                ? carrito
                : [];

        } catch (error) {

            console.error(
                "Error leyendo carrito:",
                error
            );

            return [];
        }
    }


    function guardarCarrito(
        carrito
    ) {

        localStorage.setItem(
            STORAGE_CARRITO,
            JSON.stringify(carrito)
        );
    }


    /* =====================================================
       AGREGAR AL CARRITO

       IMPORTANTE:
       SOLO agrega el producto.
       NO redirige a carrito.html.
    ===================================================== */

    function agregarAlCarrito(
        producto
    ) {

        if (
            !producto ||
            !producto.id
        ) {
            return false;
        }


        const stock =
            Number(producto.stock) || 0;


        if (stock <= 0) {

            mostrarMensaje(
                "Este producto está agotado"
            );

            return false;
        }


        let carrito =
            obtenerCarrito();


        const indice =
            carrito.findIndex(
                item =>
                    String(item.id) ===
                    String(producto.id)
            );


        /* =================================================
           PRODUCTO YA EXISTE
        ================================================= */

        if (indice >= 0) {

            const cantidadActual =
                Number(
                    carrito[indice].cantidad
                ) || 0;


            if (
                cantidadActual >= stock
            ) {

                mostrarMensaje(
                    "No hay más stock disponible"
                );

                return false;
            }


            carrito[indice].cantidad =
                cantidadActual + 1;

            carrito[indice].stock =
                stock;

            carrito[indice].nombre =
                producto.nombre || "";

            carrito[indice].descripcion =
                producto.descripcion || "";

            carrito[indice].precio =
                Number(producto.precio) || 0;

            carrito[indice].imagen =
                obtenerURLImagen(
                    producto.imagen
                );

            carrito[indice].genero =
                producto.genero || "";

            carrito[indice].categoria_id =
                CATEGORIA_GORRAS;

        } else {


            /* =================================================
               PRODUCTO NUEVO EN CARRITO
            ================================================= */

            carrito.push({

                id:
                    producto.id,

                nombre:
                    producto.nombre || "",

                descripcion:
                    producto.descripcion || "",

                precio:
                    Number(producto.precio) || 0,

                imagen:
                    obtenerURLImagen(
                        producto.imagen
                    ),

                stock:
                    stock,

                genero:
                    producto.genero || "",

                categoria_id:
                    CATEGORIA_GORRAS,

                cantidad:
                    1
            });
        }


        guardarCarrito(
            carrito
        );


        actualizarContadorCarrito();


        mostrarMensaje(
            "Producto agregado al carrito"
        );


        return true;
    }


    /* =====================================================
       CONTADOR CARRITO
    ===================================================== */

    function actualizarContadorCarrito() {

        const contador =
            document.getElementById(
                "contadorCarrito"
            );


        if (!contador) {
            return;
        }


        const carrito =
            obtenerCarrito();


        const cantidad =
            carrito.reduce(
                (total, item) =>
                    total +
                    (
                        Number(
                            item.cantidad
                        ) || 0
                    ),
                0
            );


        contador.textContent =
            cantidad;


        if (cantidad > 0) {

            contador.style.display =
                "flex";

        } else {

            contador.style.display =
                "none";
        }
    }


    /* =====================================================
       CARGAR PRODUCTOS
    ===================================================== */

    async function cargarProductos() {

        if (!productosTienda) {

            console.error(
                "No existe #productosTienda"
            );

            return;
        }


        productosTienda.innerHTML = `

            <div style="
                grid-column: 1 / -1;
                padding: 40px 20px;
                text-align: center;
                color: #777;
                font-size: 14px;
            ">

                Cargando gorras...

            </div>

        `;


        try {

            const {
                data,
                error
            } =
                await supabaseClient
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
                        CATEGORIA_GORRAS
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
                throw error;
            }


            productos =
                Array.isArray(data)
                    ? data
                    : [];


            /* =================================================
               SEGURIDAD EXTRA:
               SOLO GORRAS
            ================================================= */

            productos =
                productos.filter(
                    producto =>
                        Number(
                            producto.categoria_id
                        ) ===
                        CATEGORIA_GORRAS
                );


            productosFiltrados =
                [...productos];


            mostrarProductos();


        } catch (error) {

            console.error(
                "Error cargando gorras:",
                error
            );


            productos = [];

            productosFiltrados = [];


            productosTienda.innerHTML = `

                <div style="
                    grid-column: 1 / -1;
                    padding: 50px 20px;
                    text-align: center;
                    color: #d00000;
                ">

                    <i
                        class="fa-solid fa-triangle-exclamation"
                        style="
                            display:block;
                            font-size:35px;
                            margin-bottom:12px;
                        "
                    ></i>

                    <strong>
                        No se pudieron cargar las gorras
                    </strong>

                    <p style="
                        margin-top:8px;
                        font-size:13px;
                        color:#777;
                    ">

                        Revisa tu conexión e inténtalo nuevamente.

                    </p>

                </div>

            `;


            if (sinResultados) {

                sinResultados.style.display =
                    "none";
            }
        }
    }


    /* =====================================================
       NORMALIZAR GÉNERO
    ===================================================== */

    function normalizarGenero(
        genero
    ) {

        let valor =
            String(
                genero || ""
            )
                .trim()
                .toLowerCase();


        valor =
            valor
                .normalize("NFD")
                .replace(
                    /[\u0300-\u036f]/g,
                    ""
                );


        if (
            valor === "hombre" ||
            valor === "masculino" ||
            valor === "men" ||
            valor === "para el"
        ) {

            return "hombre";
        }


        if (
            valor === "mujer" ||
            valor === "femenino" ||
            valor === "women" ||
            valor === "para ella"
        ) {

            return "mujer";
        }


        if (
            valor === "unisex"
        ) {

            return "unisex";
        }


        return valor;
    }


    /* =====================================================
       FILTROS
    ===================================================== */

    function aplicarFiltros() {

        let resultado =
            [...productos];


        /* =================================================
           FILTRO GÉNERO

           TODOS:
           Hombre + Mujer + Unisex

           HOMBRE:
           Hombre + Unisex

           MUJER:
           Mujer + Unisex

           UNISEX:
           Unisex solamente
        ================================================= */

        if (
            generoActual &&
            generoActual !== "todos"
        ) {

            resultado =
                resultado.filter(
                    producto => {

                        const generoProducto =
                            normalizarGenero(
                                producto.genero
                            );


                        if (
                            generoActual ===
                            "hombre"
                        ) {

                            return (
                                generoProducto ===
                                "hombre" ||
                                generoProducto ===
                                "unisex"
                            );
                        }


                        if (
                            generoActual ===
                            "mujer"
                        ) {

                            return (
                                generoProducto ===
                                "mujer" ||
                                generoProducto ===
                                "unisex"
                            );
                        }


                        if (
                            generoActual ===
                            "unisex"
                        ) {

                            return (
                                generoProducto ===
                                "unisex"
                            );
                        }


                        return (
                            generoProducto ===
                            generoActual
                        );
                    }
                );
        }


        /* =================================================
           BUSCADOR
        ================================================= */

        const texto =
            buscarProducto
                ? buscarProducto.value
                    .trim()
                    .toLowerCase()
                : "";


        if (texto) {

            resultado =
                resultado.filter(
                    producto => {

                        const nombre =
                            String(
                                producto.nombre ||
                                ""
                            ).toLowerCase();


                        const descripcion =
                            String(
                                producto.descripcion ||
                                ""
                            ).toLowerCase();


                        const genero =
                            String(
                                producto.genero ||
                                ""
                            ).toLowerCase();


                        return (
                            nombre.includes(texto) ||
                            descripcion.includes(texto) ||
                            genero.includes(texto)
                        );
                    }
                );
        }


        /* =================================================
           CATEGORÍA
        ================================================= */

        if (
            filtroCategoria &&
            filtroCategoria.value &&
            filtroCategoria.value !== "todos"
        ) {

            if (
                filtroCategoria.value !==
                "gorras"
            ) {

                resultado = [];
            }
        }


        /* =================================================
           ORDEN
        ================================================= */

        const orden =
            ordenarProductos
                ? ordenarProductos.value
                : "";


        switch (orden) {

            case "precio-menor":

                resultado.sort(
                    (a, b) =>
                        Number(
                            a.precio || 0
                        ) -
                        Number(
                            b.precio || 0
                        )
                );

                break;


            case "precio-mayor":

                resultado.sort(
                    (a, b) =>
                        Number(
                            b.precio || 0
                        ) -
                        Number(
                            a.precio || 0
                        )
                );

                break;


            case "nombre-az":

                resultado.sort(
                    (a, b) =>
                        String(
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
                        )
                );

                break;


            case "nombre-za":

                resultado.sort(
                    (a, b) =>
                        String(
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
                        )
                );

                break;


            case "nuevo":

                resultado.sort(
                    (a, b) =>
                        new Date(
                            b.creado_en || 0
                        ) -
                        new Date(
                            a.creado_en || 0
                        )
                );

                break;


            case "stock":

                resultado.sort(
                    (a, b) =>
                        Number(
                            b.stock || 0
                        ) -
                        Number(
                            a.stock || 0
                        )
                );

                break;
        }


        productosFiltrados =
            resultado;
    }


    /* =====================================================
       MOSTRAR PRODUCTOS
    ===================================================== */

    function mostrarProductos() {

        aplicarFiltros();


        productosTienda.innerHTML =
            "";


        if (
            productosFiltrados.length === 0
        ) {

            if (sinResultados) {

                sinResultados.style.display =
                    "block";
            }

            return;
        }


        if (sinResultados) {

            sinResultados.style.display =
                "none";
        }


        productosFiltrados.forEach(
            producto => {

                const tarjeta =
                    crearTarjetaProducto(
                        producto
                    );


                productosTienda.appendChild(
                    tarjeta
                );
            }
        );


        actualizarCorazones();
    }


    /* =====================================================
       CREAR TARJETA
    ===================================================== */

    function crearTarjetaProducto(
        producto
    ) {

        const tarjeta =
            document.createElement(
                "article"
            );


        tarjeta.className =
            "producto-card";


        tarjeta.dataset.id =
            producto.id;


        const stock =
            Number(producto.stock) || 0;


        const precio =
            Number(producto.precio) || 0;


        const imagen =
            obtenerURLImagen(
                producto.imagen
            );


        const favorito =
            esFavorito(
                producto.id
            );


        let textoStock = "";

        let claseStock = "";


        if (stock <= 0) {

            textoStock =
                "Agotado";

            claseStock =
                "agotado";

        } else if (stock <= 3) {

            textoStock =
                `Poco stock · ${stock} disponibles`;

            claseStock =
                "poco-stock";

        } else {

            textoStock =
                `${stock} disponibles`;

            claseStock =
                "disponible";
        }


        const generoTexto =
            obtenerTextoGenero(
                producto.genero
            );


        tarjeta.innerHTML = `

            <div class="producto-imagen-container">

                <img
                    class="producto-imagen"
                    src="${escaparHTML(imagen)}"
                    alt="${escaparHTML(
            producto.nombre ||
            "Gorra"
        )}"
                    loading="lazy"
                    onerror="
                        this.onerror=null;
                        this.src='${PLACEHOLDER}';
                    "
                >

                <button
                    type="button"
                    class="btn-favorito ${favorito
                ? "favorito-activo"
                : ""
            }"
                    data-id="${producto.id}"
                    aria-label="${favorito
                ? "Quitar de favoritos"
                : "Agregar a favoritos"
            }"
                >

                    <i class="${favorito
                ? "fa-solid fa-heart"
                : "fa-regular fa-heart"
            }"></i>

                </button>

            </div>


            <div class="producto-info">

                <span class="producto-genero">

                    ${escaparHTML(
                generoTexto
            )}

                </span>


                <h3 class="producto-nombre">

                    ${escaparHTML(
                producto.nombre ||
                "Sin nombre"
            )}

                </h3>


                <p class="producto-descripcion">

                    ${escaparHTML(
                producto.descripcion ||
                "Sin descripción disponible."
            )}

                </p>


                <div class="producto-precio">

                    ${formatearPrecio(
                precio
            )}

                </div>


                <div class="producto-stock ${claseStock}">

                    ${escaparHTML(
                textoStock
            )}

                </div>


                <button
                    type="button"
                    class="btn-comprar"
                    data-id="${producto.id}"
                    ${stock <= 0
                ? "disabled"
                : ""
            }
                >

                    ${stock <= 0
                ? "Agotado"
                : "Agregar al carrito"
            }

                </button>

            </div>

        `;


        /* =================================================
           CLICK TARJETA

           Si se presiona el botón comprar
           NO abrir el modal.
        ================================================= */

        tarjeta.addEventListener(
            "click",
            event => {

                if (
                    event.target.closest(
                        ".btn-favorito"
                    )
                ) {

                    return;
                }


                if (
                    event.target.closest(
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
                event => {

                    event.stopPropagation();

                    alternarFavorito(
                        producto
                    );
                }
            );
        }


        /* =================================================
           BOTÓN AGREGAR AL CARRITO
        ================================================= */

        const botonComprar =
            tarjeta.querySelector(
                ".btn-comprar"
            );


        if (botonComprar) {

            botonComprar.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();


                    if (stock <= 0) {
                        return;
                    }


                    agregarAlCarrito(
                        producto
                    );
                }
            );
        }


        return tarjeta;
    }


    /* =====================================================
       GÉNERO
    ===================================================== */

    function obtenerTextoGenero(
        genero
    ) {

        const valor =
            normalizarGenero(
                genero
            );


        if (
            valor === "hombre"
        ) {

            return "Gorras para él";
        }


        if (
            valor === "mujer"
        ) {

            return "Gorras para ella";
        }


        if (
            valor === "unisex"
        ) {

            return "Gorras unisex";
        }


        return genero
            ? String(genero)
            : "Gorras";
    }


    /* =====================================================
       MODAL
    ===================================================== */

    function abrirModalProducto(
        producto
    ) {

        if (!modalProducto) {
            return;
        }


        productoModalActual =
            producto;


        const imagen =
            obtenerURLImagen(
                producto.imagen
            );


        const precio =
            Number(producto.precio) || 0;


        const stock =
            Number(producto.stock) || 0;


        /* =================================================
           IMAGEN
        ================================================= */

        if (modalProductoImagen) {

            modalProductoImagen.src =
                imagen;

            modalProductoImagen.alt =
                producto.nombre ||
                "Gorra";


            modalProductoImagen.onerror =
                function () {

                    this.onerror =
                        null;

                    this.src =
                        PLACEHOLDER;
                };
        }


        /* =================================================
           NOMBRE
        ================================================= */

        if (modalProductoNombre) {

            modalProductoNombre.textContent =
                producto.nombre ||
                "Sin nombre";
        }


        /* =================================================
           DESCRIPCIÓN
        ================================================= */

        if (modalProductoDescripcion) {

            const descripcion =
                String(
                    producto.descripcion || ""
                ).trim();


            if (descripcion) {

                modalProductoDescripcion.textContent =
                    descripcion;

            } else {

                modalProductoDescripcion.textContent =
                    "Sin descripción disponible.";
            }


            modalProductoDescripcion.style.display =
                "block";
        }


        /* =================================================
           PRECIO
        ================================================= */

        if (modalProductoPrecio) {

            modalProductoPrecio.textContent =
                formatearPrecio(
                    precio
                );
        }


        /* =================================================
           GORRAS NO USA DESCUENTOS
        ================================================= */

        if (
            modalProductoPrecioOriginal
        ) {

            modalProductoPrecioOriginal.style.display =
                "none";
        }


        if (
            modalProductoDescuento
        ) {

            modalProductoDescuento.style.display =
                "none";
        }


        /* =================================================
           STOCK
        ================================================= */

        if (modalProductoStock) {

            if (stock <= 0) {

                modalProductoStock.textContent =
                    "Agotado";

                modalProductoStock.style.color =
                    "#d00000";

            } else if (stock <= 3) {

                modalProductoStock.textContent =
                    `Poco stock · ${stock} disponibles`;

                modalProductoStock.style.color =
                    "#d97706";

            } else {

                modalProductoStock.textContent =
                    `${stock} disponibles`;

                modalProductoStock.style.color =
                    "#188038";
            }
        }


        /* =================================================
           BOTÓN CARRITO DEL MODAL
        ================================================= */

        if (modalProductoComprar) {

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
           FAVORITO
        ================================================= */

        actualizarFavoritoModal();


        /* =================================================
           ABRIR
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


    /* =====================================================
       FAVORITO MODAL
    ===================================================== */

    function actualizarFavoritoModal() {

        if (
            !modalProductoFavorito ||
            !productoModalActual
        ) {

            return;
        }


        const favorito =
            esFavorito(
                productoModalActual.id
            );


        if (favorito) {

            modalProductoFavorito.innerHTML = `

                <i class="fa-solid fa-heart"></i>
                Quitar de favoritos

            `;

            modalProductoFavorito.style.color =
                "#e00000";

        } else {

            modalProductoFavorito.innerHTML = `

                <i class="fa-regular fa-heart"></i>
                Agregar a favoritos

            `;

            modalProductoFavorito.style.color =
                "#111";
        }
    }


    /* =====================================================
       ACTUALIZAR CORAZONES
    ===================================================== */

    function actualizarCorazones() {

        document
            .querySelectorAll(
                ".btn-favorito"
            )
            .forEach(
                boton => {

                    const id =
                        boton.dataset.id;


                    const activo =
                        esFavorito(id);


                    boton.classList.toggle(
                        "favorito-activo",
                        activo
                    );


                    boton.innerHTML =
                        activo
                            ? `
                                <i class="fa-solid fa-heart"></i>
                            `
                            : `
                                <i class="fa-regular fa-heart"></i>
                            `;


                    boton.setAttribute(
                        "aria-label",
                        activo
                            ? "Quitar de favoritos"
                            : "Agregar a favoritos"
                    );
                }
            );
    }


    /* =====================================================
       EVENTOS DEL MODAL
    ===================================================== */

    if (cerrarModalProducto) {

        cerrarModalProducto.addEventListener(
            "click",
            cerrarModal
        );
    }


    if (modalProducto) {

        modalProducto.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    modalProducto
                ) {

                    cerrarModal();
                }
            }
        );
    }


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                modalProducto &&
                modalProducto.classList.contains(
                    "activo"
                )
            ) {

                cerrarModal();
            }
        }
    );


    /* =====================================================
       BOTÓN AGREGAR AL CARRITO DEL MODAL

       IMPORTANTE:
       SOLO agrega al carrito.
       NO redirige a carrito.html.
    ===================================================== */

    if (modalProductoComprar) {

        modalProductoComprar.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();


                if (
                    !productoModalActual
                ) {

                    return;
                }


                agregarAlCarrito(
                    productoModalActual
                );
            }
        );
    }


    /* =====================================================
       FAVORITO DEL MODAL
    ===================================================== */

    if (modalProductoFavorito) {

        modalProductoFavorito.addEventListener(
            "click",
            event => {

                event.preventDefault();


                if (
                    !productoModalActual
                ) {

                    return;
                }


                alternarFavorito(
                    productoModalActual
                );
            }
        );
    }


    /* =====================================================
       BOTONES DE GÉNERO

       IMPORTANTE:

       Normalizamos valores como:

       Para él
       Para ella
       Hombre
       Mujer
       Masculino
       Femenino
       Unisex

       para evitar problemas con acentos o
       diferentes valores en el HTML.
    ===================================================== */

    botonesGenero.forEach(
        boton => {

            boton.addEventListener(
                "click",
                () => {

                    botonesGenero.forEach(
                        otroBoton => {

                            otroBoton.classList.remove(
                                "active"
                            );
                        }
                    );


                    boton.classList.add(
                        "active"
                    );


                    let valorGenero =
                        String(
                            boton.dataset.genero ||
                            boton.textContent ||
                            "todos"
                        )
                            .trim()
                            .toLowerCase();


                    valorGenero =
                        valorGenero
                            .normalize("NFD")
                            .replace(
                                /[\u0300-\u036f]/g,
                                ""
                            );


                    if (
                        valorGenero ===
                        "para el" ||
                        valorGenero ===
                        "hombre" ||
                        valorGenero ===
                        "masculino" ||
                        valorGenero ===
                        "men"
                    ) {

                        generoActual =
                            "hombre";

                    } else if (
                        valorGenero ===
                        "para ella" ||
                        valorGenero ===
                        "mujer" ||
                        valorGenero ===
                        "femenino" ||
                        valorGenero ===
                        "women"
                    ) {

                        generoActual =
                            "mujer";

                    } else if (
                        valorGenero ===
                        "unisex"
                    ) {

                        generoActual =
                            "unisex";

                    } else {

                        generoActual =
                            "todos";
                    }


                    mostrarProductos();
                }
            );
        }
    );


    /* =====================================================
       BUSCADOR
    ===================================================== */

    if (buscarProducto) {

        buscarProducto.addEventListener(
            "input",
            () => {

                mostrarProductos();
            }
        );
    }


    /* =====================================================
       FILTRO CATEGORÍA
    ===================================================== */

    if (filtroCategoria) {

        filtroCategoria.addEventListener(
            "change",
            () => {

                mostrarProductos();
            }
        );
    }


    /* =====================================================
       ORDENAR
    ===================================================== */

    if (ordenarProductos) {

        ordenarProductos.addEventListener(
            "change",
            () => {

                mostrarProductos();
            }
        );
    }


    /* =====================================================
       FORMATEAR PRECIO
    ===================================================== */

    function formatearPrecio(
        precio
    ) {

        const numero =
            Number(precio) || 0;


        return numero.toLocaleString(
            "es-GT",
            {
                style: "currency",
                currency: "GTQ",
                minimumFractionDigits: 2
            }
        );
    }


    /* =====================================================
       ESCAPAR HTML
    ===================================================== */

    function escaparHTML(
        valor
    ) {

        return String(
            valor ?? ""
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
       MENSAJES
    ===================================================== */

    function mostrarMensaje(
        mensaje
    ) {

        let contenedor =
            document.querySelector(
                ".mensaje-gorras"
            );


        if (!contenedor) {

            contenedor =
                document.createElement(
                    "div"
                );


            contenedor.className =
                "mensaje-gorras";


            contenedor.style.position =
                "fixed";


            contenedor.style.left =
                "50%";


            contenedor.style.bottom =
                "90px";


            contenedor.style.transform =
                "translateX(-50%) translateY(20px)";


            contenedor.style.zIndex =
                "999999";


            contenedor.style.padding =
                "12px 18px";


            contenedor.style.background =
                "#050505";


            contenedor.style.color =
                "#fff";


            contenedor.style.borderRadius =
                "9px";


            contenedor.style.fontSize =
                "13px";


            contenedor.style.fontWeight =
                "600";


            contenedor.style.boxShadow =
                "0 8px 25px rgba(0,0,0,.2)";


            contenedor.style.opacity =
                "0";


            contenedor.style.pointerEvents =
                "none";


            contenedor.style.transition =
                "all .25s ease";


            document.body.appendChild(
                contenedor
            );
        }


        contenedor.textContent =
            mensaje;


        contenedor.style.opacity =
            "1";


        contenedor.style.transform =
            "translateX(-50%) translateY(0)";


        clearTimeout(
            contenedor._timer
        );


        contenedor._timer =
            setTimeout(
                () => {

                    contenedor.style.opacity =
                        "0";

                    contenedor.style.transform =
                        "translateX(-50%) translateY(20px)";

                },
                2200
            );
    }


    /* =====================================================
       STORAGE EVENT

       SINCRONIZAR FAVORITOS / CARRITO
    ===================================================== */

    window.addEventListener(
        "storage",
        event => {

            if (
                event.key ===
                STORAGE_FAVORITOS
            ) {

                actualizarCorazones();

                actualizarFavoritoModal();
            }


            if (
                event.key ===
                STORAGE_CARRITO
            ) {

                actualizarContadorCarrito();
            }
        }
    );


    /* =====================================================
       VISIBILITY CHANGE
    ===================================================== */

    document.addEventListener(
        "visibilitychange",
        () => {

            if (
                document.visibilityState ===
                "visible"
            ) {

                actualizarContadorCarrito();

                actualizarCorazones();

                actualizarFavoritoModal();
            }
        }
    );


    /* =====================================================
       CARGA INICIAL
    ===================================================== */

    actualizarContadorCarrito();

    cargarProductos();


    /* =====================================================
       AVISAR QUE SUPABASE ESTÁ LISTO
    ===================================================== */

    window.gorrasSupabaseListo =
        true;


    document.dispatchEvent(
        new CustomEvent(
            "gorrasSupabaseListo"
        )
    );


    /* =====================================================
       FUNCIONES GLOBALES
    ===================================================== */

    window.gorras = {

        recargar:
            cargarProductos,

        obtenerProductos:
            () => [...productos],

        obtenerFiltrados:
            () => [...productosFiltrados],

        abrirProducto:
            abrirModalProducto,

        cerrarProducto:
            cerrarModal,

        agregarCarrito:
            agregarAlCarrito,

        alternarFavorito:
            alternarFavorito,

        actualizarCarrito:
            actualizarContadorCarrito
    };


    console.log(
        "✅ DL Luxury - Gorras cargado correctamente"
    );

});
