/* =========================================================
   DL LUXURY - PERFIL / LOGIN / PUNTOS / CANJES
   ========================================================= */

/* =========================================================
   SUPABASE
   ========================================================= */

const SUPABASE_URL =
    "https://brnyvkqwkosgtpugxcge.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_Qdae9GUtmuosAPP4kemF3A_Vr4HFo0n";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =========================================================
   VARIABLES GLOBALES
   ========================================================= */

let usuarioActual = null;
let perfilActual = null;


/* =========================================================
   DOM
   ========================================================= */

const formLogin =
    document.getElementById("formLogin");

const loginCorreo =
    document.getElementById("loginCorreo");

const loginPassword =
    document.getElementById("loginPassword");

const mostrarPassword =
    document.getElementById("mostrarPassword");

const btnLogin =
    document.getElementById("btnLogin");

const mensajeLogin =
    document.getElementById("mensajeLogin");

const estadoSesion =
    document.getElementById("estadoSesion");

const seccionLogin =
    document.getElementById("seccionLogin");

const seccionUsuario =
    document.getElementById("seccionUsuario");

const usuarioNombre =
    document.getElementById("usuarioNombre");

const usuarioCorreo =
    document.getElementById("usuarioCorreo");

const puntosUsuario =
    document.getElementById("puntosUsuario");

const seccionPuntos =
    document.getElementById("seccionPuntos");

const seccionCanje =
    document.getElementById("seccionCanje");

const seccionHistorial =
    document.getElementById("seccionHistorial");

const historialCanjes =
    document.getElementById("historialCanjes");

const btnCerrarSesion =
    document.getElementById("btnCerrarSesion");

const contadorCarrito =
    document.getElementById("contadorCarrito");


/* =========================================================
   FUNCIONES GENERALES
   ========================================================= */

function escapeHTML(texto) {
    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function normalizarTexto(texto) {
    return String(texto ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}


/* =========================================================
   IMÁGENES DE SUPABASE STORAGE
   ========================================================= */

function obtenerUrlImagen(imagen) {
    if (!imagen) {
        return "";
    }

    let ruta = String(imagen).trim();

    if (!ruta) {
        return "";
    }

    /* Si ya es una URL completa */
    if (
        /^https?:\/\//i.test(ruta) ||
        /^data:/i.test(ruta)
    ) {
        return ruta;
    }

    /* Quitar / iniciales */
    ruta = ruta.replace(/^\/+/, "");

    /* Si viene como URL interna de Supabase */
    if (
        /^storage\/v1\/object\/public\/productos\//i.test(ruta)
    ) {
        ruta = ruta.replace(
            /^storage\/v1\/object\/public\/productos\//i,
            ""
        );
    }

    /* Si viene como productos/foto.jpg */
    if (/^productos\//i.test(ruta)) {
        ruta = ruta.replace(
            /^productos\//i,
            ""
        );
    }

    return (
        SUPABASE_URL +
        "/storage/v1/object/public/productos/" +
        ruta
    );
}


/* =========================================================
   OBTENER IMAGEN DEL PRODUCTO
   ========================================================= */

function obtenerImagenProducto(producto) {
    if (!producto) {
        return "";
    }

    const imagen =
        producto.imagen ??
        producto.imagen_url ??
        producto.image ??
        producto.foto ??
        producto.foto_url ??
        "";

    return obtenerUrlImagen(imagen);
}


/* =========================================================
   OBTENER PRECIO
   ========================================================= */

function obtenerPrecioProducto(producto) {
    if (!producto) {
        return 0;
    }

    const precio = Number(
        producto.precio_final ??
        producto.precio ??
        producto.precioFinal ??
        0
    );

    if (
        !Number.isFinite(precio) ||
        precio < 0
    ) {
        return 0;
    }

    return precio;
}


/* =========================================================
   CATEGORÍAS
   ========================================================= */

/*
   Esta función intenta obtener el nombre de categoría
   directamente desde el producto.

   Si el SELECT trae categoria_id pero no trae el nombre,
   usamos el mapa de categorías cargado desde Supabase.
*/

const mapaCategorias = new Map();


function obtenerCategoriaProducto(producto) {
    if (!producto) {
        return "";
    }

    return (
        producto.categoriaNombre ||
        producto.categoria_nombre ||
        producto.categoria ||
        producto.categoria_name ||
        producto.categoriaName ||
        mapaCategorias.get(
            String(producto.categoria_id)
        ) ||
        ""
    );
}


/* =========================================================
   CARGAR CATEGORÍAS
   ========================================================= */

async function cargarCategorias() {
    mapaCategorias.clear();

    try {
        const resultado =
            await supabaseClient
                .from("categorias")
                .select("*");

        if (resultado.error) {
            console.warn(
                "No se pudieron cargar las categorías:",
                resultado.error
            );

            return;
        }

        const categorias =
            resultado.data || [];

        categorias.forEach(function (categoria) {

            const id =
                categoria.id ??
                categoria.categoria_id;

            const nombre =
                categoria.nombre ??
                categoria.nombre_categoria ??
                categoria.categoria ??
                categoria.descripcion ??
                "";

            if (
                id !== undefined &&
                id !== null &&
                nombre
            ) {
                mapaCategorias.set(
                    String(id),
                    String(nombre)
                );
            }
        });

    } catch (error) {
        console.error(
            "Error cargando categorías:",
            error
        );
    }
}


/* =========================================================
   MOSTRAR MENSAJE DE LOGIN
   ========================================================= */

function mostrarMensajeLogin(
    mensaje,
    tipo = ""
) {
    if (!mensajeLogin) {
        return;
    }

    mensajeLogin.textContent = mensaje;

    mensajeLogin.className =
        "mensaje-login";

    if (tipo) {
        mensajeLogin.classList.add(tipo);
    }
}


/* =========================================================
   CARGAR PERFIL
   ========================================================= */

async function cargarPerfil(user) {

    if (!user) {
        return;
    }

    usuarioActual = user;

    try {

        const resultado =
            await supabaseClient
                .from("perfiles")
                .select(`
                    id,
                    nombre,
                    apellido,
                    rol,
                    "Puntos",
                    creado_en,
                    actualizado_en
                `)
                .eq("id", user.id)
                .maybeSingle();

        if (resultado.error) {

            console.error(
                "Error cargando perfil:",
                resultado.error
            );

            return;
        }

        let perfil =
            resultado.data;

        /* Si no existe perfil, crearlo */

        if (!perfil) {

            const nuevoPerfil = {
                id: user.id,
                nombre: "",
                apellido: "",
                rol: "cliente",
                "Puntos": 0
            };

            const insertado =
                await supabaseClient
                    .from("perfiles")
                    .insert(nuevoPerfil)
                    .select(`
                        id,
                        nombre,
                        apellido,
                        rol,
                        "Puntos",
                        creado_en,
                        actualizado_en
                    `)
                    .single();

            if (insertado.error) {

                console.error(
                    "Error creando perfil:",
                    insertado.error
                );

                return;
            }

            perfil =
                insertado.data;
        }

        perfilActual = perfil;

        actualizarInterfazUsuario();

        await cargarHistorialCanjes();

        actualizarBotonesCanje();

    } catch (error) {

        console.error(
            "Error cargando perfil:",
            error
        );
    }
}


/* =========================================================
   ACTUALIZAR INTERFAZ DEL USUARIO
   ========================================================= */

function actualizarInterfazUsuario() {

    if (!usuarioActual) {
        return;
    }

    const nombre =
        perfilActual?.nombre ||
        usuarioActual.user_metadata?.nombre ||
        usuarioActual.email?.split("@")[0] ||
        "Usuario";

    const apellido =
        perfilActual?.apellido ||
        usuarioActual.user_metadata?.apellido ||
        "";

    const nombreCompleto =
        `${nombre} ${apellido}`.trim();

    if (usuarioNombre) {
        usuarioNombre.textContent =
            nombreCompleto;
    }

    if (usuarioCorreo) {
        usuarioCorreo.textContent =
            usuarioActual.email || "";
    }

    const puntos =
        Number(
            perfilActual?.["Puntos"] ?? 0
        );

    if (puntosUsuario) {
        puntosUsuario.textContent =
            puntos.toLocaleString("es-GT");
    }

    if (estadoSesion) {
        estadoSesion.textContent =
            "Sesión iniciada";
    }

    if (seccionLogin) {
        seccionLogin.style.display =
            "none";
    }

    if (seccionUsuario) {
        seccionUsuario.style.display =
            "";
    }

    if (seccionPuntos) {
        seccionPuntos.style.display =
            "";
    }

    if (seccionCanje) {
        seccionCanje.style.display =
            "";
    }

    if (seccionHistorial) {
        seccionHistorial.style.display =
            "";
    }
}


/* =========================================================
   MOSTRAR FORMULARIO DE LOGIN
   ========================================================= */

function mostrarFormularioLogin() {

    usuarioActual = null;
    perfilActual = null;

    if (estadoSesion) {
        estadoSesion.textContent =
            "No has iniciado sesión";
    }

    if (seccionLogin) {
        seccionLogin.style.display =
            "";
    }

    if (seccionUsuario) {
        seccionUsuario.style.display =
            "none";
    }

    if (seccionPuntos) {
        seccionPuntos.style.display =
            "none";
    }

    if (seccionCanje) {
        seccionCanje.style.display =
            "none";
    }

    if (seccionHistorial) {
        seccionHistorial.style.display =
            "none";
    }

    actualizarBotonesCanje();
}


/* =========================================================
   LOGIN
   ========================================================= */

if (formLogin) {

    formLogin.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const correo =
                loginCorreo?.value.trim() || "";

            const password =
                loginPassword?.value || "";

            if (!correo || !password) {

                mostrarMensajeLogin(
                    "Ingresa tu correo y contraseña.",
                    "error"
                );

                return;
            }

            if (password.length < 6) {

                mostrarMensajeLogin(
                    "La contraseña debe tener al menos 6 caracteres.",
                    "error"
                );

                return;
            }

            if (btnLogin) {
                btnLogin.disabled = true;
                btnLogin.textContent =
                    "Ingresando...";
            }

            mostrarMensajeLogin(
                "",
                ""
            );

            try {

                /* Intentar iniciar sesión */

                let resultado =
                    await supabaseClient.auth
                        .signInWithPassword({
                            email: correo,
                            password: password
                        });

                /*
                    Si no existe la cuenta, intentar crearla.
                */

                if (resultado.error) {

                    const mensajeError =
                        resultado.error.message || "";

                    const esCredenciales =
                        /invalid login credentials/i.test(
                            mensajeError
                        );

                    if (esCredenciales) {

                        const registro =
                            await supabaseClient.auth
                                .signUp({
                                    email: correo,
                                    password: password
                                });

                        if (registro.error) {

                            throw registro.error;
                        }

                        if (registro.data?.session) {

                            await cargarPerfil(
                                registro.data.user
                            );

                            mostrarMensajeLogin(
                                "Cuenta creada correctamente.",
                                "exito"
                            );

                        } else {

                            mostrarMensajeLogin(
                                "Cuenta creada. Revisa tu correo para confirmar tu cuenta.",
                                "exito"
                            );
                        }

                    } else {

                        throw resultado.error;
                    }

                } else {

                    await cargarPerfil(
                        resultado.data.user
                    );

                    mostrarMensajeLogin(
                        "Inicio de sesión exitoso.",
                        "exito"
                    );
                }

            } catch (error) {

                console.error(
                    "Error de login:",
                    error
                );

                mostrarMensajeLogin(
                    error.message ||
                    "No se pudo iniciar sesión.",
                    "error"
                );

            } finally {

                if (btnLogin) {
                    btnLogin.disabled = false;
                    btnLogin.textContent =
                        "Iniciar sesión";
                }
            }
        }
    );
}


/* =========================================================
   MOSTRAR / OCULTAR PASSWORD
   ========================================================= */

if (mostrarPassword && loginPassword) {

    mostrarPassword.addEventListener(
        "change",
        function () {

            loginPassword.type =
                mostrarPassword.checked
                    ? "text"
                    : "password";
        }
    );
}


/* =========================================================
   BOTONES DE CANJE
   ========================================================= */

function prepararBotonesCanje() {

    const botones =
        document.querySelectorAll(
            ".btn-canjear"
        );

    botones.forEach(function (boton) {

        boton.addEventListener(
            "click",
            async function (event) {

                event.preventDefault();
                event.stopPropagation();

                if (!usuarioActual) {

                    alert(
                        "Debes iniciar sesión para realizar un canje."
                    );

                    return;
                }

                const recompensa =
                    boton.dataset.recompensa ||
                    "Canje";

                const categoria =
                    boton.dataset.categoria ||
                    boton.closest(
                        "[data-categoria]"
                    )?.dataset.categoria ||
                    recompensa;

                const puntosMaximos =
                    Number(
                        boton.dataset.puntos || 0
                    );

                if (
                    !Number.isFinite(
                        puntosMaximos
                    ) ||
                    puntosMaximos <= 0
                ) {

                    alert(
                        "El nivel de puntos no es válido."
                    );

                    return;
                }

                try {

                    const resultado =
                        await supabaseClient
                            .from("perfiles")
                            .select('"Puntos"')
                            .eq(
                                "id",
                                usuarioActual.id
                            )
                            .single();

                    if (resultado.error) {
                        throw resultado.error;
                    }

                    const puntosActuales =
                        Number(
                            resultado.data?.["Puntos"] ??
                            0
                        );

                    if (
                        puntosActuales <
                        puntosMaximos
                    ) {

                        alert(
                            `Necesitas ${puntosMaximos.toLocaleString("es-GT")} puntos para acceder a este nivel. Actualmente tienes ${puntosActuales.toLocaleString("es-GT")}.`
                        );

                        return;
                    }

                    await abrirSelectorProductosCanje(
                        recompensa,
                        categoria,
                        puntosMaximos
                    );

                } catch (error) {

                    console.error(
                        "Error preparando canje:",
                        error
                    );

                    alert(
                        "No se pudo iniciar el canje."
                    );
                }
            }
        );
    });
}


/* =========================================================
   ACTUALIZAR ESTADO DE LOS BOTONES
   ========================================================= */

function actualizarBotonesCanje() {

    const botones =
        document.querySelectorAll(
            ".btn-canjear"
        );

    const puntosActuales =
        Number(
            perfilActual?.["Puntos"] ?? 0
        );

    botones.forEach(function (boton) {

        const puntosMaximos =
            Number(
                boton.dataset.puntos || 0
            );

        if (!usuarioActual) {

            boton.disabled = false;
            boton.textContent =
                "Canjear";

            return;
        }

        if (
            puntosActuales <
            puntosMaximos
        ) {

            boton.disabled = true;

            boton.textContent =
                "Puntos insuficientes";

        } else {

            boton.disabled = false;

            boton.textContent =
                "Canjear";
        }
    });
}


/* =========================================================
   ABRIR MODAL DE PRODUCTOS
   ========================================================= */

async function abrirSelectorProductosCanje(
    recompensa,
    categoriaSeleccionada,
    puntosMaximos
) {

    const modal =
        document.getElementById(
            "modalCanjeProducto"
        );

    const contenedor =
        document.getElementById(
            "productosCanje"
        );

    const texto =
        document.getElementById(
            "textoPuntosCanje"
        );

    const mensaje =
        document.getElementById(
            "mensajeCanjeProducto"
        );

    const cerrar =
        document.getElementById(
            "cerrarModalCanje"
        );

    if (
        !modal ||
        !contenedor
    ) {

        console.error(
            "No se encontró el modal de canje."
        );

        return;
    }

    if (texto) {

        texto.textContent =
            `${categoriaSeleccionada} · Hasta Q${puntosMaximos.toLocaleString("es-GT")}. Elige el producto que deseas canjear.`;
    }

    if (mensaje) {
        mensaje.textContent = "";
    }

    contenedor.innerHTML = `
        <div class="cargando-canjes">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>Cargando productos...</span>
        </div>
    `;

    modal.style.display = "flex";

    document.body.style.overflow =
        "hidden";

    if (cerrar) {

        cerrar.onclick =
            function () {

                cerrarModalCanje();
            };
    }

    try {

        /*
            Primero cargamos las categorías.

            Esto permite traducir categoria_id
            al nombre real de la categoría.
        */

        await cargarCategorias();

        /*
            Obtener todos los productos activos.
        */

        const resultado =
            await supabaseClient
                .from("productos")
                .select("*")
                .eq("activo", true)
                .order(
                    "id",
                    {
                        ascending: false
                    }
                );

        if (resultado.error) {
            throw resultado.error;
        }

        const todosLosProductos =
            resultado.data || [];

        const categoriaNormalizada =
            normalizarTexto(
                categoriaSeleccionada
            );

        /*
            =================================================
            FILTRO IMPORTANTE
            =================================================

            Aquí se muestran SOLO productos de la categoría
            seleccionada.

            Ejemplo:

            Playeras -> solamente Playeras
            Gorras -> solamente Gorras
            Hoodies -> solamente Hoodies
            etc.

            También se verifica que el precio no supere
            el límite de puntos del nivel.
        */

        const productos =
            todosLosProductos.filter(
                function (producto) {

                    const precio =
                        obtenerPrecioProducto(
                            producto
                        );

                    if (
                        precio <= 0 ||
                        precio > puntosMaximos
                    ) {
                        return false;
                    }

                    const categoriaProducto =
                        normalizarTexto(
                            obtenerCategoriaProducto(
                                producto
                            )
                        );

                    return (
                        categoriaProducto ===
                        categoriaNormalizada
                    );
                }
            );

        if (!productos.length) {

            contenedor.innerHTML = `
                <div class="sin-productos-canje">
                    <i class="fa-solid fa-box-open"></i>
                    <h3>No hay productos disponibles</h3>
                    <p>
                        No encontramos productos de
                        ${escapeHTML(categoriaSeleccionada)}
                        de hasta
                        Q${puntosMaximos.toLocaleString("es-GT")}.
                    </p>
                </div>
            `;

            return;
        }

        contenedor.innerHTML =
            productos.map(
                function (producto) {

                    const nombre =
                        producto.nombre ||
                        producto.nombre_producto ||
                        "Producto";

                    const precio =
                        obtenerPrecioProducto(
                            producto
                        );

                    const imagen =
                        obtenerImagenProducto(
                            producto
                        );

                    const categoria =
                        obtenerCategoriaProducto(
                            producto
                        ) ||
                        categoriaSeleccionada;

                    const idProducto =
                        producto.id;

                    return `
                        <article
                            class="producto-canje-card"
                        >

                            <div
                                class="producto-canje-foto"
                            >

                                ${imagen
                            ? `
                                            <img
                                                src="${escapeHTML(imagen)}"
                                                alt="${escapeHTML(nombre)}"
                                                class="producto-canje-imagen"
                                                loading="lazy"
                                                onerror="
                                                    this.style.display='none';
                                                    this.parentElement
                                                        .querySelector('.producto-canje-sin-imagen')
                                                        .style.display='flex';
                                                "
                                            >

                                            <div
                                                class="producto-canje-sin-imagen"
                                                style="display:none;"
                                            >
                                                <i class="fa-solid fa-image"></i>
                                            </div>
                                        `
                            : `
                                            <div
                                                class="producto-canje-sin-imagen"
                                                style="display:flex;"
                                            >
                                                <i class="fa-solid fa-image"></i>
                                            </div>
                                        `
                        }

                            </div>

                            <div
                                class="producto-canje-info"
                            >

                                <div
                                    class="producto-canje-categoria"
                                >
                                    ${escapeHTML(categoria)}
                                </div>

                                <h3>
                                    ${escapeHTML(nombre)}
                                </h3>

                                <div
                                    class="producto-canje-precio"
                                >
                                    Q${precio.toLocaleString(
                            "es-GT",
                            {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }
                        )}
                                </div>

                                <button
                                    type="button"
                                    class="btn-seleccionar-producto-canje"
                                    data-producto-id="${escapeHTML(idProducto)}"
                                >
                                    <i class="fa-solid fa-gift"></i>
                                    Seleccionar
                                </button>

                            </div>

                        </article>
                    `;
                }
            ).join("");

        /*
            Preparar botones de selección.
        */

        contenedor
            .querySelectorAll(
                ".btn-seleccionar-producto-canje"
            )
            .forEach(
                function (boton) {

                    boton.addEventListener(
                        "click",
                        function () {

                            const id =
                                boton.dataset.productoId;

                            const producto =
                                productos.find(
                                    function (item) {
                                        return String(
                                            item.id
                                        ) ===
                                            String(id);
                                    }
                                );

                            if (!producto) {
                                return;
                            }

                            confirmarProductoCanje(
                                producto,
                                recompensa,
                                categoriaSeleccionada,
                                puntosMaximos
                            );
                        }
                    );
                }
            );

    } catch (error) {

        console.error(
            "Error cargando productos para canje:",
            error
        );

        contenedor.innerHTML = `
            <div class="sin-productos-canje">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <h3>Error al cargar productos</h3>
                <p>
                    No se pudieron cargar los productos.
                    Intenta nuevamente.
                </p>
            </div>
        `;
    }
}


/* =========================================================
   CERRAR MODAL
   ========================================================= */

function cerrarModalCanje() {

    const modal =
        document.getElementById(
            "modalCanjeProducto"
        );

    if (modal) {
        modal.style.display = "none";
    }

    document.body.style.overflow = "";
}


/* =========================================================
   CERRAR MODAL AL HACER CLICK FUERA
   ========================================================= */

const modalCanjeProducto =
    document.getElementById(
        "modalCanjeProducto"
    );

if (modalCanjeProducto) {

    modalCanjeProducto.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                modalCanjeProducto
            ) {

                cerrarModalCanje();
            }
        }
    );
}


/* =========================================================
   ESC PARA CERRAR MODAL
   ========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape"
        ) {

            const modal =
                document.getElementById(
                    "modalCanjeProducto"
                );

            if (
                modal &&
                modal.style.display === "flex"
            ) {

                cerrarModalCanje();
            }
        }
    }
);


/* =========================================================
   CONFIRMAR PRODUCTO
   ========================================================= */

async function confirmarProductoCanje(
    producto,
    recompensa,
    categoria,
    puntosMaximos
) {

    if (!usuarioActual) {

        alert(
            "Debes iniciar sesión para realizar un canje."
        );

        return;
    }

    if (!producto) {

        alert(
            "No se encontró el producto."
        );

        return;
    }

    const nombreProducto =
        producto.nombre ||
        producto.nombre_producto ||
        "Producto";

    const precio =
        obtenerPrecioProducto(
            producto
        );

    const imagen =
        obtenerImagenProducto(
            producto
        );

    if (
        !Number.isFinite(precio) ||
        precio <= 0
    ) {

        alert(
            "El precio del producto no es válido."
        );

        return;
    }

    if (
        precio > puntosMaximos
    ) {

        alert(
            `Este producto cuesta Q${precio.toLocaleString("es-GT")} y supera el límite de Q${puntosMaximos.toLocaleString("es-GT")}.`
        );

        return;
    }

    /*
        1 punto = Q1.

        Si el precio tiene centavos,
        se redondea hacia arriba.

        Ejemplo:
        Q149.50 = 150 puntos
    */

    const puntosUtilizados =
        Math.ceil(precio);

    const confirmacion =
        window.confirm(
            `¿Deseas canjear "${nombreProducto}" por ${puntosUtilizados.toLocaleString("es-GT")} puntos?\n\nPrecio: Q${precio.toLocaleString(
                "es-GT",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            )}\n\nNivel máximo: ${puntosMaximos.toLocaleString("es-GT")} puntos`
        );

    if (!confirmacion) {
        return;
    }

    try {

        /*
            Obtener puntos reales nuevamente
            para evitar errores si cambió la cantidad.
        */

        const resultadoPerfil =
            await supabaseClient
                .from("perfiles")
                .select('"Puntos"')
                .eq(
                    "id",
                    usuarioActual.id
                )
                .single();

        if (resultadoPerfil.error) {
            throw resultadoPerfil.error;
        }

        const puntosActuales =
            Number(
                resultadoPerfil.data?.["Puntos"] ??
                0
            );

        if (
            puntosActuales <
            puntosUtilizados
        ) {

            alert(
                `No tienes suficientes puntos. Tienes ${puntosActuales.toLocaleString("es-GT")} y necesitas ${puntosUtilizados.toLocaleString("es-GT")}.`
            );

            return;
        }

        const puntosRestantes =
            puntosActuales -
            puntosUtilizados;

        /*
            Actualizar puntos.
        */

        const actualizacion =
            await supabaseClient
                .from("perfiles")
                .update({
                    "Puntos": puntosRestantes,
                    actualizado_en:
                        new Date().toISOString()
                })
                .eq(
                    "id",
                    usuarioActual.id
                );

        if (actualizacion.error) {
            throw actualizacion.error;
        }

        /*
            Registrar canje.
        */

        const registroCanje = {
            usuario_id:
                usuarioActual.id,

            recompensa:
                nombreProducto,

            puntos:
                puntosUtilizados
        };

        const canjeInsertado =
            await supabaseClient
                .from("canjes")
                .insert(
                    registroCanje
                )
                .select()
                .single();

        /*
            Si falla el registro del canje,
            devolver los puntos.
        */

        if (canjeInsertado.error) {

            await supabaseClient
                .from("perfiles")
                .update({
                    "Puntos":
                        puntosActuales
                })
                .eq(
                    "id",
                    usuarioActual.id
                );

            throw canjeInsertado.error;
        }

        /*
            Generar código.
        */

        const codigo =
            "DL-" +
            Math.random()
                .toString(36)
                .substring(2, 8)
                .toUpperCase();

        /*
            Guardar información detallada
            en localStorage.
        */

        const canjeLocal = {

            activo: true,

            id:
                canjeInsertado.data?.id ||
                null,

            usuario_id:
                usuarioActual.id,

            recompensa:
                nombreProducto,

            nombre:
                nombreProducto,

            producto_id:
                producto.id,

            producto_nombre:
                nombreProducto,

            categoria:
                categoria,

            producto_categoria:
                obtenerCategoriaProducto(
                    producto
                ) || categoria,

            producto_imagen:
                imagen,

            producto_precio:
                precio,

            puntos:
                puntosUtilizados,

            puntos_maximos:
                puntosMaximos,

            puntos_restantes:
                puntosRestantes,

            descuento:
                0,

            codigo:
                codigo,

            creado_en:
                new Date().toISOString()
        };

        let canjesGuardados = [];

        try {

            const existentes =
                JSON.parse(
                    localStorage.getItem(
                        "dlLuxuryCanje"
                    ) || "[]"
                );

            if (Array.isArray(existentes)) {
                canjesGuardados =
                    existentes;
            }

        } catch (error) {

            canjesGuardados = [];
        }

        canjesGuardados.unshift(
            canjeLocal
        );

        localStorage.setItem(
            "dlLuxuryCanje",
            JSON.stringify(
                canjesGuardados
            )
        );

        /*
            Actualizar perfil local.
        */

        if (perfilActual) {

            perfilActual["Puntos"] =
                puntosRestantes;

            perfilActual.actualizado_en =
                new Date().toISOString();
        }

        if (puntosUsuario) {

            puntosUsuario.textContent =
                puntosRestantes.toLocaleString(
                    "es-GT"
                );
        }

        /*
            Actualizar botones.
        */

        actualizarBotonesCanje();

        /*
            Cerrar modal.
        */

        cerrarModalCanje();

        /*
            Recargar historial.
        */

        await cargarHistorialCanjes();

        /*
            WhatsApp
        */

        const mensajeWhatsApp =
            `Hola, quiero utilizar mi canje de DL Luxury.

Producto: ${nombreProducto}
Categoría: ${categoria}
Precio: Q${precio.toLocaleString(
                "es-GT",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            )}
Puntos utilizados: ${puntosUtilizados}
Nivel máximo: ${puntosMaximos}
Puntos restantes: ${puntosRestantes}

Código de canje: ${codigo}

Imagen: ${imagen || "Sin imagen"}`;

        const urlWhatsApp =
            "https://wa.me/50246880894?text=" +
            encodeURIComponent(
                mensajeWhatsApp
            );

        /*
            Mostrar mensaje.
        */

        alert(
            `¡Canje realizado correctamente!\n\nProducto: ${nombreProducto}\nPuntos utilizados: ${puntosUtilizados}\nPuntos restantes: ${puntosRestantes}\n\nCódigo: ${codigo}`
        );

        /*
            Abrir WhatsApp.
        */

        window.open(
            urlWhatsApp,
            "_blank"
        );

    } catch (error) {

        console.error(
            "Error realizando canje:",
            error
        );

        alert(
            error.message ||
            "No se pudo completar el canje."
        );
    }
}


/* =========================================================
   HISTORIAL DE CANJES
   ========================================================= */

async function cargarHistorialCanjes() {

    if (
        !usuarioActual ||
        !historialCanjes
    ) {
        return;
    }

    historialCanjes.innerHTML = `
        <div class="cargando-canjes">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>Cargando historial...</span>
        </div>
    `;

    try {

        const resultado =
            await supabaseClient
                .from("canjes")
                .select(`
                    id,
                    recompensa,
                    puntos,
                    creado_en
                `)
                .eq(
                    "usuario_id",
                    usuarioActual.id
                )
                .order(
                    "creado_en",
                    {
                        ascending: false
                    }
                );

        if (resultado.error) {
            throw resultado.error;
        }

        const canjes =
            resultado.data || [];

        if (!canjes.length) {

            historialCanjes.innerHTML = `
                <div class="sin-historial">
                    <i class="fa-solid fa-gift"></i>
                    <p>
                        Aún no tienes canjes realizados.
                    </p>
                </div>
            `;

            return;
        }

        historialCanjes.innerHTML =
            canjes.map(
                function (canje) {

                    const fecha =
                        canje.creado_en
                            ? new Date(
                                canje.creado_en
                            ).toLocaleString(
                                "es-GT",
                                {
                                    dateStyle:
                                        "medium",
                                    timeStyle:
                                        "short"
                                }
                            )
                            : "";

                    const puntos =
                        Number(
                            canje.puntos || 0
                        );

                    return `
                        <div
                            class="historial-item"
                        >

                            <div
                                class="historial-icono"
                            >
                                <i class="fa-solid fa-gift"></i>
                            </div>

                            <div
                                class="historial-info"
                            >

                                <h4>
                                    ${escapeHTML(
                        canje.recompensa ||
                        "Canje"
                    )}
                                </h4>

                                <span>
                                    ${escapeHTML(
                        fecha
                    )}
                                </span>

                            </div>

                            <div
                                class="historial-puntos"
                            >
                                -${puntos.toLocaleString(
                        "es-GT"
                    )} pts
                            </div>

                        </div>
                    `;
                }
            ).join("");

    } catch (error) {

        console.error(
            "Error cargando historial:",
            error
        );

        historialCanjes.innerHTML = `
            <div class="sin-historial">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <p>
                    No se pudo cargar el historial.
                </p>
            </div>
        `;
    }
}


/* =========================================================
   CERRAR SESIÓN
   ========================================================= */

if (btnCerrarSesion) {

    btnCerrarSesion.addEventListener(
        "click",
        async function () {

            const confirmar =
                window.confirm(
                    "¿Deseas cerrar sesión?"
                );

            if (!confirmar) {
                return;
            }

            try {

                const resultado =
                    await supabaseClient.auth
                        .signOut();

                if (resultado.error) {
                    throw resultado.error;
                }

                usuarioActual = null;
                perfilActual = null;

                mostrarFormularioLogin();

                if (loginCorreo) {
                    loginCorreo.value = "";
                }

                if (loginPassword) {
                    loginPassword.value = "";
                }

                if (mensajeLogin) {
                    mensajeLogin.textContent = "";
                }

            } catch (error) {

                console.error(
                    "Error cerrando sesión:",
                    error
                );

                alert(
                    "No se pudo cerrar la sesión."
                );
            }
        }
    );
}


/* =========================================================
   CONTADOR DEL CARRITO
   ========================================================= */

function actualizarContadorCarrito() {

    if (!contadorCarrito) {
        return;
    }

    try {

        const carrito =
            JSON.parse(
                localStorage.getItem(
                    "dlLuxuryCarrito"
                ) || "[]"
            );

        if (!Array.isArray(carrito)) {

            contadorCarrito.textContent =
                "0";

            return;
        }

        const cantidad =
            carrito.reduce(
                function (total, producto) {

                    const cantidadProducto =
                        Number(
                            producto.cantidad ??
                            producto.qty ??
                            1
                        );

                    return (
                        total +
                        (
                            Number.isFinite(
                                cantidadProducto
                            )
                                ? cantidadProducto
                                : 1
                        )
                    );
                },
                0
            );

        contadorCarrito.textContent =
            cantidad.toString();

    } catch (error) {

        console.error(
            "Error actualizando carrito:",
            error
        );

        contadorCarrito.textContent =
            "0";
    }
}


/* =========================================================
   SESIÓN INICIAL
   ========================================================= */

async function iniciarPerfil() {

    try {

        /*
            Cargar categorías desde el inicio
            para que categoria_id esté disponible.
        */

        await cargarCategorias();

        const resultado =
            await supabaseClient.auth
                .getSession();

        if (resultado.error) {
            throw resultado.error;
        }

        const sesion =
            resultado.data?.session;

        if (sesion?.user) {

            await cargarPerfil(
                sesion.user
            );

        } else {

            mostrarFormularioLogin();
        }

    } catch (error) {

        console.error(
            "Error iniciando perfil:",
            error
        );

        mostrarFormularioLogin();
    }

    actualizarContadorCarrito();

    prepararBotonesCanje();
}


/* =========================================================
   CAMBIOS DE AUTENTICACIÓN
   ========================================================= */

supabaseClient.auth.onAuthStateChange(
    async function (
        event,
        session
    ) {

        /*
            Evitar hacer procesos innecesarios
            cuando la sesión sigue igual.
        */

        if (
            session?.user &&
            (
                event === "SIGNED_IN" ||
                event === "INITIAL_SESSION" ||
                event === "TOKEN_REFRESHED"
            )
        ) {

            await cargarPerfil(
                session.user
            );

        } else if (
            event === "SIGNED_OUT"
        ) {

            mostrarFormularioLogin();
        }
    }
);


/* =========================================================
   CARRITO
   ========================================================= */

window.addEventListener(
    "storage",
    function (event) {

        if (
            event.key ===
            "dlLuxuryCarrito"
        ) {

            actualizarContadorCarrito();
        }
    }
);


/* =========================================================
   INICIAR TODO
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        iniciarPerfil();

    }
);