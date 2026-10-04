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

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


/* =========================================================
   VARIABLES GLOBALES
========================================================= */

let usuarioActual = null;
let perfilActual = null;

const mapaCategorias = new Map();


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
   SISTEMA DE PUNTOS

   5% DE CADA COMPRA CONFIRMADA
   1 PUNTO = Q1
========================================================= */

/*
    Ejemplos:

    Compra de Q100   = 5 puntos
    Compra de Q500   = 25 puntos
    Compra de Q1000  = 50 puntos
    Compra de Q2000  = 100 puntos

    Esta función calcula los puntos.
    No los acredita automáticamente.
*/

function calcularPuntosVenta(totalVenta) {

    const total = Number(totalVenta);

    if (
        !Number.isFinite(total) ||
        total <= 0
    ) {
        return 0;
    }

    return Math.floor(total * 0.05);
}


/*
    Conversión de puntos a quetzales.

    1 punto equivale a Q1.
*/

function calcularValorPuntos(puntos) {

    const cantidad = Number(puntos);

    if (
        !Number.isFinite(cantidad) ||
        cantidad <= 0
    ) {
        return 0;
    }

    return cantidad;
}


/*
    Consulta el saldo de puntos de un usuario.
*/

async function consultarPuntosCliente(usuarioId) {

    if (!usuarioId) {

        throw new Error(
            "No se identificó al usuario."
        );

    }

    const { data, error } =
        await supabaseClient
            .from("perfiles")
            .select('"Puntos"')
            .eq("id", usuarioId)
            .maybeSingle();

    if (error) {
        throw error;
    }

    if (!data) {

        throw new Error(
            "No se encontró el perfil."
        );

    }

    const puntos =
        Number(data["Puntos"] || 0);

    return {

        puntos,

        valorQuetzales:
            calcularValorPuntos(puntos)

    };

}


/*
    Actualiza los puntos visibles en el perfil.
*/

async function actualizarPuntosPerfil() {

    if (
        !usuarioActual ||
        !puntosUsuario
    ) {
        return;
    }

    try {

        const saldo =
            await consultarPuntosCliente(
                usuarioActual.id
            );

        if (perfilActual) {

            perfilActual["Puntos"] =
                saldo.puntos;

        }

        puntosUsuario.textContent =
            saldo.puntos.toLocaleString(
                "es-GT"
            );

        actualizarBotonesCanje();

        return saldo;

    } catch (error) {

        console.error(
            "Error actualizando puntos:",
            error
        );

    }

}


/*
    Permite consultar cuánto ganaría una compra.

    No modifica el saldo.
*/

function mostrarCalculoPuntos(totalVenta) {

    const total =
        Number(totalVenta);

    const puntos =
        calcularPuntosVenta(total);

    return {

        totalCompra:
            total,

        puntosGanados:
            puntos,

        valorCanjeable:
            calcularValorPuntos(puntos)

    };

}


/* =========================================================
   IMÁGENES DE SUPABASE STORAGE
========================================================= */

function obtenerUrlImagen(imagen) {

    if (!imagen) {
        return "";
    }

    let ruta =
        String(imagen).trim();

    if (!ruta) {
        return "";
    }

    if (
        /^https?:\/\//i.test(ruta) ||
        /^data:/i.test(ruta)
    ) {
        return ruta;
    }

    ruta =
        ruta.replace(/^\/+/, "");

    if (
        /^storage\/v1\/object\/public\/productos\//i.test(
            ruta
        )
    ) {

        ruta =
            ruta.replace(
                /^storage\/v1\/object\/public\/productos\//i,
                ""
            );

    }

    if (
        /^productos\//i.test(ruta)
    ) {

        ruta =
            ruta.replace(
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

    const precio =
        Number(
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

        const { data, error } =
            await supabaseClient
                .from("categorias")
                .select("*");

        if (error) {

            console.warn(
                "No se pudieron cargar las categorías:",
                error
            );

            return;
        }

        (data || []).forEach(
            function (categoria) {

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

            }
        );

    } catch (error) {

        console.error(
            "Error cargando categorías:",
            error
        );

    }

}


/* =========================================================
   MENSAJE DE LOGIN
========================================================= */

function mostrarMensajeLogin(
    mensaje,
    tipo = ""
) {

    if (!mensajeLogin) {
        return;
    }

    mensajeLogin.textContent =
        mensaje;

    mensajeLogin.className =
        "mensaje-login";

    if (tipo) {

        mensajeLogin.classList.add(
            tipo
        );

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

        const { data, error } =
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

        if (error) {

            console.error(
                "Error cargando perfil:",
                error
            );

            return;
        }

        let perfil = data;

        /*
            Si no existe perfil, crearlo.
        */

        if (!perfil) {

            const nuevoPerfil = {

                id: user.id,

                nombre: "",

                apellido: "",

                rol: "cliente",

                "Puntos": 0

            };

            const {
                data: perfilCreado,
                error: errorInsertar
            } =
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

            if (errorInsertar) {

                console.error(
                    "Error creando perfil:",
                    errorInsertar
                );

                return;
            }

            perfil =
                perfilCreado;

        }

        perfilActual =
            perfil;

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
            puntos.toLocaleString(
                "es-GT"
            );

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

                btnLogin.disabled =
                    true;

                btnLogin.textContent =
                    "Ingresando...";

            }

            mostrarMensajeLogin(
                "",
                ""
            );

            try {

                /*
                    Mantiene el comportamiento original:
                    iniciar sesión y, si son credenciales inválidas,
                    intentar registrar la cuenta.
                */

                let resultado =
                    await supabaseClient.auth
                        .signInWithPassword({

                            email: correo,

                            password: password

                        });

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

                    btnLogin.disabled =
                        false;

                    btnLogin.textContent =
                        "Iniciar sesión";

                }

            }

        }
    );

}


/* =========================================================
   MOSTRAR / OCULTAR CONTRASEÑA
========================================================= */

if (
    mostrarPassword &&
    loginPassword
) {

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

    botones.forEach(
        function (boton) {

            /*
                Evita registrar dos veces
                el mismo evento.
            */

            if (
                boton.dataset.eventoCanjePreparado ===
                "true"
            ) {

                return;

            }

            boton.dataset.eventoCanjePreparado =
                "true";

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
                            boton.dataset.puntos ||
                            0
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

                        const {
                            data,
                            error
                        } =
                            await supabaseClient
                                .from("perfiles")
                                .select('"Puntos"')
                                .eq(
                                    "id",
                                    usuarioActual.id
                                )
                                .single();

                        if (error) {
                            throw error;
                        }

                        const puntosActuales =
                            Number(
                                data?.["Puntos"] ??
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

        }
    );

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

    botones.forEach(
        function (boton) {

            const puntosMaximos =
                Number(
                    boton.dataset.puntos ||
                    0
                );

            if (!usuarioActual) {

                boton.disabled =
                    false;

                boton.textContent =
                    "Canjear";

                return;
            }

            if (
                puntosActuales <
                puntosMaximos
            ) {

                boton.disabled =
                    true;

                boton.textContent =
                    "Puntos insuficientes";

            } else {

                boton.disabled =
                    false;

                boton.textContent =
                    "Canjear";

            }

        }
    );

}


/* =========================================================
   ABRIR MODAL DE PRODUCTOS PARA CANJE
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

        mensaje.textContent =
            "";

    }

    contenedor.innerHTML = `
        <div class="cargando-canjes">

            <i class="fa-solid fa-spinner fa-spin"></i>

            <span>
                Cargando productos...
            </span>

        </div>
    `;

    modal.style.display =
        "flex";

    document.body.style.overflow =
        "hidden";

    if (cerrar) {

        cerrar.onclick =
            function () {

                cerrarModalCanje();

            };

    }

    try {

        await cargarCategorias();

        const {
            data,
            error
        } =
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

        if (error) {
            throw error;
        }

        const todosLosProductos =
            data || [];

        const categoriaNormalizada =
            normalizarTexto(
                categoriaSeleccionada
            );

        /*
            Filtrar por categoría y precio.
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

                    <h3>
                        No hay productos disponibles
                    </h3>

                    <p>

                        No encontramos productos de
                        ${escapeHTML(
                categoriaSeleccionada
            )}
                        de hasta
                        Q${puntosMaximos.toLocaleString(
                "es-GT"
            )}.

                    </p>

                </div>
            `;

            return;
        }

        contenedor.innerHTML =
            productos
                .map(
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

                                        ${escapeHTML(
                                categoria
                            )}

                                    </div>


                                    <h3>
                                        ${escapeHTML(
                                nombre
                            )}
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
                                        data-producto-id="${escapeHTML(
                                idProducto
                            )}"
                                    >

                                        <i
                                            class="fa-solid fa-gift"
                                        ></i>

                                        Seleccionar

                                    </button>

                                </div>

                            </article>
                        `;

                    }
                )
                .join("");

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

                                        return (
                                            String(
                                                item.id
                                            ) ===
                                            String(id)
                                        );

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

                <i
                    class="fa-solid fa-triangle-exclamation"
                ></i>

                <h3>
                    Error al cargar productos
                </h3>

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

        modal.style.display =
            "none";

    }

    document.body.style.overflow =
        "";

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
   CONFIRMAR PRODUCTO DE CANJE
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

        Los precios con centavos se redondean hacia arriba.

        Ejemplo:
        Q149.50 = 150 puntos.
    */

    const puntosUtilizados =
        Math.ceil(precio);

    const confirmacion =
        window.confirm(

            `¿Deseas canjear "${nombreProducto}" por ${puntosUtilizados.toLocaleString("es-GT")} puntos?\n\n` +

            `Precio: Q${precio.toLocaleString(
                "es-GT",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            )}\n\n` +

            `Nivel máximo: ${puntosMaximos.toLocaleString(
                "es-GT"
            )} puntos`

        );

    if (!confirmacion) {
        return;
    }

    try {

        /*
            Consultar nuevamente el saldo actual.
        */

        const {
            data: perfil,
            error: errorPerfil
        } =
            await supabaseClient
                .from("perfiles")
                .select('"Puntos"')
                .eq(
                    "id",
                    usuarioActual.id
                )
                .single();

        if (errorPerfil) {
            throw errorPerfil;
        }

        const puntosActuales =
            Number(
                perfil?.["Puntos"] ??
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
            Descontar puntos.
        */

        const {
            error: errorActualizacion
        } =
            await supabaseClient
                .from("perfiles")
                .update({

                    "Puntos":
                        puntosRestantes,

                    actualizado_en:
                        new Date().toISOString()

                })
                .eq(
                    "id",
                    usuarioActual.id
                );

        if (errorActualizacion) {
            throw errorActualizacion;
        }


        /*
            Registrar el canje en Supabase.
        */

        const registroCanje = {

            usuario_id:
                usuarioActual.id,

            recompensa:
                nombreProducto,

            puntos:
                puntosUtilizados

        };


        const {
            data: canjeInsertado,
            error: errorCanje
        } =
            await supabaseClient
                .from("canjes")
                .insert(registroCanje)
                .select()
                .single();


        /*
            Si falla el registro,
            intentar devolver los puntos.
        */

        if (errorCanje) {

            const {
                error: errorReversion
            } =
                await supabaseClient
                    .from("perfiles")
                    .update({

                        "Puntos":
                            puntosActuales,

                        actualizado_en:
                            new Date().toISOString()

                    })
                    .eq(
                        "id",
                        usuarioActual.id
                    );

            if (errorReversion) {

                console.error(
                    "No se pudieron restaurar los puntos:",
                    errorReversion
                );

            }

            throw errorCanje;

        }


        /*
            Generar código del canje.
        */

        const codigo =
            "DL-" +
            Math.random()
                .toString(36)
                .substring(2, 8)
                .toUpperCase();


        /*
            Guardar los detalles locales del canje.
        */

        const canjeLocal = {

            activo:
                true,

            id:
                canjeInsertado?.id ||
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
                ) ||
                categoria,

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
                    ) ||
                    "[]"
                );

            if (
                Array.isArray(
                    existentes
                )
            ) {

                canjesGuardados =
                    existentes;

            }

        } catch (error) {

            canjesGuardados =
                [];

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
            Actualizar el perfil local.
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

        actualizarBotonesCanje();

        cerrarModalCanje();

        await cargarHistorialCanjes();


        /* =====================================================
           WHATSAPP
           
           ÚNICO CAMBIO:
           - Número actualizado
           - Indica que se paga/canjea con puntos
           - Incluye foto del producto
        ===================================================== */

        const mensajeWhatsApp =

            `Hola, quiero utilizar mi canje de DL Luxury.\n\n` +

            `🎁 CANJE DE PRODUCTO\n` +
            `━━━━━━━━━━━━━━━━━━\n\n` +

            `📦 Producto: ${nombreProducto}\n` +

            `🏷️ Categoría: ${categoria}\n` +

            `💰 Precio: Q${precio.toLocaleString(
                "es-GT",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            )}\n` +

            `⭐ Puntos utilizados: ${puntosUtilizados.toLocaleString(
                "es-GT"
            )}\n` +

            `⭐ Nivel máximo: ${puntosMaximos.toLocaleString(
                "es-GT"
            )}\n` +

            `⭐ Puntos restantes: ${puntosRestantes.toLocaleString(
                "es-GT"
            )}\n` +

            `🎟️ Código de canje: ${codigo}\n\n` +

            `💳 FORMA DE PAGO: CANJE CON PUNTOS\n` +

            `El producto será pagado/canjeado utilizando mis puntos de DL Luxury.\n` +

            `No realizaré un pago en efectivo por este producto.\n\n` +

            `📷 Foto del producto:\n` +

            `${imagen || "Sin imagen disponible"}\n\n` +

            `Quedo pendiente de la confirmación del canje.`;


        /*
            Número de WhatsApp:

            +502 5725 5468

            Para wa.me se escribe:
            50257255468
        */

        const numeroWhatsApp =
            "50257255468";


        const urlWhatsApp =
            "https://wa.me/" +
            numeroWhatsApp +
            "?text=" +
            encodeURIComponent(
                mensajeWhatsApp
            );


        /*
            Mensaje de éxito original.
        */

        alert(

            `¡Canje realizado correctamente!\n\n` +

            `Producto: ${nombreProducto}\n` +

            `Puntos utilizados: ${puntosUtilizados}\n` +

            `Puntos restantes: ${puntosRestantes}\n\n` +

            `Código: ${codigo}`

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

            <span>
                Cargando historial...
            </span>

        </div>

    `;

    try {

        const {
            data,
            error
        } =
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

        if (error) {
            throw error;
        }

        const canjes =
            data || [];

        if (!canjes.length) {

            historialCanjes.innerHTML = `

                <div class="sin-historial">

                    <i
                        class="fa-solid fa-gift"
                    ></i>

                    <p>
                        Aún no tienes canjes realizados.
                    </p>

                </div>

            `;

            return;
        }

        historialCanjes.innerHTML =
            canjes
                .map(
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
                                canje.puntos ||
                                0
                            );

                        return `

                            <div
                                class="historial-item"
                            >

                                <div
                                    class="historial-icono"
                                >

                                    <i
                                        class="fa-solid fa-gift"
                                    ></i>

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
                )
                .join("");

    } catch (error) {

        console.error(
            "Error cargando historial:",
            error
        );

        historialCanjes.innerHTML = `

            <div
                class="sin-historial"
            >

                <i
                    class="fa-solid fa-triangle-exclamation"
                ></i>

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

                const { error } =
                    await supabaseClient.auth
                        .signOut();

                if (error) {
                    throw error;
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
                ) ||
                "[]"
            );

        if (
            !Array.isArray(carrito)
        ) {

            contadorCarrito.textContent =
                "0";

            return;

        }

        const cantidad =
            carrito.reduce(
                function (
                    total,
                    producto
                ) {

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

        await cargarCategorias();

        const {
            data,
            error
        } =
            await supabaseClient.auth
                .getSession();

        if (error) {
            throw error;
        }

        const sesion =
            data?.session;

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
    function (
        event,
        session
    ) {

        /*
            Se programa la carga del perfil
            fuera del callback inmediato.
        */

        if (
            session?.user &&
            (
                event === "SIGNED_IN" ||
                event === "INITIAL_SESSION" ||
                event === "TOKEN_REFRESHED"
            )
        ) {

            Promise
                .resolve()
                .then(
                    function () {

                        return cargarPerfil(
                            session.user
                        );

                    }
                );

        } else if (
            event === "SIGNED_OUT"
        ) {

            mostrarFormularioLogin();

        }

    }
);


/* =========================================================
   CAMBIOS DEL CARRITO EN OTRAS PESTAÑAS
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


/* =========================================================
   CATÁLOGO PRINCIPAL DE PRODUCTOS PARA CANJE
========================================================= */

async function cargarCatalogoCanje() {

    const catalogo =
        document.getElementById(
            "catalogoCanje"
        );

    if (!catalogo) {

        console.warn(
            "No existe #catalogoCanje"
        );

        return;
    }

    catalogo.innerHTML = `

        <div
            class="productos-canje-cargando"
        >

            <i
                class="fa-solid fa-spinner fa-spin"
            ></i>

            <p>
                Cargando productos...
            </p>

        </div>

    `;

    try {

        await cargarCategorias();

        const {
            data: productos,
            error
        } =
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

        if (error) {

            console.error(
                "Error Supabase productos:",
                error
            );

            throw error;

        }

        console.log(
            "PRODUCTOS RECIBIDOS:",
            productos
        );

        if (
            !productos ||
            productos.length === 0
        ) {

            catalogo.innerHTML = `

                <div
                    class="productos-canje-vacio"
                >

                    <i
                        class="fa-solid fa-box-open"
                    ></i>

                    <p>
                        No hay productos disponibles.
                    </p>

                </div>

            `;

            return;
        }

        catalogo.innerHTML =
            productos
                .map(
                    function (producto) {

                        const nombre =
                            producto.nombre ||
                            producto.nombre_producto ||
                            "Producto";

                        const precio =
                            obtenerPrecioProducto(
                                producto
                            );

                        const categoria =
                            obtenerCategoriaProducto(
                                producto
                            ) ||
                            "DL Luxury";

                        const imagen =
                            obtenerImagenProducto(
                                producto
                            );

                        const puntosNecesarios =
                            Math.ceil(
                                precio
                            );

                        return `

                            <article
                                class="producto-canje-card"

                                data-nombre="${escapeHTML(
                            nombre
                        )}"

                                data-categoria="${escapeHTML(
                            categoria
                        )}"
                            >

                                <div
                                    class="producto-canje-foto"
                                >

                                    ${imagen
                                ? `

                                                <img
                                                    src="${escapeHTML(
                                    imagen
                                )}"

                                                    alt="${escapeHTML(
                                    nombre
                                )}"

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

                                                    <i
                                                        class="fa-solid fa-image"
                                                    ></i>

                                                </div>

                                            `
                                : `

                                                <div
                                                    class="producto-canje-sin-imagen"
                                                    style="display:flex;"
                                                >

                                                    <i
                                                        class="fa-solid fa-image"
                                                    ></i>

                                                </div>

                                            `
                            }

                                </div>


                                <div
                                    class="producto-canje-info"
                                >

                                    <span
                                        class="producto-canje-categoria"
                                    >

                                        ${escapeHTML(
                                categoria
                            )}

                                    </span>


                                    <h3>

                                        ${escapeHTML(
                                nombre
                            )}

                                    </h3>


                                    <p
                                        class="producto-canje-precio"
                                    >

                                        Q${precio.toLocaleString(
                                "es-GT",
                                {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }
                            )}

                                    </p>


                                    <small
                                        class="producto-canje-puntos"
                                    >

                                        Necesitas
                                        ${puntosNecesarios.toLocaleString(
                                "es-GT"
                            )}
                                        puntos

                                    </small>


                                    <button
                                        type="button"

                                        class="btn-seleccionar-producto-canje"

                                        data-producto-id="${escapeHTML(
                                producto.id
                            )}"
                                    >

                                        <i
                                            class="fa-solid fa-gift"
                                        ></i>

                                        Canjear producto

                                    </button>

                                </div>

                            </article>

                        `;

                    }
                )
                .join("");

        prepararBotonesCatalogoCanje(
            productos
        );

        aplicarFiltrosCatalogoCanje();

    } catch (error) {

        console.error(
            "ERROR CARGANDO CATÁLOGO DE CANJE:",
            error
        );

        catalogo.innerHTML = `

            <div
                class="productos-canje-vacio"
            >

                <i
                    class="fa-solid fa-triangle-exclamation"
                ></i>

                <p>
                    No se pudieron cargar los productos.
                </p>

                <small>

                    ${escapeHTML(
            error?.message ||
            "Error desconocido al consultar productos."
        )}

                </small>

            </div>

        `;

    }

}


/* =========================================================
   BOTONES DEL CATÁLOGO PRINCIPAL
========================================================= */

function prepararBotonesCatalogoCanje(
    productos
) {

    const botones =
        document.querySelectorAll(
            "#catalogoCanje .btn-seleccionar-producto-canje"
        );

    botones.forEach(
        function (boton) {

            boton.addEventListener(
                "click",
                async function () {

                    if (!usuarioActual) {

                        alert(
                            "Debes iniciar sesión para realizar un canje."
                        );

                        return;
                    }

                    const productoId =
                        boton.dataset.productoId;

                    const producto =
                        productos.find(
                            function (item) {

                                return (
                                    String(
                                        item.id
                                    ) ===
                                    String(
                                        productoId
                                    )
                                );

                            }
                        );

                    if (!producto) {

                        alert(
                            "No se encontró el producto seleccionado."
                        );

                        return;
                    }

                    const precio =
                        obtenerPrecioProducto(
                            producto
                        );

                    if (
                        !Number.isFinite(
                            precio
                        ) ||
                        precio <= 0
                    ) {

                        alert(
                            "El precio de este producto no es válido."
                        );

                        return;
                    }

                    const puntosNecesarios =
                        Math.ceil(
                            precio
                        );

                    try {

                        const saldo =
                            await consultarPuntosCliente(
                                usuarioActual.id
                            );

                        if (
                            saldo.puntos <
                            puntosNecesarios
                        ) {

                            alert(

                                `No tienes suficientes puntos.\n\n` +

                                `Tienes: ${saldo.puntos.toLocaleString("es-GT")} puntos.\n\n` +

                                `Necesitas: ${puntosNecesarios.toLocaleString("es-GT")} puntos.`

                            );

                            return;

                        }

                        const categoria =
                            obtenerCategoriaProducto(
                                producto
                            ) ||
                            "DL Luxury";

                        await confirmarProductoCanje(

                            producto,

                            "Catálogo",

                            categoria,

                            saldo.puntos

                        );

                    } catch (error) {

                        console.error(
                            "Error preparando producto para canje:",
                            error
                        );

                        alert(
                            error.message ||
                            "No se pudo preparar el canje."
                        );

                    }

                }
            );

        }
    );

}


/* =========================================================
   BUSCAR Y FILTRAR CATÁLOGO
========================================================= */

function aplicarFiltrosCatalogoCanje() {

    const catalogo =
        document.getElementById(
            "catalogoCanje"
        );

    const buscador =
        document.getElementById(
            "buscarProductoCanje"
        );

    const filtro =
        document.getElementById(
            "filtroCategoriaCanje"
        );

    if (!catalogo) {
        return;
    }

    const busqueda =
        normalizarTexto(
            buscador?.value || ""
        );

    const categoriaSeleccionada =
        normalizarTexto(
            filtro?.value || ""
        );

    const tarjetas =
        catalogo.querySelectorAll(
            ".producto-canje-card"
        );

    tarjetas.forEach(
        function (tarjeta) {

            const nombre =
                normalizarTexto(
                    tarjeta.dataset.nombre ||
                    tarjeta.querySelector(
                        "h3"
                    )?.textContent ||
                    ""
                );

            const categoria =
                normalizarTexto(
                    tarjeta.dataset.categoria ||
                    tarjeta.querySelector(
                        ".producto-canje-categoria"
                    )?.textContent ||
                    ""
                );

            const coincideBusqueda =
                !busqueda ||
                nombre.includes(
                    busqueda
                );

            const coincideCategoria =
                !categoriaSeleccionada ||
                categoria ===
                categoriaSeleccionada ||
                categoria.includes(
                    categoriaSeleccionada
                );

            tarjeta.style.display =
                coincideBusqueda &&
                    coincideCategoria
                    ? ""
                    : "none";

        }
    );

}


/* =========================================================
   EVENTOS DEL BUSCADOR Y FILTRO
========================================================= */

const buscadorCatalogo =
    document.getElementById(
        "buscarProductoCanje"
    );

if (buscadorCatalogo) {

    buscadorCatalogo.addEventListener(
        "input",
        aplicarFiltrosCatalogoCanje
    );

}


const filtroCatalogo =
    document.getElementById(
        "filtroCategoriaCanje"
    );

if (filtroCatalogo) {

    filtroCatalogo.addEventListener(
        "change",
        aplicarFiltrosCatalogoCanje
    );

}


/* =========================================================
   CARGAR CATÁLOGO AL INICIAR SESIÓN
========================================================= */

const iniciarPerfilOriginal =
    iniciarPerfil;

iniciarPerfil = async function () {

    await iniciarPerfilOriginal();

    if (usuarioActual) {

        await cargarCatalogoCanje();

    }

};
