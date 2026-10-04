/* =========================================================
   DL LUXURY

   ACCESORIOS - TIENDA / VENTAS

   SUPABASE + STORAGE

   ARCHIVO:
   accesorios.js

   CATEGORÍA:
   Accesorios = categoria_id 5

   STORAGE:
   productos/accesorios

   IMPORTANTE:

   - Este archivo maneja EXCLUSIVAMENTE ACCESORIOS.
   - No usa descuentos.
   - No modifica productos.
   - No usa precio_final.
   - Muestra descripción del producto.
   - Evita doble carga.
   - Evita doble clic al agregar al carrito.
   - Agregar al carrito NO redirige.

========================================================= */

if (window.__DL_LUXURY_ACCESORIOS_JS_LOADED__) {

    console.warn(
        "DL Luxury: accesorios.js ya fue cargado."
    );

} else {

    window.__DL_LUXURY_ACCESORIOS_JS_LOADED__ = true;

    document.addEventListener("DOMContentLoaded", () => {

        /* =====================================================
           CONFIGURACIÓN SUPABASE
        ===================================================== */

        const SUPABASE_URL =
            "https://brnyvkqwkosgtpugxcge.supabase.co";

        const SUPABASE_KEY =
            "sb_publishable_Qdae9GUtmuosAPP4kemF3A_Vr4HFo0n";

        const CATEGORIA_ACCESORIOS = 5;

        const STORAGE_BUCKET = "productos";

        const STORAGE_CARPETA = "accesorios";


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

        window.accesoriosSupabase =
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

        let agregandoAlCarrito = false;


        /* =====================================================
           PROTECCIÓN GLOBAL CARRITO
        ===================================================== */

        if (
            typeof window.__DL_LUXURY_ACCESORIOS_CART_LOCK__ ===
            "undefined"
        ) {

            window.__DL_LUXURY_ACCESORIOS_CART_LOCK__ =
                false;
        }


        /* =====================================================
           FAVORITOS
        ===================================================== */

        function obtenerFavoritos() {

            try {

                const favoritos =
                    JSON.parse(
                        localStorage.getItem(
                            "dlLuxuryFavoritos"
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


        function guardarFavoritos(favoritos) {

            localStorage.setItem(
                "dlLuxuryFavoritos",
                JSON.stringify(favoritos)
            );
        }


        function esFavorito(id) {

            const favoritos =
                obtenerFavoritos();

            return favoritos.some(
                favorito =>
                    String(
                        favorito.id ??
                        favorito
                    ) ===
                    String(id)
            );
        }


        function alternarFavorito(producto) {

            if (
                !producto ||
                !producto.id
            ) {
                return;
            }

            if (
                Number(producto.categoria_id) !==
                CATEGORIA_ACCESORIOS
            ) {

                console.warn(
                    "DL Luxury: producto fuera de accesorios."
                );

                return;
            }

            let favoritos =
                obtenerFavoritos();

            const indice =
                favoritos.findIndex(
                    favorito =>
                        String(
                            favorito.id ??
                            favorito
                        ) ===
                        String(
                            producto.id
                        )
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

                    descripcion:
                        producto.descripcion || "",

                    precio:
                        producto.precio,

                    imagen:
                        obtenerURLImagen(
                            producto.imagen
                        ),

                    genero:
                        producto.genero,

                    categoria_id:
                        CATEGORIA_ACCESORIOS

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
                            "dlLuxuryCarrito"
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


        function guardarCarrito(carrito) {

            localStorage.setItem(
                "dlLuxuryCarrito",
                JSON.stringify(carrito)
            );
        }


        /* =====================================================
           AGREGAR AL CARRITO
        ===================================================== */

        function agregarAlCarrito(producto) {

            if (
                agregandoAlCarrito ||
                window.__DL_LUXURY_ACCESORIOS_CART_LOCK__
            ) {

                return false;
            }

            if (
                !producto ||
                !producto.id
            ) {

                return false;
            }

            if (
                Number(producto.categoria_id) !==
                CATEGORIA_ACCESORIOS
            ) {

                console.warn(
                    "DL Luxury: el producto no pertenece a accesorios."
                );

                return false;
            }

            agregandoAlCarrito = true;

            window.__DL_LUXURY_ACCESORIOS_CART_LOCK__ =
                true;

            try {

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

                if (indice >= 0) {

                    const cantidadActual =
                        Number(
                            carrito[indice].cantidad
                        ) || 0;

                    if (
                        cantidadActual >=
                        stock
                    ) {

                        mostrarMensaje(
                            "No hay más stock disponible"
                        );

                        return false;
                    }

                    carrito[indice].cantidad =
                        cantidadActual + 1;

                } else {

                    carrito.push({

                        id:
                            producto.id,

                        nombre:
                            producto.nombre,

                        descripcion:
                            producto.descripcion || "",

                        precio:
                            Number(
                                producto.precio
                            ) || 0,

                        imagen:
                            obtenerURLImagen(
                                producto.imagen
                            ),

                        stock:
                            stock,

                        genero:
                            producto.genero || "",

                        categoria_id:
                            CATEGORIA_ACCESORIOS,

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

            } finally {

                setTimeout(
                    () => {

                        agregandoAlCarrito =
                            false;

                        window.__DL_LUXURY_ACCESORIOS_CART_LOCK__ =
                            false;

                    },
                    500
                );
            }
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

            contador.style.display =
                cantidad > 0
                    ? "flex"
                    : "none";
        }


        /* =====================================================
           URL IMAGEN
        ===================================================== */

        function obtenerURLImagen(imagen) {

            const PLACEHOLDER =
                "https://placehold.co/600x700?text=Sin+imagen";

            if (!imagen) {
                return PLACEHOLDER;
            }

            let valor =
                String(imagen).trim();

            if (!valor) {
                return PLACEHOLDER;
            }

            if (
                valor.startsWith("http://") ||
                valor.startsWith("https://")
            ) {

                return valor;
            }

            let ruta = valor;

            ruta =
                ruta.replace(/^\/+/, "");

            const marcadorStorage =
                "/storage/v1/object/public/";

            if (
                ruta.includes(
                    marcadorStorage
                )
            ) {

                ruta =
                    ruta.split(
                        marcadorStorage
                    )[1];
            }

            ruta =
                ruta.replace(/^\/+/, "");

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

            if (
                !ruta.includes("/")
            ) {

                ruta =
                    `${STORAGE_CARPETA}/${ruta}`;
            }

            if (
                ruta.startsWith(
                    "productos/accesorios/"
                )
            ) {

                ruta =
                    ruta.substring(
                        "productos/".length
                    );
            }

            if (
                !ruta.startsWith(
                    `${STORAGE_CARPETA}/`
                )
            ) {

                ruta =
                    `${STORAGE_CARPETA}/${ruta}`;
            }

            return (
                `${SUPABASE_URL}/storage/v1/object/public/` +
                `${STORAGE_BUCKET}/${ruta}`
            );
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
                    grid-column:1/-1;
                    padding:40px 20px;
                    text-align:center;
                    color:#777;
                ">
                    Cargando accesorios...
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
                            CATEGORIA_ACCESORIOS
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
                        ? data.filter(
                            producto =>
                                Number(
                                    producto.categoria_id
                                ) ===
                                CATEGORIA_ACCESORIOS
                        )
                        : [];

                productosFiltrados =
                    [...productos];

                mostrarProductos();

            } catch (error) {

                console.error(
                    "Error cargando accesorios:",
                    error
                );

                productos = [];

                productosFiltrados = [];

                productosTienda.innerHTML = `
                    <div style="
                        grid-column:1/-1;
                        padding:50px 20px;
                        text-align:center;
                        color:#d00000;
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
                            No se pudieron cargar los accesorios
                        </strong>

                        <p style="
                            margin-top:8px;
                            font-size:13px;
                            color:#777;
                        ">
                            Revisa tu conexión e
                            inténtalo nuevamente.
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
           
           TODOS:
           Hombre + Mujer + Unisex

           PARA ÉL:
           Hombre + Unisex

           PARA ELLA:
           Mujer + Unisex

           UNISEX:
           Solamente Unisex
        ===================================================== */

        function normalizarGenero(valor) {

            let texto =
                String(valor || "todos")
                    .trim()
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(
                        /[\u0300-\u036f]/g,
                        ""
                    );

            if (
                texto === "para el" ||
                texto === "hombre" ||
                texto === "masculino" ||
                texto === "men"
            ) {

                return "hombre";
            }

            if (
                texto === "para ella" ||
                texto === "mujer" ||
                texto === "femenino" ||
                texto === "women"
            ) {

                return "mujer";
            }

            if (
                texto === "unisex"
            ) {

                return "unisex";
            }

            return "todos";
        }


        /* =====================================================
           FILTROS
        ===================================================== */

        function aplicarFiltros() {

            let resultado =
                [...productos];


            /* =================================================
               GÉNERO
            ================================================= */

            if (
                generoActual !== "todos"
            ) {

                resultado =
                    resultado.filter(
                        producto => {

                            const generoProducto =
                                normalizarGenero(
                                    producto.genero
                                );


                            /* PARA ÉL */

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


                            /* PARA ELLA */

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


                            /* UNISEX */

                            if (
                                generoActual ===
                                "unisex"
                            ) {

                                return (
                                    generoProducto ===
                                    "unisex"
                                );
                            }

                            return true;
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
                    "accesorios"
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
                            Number(a.precio || 0) -
                            Number(b.precio || 0)
                    );

                    break;


                case "precio-mayor":

                    resultado.sort(
                        (a, b) =>
                            Number(b.precio || 0) -
                            Number(a.precio || 0)
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

            productosTienda.innerHTML = "";

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

                    productosTienda.appendChild(
                        crearTarjetaProducto(
                            producto
                        )
                    );
                }
            );

            actualizarCorazones();
        }


        /* =====================================================
           CREAR TARJETA
        ===================================================== */

        function crearTarjetaProducto(producto) {

            const tarjeta =
                document.createElement(
                    "article"
                );

            tarjeta.className =
                "producto-card";

            tarjeta.dataset.id =
                producto.id;

            const stock =
                Number(
                    producto.stock
                ) || 0;

            const precio =
                Number(
                    producto.precio
                ) || 0;

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


            /* DESCRIPCIÓN */

            const descripcion =
                producto.descripcion &&
                    String(
                        producto.descripcion
                    ).trim()
                    ? String(
                        producto.descripcion
                    ).trim()
                    : "Sin descripción disponible.";


            tarjeta.innerHTML = `
                <div class="producto-imagen-container">

                    <img
                        class="producto-imagen"
                        src="${escaparHTML(imagen)}"
                        alt="${escaparHTML(
                producto.nombre ||
                "Accesorio"
            )}"
                        loading="lazy"
                        onerror="
                            this.onerror=null;
                            this.src='https://placehold.co/600x700?text=Sin+imagen';
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
                    descripcion
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

                        event.preventDefault();

                        event.stopPropagation();

                        alternarFavorito(
                            producto
                        );
                    }
                );
            }


            /* =================================================
               BOTÓN AGREGAR AL CARRITO

               NO REDIRIGE A carrito.html
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

        function obtenerTextoGenero(genero) {

            const valor =
                normalizarGenero(
                    genero
                );

            if (
                valor === "hombre"
            ) {

                return "Accesorios para él";
            }

            if (
                valor === "mujer"
            ) {

                return "Accesorios para ella";
            }

            if (
                valor === "unisex"
            ) {

                return "Accesorios unisex";
            }

            return genero
                ? String(genero)
                : "Accesorios";
        }


        /* =====================================================
           MODAL PRODUCTO
        ===================================================== */

        function abrirModalProducto(producto) {

            if (!modalProducto) {
                return;
            }

            if (
                !producto ||
                Number(producto.categoria_id) !==
                CATEGORIA_ACCESORIOS
            ) {

                return;
            }

            productoModalActual =
                producto;


            const imagen =
                obtenerURLImagen(
                    producto.imagen
                );

            const precio =
                Number(
                    producto.precio
                ) || 0;

            const stock =
                Number(
                    producto.stock
                ) || 0;


            /* IMAGEN */

            if (
                modalProductoImagen
            ) {

                modalProductoImagen.src =
                    imagen;

                modalProductoImagen.alt =
                    producto.nombre ||
                    "Accesorio";

                modalProductoImagen.onerror =
                    function () {

                        this.onerror =
                            null;

                        this.src =
                            "https://placehold.co/600x700?text=Sin+imagen";
                    };
            }


            /* NOMBRE */

            if (
                modalProductoNombre
            ) {

                modalProductoNombre.textContent =
                    producto.nombre ||
                    "Sin nombre";
            }


            /* DESCRIPCIÓN */

            if (
                modalProductoDescripcion
            ) {

                const descripcion =
                    producto.descripcion &&
                        String(
                            producto.descripcion
                        ).trim()
                        ? String(
                            producto.descripcion
                        ).trim()
                        : "Sin descripción disponible.";

                modalProductoDescripcion.textContent =
                    descripcion;

                modalProductoDescripcion.style.display =
                    "block";
            }


            /* PRECIO */

            if (
                modalProductoPrecio
            ) {

                modalProductoPrecio.textContent =
                    formatearPrecio(
                        precio
                    );
            }


            /* ACCESORIOS NO USA DESCUENTOS */

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


            /* STOCK */

            if (
                modalProductoStock
            ) {

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


            /* BOTÓN CARRITO */

            if (
                modalProductoComprar
            ) {

                modalProductoComprar.disabled =
                    stock <= 0;

                modalProductoComprar.textContent =
                    stock <= 0
                        ? "Agotado"
                        : "Agregar al carrito";
            }


            /* FAVORITO */

            actualizarFavoritoModal();


            /* ABRIR */

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
                                ? `<i class="fa-solid fa-heart"></i>`
                                : `<i class="fa-regular fa-heart"></i>`;

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
           EVENTOS MODAL
        ===================================================== */

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
           AGREGAR AL CARRITO DESDE MODAL

           NO REDIRIGE A carrito.html
        ===================================================== */

        if (
            modalProductoComprar
        ) {

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
           FAVORITO MODAL
        ===================================================== */

        if (
            modalProductoFavorito
        ) {

            modalProductoFavorito.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();

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
           BOTONES GÉNERO
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


                        /*
                           IMPORTANTE:

                           Se toma primero data-genero.
                           Si no existe, se usa el texto
                           del botón.

                           Ejemplos reconocidos:

                           todos
                           Para él
                           Para ella
                           hombre
                           mujer
                           masculino
                           femenino
                           men
                           women
                           unisex
                        */

                        generoActual =
                            normalizarGenero(
                                boton.dataset.genero ||
                                boton.textContent ||
                                "todos"
                            );

                        mostrarProductos();
                    }
                );
            }
        );


        /* =====================================================
           BUSCADOR
        ===================================================== */

        if (
            buscarProducto
        ) {

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

        if (
            filtroCategoria
        ) {

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

        if (
            ordenarProductos
        ) {

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

        function formatearPrecio(precio) {

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

        function escaparHTML(valor) {

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

        function mostrarMensaje(mensaje) {

            let contenedor =
                document.querySelector(
                    ".mensaje-accesorios"
                );

            if (!contenedor) {

                contenedor =
                    document.createElement(
                        "div"
                    );

                contenedor.className =
                    "mensaje-accesorios";

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
           CARGA INICIAL
        ===================================================== */

        actualizarContadorCarrito();

        cargarProductos();


        /* =====================================================
           SUPABASE LISTO
        ===================================================== */

        window.accesoriosSupabaseListo =
            true;

        document.dispatchEvent(
            new CustomEvent(
                "accesoriosSupabaseListo"
            )
        );


        /* =====================================================
           FUNCIONES GLOBALES
        ===================================================== */

        window.accesorios = {

            recargar:
                cargarProductos,

            obtenerProductos:
                () => [
                    ...productos
                ],

            obtenerFiltrados:
                () => [
                    ...productosFiltrados
                ],

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

    });

}
