/* =========================================================
   DL LUXURY
   TIENDA / VENTAS
   SUPABASE + STORAGE
   TODOS LOS PRODUCTOS
   FAVORITOS
   CARRITO
   MODAL
   DESCRIPCIÓN
   IMAGEN
   DESCUENTOS
   STOCK
   FILTROS
   BUSCADOR
   ORDENAMIENTO
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       CONFIGURACIÓN SUPABASE
    ===================================================== */

    const SUPABASE_URL =
        "https://brnyvkqwkosgtpugxcge.supabase.co";

    const SUPABASE_ANON_KEY =
        "sb_publishable_Qdae9GUtmuosAPP4kemF3A_Vr4HFo0n";

    const SUPABASE_BUCKET =
        "productos";


    /* =====================================================
       LOCALSTORAGE
    ===================================================== */

    const FAVORITOS_KEY =
        "dlLuxuryFavoritos";

    const CARRITO_KEY =
        "dlLuxuryCarrito";


    /* =====================================================
       COMPROBAR SUPABASE
    ===================================================== */

    if (!window.supabase) {

        console.error(
            "Supabase no está cargado."
        );

        return;
    }


    const supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY
        );


    /* =====================================================
       ELEMENTOS HTML
    ===================================================== */

    const productosTienda =
        document.getElementById("productosTienda");

    const sinResultados =
        document.getElementById("sinResultados");

    const buscarProducto =
        document.getElementById("buscarProducto");

    const filtroCategoria =
        document.getElementById("filtroCategoria");

    const ordenarProductos =
        document.getElementById("ordenarProductos");

    const generoBtns =
        document.querySelectorAll(".genero-btn");

    const contadorCarrito =
        document.getElementById("contadorCarrito");


    /* =====================================================
       MODAL
    ===================================================== */

    const modal =
        document.getElementById("modalProducto");

    const cerrarModalBtn =
        document.getElementById("cerrarModalProducto");

    const modalImagen =
        document.getElementById("modalProductoImagen");

    const modalCategoria =
        document.getElementById("modalProductoCategoria") ||
        document.querySelector(".modal-producto-categoria");

    const modalNombre =
        document.getElementById("modalProductoNombre");

    let modalDescripcion =
        document.getElementById("modalProductoDescripcion");

    const modalPrecioOriginal =
        document.getElementById(
            "modalProductoPrecioOriginal"
        );

    const modalPrecio =
        document.getElementById(
            "modalProductoPrecio"
        );

    const modalDescuento =
        document.getElementById(
            "modalProductoDescuento"
        );

    const modalStock =
        document.getElementById(
            "modalProductoStock"
        );

    const modalComprar =
        document.getElementById(
            "modalProductoComprar"
        );

    const modalFavorito =
        document.getElementById(
            "modalProductoFavorito"
        );


    /* =====================================================
       CREAR DESCRIPCIÓN SI EL HTML NO LA TIENE
    ===================================================== */

    function asegurarDescripcionModal() {

        if (modalDescripcion) {
            return;
        }

        const info =
            modal?.querySelector(
                ".modal-producto-info"
            );

        if (!info) {
            return;
        }

        modalDescripcion =
            document.createElement("p");

        modalDescripcion.id =
            "modalProductoDescripcion";

        modalDescripcion.className =
            "modal-producto-descripcion";

        modalDescripcion.style.margin =
            "15px 0";

        modalDescripcion.style.lineHeight =
            "1.6";

        modalDescripcion.style.color =
            "#666";

        modalDescripcion.style.fontSize =
            "14px";

        const stock =
            document.getElementById(
                "modalProductoStock"
            );

        if (stock) {

            const contenedorStock =
                stock.closest(
                    ".modal-producto-stock"
                );

            if (contenedorStock) {

                info.insertBefore(
                    modalDescripcion,
                    contenedorStock
                );

            } else {

                info.insertBefore(
                    modalDescripcion,
                    stock
                );
            }

        } else {

            info.appendChild(
                modalDescripcion
            );
        }
    }


    asegurarDescripcionModal();


    /* =====================================================
       VARIABLES
    ===================================================== */

    let productos = [];

    let categorias = [];

    let generoActual = "todos";

    let favoritos =
        cargarFavoritos();

    let carrito =
        cargarCarrito();

    let productoModalActual =
        null;


    /* =====================================================
       UTILIDADES
    ===================================================== */

    function escaparHTML(texto) {

        if (
            texto === null ||
            texto === undefined
        ) {
            return "";
        }

        return String(texto)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function escaparAtributo(texto) {
        return escaparHTML(texto);
    }


    function escaparJS(texto) {

        return String(texto ?? "")
            .replace(/\\/g, "\\\\")
            .replace(/'/g, "\\'")
            .replace(/"/g, '\\"')
            .replace(/\r/g, "\\r")
            .replace(/\n/g, "\\n");
    }


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


    function calcularPrecioFinal(
        precio,
        descuento
    ) {

        const p =
            Number(precio) || 0;

        const d =
            Number(descuento) || 0;

        if (d <= 0) {
            return p;
        }

        return p - (p * d / 100);
    }


    function normalizarTexto(texto) {

        return String(texto || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
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
       Solo Unisex
    ===================================================== */

    function normalizarGenero(valor) {

        let texto =
            String(valor || "todos")
                .trim()
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");

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


    function capitalizar(texto) {

        if (!texto) {
            return "";
        }

        const valor =
            String(texto).trim();

        return (
            valor.charAt(0).toUpperCase() +
            valor.slice(1)
        );
    }


    /* =====================================================
       PRECIO FINAL
    ===================================================== */

    function obtenerPrecio(producto) {

        if (
            producto.precio_final !== null &&
            producto.precio_final !== undefined &&
            producto.precio_final !== "" &&
            !isNaN(
                Number(producto.precio_final)
            )
        ) {

            return Number(
                producto.precio_final
            );
        }

        return calcularPrecioFinal(
            producto.precio,
            producto.descuento
        );
    }


    /* =====================================================
       CATEGORÍA
    ===================================================== */

    function obtenerNombreCategoria(producto) {

        if (producto.categoria) {

            return String(
                producto.categoria
            );
        }

        if (
            producto.categoria_id !== null &&
            producto.categoria_id !== undefined
        ) {

            const categoria =
                categorias.find(
                    c =>
                        String(c.id) ===
                        String(
                            producto.categoria_id
                        )
                );

            if (categoria) {

                return String(
                    categoria.nombre
                );
            }
        }

        return "Producto";
    }


    /* =====================================================
       IMAGEN SUPABASE STORAGE
    ===================================================== */

    function obtenerURLImagen(imagen) {

        if (
            !imagen ||
            String(imagen).trim() === ""
        ) {

            return "";
        }

        let valor =
            String(imagen).trim();


        if (
            valor.startsWith("data:image/")
        ) {

            return valor;
        }


        if (
            valor.startsWith("http://") ||
            valor.startsWith("https://")
        ) {

            return valor;
        }


        valor =
            valor.replace(/^\/+/, "");


        if (
            valor.startsWith(
                SUPABASE_BUCKET + "/"
            )
        ) {

            valor =
                valor.substring(
                    SUPABASE_BUCKET.length + 1
                );
        }


        return (
            SUPABASE_URL +
            "/storage/v1/object/public/" +
            SUPABASE_BUCKET +
            "/" +
            valor
        );
    }


    /* =====================================================
       FAVORITOS
    ===================================================== */

    function cargarFavoritos() {

        try {

            const guardados =
                localStorage.getItem(
                    FAVORITOS_KEY
                );

            if (!guardados) {
                return [];
            }

            const datos =
                JSON.parse(guardados);

            return Array.isArray(datos)
                ? datos
                : [];

        } catch (error) {

            console.error(
                "Error cargando favoritos:",
                error
            );

            return [];
        }
    }


    function guardarFavoritos() {

        try {

            localStorage.setItem(
                FAVORITOS_KEY,
                JSON.stringify(favoritos)
            );

        } catch (error) {

            console.error(
                "Error guardando favoritos:",
                error
            );
        }
    }


    function esFavorito(id) {

        return favoritos.some(
            favorito =>
                String(favorito) ===
                String(id)
        );
    }


    function cambiarFavorito(id) {

        if (esFavorito(id)) {

            favoritos =
                favoritos.filter(
                    favorito =>
                        String(favorito) !==
                        String(id)
                );

        } else {

            favoritos.push(id);
        }


        guardarFavoritos();

        renderizarProductos();


        if (
            productoModalActual &&
            String(productoModalActual.id) ===
            String(id)
        ) {

            actualizarBotonFavoritoModal(id);
        }
    }


    function actualizarBotonFavoritoModal(id) {

        if (!modalFavorito) {
            return;
        }

        const activo =
            esFavorito(id);

        modalFavorito.classList.toggle(
            "active",
            activo
        );

        modalFavorito.innerHTML =
            activo
                ? `
                    <i class="fa-solid fa-heart"></i>
                    Favorito
                  `
                : `
                    <i class="fa-regular fa-heart"></i>
                    Favorito
                  `;
    }


    /* =====================================================
       CARRITO
    ===================================================== */

    function cargarCarrito() {

        try {

            const guardado =
                localStorage.getItem(
                    CARRITO_KEY
                );

            if (!guardado) {
                return [];
            }

            const datos =
                JSON.parse(guardado);

            return Array.isArray(datos)
                ? datos
                : [];

        } catch (error) {

            console.error(
                "Error cargando carrito:",
                error
            );

            return [];
        }
    }


    function guardarCarrito() {

        try {

            localStorage.setItem(
                CARRITO_KEY,
                JSON.stringify(carrito)
            );

        } catch (error) {

            console.error(
                "Error guardando carrito:",
                error
            );
        }

        actualizarContadorCarrito();
    }


    /* =====================================================
       AGREGAR AL CARRITO
    ===================================================== */

    function agregarAlCarrito(id) {

        const producto =
            productos.find(
                p =>
                    String(p.id) ===
                    String(id)
            );

        if (!producto) {

            mostrarMensaje(
                "Producto no encontrado"
            );

            return;
        }


        const stock =
            Number(producto.stock) || 0;


        if (stock <= 0) {

            mostrarMensaje(
                "Este producto está agotado"
            );

            return;
        }


        const itemExistente =
            carrito.find(
                item =>
                    String(item.id) ===
                    String(producto.id)
            );


        if (itemExistente) {

            const cantidad =
                Number(
                    itemExistente.cantidad
                ) || 0;


            if (cantidad >= stock) {

                mostrarMensaje(
                    "No hay más unidades disponibles"
                );

                return;
            }


            itemExistente.cantidad =
                cantidad + 1;

            itemExistente.stock =
                stock;

            itemExistente.precio =
                obtenerPrecio(producto);

            itemExistente.imagen =
                obtenerURLImagen(
                    producto.imagen
                );

            itemExistente.nombre =
                producto.nombre;

            itemExistente.descripcion =
                producto.descripcion || "";

            itemExistente.descuento =
                Number(
                    producto.descuento
                ) || 0;

        } else {

            carrito.push({

                id:
                    producto.id,

                nombre:
                    producto.nombre,

                descripcion:
                    producto.descripcion || "",

                precio:
                    obtenerPrecio(producto),

                imagen:
                    obtenerURLImagen(
                        producto.imagen
                    ),

                cantidad:
                    1,

                stock:
                    stock,

                descuento:
                    Number(
                        producto.descuento
                    ) || 0
            });
        }


        guardarCarrito();


        mostrarMensaje(
            "Producto agregado al carrito"
        );
    }


    /* =====================================================
       CONTADOR CARRITO
    ===================================================== */

    function actualizarContadorCarrito() {

        if (!contadorCarrito) {
            return;
        }


        let cantidadTotal = 0;


        carrito.forEach(
            item => {

                cantidadTotal +=
                    Number(
                        item.cantidad
                    ) || 0;
            }
        );


        contadorCarrito.textContent =
            cantidadTotal > 99
                ? "99+"
                : cantidadTotal;


        contadorCarrito.style.display =
            cantidadTotal > 0
                ? "flex"
                : "none";
    }


    /* =====================================================
       MENSAJE
    ===================================================== */

    function mostrarMensaje(mensaje) {

        let toast =
            document.getElementById(
                "toastTienda"
            );


        if (!toast) {

            toast =
                document.createElement(
                    "div"
                );

            toast.id =
                "toastTienda";

            toast.style.cssText = `
                position:fixed;
                bottom:90px;
                left:50%;
                transform:translateX(-50%) translateY(20px);
                background:#111;
                color:#fff;
                padding:13px 20px;
                border-radius:10px;
                font-size:13px;
                font-weight:700;
                z-index:999999;
                opacity:0;
                pointer-events:none;
                transition:.3s ease;
                box-shadow:0 8px 25px rgba(0,0,0,.2);
                white-space:nowrap;
            `;

            document.body.appendChild(
                toast
            );
        }


        toast.textContent =
            mensaje;

        toast.style.opacity =
            "1";

        toast.style.transform =
            "translateX(-50%) translateY(0)";


        clearTimeout(
            toast.timer
        );


        toast.timer =
            setTimeout(
                () => {

                    toast.style.opacity =
                        "0";

                    toast.style.transform =
                        "translateX(-50%) translateY(20px)";

                },
                2200
            );
    }


    /* =====================================================
       ABRIR MODAL
    ===================================================== */

    function abrirModalProducto(id) {

        const producto =
            productos.find(
                p =>
                    String(p.id) ===
                    String(id)
            );


        if (!producto) {

            console.error(
                "Producto no encontrado:",
                id
            );

            return;
        }


        productoModalActual =
            producto;


        if (!modal) {

            console.error(
                "No existe #modalProducto"
            );

            return;
        }


        /* =================================================
           ASEGURAR DESCRIPCIÓN
        ================================================= */

        asegurarDescripcionModal();


        /* =================================================
           NOMBRE
        ================================================= */

        if (modalNombre) {

            modalNombre.textContent =
                producto.nombre ||
                "Producto";
        }


        /* =================================================
           CATEGORÍA
        ================================================= */

        if (modalCategoria) {

            modalCategoria.textContent =
                capitalizar(
                    obtenerNombreCategoria(
                        producto
                    )
                );
        }


        /* =================================================
           DESCRIPCIÓN
        ================================================= */

        if (modalDescripcion) {

            const descripcion =
                String(
                    producto.descripcion || ""
                ).trim();

            modalDescripcion.textContent =
                descripcion ||
                "Sin descripción disponible.";
        }


        /* =================================================
           PRECIO
        ================================================= */

        const precioOriginal =
            Number(
                producto.precio
            ) || 0;

        const descuento =
            Number(
                producto.descuento
            ) || 0;

        const precioFinal =
            obtenerPrecio(
                producto
            );


        if (modalPrecio) {

            modalPrecio.textContent =
                formatearPrecio(
                    precioFinal
                );
        }


        /* =================================================
           PRECIO ORIGINAL
        ================================================= */

        if (modalPrecioOriginal) {

            if (descuento > 0) {

                modalPrecioOriginal.textContent =
                    formatearPrecio(
                        precioOriginal
                    );

                modalPrecioOriginal.style.display =
                    "inline";

            } else {

                modalPrecioOriginal.textContent =
                    "";

                modalPrecioOriginal.style.display =
                    "none";
            }
        }


        /* =================================================
           DESCUENTO
        ================================================= */

        if (modalDescuento) {

            if (descuento > 0) {

                modalDescuento.textContent =
                    `-${descuento}%`;

                modalDescuento.style.display =
                    "inline-block";

            } else {

                modalDescuento.textContent =
                    "";

                modalDescuento.style.display =
                    "none";
            }
        }


        /* =================================================
           STOCK
        ================================================= */

        const stock =
            Number(
                producto.stock
            ) || 0;


        if (modalStock) {

            if (stock <= 0) {

                modalStock.textContent =
                    "Agotado";

                modalStock.classList.add(
                    "agotado"
                );

            } else {

                modalStock.textContent =
                    stock;

                modalStock.classList.remove(
                    "agotado"
                );
            }
        }


        /* =================================================
           IMAGEN
        ================================================= */

        const urlImagen =
            obtenerURLImagen(
                producto.imagen
            );


        if (modalImagen) {

            modalImagen.onerror =
                function () {

                    this.onerror = null;

                    this.style.display =
                        "none";
                };


            if (urlImagen) {

                modalImagen.src =
                    urlImagen;

                modalImagen.alt =
                    producto.nombre ||
                    "Producto";

                modalImagen.style.display =
                    "block";

            } else {

                modalImagen.removeAttribute(
                    "src"
                );

                modalImagen.style.display =
                    "none";
            }
        }


        /* =================================================
           BOTÓN CARRITO
        ================================================= */

        if (modalComprar) {

            modalComprar.disabled =
                stock <= 0;


            if (stock <= 0) {

                modalComprar.innerHTML = `
                    <i class="fa-solid fa-ban"></i>
                    Agotado
                `;

            } else {

                modalComprar.innerHTML = `
                    <i class="fa-solid fa-cart-shopping"></i>
                    Agregar al carrito
                `;
            }


            modalComprar.onclick =
                event => {

                    event.stopPropagation();

                    if (stock <= 0) {
                        return;
                    }

                    agregarAlCarrito(
                        producto.id
                    );
                };
        }


        /* =================================================
           FAVORITO
        ================================================= */

        if (modalFavorito) {

            actualizarBotonFavoritoModal(
                producto.id
            );


            modalFavorito.onclick =
                event => {

                    event.stopPropagation();

                    cambiarFavorito(
                        producto.id
                    );
                };
        }


        /* =================================================
           MOSTRAR MODAL
        ================================================= */

        modal.classList.add(
            "mostrar"
        );

        modal.classList.add(
            "activo"
        );

        document.body.classList.add(
            "modal-abierto"
        );

        document.body.style.overflow =
            "hidden";
    }


    /* =====================================================
       CERRAR MODAL
    ===================================================== */

    function cerrarModalProducto() {

        if (!modal) {
            return;
        }


        modal.classList.remove(
            "mostrar"
        );

        modal.classList.remove(
            "activo"
        );


        document.body.classList.remove(
            "modal-abierto"
        );


        document.body.style.overflow =
            "";


        productoModalActual =
            null;
    }


    /* =====================================================
       BOTÓN CERRAR
    ===================================================== */

    if (cerrarModalBtn) {

        cerrarModalBtn.addEventListener(
            "click",
            cerrarModalProducto
        );
    }


    /* =====================================================
       CERRAR CLICK FUERA
    ===================================================== */

    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    modal
                ) {

                    cerrarModalProducto();
                }
            }
        );
    }


    /* =====================================================
       ESC
    ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                cerrarModalProducto();
            }
        }
    );


    /* =====================================================
       CARGAR CATEGORÍAS
    ===================================================== */

    async function cargarCategorias() {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("categorias")
                .select(
                    "id,nombre"
                )
                .order(
                    "id",
                    {
                        ascending: true
                    }
                );


        if (error) {
            throw error;
        }


        categorias =
            Array.isArray(data)
                ? data
                : [];


        /* ================================================
           LLENAR SELECT DE CATEGORÍAS
        ================================================ */

        if (filtroCategoria) {

            const valorActual =
                filtroCategoria.value;


            filtroCategoria.innerHTML = `
                <option value="todos">
                    Todas las categorías
                </option>
            `;


            categorias.forEach(
                categoria => {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        String(
                            categoria.id
                        );

                    option.textContent =
                        categoria.nombre;

                    filtroCategoria.appendChild(
                        option
                    );
                }
            );


            if (
                valorActual &&
                [...filtroCategoria.options]
                    .some(
                        option =>
                            option.value ===
                            valorActual
                    )
            ) {

                filtroCategoria.value =
                    valorActual;
            }
        }
    }


    /* =====================================================
       CARGAR TODOS LOS PRODUCTOS
    ===================================================== */

    async function cargarProductos() {

        if (!productosTienda) {

            console.warn(
                "No existe #productosTienda"
            );

            return;
        }


        productosTienda.innerHTML = `
            <div
                style="
                    grid-column:1 / -1;
                    text-align:center;
                    padding:60px 20px;
                    color:#888;
                "
            >
                <i
                    class="fa-solid fa-spinner fa-spin"
                    style="
                        font-size:30px;
                        margin-bottom:12px;
                    "
                ></i>

                <p>
                    Cargando productos...
                </p>
            </div>
        `;


        try {

            /* =================================================
               CATEGORÍAS
            ================================================= */

            await cargarCategorias();


            /* =================================================
               TODOS LOS PRODUCTOS ACTIVOS

               IMPORTANTE:
               YA NO SE USA:
               .eq("categoria_id", 5)
            ================================================= */

            const {
                data,
                error
            } =
                await supabaseClient
                    .from("productos")
                    .select(`
                        id,
                        nombre,
                        descripcion,
                        precio,
                        descuento,
                        precio_final,
                        stock,
                        imagen,
                        activo,
                        creado_en,
                        categoria_id,
                        genero
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
                throw error;
            }


            productos =
                Array.isArray(data)
                    ? data
                    : [];


            /* =================================================
               ASIGNAR NOMBRE DE CATEGORÍA
            ================================================= */

            productos.forEach(
                producto => {

                    const categoria =
                        categorias.find(
                            c =>
                                String(c.id) ===
                                String(
                                    producto.categoria_id
                                )
                        );


                    producto.categoria =
                        categoria
                            ? categoria.nombre
                            : "Producto";
                }
            );


            console.log(
                "TODOS LOS PRODUCTOS CARGADOS:",
                productos
            );


            console.log(
                "Total de productos:",
                productos.length
            );


            console.log(
                "Categorías:",
                categorias
            );


            console.log(
                "Descripciones:",
                productos.map(
                    producto => ({

                        id:
                            producto.id,

                        nombre:
                            producto.nombre,

                        categoria:
                            producto.categoria,

                        descripcion:
                            producto.descripcion
                    })
                )
            );


            renderizarProductos();


        } catch (error) {

            console.error(
                "Error cargando productos:",
                error
            );


            productos = [];


            productosTienda.innerHTML = `
                <div
                    style="
                        grid-column:1 / -1;
                        text-align:center;
                        padding:60px 20px;
                    "
                >
                    <i
                        class="fa-solid fa-triangle-exclamation"
                        style="
                            font-size:40px;
                            color:#c69a2b;
                            margin-bottom:15px;
                        "
                    ></i>

                    <h3>
                        No se pudieron cargar los productos
                    </h3>

                    <p
                        style="
                            color:#888;
                            margin-top:8px;
                        "
                    >
                        Revisa la conexión con Supabase.
                    </p>

                    <button
                        type="button"
                        id="btnReintentarProductos"
                        style="
                            margin-top:15px;
                            padding:10px 18px;
                            border:0;
                            border-radius:8px;
                            background:#111;
                            color:#fff;
                            cursor:pointer;
                            font-weight:700;
                        "
                    >
                        Reintentar
                    </button>
                </div>
            `;


            const btnReintentar =
                document.getElementById(
                    "btnReintentarProductos"
                );


            if (btnReintentar) {

                btnReintentar.onclick =
                    cargarProductos;
            }
        }
    }


    /* =====================================================
       FILTRAR PRODUCTOS
    ===================================================== */

    function obtenerProductosFiltrados() {

        let resultado =
            [...productos];


        /* =================================================
           BUSCADOR
        ================================================= */

        const busqueda =
            buscarProducto?.value?.trim() ||
            "";


        if (busqueda) {

            const texto =
                normalizarTexto(
                    busqueda
                );


            resultado =
                resultado.filter(
                    producto => {

                        const nombre =
                            normalizarTexto(
                                producto.nombre
                            );

                        const descripcion =
                            normalizarTexto(
                                producto.descripcion
                            );

                        const categoria =
                            normalizarTexto(
                                producto.categoria
                            );


                        return (
                            nombre.includes(texto) ||
                            descripcion.includes(texto) ||
                            categoria.includes(texto)
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

            const categoriaSeleccionada =
                String(
                    filtroCategoria.value
                );


            resultado =
                resultado.filter(
                    producto =>
                        String(
                            producto.categoria_id
                        ) ===
                        categoriaSeleccionada
                );
        }


        /* =================================================
           GÉNERO

           TODOS:
           Hombre + Mujer + Unisex

           HOMBRE / PARA ÉL:
           Hombre + Unisex

           MUJER / PARA ELLA:
           Mujer + Unisex

           UNISEX:
           Solo Unisex
        ================================================= */

        if (
            generoActual !==
            "todos"
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


                        return true;
                    }
                );
        }


        /* =================================================
           ORDEN
        ================================================= */

        const orden =
            ordenarProductos?.value ||
            "default";


        switch (orden) {

            case "precio-menor":

                resultado.sort(
                    (a, b) =>
                        obtenerPrecio(a) -
                        obtenerPrecio(b)
                );

                break;


            case "precio-mayor":

                resultado.sort(
                    (a, b) =>
                        obtenerPrecio(b) -
                        obtenerPrecio(a)
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
                            "es"
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
                            "es"
                        )
                );

                break;
        }


        return resultado;
    }


    /* =====================================================
       RENDERIZAR PRODUCTOS
    ===================================================== */

    function renderizarProductos() {

        if (!productosTienda) {
            return;
        }


        const lista =
            obtenerProductosFiltrados();


        if (lista.length === 0) {

            productosTienda.innerHTML =
                "";


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


        productosTienda.innerHTML =
            lista
                .map(
                    tarjetaProducto
                )
                .join("");
    }


    /* =====================================================
       TARJETA PRODUCTO
    ===================================================== */

    function tarjetaProducto(producto) {

        const id =
            producto.id;


        const idSeguro =
            escaparJS(id);


        const nombre =
            escaparHTML(
                producto.nombre ||
                "Producto"
            );


        const precioOriginal =
            Number(
                producto.precio
            ) || 0;


        const descuento =
            Number(
                producto.descuento
            ) || 0;


        const precioFinal =
            obtenerPrecio(
                producto
            );


        const stock =
            Number(
                producto.stock
            ) || 0;


        const favorito =
            esFavorito(id);


        const agotado =
            stock <= 0;


        const categoria =
            escaparHTML(
                capitalizar(
                    obtenerNombreCategoria(
                        producto
                    )
                )
            );


        const urlImagen =
            obtenerURLImagen(
                producto.imagen
            );


        let imagenHTML = "";


        if (urlImagen) {

            imagenHTML = `
                <img
                    src="${escaparAtributo(urlImagen)}"
                    alt="${nombre}"
                    loading="lazy"
                    class="producto-imagen-click"
                    onclick="abrirDetalleProducto('${idSeguro}')"
                    onerror="
                        this.style.display='none';
                        this.nextElementSibling.style.display='flex';
                    "
                >

                <div
                    class="producto-imagen-fallback"
                    style="
                        display:none;
                        width:100%;
                        height:100%;
                        align-items:center;
                        justify-content:center;
                        color:#aaa;
                        font-size:40px;
                        cursor:pointer;
                    "
                    onclick="abrirDetalleProducto('${idSeguro}')"
                >
                    <i class="fa-solid fa-image"></i>
                </div>
            `;

        } else {

            imagenHTML = `
                <div
                    class="producto-imagen-fallback"
                    style="
                        width:100%;
                        height:100%;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        color:#aaa;
                        font-size:40px;
                        cursor:pointer;
                    "
                    onclick="abrirDetalleProducto('${idSeguro}')"
                >
                    <i class="fa-solid fa-image"></i>
                </div>
            `;
        }


        /* =================================================
           PRECIO
        ================================================= */

        let precioHTML = "";


        if (descuento > 0) {

            precioHTML = `
                <div
                    class="producto-precios"
                    style="
                        display:flex;
                        align-items:center;
                        gap:9px;
                        flex-wrap:wrap;
                        min-height:42px;
                        margin-top:10px;
                    "
                >

                    <span
                        class="producto-precio-final"
                        style="
                            color:#111;
                            font-size:20px;
                            font-weight:900;
                        "
                    >
                        ${formatearPrecio(
                precioFinal
            )}
                    </span>

                    <span
                        class="producto-precio-original"
                        style="
                            color:#999;
                            font-size:13px;
                            text-decoration:line-through;
                        "
                    >
                        ${formatearPrecio(
                precioOriginal
            )}
                    </span>

                    <span
                        class="producto-descuento"
                        style="
                            background:#111;
                            color:#fff;
                            padding:4px 7px;
                            border-radius:5px;
                            font-size:10px;
                            font-weight:800;
                        "
                    >
                        -${descuento}%
                    </span>

                </div>
            `;

        } else {

            precioHTML = `
                <div
                    class="producto-precios"
                    style="
                        min-height:42px;
                        margin-top:10px;
                        display:flex;
                        align-items:center;
                    "
                >

                    <span
                        class="producto-precio-final"
                        style="
                            color:#111;
                            font-size:17px;
                            font-weight:900;
                        "
                    >
                        ${formatearPrecio(
                precioFinal
            )}
                    </span>

                </div>
            `;
        }


        /* =================================================
           CARRITO
        ================================================= */

        const botonHTML =
            agotado
                ? `
                    <button
                        type="button"
                        class="btn-agregar-carrito"
                        disabled
                    >
                        <i class="fa-solid fa-ban"></i>
                        Agotado
                    </button>
                `
                : `
                    <button
                        type="button"
                        class="btn-agregar-carrito"
                        onclick="
                            event.stopPropagation();
                            agregarProductoTienda('${idSeguro}');
                        "
                    >
                        <i class="fa-solid fa-cart-shopping"></i>
                        Agregar al carrito
                    </button>
                `;


        /* =================================================
           TARJETA
        ================================================= */

        return `
            <article
                class="producto-tienda"
                data-id="${escaparAtributo(id)}"
            >

                <div
                    class="producto-tienda-imagen"
                >

                    ${imagenHTML}


                    ${descuento > 0
                ? `
                                <span
                                    class="producto-oferta"
                                >
                                    OFERTA
                                </span>
                              `
                : ""
            }


                    <button
                        type="button"
                        class="producto-favorito ${favorito
                ? "active"
                : ""
            }"
                        onclick="
                            event.stopPropagation();
                            cambiarFavoritoTienda('${idSeguro}');
                        "
                        aria-label="Agregar a favoritos"
                    >

                        <i
                            class="${favorito
                ? "fa-solid fa-heart"
                : "fa-regular fa-heart"
            }"
                        ></i>

                    </button>

                </div>


                <div
                    class="producto-tienda-info"
                >

                    <span
                        class="producto-tienda-categoria"
                    >
                        ${categoria}
                    </span>


                    <h3
                        onclick="
                            abrirDetalleProducto('${idSeguro}')
                        "
                        style="cursor:pointer;"
                    >
                        ${nombre}
                    </h3>


                    ${precioHTML}


                    <div
                        class="producto-stock"
                    >

                        ${agotado
                ? "Sin existencias"
                : `Stock disponible: ${stock}`
            }

                    </div>


                    ${botonHTML}

                </div>

            </article>
        `;
    }


    /* =====================================================
       EVENTOS GÉNERO
    ===================================================== */

    generoBtns.forEach(
        btn => {

            btn.addEventListener(
                "click",
                () => {

                    generoBtns.forEach(
                        b =>
                            b.classList.remove(
                                "active"
                            )
                    );


                    btn.classList.add(
                        "active"
                    );


                    /*
                       AQUÍ ESTÁ EL CAMBIO IMPORTANTE

                       Convierte:
                       "Para él"   → hombre
                       "Para ella" → mujer
                       "Unisex"    → unisex
                       "Todos"     → todos
                    */

                    generoActual =
                        normalizarGenero(
                            btn.dataset.genero ||
                            btn.textContent ||
                            "todos"
                        );


                    renderizarProductos();
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
            renderizarProductos
        );
    }


    /* =====================================================
       CATEGORÍA
    ===================================================== */

    if (filtroCategoria) {

        filtroCategoria.addEventListener(
            "change",
            renderizarProductos
        );
    }


    /* =====================================================
       ORDEN
    ===================================================== */

    if (ordenarProductos) {

        ordenarProductos.addEventListener(
            "change",
            renderizarProductos
        );
    }


    /* =====================================================
       FUNCIONES GLOBALES
    ===================================================== */

    window.agregarProductoTienda =
        function (id) {

            agregarAlCarrito(id);
        };


    window.cambiarFavoritoTienda =
        function (id) {

            cambiarFavorito(id);
        };


    window.abrirDetalleProducto =
        function (id) {

            abrirModalProducto(id);
        };


    window.cerrarModalProducto =
        function () {

            cerrarModalProducto();
        };


    /* =====================================================
       STORAGE
    ===================================================== */

    window.addEventListener(
        "storage",
        event => {

            if (
                event.key ===
                CARRITO_KEY
            ) {

                carrito =
                    cargarCarrito();

                actualizarContadorCarrito();
            }


            if (
                event.key ===
                FAVORITOS_KEY
            ) {

                favoritos =
                    cargarFavoritos();

                renderizarProductos();
            }
        }
    );


    /* =====================================================
       ACTUALIZAR CADA 30 SEGUNDOS
    ===================================================== */

    setInterval(
        cargarProductos,
        30000
    );


    /* =====================================================
       INICIO
    ===================================================== */

    actualizarContadorCarrito();

    cargarProductos();

});
