
/* =========================================================
   DL LUXURY

   SISTEMA DE VENTAS

   SUPABASE

   PRODUCTOS + DESCUENTOS + STOCK + HISTORIAL
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       SUPABASE
    ===================================================== */

    const SUPABASE_URL =
        "https://brnyvkqwkosgtpugxcge.supabase.co";

    const SUPABASE_ANON_KEY =
        "sb_publishable_Qdae9GUtmuosAPP4kemF3A_Vr4HFo0n";

    const SUPABASE_BUCKET =
        "productos";


    /* =====================================================
       CREAR CLIENTE SUPABASE
    ===================================================== */

    if (
        typeof window.supabase === "undefined" ||
        !window.supabase.createClient
    ) {
        console.error(
            "Supabase JS no está cargado. Verifica que supabase-js esté incluido antes de este archivo."
        );

        return;
    }

    const supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY
        );


    /* =====================================================
       CONFIGURACIÓN
    ===================================================== */

    const CLAVE_VENTAS =
        "dlLuxuryVentas";

    const CLAVE_FAVORITOS =
        "dlLuxuryFavoritos";


    /* =====================================================
       OBTENER FAVORITOS
    ===================================================== */

    function obtenerFavoritos() {

        try {

            const favoritos =
                JSON.parse(
                    localStorage.getItem(
                        CLAVE_FAVORITOS
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


    /* =====================================================
       GUARDAR FAVORITOS
    ===================================================== */

    function guardarFavoritos(favoritos) {

        try {

            localStorage.setItem(
                CLAVE_FAVORITOS,
                JSON.stringify(favoritos)
            );

        } catch (error) {

            console.error(
                "Error guardando favoritos:",
                error
            );
        }
    }


    /* =====================================================
       OBTENER PRECIO FINAL
    ===================================================== */

    function obtenerPrecioFinal(producto) {

        const precio =
            Number(producto.precio) || 0;

        const descuento =
            Number(producto.descuento) || 0;

        if (
            producto.precio_final !== null &&
            producto.precio_final !== undefined &&
            !isNaN(Number(producto.precio_final))
        ) {

            return Number(
                producto.precio_final
            );
        }

        return (
            precio -
            (precio * descuento / 100)
        );
    }


    /* =====================================================
       IMAGEN DE SUPABASE
    ===================================================== */

    function obtenerImagenURL(imagen) {

        if (!imagen) {
            return "";
        }

        const valor =
            String(imagen).trim();

        if (!valor) {
            return "";
        }

        /* Si ya es una URL completa */

        if (
            valor.startsWith("http://") ||
            valor.startsWith("https://")
        ) {

            return valor;
        }

        /* Si viene como ruta del Storage */

        const ruta =
            valor.replace(/^\/+/, "");

        return (
            SUPABASE_URL +
            "/storage/v1/object/public/" +
            SUPABASE_BUCKET +
            "/" +
            ruta
        );
    }


    /* =====================================================
       FAVORITOS
    ===================================================== */

    function cambiarFavorito(producto) {

        if (
            !producto ||
            producto.id === undefined
        ) {

            return false;
        }

        let favoritos =
            obtenerFavoritos();

        const existe =
            favoritos.some(
                item =>
                    String(item.id) ===
                    String(producto.id)
            );

        if (existe) {

            favoritos =
                favoritos.filter(
                    item =>
                        String(item.id) !==
                        String(producto.id)
                );

            guardarFavoritos(favoritos);

            return false;
        }

        const productoFavorito = {

            id:
                producto.id,

            nombre:
                producto.nombre ||
                "Producto",

            precio:
                Number(producto.precio) || 0,

            precio_final:
                obtenerPrecioFinal(producto),

            descuento:
                Number(producto.descuento) || 0,

            stock:
                Number(producto.stock) || 0,

            imagen:
                obtenerImagenURL(producto.imagen),

            categoria_id:
                producto.categoria_id || null
        };

        favoritos.push(
            productoFavorito
        );

        guardarFavoritos(
            favoritos
        );

        return true;
    }


    /* =====================================================
       ACTUALIZAR CORAZÓN
    ===================================================== */

    function actualizarCorazon(
        boton,
        activo
    ) {

        if (!boton) {
            return;
        }

        const icono =
            boton.querySelector("i");

        if (!icono) {
            return;
        }

        if (activo) {

            boton.classList.add(
                "favorito"
            );

            icono.classList.remove(
                "fa-regular"
            );

            icono.classList.add(
                "fa-solid"
            );

            boton.setAttribute(
                "aria-label",
                "Quitar de favoritos"
            );

            boton.setAttribute(
                "title",
                "Quitar de favoritos"
            );

        } else {

            boton.classList.remove(
                "favorito"
            );

            icono.classList.remove(
                "fa-solid"
            );

            icono.classList.add(
                "fa-regular"
            );

            boton.setAttribute(
                "aria-label",
                "Agregar a favoritos"
            );

            boton.setAttribute(
                "title",
                "Agregar a favoritos"
            );
        }
    }


    /* =====================================================
       FUNCIÓN GLOBAL PARA FAVORITOS
    ===================================================== */

    window.toggleFavorito =
        function (boton) {

            if (!boton) {
                return;
            }

            let producto = null;

            const id =
                boton.dataset.id;

            if (id) {

                const favoritos =
                    obtenerFavoritos();

                const encontrado =
                    favoritos.find(
                        item =>
                            String(item.id) ===
                            String(id)
                    );

                if (encontrado) {

                    producto =
                        encontrado;
                }
            }

            if (
                !producto &&
                boton.dataset.producto
            ) {

                try {

                    producto =
                        JSON.parse(
                            boton.dataset.producto
                        );

                } catch (error) {

                    console.error(
                        "Error leyendo producto favorito:",
                        error
                    );
                }
            }

            if (!producto) {

                const card =
                    boton.closest(
                        ".oferta-card"
                    );

                if (card) {

                    const nombre =
                        card.querySelector("h3");

                    const precioActual =
                        card.querySelector(
                            ".precio-actual"
                        );

                    const precioAnterior =
                        card.querySelector(
                            ".precio-anterior"
                        );

                    const imagen =
                        card.querySelector(
                            ".oferta-imagen img"
                        );

                    const descuento =
                        card.querySelector(
                            ".oferta-descuento"
                        );

                    producto = {

                        id:
                            boton.dataset.id ||
                            "oferta-" +
                            Date.now(),

                        nombre:
                            nombre
                                ? nombre.textContent.trim()
                                : "Producto",

                        precio:
                            precioAnterior
                                ? Number(
                                    precioAnterior.textContent
                                        .replace(
                                            /[^0-9.]/g,
                                            ""
                                        )
                                ) || 0
                                : 0,

                        precio_final:
                            precioActual
                                ? Number(
                                    precioActual.textContent
                                        .replace(
                                            /[^0-9.]/g,
                                            ""
                                        )
                                ) || 0
                                : 0,

                        descuento:
                            descuento
                                ? Number(
                                    descuento.textContent
                                        .replace(
                                            /[^0-9]/g,
                                            ""
                                        )
                                ) || 0
                                : 0,

                        stock: 1,

                        imagen:
                            imagen
                                ? imagen.src
                                : ""
                    };
                }
            }

            if (!producto) {

                console.error(
                    "No se pudo identificar el producto."
                );

                return;
            }

            const agregado =
                cambiarFavorito(
                    producto
                );

            actualizarCorazon(
                boton,
                agregado
            );
        };


    /* =====================================================
       OBTENER VENTAS
    ===================================================== */

    function obtenerVentas() {

        try {

            const ventas =
                JSON.parse(
                    localStorage.getItem(
                        CLAVE_VENTAS
                    )
                );

            return Array.isArray(ventas)
                ? ventas
                : [];

        } catch (error) {

            console.error(
                "Error leyendo ventas:",
                error
            );

            return [];
        }
    }


    /* =====================================================
       GUARDAR VENTAS
    ===================================================== */

    function guardarVentas(ventas) {

        try {

            localStorage.setItem(
                CLAVE_VENTAS,
                JSON.stringify(ventas)
            );

        } catch (error) {

            console.error(
                "Error guardando ventas:",
                error
            );
        }
    }


    /* =====================================================
       CARGAR PRODUCTOS DE DESCUENTOS
    ===================================================== */

    async function obtenerProductos() {

        try {

            console.log(
                "========================================"
            );

            console.log(
                "CARGANDO PRODUCTOS DESDE SUPABASE"
            );


            /* =============================================
               BUSCAR CATEGORÍA DESCUENTOS
            ============================================= */

            const {
                data: categoria,
                error: errorCategoria
            } =
                await supabaseClient
                    .from("categorias")
                    .select("id,nombre")
                    .eq(
                        "nombre",
                        "Descuentos"
                    )
                    .limit(1)
                    .maybeSingle();


            if (errorCategoria) {

                console.error(
                    "Error buscando categoría Descuentos:",
                    errorCategoria
                );

                return [];
            }


            if (!categoria) {

                console.error(
                    "No existe la categoría Descuentos."
                );

                return [];
            }


            console.log(
                "Categoría encontrada:",
                categoria
            );


            /* =============================================
               BUSCAR PRODUCTOS
            ============================================= */

            const {
                data,
                error
            } =
                await supabaseClient
                    .from("productos")
                    .select(`
                        id,
                        nombre,
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
                    .eq(
                        "categoria_id",
                        categoria.id
                    )
                    .order(
                        "creado_en",
                        {
                            ascending: false
                        }
                    );


            if (error) {

                console.error(
                    "Error cargando productos:",
                    error
                );

                return [];
            }


            console.log(
                "PRODUCTOS RECIBIDOS:",
                data
            );


            if (Array.isArray(data)) {

                data.forEach(
                    producto => {

                        console.log(
                            "================================"
                        );

                        console.log(
                            "PRODUCTO:",
                            producto.nombre
                        );

                        console.log(
                            "IMAGEN BD:",
                            producto.imagen
                        );

                        console.log(
                            "URL FINAL:",
                            obtenerImagenURL(
                                producto.imagen
                            )
                        );

                        console.log(
                            "DESCUENTO:",
                            producto.descuento
                        );

                        console.log(
                            "PRECIO FINAL:",
                            producto.precio_final
                        );
                    }
                );
            }

            return data || [];

        } catch (error) {

            console.error(
                "ERROR GENERAL:",
                error
            );

            return [];
        }
    }


    /* =====================================================
       MOSTRAR PRODUCTOS EN VENTAS
    ===================================================== */

    async function mostrarProductosVenta() {

        const contenedor =
            document.querySelector(
                "#productosVenta"
            );

        if (!contenedor) {
            return;
        }

        contenedor.innerHTML = `
            <p class="sin-productos">
                Cargando productos...
            </p>
        `;

        const productos =
            await obtenerProductos();

        const disponibles =
            productos.filter(
                producto =>
                    Number(
                        producto.stock
                    ) > 0
            );

        if (
            disponibles.length === 0
        ) {

            contenedor.innerHTML = `
                <p class="sin-productos">
                    No hay productos disponibles.
                </p>
            `;

            return;
        }

        contenedor.innerHTML = "";

        disponibles.forEach(
            producto => {

                const card =
                    crearTarjetaProducto(
                        producto
                    );

                contenedor.appendChild(
                    card
                );
            }
        );
    }


    /* =====================================================
       CREAR TARJETA PRODUCTO
    ===================================================== */

    function crearTarjetaProducto(
        producto
    ) {

        const card =
            document.createElement(
                "div"
            );

        card.className =
            "producto-card";


        const precio =
            Number(
                producto.precio
            ) || 0;

        const descuento =
            Number(
                producto.descuento
            ) || 0;

        const precioFinal =
            obtenerPrecioFinal(
                producto
            );

        const stock =
            Number(
                producto.stock
            ) || 0;

        const imagen =
            obtenerImagenURL(
                producto.imagen
            );


        let precioHTML;


        if (descuento > 0) {

            precioHTML = `
                <div class="producto-precios">

                    <span class="precio-original">
                        Q${precio.toFixed(2)}
                    </span>

                    <span class="precio-descuento">
                        Q${precioFinal.toFixed(2)}
                    </span>

                    <span class="porcentaje-descuento">
                        -${descuento}%
                    </span>

                </div>
            `;

        } else {

            precioHTML = `
                <div class="producto-precios">

                    <span class="precio-normal">
                        Q${precioFinal.toFixed(2)}
                    </span>

                </div>
            `;
        }


        /* =================================================
           IMAGEN
        ================================================= */

        const imagenHTML =
            imagen
                ? `
                    <img
                        src="${escaparHTML(imagen)}"
                        alt="${escaparHTML(
                    producto.nombre ||
                    "Producto"
                )}"
                    >
                `
                : `
                    <div class="sin-imagen">
                        <i class="fa-solid fa-image"></i>
                    </div>
                `;


        card.innerHTML = `

            <div class="producto-imagen">

                ${imagenHTML}

            </div>


            <div class="producto-info">

                <h3>
                    ${escaparHTML(
            producto.nombre ||
            "Producto"
        )}
                </h3>

                ${precioHTML}

                <p class="producto-stock">
                    Stock: ${stock}
                </p>

                <button
                    class="btn-comprar"
                    type="button"
                >
                    Comprar
                </button>

            </div>
        `;


        const boton =
            card.querySelector(
                ".btn-comprar"
            );


        if (boton) {

            boton.addEventListener(
                "click",
                function () {

                    comprarProducto(
                        producto
                    );
                }
            );
        }


        return card;
    }


    /* =====================================================
       OFERTAS DESTACADAS
    ===================================================== */

    async function mostrarOfertasDestacadas() {

        const contenedor =
            document.querySelector(
                ".ofertas-container"
            );

        if (!contenedor) {
            return;
        }

        contenedor.innerHTML = `
            <p class="cargando-ofertas">
                Cargando ofertas...
            </p>
        `;


        const productos =
            await obtenerProductos();


        const ofertas =
            productos.filter(
                producto => {

                    const descuento =
                        Number(
                            producto.descuento
                        ) || 0;

                    const stock =
                        Number(
                            producto.stock
                        ) || 0;

                    return (
                        descuento > 0 &&
                        stock > 0
                    );
                }
            );


        if (
            ofertas.length === 0
        ) {

            contenedor.innerHTML = `
                <p class="sin-ofertas">
                    No hay ofertas disponibles.
                </p>
            `;

            return;
        }


        contenedor.innerHTML = "";


        ofertas.forEach(
            producto => {

                const card =
                    crearTarjetaOferta(
                        producto
                    );

                contenedor.appendChild(
                    card
                );
            }
        );
    }


    /* =====================================================
       CREAR TARJETA OFERTA
    ===================================================== */

    function crearTarjetaOferta(
        producto
    ) {

        const card =
            document.createElement(
                "div"
            );

        card.className =
            "oferta-card";


        const precio =
            Number(
                producto.precio
            ) || 0;

        const descuento =
            Number(
                producto.descuento
            ) || 0;

        const precioFinal =
            obtenerPrecioFinal(
                producto
            );

        const stock =
            Number(
                producto.stock
            ) || 0;

        const imagen =
            obtenerImagenURL(
                producto.imagen
            );


        /* =================================================
           IMAGEN
        ================================================= */

        const imagenHTML =
            imagen
                ? `
                    <img
                        src="${escaparHTML(imagen)}"
                        alt="${escaparHTML(
                    producto.nombre ||
                    "Oferta"
                )}"
                    >
                `
                : `
                    <div class="sin-imagen">
                        <i class="fa-solid fa-image"></i>
                    </div>
                `;


        /* =================================================
           FAVORITOS
        ================================================= */

        const favoritos =
            obtenerFavoritos();

        const estaEnFavoritos =
            favoritos.some(
                item =>
                    String(item.id) ===
                    String(producto.id)
            );


        const claseFavorito =
            estaEnFavoritos
                ? "favorito"
                : "";


        const iconoFavorito =
            estaEnFavoritos
                ? "fa-solid"
                : "fa-regular";


        const textoFavorito =
            estaEnFavoritos
                ? "Quitar de favoritos"
                : "Agregar a favoritos";


        /* =================================================
           TARJETA
        ================================================= */

        card.innerHTML = `

            <div class="oferta-imagen">

                ${imagenHTML}

                <button
                    class="oferta-favorito ${claseFavorito}"
                    type="button"
                    data-id="${producto.id}"
                    aria-label="${textoFavorito}"
                    title="${textoFavorito}"
                >

                    <i
                        class="${iconoFavorito} fa-heart"
                    ></i>

                </button>

            </div>


            <div class="oferta-info">

                <span class="categoria-oferta">
                    Oferta especial
                </span>

                <h3>
                    ${escaparHTML(
            producto.nombre ||
            "Producto"
        )}
                </h3>


                <div class="precios">

                    <span class="precio-anterior">
                        Q${precio.toFixed(2)}
                    </span>

                    <span class="precio-actual">
                        Q${precioFinal.toFixed(2)}
                    </span>

                    <span class="oferta-descuento">
                        -${descuento}%
                    </span>

                </div>


                <p class="oferta-stock">
                    Stock: ${stock}
                </p>


                <button
                    type="button"
                    class="btn-comprar"
                >
                    Añadir al carrito
                </button>

            </div>
        `;


        /* =================================================
           FAVORITO
        ================================================= */

        const botonFavorito =
            card.querySelector(
                ".oferta-favorito"
            );


        if (botonFavorito) {

            botonFavorito.addEventListener(
                "click",
                function (event) {

                    event.stopPropagation();

                    const agregado =
                        cambiarFavorito(
                            producto
                        );

                    actualizarCorazon(
                        botonFavorito,
                        agregado
                    );
                }
            );
        }


        /* =================================================
           COMPRAR
        ================================================= */

        const boton =
            card.querySelector(
                ".btn-comprar"
            );


        if (boton) {

            boton.addEventListener(
                "click",
                function (event) {

                    event.stopPropagation();

                    comprarProducto(
                        producto
                    );
                }
            );
        }


        /* =================================================
           ABRIR MODAL AL TOCAR LA IMAGEN
        ================================================= */

        const imagenOferta =
            card.querySelector(
                ".oferta-imagen"
            );


        if (imagenOferta) {

            imagenOferta.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target.closest(
                            ".oferta-favorito"
                        )
                    ) {
                        return;
                    }

                    abrirModalOferta(
                        producto
                    );
                }
            );
        }


        return card;
    }


    /* =====================================================
       MODAL DE OFERTA
    ===================================================== */

    function abrirModalOferta(producto) {

        const modal =
            document.getElementById(
                "modalOferta"
            );

        if (!modal) {
            return;
        }


        const imagen =
            document.getElementById(
                "modalOfertaImagen"
            );

        const nombre =
            document.getElementById(
                "modalOfertaNombre"
            );

        const precioOriginal =
            document.getElementById(
                "modalOfertaPrecioOriginal"
            );

        const precioFinal =
            document.getElementById(
                "modalOfertaPrecio"
            );

        const descuento =
            document.getElementById(
                "modalOfertaDescuento"
            );

        const stock =
            document.getElementById(
                "modalOfertaStock"
            );

        const botonComprar =
            document.getElementById(
                "modalOfertaComprar"
            );

        const botonFavorito =
            document.getElementById(
                "modalOfertaFavorito"
            );


        const precio =
            Number(
                producto.precio
            ) || 0;

        const final =
            obtenerPrecioFinal(
                producto
            );

        const porcentaje =
            Number(
                producto.descuento
            ) || 0;

        const cantidadStock =
            Number(
                producto.stock
            ) || 0;

        const imagenURL =
            obtenerImagenURL(
                producto.imagen
            );


        /* =================================================
           INFORMACIÓN
        ================================================= */

        if (imagen) {

            imagen.src =
                imagenURL || "";

            imagen.alt =
                producto.nombre ||
                "Producto";
        }


        if (nombre) {

            nombre.textContent =
                producto.nombre ||
                "Producto";
        }


        if (precioOriginal) {

            precioOriginal.textContent =
                `Q${precio.toFixed(2)}`;
        }


        if (precioFinal) {

            precioFinal.textContent =
                `Q${final.toFixed(2)}`;
        }


        if (descuento) {

            descuento.textContent =
                `-${porcentaje}%`;
        }


        if (stock) {

            stock.textContent =
                cantidadStock;
        }


        /* =================================================
           FAVORITO DEL MODAL
        ================================================= */

        if (botonFavorito) {

            const favoritos =
                obtenerFavoritos();

            const estaEnFavoritos =
                favoritos.some(
                    item =>
                        String(item.id) ===
                        String(producto.id)
                );


            botonFavorito.innerHTML =
                estaEnFavoritos
                    ? `
                        <i class="fa-solid fa-heart"></i>
                        Quitar de favoritos
                    `
                    : `
                        <i class="fa-regular fa-heart"></i>
                        Agregar a favoritos
                    `;


            botonFavorito.classList.toggle(
                "favorito",
                estaEnFavoritos
            );


            botonFavorito.onclick =
                function () {

                    const agregado =
                        cambiarFavorito(
                            producto
                        );


                    botonFavorito.innerHTML =
                        agregado
                            ? `
                                <i class="fa-solid fa-heart"></i>
                                Quitar de favoritos
                            `
                            : `
                                <i class="fa-regular fa-heart"></i>
                                Agregar a favoritos
                            `;


                    botonFavorito.classList.toggle(
                        "favorito",
                        agregado
                    );


                    /* Actualizar corazón de la tarjeta */

                    const tarjeta =
                        document.querySelector(
                            `.oferta-card .oferta-favorito[data-id="${producto.id}"]`
                        );


                    if (tarjeta) {

                        actualizarCorazon(
                            tarjeta,
                            agregado
                        );
                    }
                };
        }


        /* =================================================
           BOTÓN COMPRAR DEL MODAL
        ================================================= */

        if (botonComprar) {

            botonComprar.onclick =
                function () {

                    comprarProducto(
                        producto
                    );
                };
        }


        /* =================================================
           MOSTRAR MODAL
        ================================================= */

        modal.classList.add(
            "activo"
        );

        document.body.classList.add(
            "modal-abierto"
        );
    }


    /* =====================================================
       CERRAR MODAL
    ===================================================== */

    function cerrarModalOferta() {

        const modal =
            document.getElementById(
                "modalOferta"
            );

        if (!modal) {
            return;
        }

        modal.classList.remove(
            "activo"
        );

        document.body.classList.remove(
            "modal-abierto"
        );
    }


    /* =====================================================
       EVENTOS DEL MODAL
    ===================================================== */

    const cerrarModal =
        document.getElementById(
            "cerrarModalOferta"
        );


    if (cerrarModal) {

        cerrarModal.addEventListener(
            "click",
            cerrarModalOferta
        );
    }


    const modalOferta =
        document.getElementById(
            "modalOferta"
        );


    if (modalOferta) {

        modalOferta.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    modalOferta
                ) {

                    cerrarModalOferta();
                }
            }
        );
    }


    /* =====================================================
       CERRAR CON ESC
    ===================================================== */

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape"
            ) {

                cerrarModalOferta();
            }
        }
    );


    /* =====================================================
       COMPRAR PRODUCTO
    ===================================================== */

    function comprarProducto(
        producto
    ) {

        const stock =
            Number(
                producto.stock
            ) || 0;


        if (stock <= 0) {

            alert(
                "Este producto no tiene stock disponible."
            );

            return;
        }


        let carrito = [];


        try {

            carrito =
                JSON.parse(
                    localStorage.getItem(
                        "dlLuxuryCarrito"
                    )
                ) || [];

        } catch (error) {

            carrito = [];
        }


        const existente =
            carrito.find(
                item =>
                    String(item.id) ===
                    String(producto.id)
            );


        if (existente) {

            if (
                Number(
                    existente.cantidad
                ) >= stock
            ) {

                alert(
                    "No hay más unidades disponibles."
                );

                return;
            }


            existente.cantidad++;

        } else {

            carrito.push({

                id:
                    producto.id,

                nombre:
                    producto.nombre,

                precio:
                    Number(
                        producto.precio
                    ) || 0,

                precio_final:
                    obtenerPrecioFinal(
                        producto
                    ),

                descuento:
                    Number(
                        producto.descuento
                    ) || 0,

                stock:
                    stock,

                imagen:
                    obtenerImagenURL(
                        producto.imagen
                    ),

                cantidad: 1
            });
        }


        try {

            localStorage.setItem(
                "dlLuxuryCarrito",
                JSON.stringify(
                    carrito
                )
            );

        } catch (error) {

            console.error(
                "Error guardando carrito:",
                error
            );

            alert(
                "No se pudo guardar el producto en el carrito."
            );

            return;
        }


        actualizarContadorCarrito();


        alert(
            `${producto.nombre} fue agregado al carrito.`
        );
    }


    /* =====================================================
       CONTADOR CARRITO
    ===================================================== */

    function actualizarContadorCarrito() {

        let carrito = [];


        try {

            carrito =
                JSON.parse(
                    localStorage.getItem(
                        "dlLuxuryCarrito"
                    )
                ) || [];

        } catch (error) {

            carrito = [];
        }


        const cantidad =
            carrito.reduce(
                (
                    total,
                    producto
                ) => {

                    return (
                        total +
                        Number(
                            producto.cantidad || 0
                        )
                    );
                },
                0
            );


        const contador =
            document.querySelector(
                ".nav-item.cart b"
            );


        if (contador) {

            contador.textContent =
                cantidad;
        }
    }


    /* =====================================================
       HISTORIAL DE VENTAS
    ===================================================== */

    function mostrarHistorialVentas() {

        const contenedor =
            document.querySelector(
                "#historialVentas"
            );


        if (!contenedor) {
            return;
        }


        const ventas =
            obtenerVentas();


        if (
            ventas.length === 0
        ) {

            contenedor.innerHTML = `
                <p class="sin-ventas">
                    No hay ventas registradas.
                </p>
            `;

            return;
        }


        contenedor.innerHTML = "";


        ventas
            .slice()
            .reverse()
            .forEach(
                venta => {

                    const card =
                        document.createElement(
                            "div"
                        );

                    card.className =
                        "venta-card";


                    const fecha =
                        venta.fecha
                            ? new Date(
                                venta.fecha
                            ).toLocaleString(
                                "es-GT"
                            )
                            : "";


                    card.innerHTML = `

                        <div class="venta-info">

                            <h3>
                                ${escaparHTML(
                        venta.producto ||
                        "Producto"
                    )}
                            </h3>

                            <p>
                                Cantidad:
                                ${Number(
                        venta.cantidad
                    ) || 1}
                            </p>

                            <p>
                                Total:
                                Q${Number(
                        venta.total || 0
                    ).toFixed(2)}
                            </p>

                            <small>
                                ${fecha}
                            </small>

                        </div>
                    `;


                    contenedor.appendChild(
                        card
                    );
                }
            );
    }


    /* =====================================================
       ESCAPAR HTML
    ===================================================== */

    function escaparHTML(texto) {

        if (
            texto === null ||
            texto === undefined
        ) {

            return "";
        }


        return String(texto)

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
       INICIALIZAR
    ===================================================== */

    actualizarContadorCarrito();

    mostrarHistorialVentas();

    mostrarProductosVenta();

    mostrarOfertasDestacadas();

});