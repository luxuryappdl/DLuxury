
/* =========================================================
   DL LUXURY
   FAVORITOS - TIENDA

   ARCHIVO:
   favoritos.js

   FUNCIONES:
   - Cargar favoritos desde localStorage
   - Consultar productos en Supabase
   - Mostrar favoritos de TODAS las categorías
   - Gorras
   - Playeras
   - Hoodies
   - Perfumes
   - Accesorios
   - Descuentos
   - Abrir modal
   - Quitar favoritos
   - Agregar al carrito
   - Contador de favoritos
   - Contador de carrito
   - Limpiar todos los favoritos
   - Imágenes desde Supabase Storage
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
            "❌ DL Luxury: Supabase no está cargado."
        );
        return;
    }

    const supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );

    window.favoritosSupabase = supabaseClient;


    /* =====================================================
       STORAGE
    ===================================================== */

    const BUCKET = "productos";

    const STORAGE_FAVORITOS =
        "dlLuxuryFavoritos";

    const STORAGE_CARRITO =
        "dlLuxuryCarrito";


    /* =====================================================
       CATEGORÍAS

       IMPORTANTE:
       Estos IDs deben coincidir con tu tabla
       categorias en Supabase.
    ===================================================== */

    const CATEGORIAS = {

        1: {
            nombre: "Gorras",
            carpeta: "gorras"
        },

        2: {
            nombre: "Playeras",
            carpeta: "playeras"
        },

        3: {
            nombre: "Hoodies",
            carpeta: "hoodies"
        },

        4: {
            nombre: "Perfumes",
            carpeta: "perfumes"
        },

        5: {
            nombre: "Accesorios",
            carpeta: "accesorios"
        },

        6: {
            nombre: "Descuentos",
            carpeta: "descuentos"
        }

    };


    /* =====================================================
       VARIABLES
    ===================================================== */

    let productos = [];

    let favoritos = [];

    let productoModalActual = null;


    /* =====================================================
       ELEMENTOS HTML
    ===================================================== */

    const favoritosContainer =
        document.getElementById(
            "favoritosContainer"
        );

    const contadorFavoritos =
        document.getElementById(
            "contadorFavoritos"
        );

    const textoResultados =
        document.getElementById(
            "textoResultados"
        );

    const sinFavoritos =
        document.getElementById(
            "sinFavoritos"
        );

    const limpiarFavoritos =
        document.getElementById(
            "limpiarFavoritos"
        );

    const contadorCarrito =
        document.getElementById(
            "contadorCarrito"
        );


    /* =====================================================
       MODAL
    ===================================================== */

    const modalProducto =
        document.getElementById(
            "modalProducto"
        );

    const cerrarModal =
        document.getElementById(
            "cerrarModal"
        );

    const modalImagen =
        document.getElementById(
            "modalImagen"
        );

    const modalNombre =
        document.getElementById(
            "modalNombre"
        );

    const modalCategoria =
        document.getElementById(
            "modalCategoria"
        );

    const modalDescripcion =
        document.getElementById(
            "modalDescripcion"
        );

    const modalPrecio =
        document.getElementById(
            "modalPrecio"
        );

    const modalStock =
        document.getElementById(
            "modalStock"
        );

    const modalAgregarCarrito =
        document.getElementById(
            "modalAgregarCarrito"
        );

    const modalQuitarFavorito =
        document.getElementById(
            "modalQuitarFavorito"
        );


    /* =====================================================
       INICIO
    ===================================================== */

    console.log(
        "========================================"
    );

    console.log(
        "❤️ DL LUXURY - FAVORITOS"
    );

    console.log(
        "========================================"
    );


    favoritos = obtenerFavoritos();

    actualizarContadorFavoritos();

    actualizarContadorCarrito();

    await cargarProductos();

    mostrarFavoritos();


    /* =====================================================
       OBTENER FAVORITOS
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

            const lista =
                JSON.parse(datos);

            if (!Array.isArray(lista)) {
                return [];
            }

            return lista;

        } catch (error) {

            console.error(
                "❌ Error leyendo favoritos:",
                error
            );

            return [];
        }
    }


    /* =====================================================
       OBTENER ID DEL FAVORITO

       Permite favoritos guardados como:

       123

       o:

       {
           id: 123,
           nombre: "Gorra"
       }
    ===================================================== */

    function obtenerIdFavorito(favorito) {

        if (
            favorito &&
            typeof favorito === "object"
        ) {

            return favorito.id;
        }

        return favorito;
    }


    /* =====================================================
       GUARDAR FAVORITOS
    ===================================================== */

    function guardarFavoritos() {

        try {

            localStorage.setItem(
                STORAGE_FAVORITOS,
                JSON.stringify(favoritos)
            );

        } catch (error) {

            console.error(
                "❌ Error guardando favoritos:",
                error
            );
        }
    }


    /* =====================================================
       CARGAR TODOS LOS PRODUCTOS

       NO SE FILTRA categoria_id.

       Se cargan:

       - Gorras
       - Playeras
       - Hoodies
       - Perfumes
       - Accesorios
       - Descuentos
    ===================================================== */

    async function cargarProductos() {

        try {

            console.log(
                "🔄 Cargando todos los productos..."
            );

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
                        descuento,
                        precio_final,
                        stock,
                        imagen,
                        activo,
                        categoria_id,
                        creado_en
                    `)
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
                    "❌ Error Supabase:",
                    error
                );

                productos = [];

                mostrarMensaje(
                    "No se pudieron cargar los productos."
                );

                return;
            }

            productos =
                Array.isArray(data)
                    ? data
                    : [];

            console.log(
                "✅ Productos cargados:",
                productos.length
            );

            console.log(
                "❤️ Favoritos guardados:",
                favoritos
            );

            productos.forEach(
                function (producto) {

                    console.log(
                        "Producto:",
                        producto.nombre,
                        "| Categoría:",
                        obtenerNombreCategoria(
                            producto.categoria_id
                        )
                    );

                }
            );

        } catch (error) {

            console.error(
                "❌ Error cargando productos:",
                error
            );

            productos = [];

            mostrarMensaje(
                "Error cargando productos."
            );
        }
    }


    /* =====================================================
       MOSTRAR FAVORITOS
    ===================================================== */

    function mostrarFavoritos() {

        if (!favoritosContainer) {

            console.error(
                "❌ No existe #favoritosContainer"
            );

            return;
        }

        favoritos =
            obtenerFavoritos();


        /* =================================================
           PRODUCTOS FAVORITOS

           Se compara usando el ID real,
           aunque localStorage tenga objetos.
        ================================================= */

        const productosFavoritos =
            productos.filter(
                function (producto) {

                    return favoritos.some(
                        function (favorito) {

                            const idFavorito =
                                obtenerIdFavorito(
                                    favorito
                                );

                            return (
                                String(idFavorito) ===
                                String(producto.id)
                            );

                        }
                    );

                }
            );


        /* =================================================
           CONTADOR
        ================================================= */

        actualizarContadorFavoritos();


        if (textoResultados) {

            const cantidad =
                productosFavoritos.length;

            textoResultados.textContent =
                cantidad === 1
                    ? "1 producto"
                    : `${cantidad} productos`;
        }


        /* =================================================
           SIN FAVORITOS
        ================================================= */

        if (
            productosFavoritos.length === 0
        ) {

            favoritosContainer.innerHTML = "";

            if (sinFavoritos) {

                sinFavoritos.style.display =
                    "flex";
            }

            return;
        }


        if (sinFavoritos) {

            sinFavoritos.style.display =
                "none";
        }


        favoritosContainer.innerHTML = "";


        /* =================================================
           MANTENER ORDEN DE FAVORITOS
        ================================================= */

        const productosOrdenados =
            favoritos
                .map(
                    function (favorito) {

                        const id =
                            obtenerIdFavorito(
                                favorito
                            );

                        return productos.find(
                            function (producto) {

                                return (
                                    String(producto.id) ===
                                    String(id)
                                );

                            }
                        );

                    }
                )
                .filter(Boolean);


        /* =================================================
           CREAR TARJETAS
        ================================================= */

        productosOrdenados.forEach(
            function (producto) {

                const tarjeta =
                    crearTarjetaFavorito(
                        producto
                    );

                favoritosContainer.appendChild(
                    tarjeta
                );
            }
        );
    }


    /* =====================================================
       CREAR TARJETA FAVORITO
    ===================================================== */

    function crearTarjetaFavorito(
        producto
    ) {

        const tarjeta =
            document.createElement(
                "article"
            );

        tarjeta.className =
            "favorito-card";

        tarjeta.dataset.id =
            producto.id;


        const imagenURL =
            obtenerURLImagen(
                producto.imagen,
                producto.categoria_id
            );


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


        const genero =
            String(
                producto.genero || ""
            ).trim();


        const categoria =
            obtenerNombreCategoria(
                producto.categoria_id
            );


        const precio =
            obtenerPrecioProducto(
                producto
            );


        tarjeta.innerHTML = `

            <div class="favorito-imagen-container">

                <img
                    class="favorito-imagen"
                    src="${escapeHTML(imagenURL)}"
                    alt="${escapeHTML(
            producto.nombre ||
            "Producto"
        )}"
                    loading="lazy"
                >

                <button
                    type="button"
                    class="favorito-quitar"
                    title="Quitar de favoritos"
                    data-id="${escapeHTML(
            producto.id
        )}"
                >
                    <i class="fa-solid fa-heart"></i>
                </button>

            </div>


            <div class="favorito-info">

                <span class="favorito-categoria">
                    ${escapeHTML(categoria)}
                </span>


                ${genero
                ? `
                            <span class="favorito-genero">
                                ${escapeHTML(genero)}
                            </span>
                        `
                : ""
            }


                <h3 class="favorito-nombre">
                    ${escapeHTML(
                producto.nombre ||
                "Producto"
            )}
                </h3>


                ${producto.descripcion
                ? `
                            <p class="favorito-descripcion">
                                ${escapeHTML(
                    producto.descripcion
                )}
                            </p>
                        `
                : ""
            }


                <div class="favorito-precio">
                    Q${formatearPrecio(precio)}
                </div>


                <div class="favorito-stock ${claseStock}">
                    ${escapeHTML(textoStock)}
                </div>


                <button
                    type="button"
                    class="favorito-comprar"
                    data-id="${escapeHTML(
                producto.id
            )}"
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
           ERROR DE IMAGEN
        ================================================= */

        const imagen =
            tarjeta.querySelector(
                ".favorito-imagen"
            );

        if (imagen) {

            imagen.addEventListener(
                "error",
                function () {

                    this.onerror = null;

                    this.src =
                        "https://placehold.co/600x700?text=Sin+imagen";
                }
            );
        }


        /* =================================================
           CLICK EN TARJETA
        ================================================= */

        tarjeta.addEventListener(
            "click",
            function (evento) {

                if (
                    evento.target.closest(
                        ".favorito-quitar"
                    )
                ) {
                    return;
                }

                if (
                    evento.target.closest(
                        ".favorito-comprar"
                    )
                ) {
                    return;
                }

                abrirModal(
                    producto
                );
            }
        );


        /* =================================================
           QUITAR FAVORITO
        ================================================= */

        const botonQuitar =
            tarjeta.querySelector(
                ".favorito-quitar"
            );

        if (botonQuitar) {

            botonQuitar.addEventListener(
                "click",
                function (evento) {

                    evento.stopPropagation();

                    quitarFavorito(
                        producto.id
                    );
                }
            );
        }


        /* =================================================
           AGREGAR AL CARRITO
        ================================================= */

        const botonComprar =
            tarjeta.querySelector(
                ".favorito-comprar"
            );

        if (botonComprar) {

            botonComprar.addEventListener(
                "click",
                function (evento) {

                    evento.stopPropagation();

                    agregarAlCarrito(
                        producto
                    );
                }
            );
        }


        return tarjeta;
    }


    /* =====================================================
       OBTENER PRECIO

       Para descuentos utiliza:

       precio_final

       Si no existe, calcula:

       precio - descuento %
    ===================================================== */

    function obtenerPrecioProducto(
        producto
    ) {

        const precioFinal =
            Number(
                producto.precio_final
            );

        if (
            Number.isFinite(precioFinal) &&
            precioFinal > 0
        ) {

            return precioFinal;
        }


        const precio =
            Number(
                producto.precio || 0
            );

        const descuento =
            Number(
                producto.descuento || 0
            );


        if (
            descuento > 0 &&
            descuento <= 100
        ) {

            return (
                precio -
                (
                    precio *
                    descuento /
                    100
                )
            );
        }


        return precio;
    }


    /* =====================================================
       OBTENER URL IMAGEN

       Soporta:

       imagen.jpg

       gorras/imagen.jpg

       productos/gorras/imagen.jpg

       URL completa de Supabase

       URL externa
    ===================================================== */

    function obtenerURLImagen(
        valor,
        categoriaId
    ) {

        const PLACEHOLDER =
            "https://placehold.co/600x700?text=Sin+imagen";


        if (!valor) {
            return PLACEHOLDER;
        }


        let ruta =
            String(valor).trim();


        if (!ruta) {
            return PLACEHOLDER;
        }


        /* URL completa */

        if (
            ruta.startsWith("http://") ||
            ruta.startsWith("https://") ||
            ruta.startsWith("data:image/")
        ) {

            return ruta;
        }


        /* Quitar slash inicial */

        ruta =
            ruta.replace(
                /^\/+/,
                ""
            );


        /* =================================================
           SI YA VIENE COMO URL DE STORAGE
        ================================================= */

        const marcador =
            "/storage/v1/object/public/";


        if (
            ruta.includes(
                marcador
            )
        ) {

            const posicion =
                ruta.indexOf(
                    marcador
                );


            ruta =
                ruta.substring(
                    posicion +
                    marcador.length
                );


            if (
                ruta.startsWith(
                    `${BUCKET}/`
                )
            ) {

                return (
                    `${SUPABASE_URL}/storage/v1/object/public/${ruta}`
                );
            }


            return (
                `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${ruta}`
            );
        }


        /* =================================================
           SI VIENE COMO productos/...
        ================================================= */

        if (
            ruta.startsWith(
                `${BUCKET}/`
            )
        ) {

            ruta =
                ruta.substring(
                    `${BUCKET}/`.length
                );
        }


        /* =================================================
           OBTENER CARPETA
        ================================================= */

        const categoria =
            CATEGORIAS[
            Number(categoriaId)
            ];


        const carpeta =
            categoria
                ? categoria.carpeta
                : "";


        /* =================================================
           SI YA VIENE CON CARPETA
        ================================================= */

        if (
            carpeta &&
            ruta.startsWith(
                `${carpeta}/`
            )
        ) {

            return (
                `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${ruta}`
            );
        }


        /* =================================================
           SI SOLO VIENE NOMBRE
        ================================================= */

        if (
            carpeta &&
            !ruta.includes("/")
        ) {

            ruta =
                `${carpeta}/${ruta}`;
        }


        return (
            `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${ruta}`
        );
    }


    /* =====================================================
       QUITAR FAVORITO
    ===================================================== */

    function quitarFavorito(
        id
    ) {

        favoritos =
            obtenerFavoritos();


        favoritos =
            favoritos.filter(
                function (favorito) {

                    const idFavorito =
                        obtenerIdFavorito(
                            favorito
                        );

                    return (
                        String(idFavorito) !==
                        String(id)
                    );
                }
            );


        guardarFavoritos();

        actualizarContadorFavoritos();

        mostrarFavoritos();


        if (
            productoModalActual &&
            String(
                productoModalActual.id
            ) ===
            String(id)
        ) {

            cerrarModalProducto();
        }


        mostrarMensaje(
            "Producto eliminado de favoritos."
        );


        document.dispatchEvent(
            new CustomEvent(
                "favoritosActualizados"
            )
        );
    }


    /* =====================================================
       LIMPIAR TODOS LOS FAVORITOS
    ===================================================== */

    if (limpiarFavoritos) {

        limpiarFavoritos.addEventListener(
            "click",
            function () {

                favoritos =
                    obtenerFavoritos();


                if (
                    favoritos.length === 0
                ) {

                    mostrarMensaje(
                        "No tienes favoritos para eliminar."
                    );

                    return;
                }


                const confirmar =
                    confirm(
                        "¿Quieres eliminar todos tus favoritos?"
                    );


                if (!confirmar) {
                    return;
                }


                favoritos = [];

                guardarFavoritos();

                actualizarContadorFavoritos();

                mostrarFavoritos();


                mostrarMensaje(
                    "Todos los favoritos fueron eliminados."
                );


                document.dispatchEvent(
                    new CustomEvent(
                        "favoritosActualizados"
                    )
                );
            }
        );
    }


    /* =====================================================
       CONTADOR FAVORITOS
    ===================================================== */

    function actualizarContadorFavoritos() {

        if (!contadorFavoritos) {
            return;
        }


        favoritos =
            obtenerFavoritos();


        contadorFavoritos.textContent =
            favoritos.length;


        contadorFavoritos.style.display =
            favoritos.length > 0
                ? "flex"
                : "none";
    }


    /* =====================================================
       ABRIR MODAL
    ===================================================== */

    function abrirModal(
        producto
    ) {

        if (!modalProducto) {
            return;
        }


        productoModalActual =
            producto;


        /* IMAGEN */

        if (modalImagen) {

            modalImagen.src =
                obtenerURLImagen(
                    producto.imagen,
                    producto.categoria_id
                );

            modalImagen.alt =
                producto.nombre ||
                "Producto";


            modalImagen.onerror =
                function () {

                    this.onerror = null;

                    this.src =
                        "https://placehold.co/600x700?text=Sin+imagen";
                };
        }


        /* CATEGORÍA */

        if (modalCategoria) {

            modalCategoria.textContent =
                obtenerNombreCategoria(
                    producto.categoria_id
                );
        }


        /* NOMBRE */

        if (modalNombre) {

            modalNombre.textContent =
                producto.nombre ||
                "Producto";
        }


        /* DESCRIPCIÓN */

        if (modalDescripcion) {

            modalDescripcion.textContent =
                producto.descripcion ||
                "Sin descripción disponible.";
        }


        /* PRECIO */

        if (modalPrecio) {

            modalPrecio.textContent =
                `Q${formatearPrecio(
                    obtenerPrecioProducto(
                        producto
                    )
                )}`;
        }


        /* STOCK */

        if (modalStock) {

            const stock =
                Number(
                    producto.stock || 0
                );


            modalStock.textContent =
                stock > 0
                    ? `${stock} disponibles`
                    : "Agotado";
        }


        /* BOTÓN CARRITO */

        if (modalAgregarCarrito) {

            const stock =
                Number(
                    producto.stock || 0
                );


            modalAgregarCarrito.disabled =
                stock <= 0;


            modalAgregarCarrito.innerHTML =
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


        /* BOTÓN FAVORITO */

        if (modalQuitarFavorito) {

            modalQuitarFavorito.innerHTML = `
                <i class="fa-solid fa-heart"></i>
                Quitar de favoritos
            `;
        }


        /* MOSTRAR */

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

    function cerrarModalProducto() {

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
       BOTÓN CERRAR
    ===================================================== */

    if (cerrarModal) {

        cerrarModal.addEventListener(
            "click",
            cerrarModalProducto
        );
    }


    /* =====================================================
       CLICK FUERA DEL MODAL
    ===================================================== */

    if (modalProducto) {

        modalProducto.addEventListener(
            "click",
            function (evento) {

                if (
                    evento.target ===
                    modalProducto
                ) {

                    cerrarModalProducto();
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

                cerrarModalProducto();
            }
        }
    );


    /* =====================================================
       AGREGAR AL CARRITO DESDE MODAL
    ===================================================== */

    if (modalAgregarCarrito) {

        modalAgregarCarrito.addEventListener(
            "click",
            function () {

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
       QUITAR FAVORITO DESDE MODAL
    ===================================================== */

    if (modalQuitarFavorito) {

        modalQuitarFavorito.addEventListener(
            "click",
            function () {

                if (
                    !productoModalActual
                ) {
                    return;
                }


                const id =
                    productoModalActual.id;


                quitarFavorito(id);
            }
        );
    }


    /* =====================================================
       AGREGAR AL CARRITO
    ===================================================== */

    function agregarAlCarrito(
        producto
    ) {

        if (!producto) {
            return;
        }


        const stock =
            Number(
                producto.stock || 0
            );


        if (stock <= 0) {

            mostrarMensaje(
                "Este producto está agotado."
            );

            return;
        }


        let carrito =
            obtenerCarrito();


        const existente =
            carrito.find(
                function (item) {

                    return (
                        String(item.id) ===
                        String(producto.id)
                    );
                }
            );


        if (existente) {

            const cantidadActual =
                Number(
                    existente.cantidad || 0
                );


            if (
                cantidadActual >= stock
            ) {

                mostrarMensaje(
                    "No puedes agregar más unidades de este producto."
                );

                return;
            }


            existente.cantidad =
                cantidadActual + 1;

        } else {

            carrito.push({

                id:
                    producto.id,

                nombre:
                    producto.nombre,

                precio:
                    obtenerPrecioProducto(
                        producto
                    ),

                precioOriginal:
                    Number(
                        producto.precio || 0
                    ),

                descuento:
                    Number(
                        producto.descuento || 0
                    ),

                imagen:
                    obtenerURLImagen(
                        producto.imagen,
                        producto.categoria_id
                    ),

                stock:
                    stock,

                cantidad:
                    1,

                categoria_id:
                    producto.categoria_id,

                genero:
                    producto.genero || "",

                descripcion:
                    producto.descripcion || ""
            });
        }


        guardarCarrito(
            carrito
        );


        actualizarContadorCarrito();


        mostrarMensaje(
            "Producto agregado al carrito."
        );


        document.dispatchEvent(
            new CustomEvent(
                "carritoActualizado"
            )
        );
    }


    /* =====================================================
       OBTENER CARRITO
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


    /* =====================================================
       GUARDAR CARRITO
    ===================================================== */

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

        if (!contadorCarrito) {
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
       NOMBRE CATEGORÍA
    ===================================================== */

    function obtenerNombreCategoria(
        categoriaId
    ) {

        const categoria =
            CATEGORIAS[
            Number(categoriaId)
            ];


        return categoria
            ? categoria.nombre
            : "Producto";
    }


    /* =====================================================
       FORMATEAR PRECIO
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
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
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
       MENSAJE
    ===================================================== */

    function mostrarMensaje(
        mensaje
    ) {

        const existente =
            document.querySelector(
                ".mensaje-favoritos"
            );


        if (existente) {
            existente.remove();
        }


        const elemento =
            document.createElement(
                "div"
            );


        elemento.className =
            "mensaje-favoritos";


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
       EVENTO STORAGE

       Se ejecuta cuando cambian favoritos
       o carrito desde otra página.
    ===================================================== */

    window.addEventListener(
        "storage",
        function (evento) {

            if (
                evento.key ===
                STORAGE_FAVORITOS
            ) {

                favoritos =
                    obtenerFavoritos();

                actualizarContadorFavoritos();

                mostrarFavoritos();
            }


            if (
                evento.key ===
                STORAGE_CARRITO
            ) {

                actualizarContadorCarrito();
            }
        }
    );


    /* =====================================================
       EVENTO PERSONALIZADO
    ===================================================== */

    document.addEventListener(
        "favoritosActualizados",
        function () {

            favoritos =
                obtenerFavoritos();

            actualizarContadorFavoritos();

            mostrarFavoritos();
        }
    );


    /* =====================================================
       EVENTO CARRITO
    ===================================================== */

    document.addEventListener(
        "carritoActualizado",
        function () {

            actualizarContadorCarrito();
        }
    );


    /* =====================================================
       FUNCIONES GLOBALES
    ===================================================== */

    window.recargarFavoritos =
        async function () {

            favoritos =
                obtenerFavoritos();

            await cargarProductos();

            mostrarFavoritos();
        };


    window.actualizarFavoritos =
        function () {

            favoritos =
                obtenerFavoritos();

            actualizarContadorFavoritos();

            mostrarFavoritos();
        };


    window.abrirFavorito =
        function (id) {

            const producto =
                productos.find(
                    function (item) {

                        return (
                            String(item.id) ===
                            String(id)
                        );
                    }
                );


            if (producto) {

                abrirModal(
                    producto
                );
            }
        };


    /* =====================================================
       ACTUALIZAR AL VOLVER A LA PÁGINA
    ===================================================== */

    document.addEventListener(
        "visibilitychange",
        async function () {

            if (
                document.visibilityState ===
                "visible"
            ) {

                favoritos =
                    obtenerFavoritos();

                actualizarContadorFavoritos();

                actualizarContadorCarrito();

                mostrarFavoritos();
            }
        }
    );


    /* =====================================================
       FINAL
    ===================================================== */

    console.log(
        "✅ Favoritos cargados correctamente."
    );

});