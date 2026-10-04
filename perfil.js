/* =========================================================
   DL LUXURY
   PERFIL + LOGIN + REGISTRO AUTOMÁTICO + PUNTOS + CANJE DE PRODUCTOS

   FUNCIONES:
   - Inicio de sesión con Supabase
   - Registro automático si el usuario no existe
   - Perfil del usuario
   - Puntos
   - Catálogo completo de productos para canje
   - Modal de detalle
   - Canje de productos
   - Control de puntos y stock
   - Historial de canjes
   - Cerrar sesión
   - Contador del carrito
   - Imágenes desde Supabase Storage
   - Envío del canje por WhatsApp

   REGLA:
   1 punto = Q1
========================================================= */


/* =========================================================
   1. SUPABASE
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
   2. CONFIGURACIÓN
========================================================= */

const CLAVE_CARRITO = "dlLuxuryCarrito";
const CLAVE_CANJE = "dlLuxuryCanje";

const NUMERO_WHATSAPP_CANJE = "50257255468";


/* =========================================================
   3. VARIABLES GLOBALES
========================================================= */

let usuarioActual = null;
let perfilActual = null;
let productosCanje = [];
let productoSeleccionadoCanje = null;
let mapaCategorias = new Map();


/* =========================================================
   4. ELEMENTOS DEL DOM
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

const catalogoCanje =
    document.getElementById("catalogoCanje");


/* =========================================================
   5. MODAL DETALLE
========================================================= */

const modalDetalleProducto =
    document.getElementById(
        "modalDetalleProducto"
    );

const cerrarModalDetalleProducto =
    document.getElementById(
        "cerrarModalDetalleProducto"
    );

const detalleImagenProducto =
    document.getElementById(
        "detalleImagenProducto"
    );

const detalleSinImagenProducto =
    document.getElementById(
        "detalleSinImagenProducto"
    );

const detalleCategoriaProducto =
    document.getElementById(
        "detalleCategoriaProducto"
    );

const detalleNombreProducto =
    document.getElementById(
        "detalleNombreProducto"
    );

const detalleDescripcionProducto =
    document.getElementById(
        "detalleDescripcionProducto"
    );

const detallePrecioProducto =
    document.getElementById(
        "detallePrecioProducto"
    );

const detallePuntosProducto =
    document.getElementById(
        "detallePuntosProducto"
    );

const detalleStockProducto =
    document.getElementById(
        "detalleStockProducto"
    );

const btnCanjearDesdeDetalle =
    document.getElementById(
        "btnCanjearDesdeDetalle"
    );


/* =========================================================
   6. ESCAPE HTML
========================================================= */

function escapeHTML(valor) {

    if (
        valor === null ||
        valor === undefined
    ) {
        return "";
    }

    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   7. NORMALIZAR TEXTO
========================================================= */

function normalizarTexto(valor) {

    return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}


/* =========================================================
   8. OBTENER PRECIO
========================================================= */

function obtenerPrecioProducto(producto) {

    const precio =
        producto?.precio_final ??
        producto?.precio ??
        producto?.precioFinal ??
        0;

    const numero = Number(precio);

    if (
        !Number.isFinite(numero) ||
        numero < 0
    ) {
        return 0;
    }

    return numero;
}


/* =========================================================
   9. OBTENER PUNTOS
========================================================= */

function obtenerPuntosProducto(producto) {

    const precio =
        obtenerPrecioProducto(producto);

    return Math.ceil(precio);
}


/* =========================================================
   10. OBTENER URL DE IMAGEN
========================================================= */

function obtenerUrlImagen(valor) {

    if (!valor) {
        return "";
    }

    let texto = String(valor).trim();

    if (!texto) {
        return "";
    }

    if (
        texto.startsWith("http://") ||
        texto.startsWith("https://") ||
        texto.startsWith("data:image/")
    ) {
        return texto;
    }

    texto = texto.replace(/^\/+/, "");

    if (
        texto.startsWith(
            "storage/v1/object/"
        )
    ) {

        return (
            SUPABASE_URL +
            "/" +
            texto
        );
    }

    if (
        texto.startsWith("productos/")
    ) {

        texto =
            texto.substring(
                "productos/".length
            );
    }

    return (
        SUPABASE_URL +
        "/storage/v1/object/public/productos/" +
        texto
    );
}


/* =========================================================
   11. OBTENER IMAGEN DEL PRODUCTO
========================================================= */

function obtenerImagenProducto(producto) {

    if (!producto) {
        return "";
    }

    const imagen =
        producto.imagen ||
        producto.imagenBase64 ||
        producto.image ||
        producto.foto ||
        producto.imagen_url ||
        producto.url_imagen ||
        "";

    return obtenerUrlImagen(imagen);
}


/* =========================================================
   12. CARGAR CATEGORÍAS
========================================================= */

async function cargarCategorias() {

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("categorias")
            .select("*");

        if (error) {

            console.warn(
                "No se pudieron cargar categorías:",
                error
            );

            return;
        }

        mapaCategorias.clear();

        (data || []).forEach(
            categoria => {

                const id =
                    categoria.id;

                const nombre =
                    categoria.nombre ||
                    categoria.name ||
                    categoria.titulo ||
                    "";

                if (
                    id !== undefined &&
                    nombre
                ) {

                    mapaCategorias.set(
                        String(id),
                        nombre
                    );
                }
            }
        );

    } catch (error) {

        console.warn(
            "Error cargando categorías:",
            error
        );
    }
}


/* =========================================================
   13. OBTENER CATEGORÍA
========================================================= */

function obtenerCategoriaProducto(producto) {

    const categoria =
        producto?.categoriaNombre ||
        producto?.categoria_nombre ||
        producto?.categoria ||
        producto?.categoria_name ||
        producto?.categoriaName ||
        mapaCategorias.get(
            String(
                producto?.categoria_id
            )
        ) ||
        "";

    return String(
        categoria
    ).trim();
}


/* =========================================================
   14. MENSAJE LOGIN
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
        "mensaje-login " + tipo;
}


/* =========================================================
   15. CARGAR PERFIL
========================================================= */

async function cargarPerfil(user) {

    if (!user) {
        return;
    }

    usuarioActual = user;

    try {

        let {
            data: perfil,
            error
        } = await supabaseClient
            .from("perfiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

        if (error) {
            throw error;
        }

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
                error: errorCrear
            } = await supabaseClient
                .from("perfiles")
                .insert(nuevoPerfil)
                .select("*")
                .single();

            if (errorCrear) {
                throw errorCrear;
            }

            perfil =
                perfilCreado;
        }

        perfilActual =
            perfil;

        console.log(
            "PERFIL CARGADO:",
            perfilActual
        );

        actualizarInterfazUsuario();

        await cargarCatalogoCanje();

        await cargarHistorialCanjes();

    } catch (error) {

        console.error(
            "Error cargando perfil:",
            error
        );

        mostrarMensajeLogin(
            "No se pudo cargar el perfil.",
            "error"
        );
    }
}


/* =========================================================
   16. ACTUALIZAR INTERFAZ
========================================================= */

function actualizarInterfazUsuario() {

    if (!usuarioActual) {
        return;
    }

    const nombre = [

        perfilActual?.nombre,

        perfilActual?.apellido

    ]
        .filter(Boolean)
        .join(" ")
        .trim();

    if (usuarioNombre) {

        usuarioNombre.textContent =
            nombre ||
            usuarioActual.email ||
            "Usuario";
    }

    if (usuarioCorreo) {

        usuarioCorreo.textContent =
            usuarioActual.email || "";
    }

    const puntos =
        Number(
            perfilActual?.["Puntos"] ??
            perfilActual?.puntos ??
            0
        );

    if (puntosUsuario) {

        puntosUsuario.textContent =
            Math.max(
                0,
                Number.isFinite(puntos)
                    ? puntos
                    : 0
            ).toLocaleString(
                "es-GT"
            );
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

    if (estadoSesion) {

        estadoSesion.textContent =
            "Sesión iniciada";
    }

    actualizarCatalogoSegunPuntos();
}


/* =========================================================
   17. MOSTRAR LOGIN
========================================================= */

function mostrarFormularioLogin() {

    usuarioActual = null;

    perfilActual = null;

    productosCanje = [];

    productoSeleccionadoCanje = null;

    if (seccionLogin) {
        seccionLogin.style.display = "";
    }

    if (seccionUsuario) {
        seccionUsuario.style.display = "none";
    }

    if (seccionPuntos) {
        seccionPuntos.style.display = "none";
    }

    if (seccionCanje) {
        seccionCanje.style.display = "none";
    }

    if (seccionHistorial) {
        seccionHistorial.style.display = "none";
    }

    if (historialCanjes) {
        historialCanjes.innerHTML = "";
    }

    if (catalogoCanje) {
        catalogoCanje.innerHTML = "";
    }

    if (estadoSesion) {
        estadoSesion.textContent =
            "Inicia sesión";
    }

    cerrarModalDetalle();
}


/* =========================================================
   18. LOGIN + REGISTRO AUTOMÁTICO
========================================================= */

if (formLogin) {

    formLogin.addEventListener(
        "submit",
        async function (e) {

            e.preventDefault();

            const correo =
                loginCorreo?.value
                    ?.trim()
                    .toLowerCase() || "";

            const password =
                loginPassword?.value || "";

            if (
                !correo ||
                !password
            ) {

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

                btnLogin.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Verificando...
                `;
            }

            mostrarMensajeLogin("", "");

            try {

                /* =================================================
                   PRIMERO INTENTAR INICIAR SESIÓN
                ================================================= */

                const {
                    data: loginData,
                    error: loginError
                } =
                    await supabaseClient.auth
                        .signInWithPassword({
                            email: correo,
                            password: password
                        });

                /* =================================================
                   SI EL LOGIN FUNCIONA
                ================================================= */

                if (!loginError && loginData?.user) {

                    console.log(
                        "LOGIN CORRECTO:",
                        loginData.user.email
                    );

                    mostrarMensajeLogin(
                        "Inicio de sesión correcto.",
                        "success"
                    );

                    await cargarPerfil(
                        loginData.user
                    );

                    return;
                }


                /* =================================================
                   SI NO EXISTE / CREDENCIALES INVÁLIDAS
                   INTENTAR CREAR CUENTA
                ================================================= */

                console.log(
                    "La cuenta no pudo iniciar sesión.",
                    loginError
                );

                if (
                    loginError &&
                    normalizarTexto(
                        loginError.message
                    ).includes(
                        "email not confirmed"
                    )
                ) {

                    mostrarMensajeLogin(
                        "Tu correo todavía no ha sido confirmado.",
                        "error"
                    );

                    return;
                }


                /* =================================================
                   REGISTRO AUTOMÁTICO
                ================================================= */

                if (btnLogin) {

                    btnLogin.innerHTML = `
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        Creando cuenta...
                    `;
                }

                const {
                    data: registroData,
                    error: registroError
                } =
                    await supabaseClient.auth
                        .signUp({
                            email: correo,
                            password: password
                        });


                /* =================================================
                   ERROR AL CREAR CUENTA
                ================================================= */

                if (registroError) {

                    console.error(
                        "ERROR CREANDO CUENTA:",
                        registroError
                    );

                    const mensajeRegistro =
                        normalizarTexto(
                            registroError.message
                        );

                    if (
                        mensajeRegistro.includes(
                            "user already registered"
                        ) ||
                        mensajeRegistro.includes(
                            "already registered"
                        )
                    ) {

                        mostrarMensajeLogin(
                            "El correo ya está registrado. Verifica que la contraseña sea correcta.",
                            "error"
                        );

                    } else {

                        mostrarMensajeLogin(
                            registroError.message ||
                            "No se pudo crear la cuenta.",
                            "error"
                        );
                    }

                    return;
                }


                /* =================================================
                   USUARIO CREADO
                ================================================= */

                const nuevoUsuario =
                    registroData?.user;

                if (!nuevoUsuario) {

                    mostrarMensajeLogin(
                        "No se pudo crear el usuario.",
                        "error"
                    );

                    return;
                }

                console.log(
                    "CUENTA CREADA:",
                    nuevoUsuario
                );


                /* =================================================
                   SUPABASE PUEDE REQUERIR CONFIRMACIÓN
                ================================================= */

                if (
                    !registroData.session
                ) {

                    mostrarMensajeLogin(
                        "Cuenta creada. Revisa tu correo para confirmar la cuenta y después inicia sesión.",
                        "success"
                    );

                    return;
                }


                /* =================================================
                   CREAR / CARGAR PERFIL
                ================================================= */

                mostrarMensajeLogin(
                    "Cuenta creada correctamente. Bienvenido a DL Luxury.",
                    "success"
                );

                await cargarPerfil(
                    nuevoUsuario
                );

            } catch (error) {

                console.error(
                    "Error inesperado de login/registro:",
                    error
                );

                mostrarMensajeLogin(
                    "Ocurrió un error al iniciar sesión o crear la cuenta.",
                    "error"
                );

            } finally {

                if (btnLogin) {

                    btnLogin.disabled = false;

                    btnLogin.innerHTML = `
                        <i class="fa-solid fa-right-to-bracket"></i>
                        Iniciar sesión
                    `;
                }
            }
        }
    );
}


/* =========================================================
   19. MOSTRAR / OCULTAR PASSWORD
========================================================= */

if (mostrarPassword) {

    mostrarPassword.addEventListener(
        "click",
        function () {

            if (!loginPassword) {
                return;
            }

            const mostrar =
                loginPassword.type === "password";

            loginPassword.type =
                mostrar
                    ? "text"
                    : "password";

            mostrarPassword.setAttribute(
                "aria-label",
                mostrar
                    ? "Ocultar contraseña"
                    : "Mostrar contraseña"
            );

            mostrarPassword.setAttribute(
                "aria-pressed",
                String(mostrar)
            );

            const icono =
                mostrarPassword.querySelector("i");

            if (icono) {

                icono.classList.toggle(
                    "fa-eye",
                    !mostrar
                );

                icono.classList.toggle(
                    "fa-eye-slash",
                    mostrar
                );
            }
        }
    );
}


/* =========================================================
   20. CARGAR CATÁLOGO
========================================================= */

async function cargarCatalogoCanje() {

    if (!catalogoCanje) {
        return;
    }

    catalogoCanje.innerHTML = `
        <div class="productos-canje-cargando">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>Cargando productos...</span>
        </div>
    `;

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("productos")
            .select("*")
            .eq("activo", true)
            .order("id", {
                ascending: false
            });

        if (error) {
            throw error;
        }

        productosCanje =
            data || [];

        console.log(
            "PRODUCTOS PARA CANJE:",
            productosCanje
        );

        if (!productosCanje.length) {

            catalogoCanje.innerHTML = `
                <div class="sin-tickets">
                    <i class="fa-solid fa-box-open"></i>

                    <h3>
                        No hay productos disponibles
                    </h3>

                    <p>
                        Actualmente no hay productos activos
                        para canjear.
                    </p>
                </div>
            `;

            return;
        }

        renderizarCatalogoCanje();

    } catch (error) {

        console.error(
            "Error cargando catálogo:",
            error
        );

        catalogoCanje.innerHTML = `
            <div class="sin-tickets">
                <i class="fa-solid fa-triangle-exclamation"></i>

                <h3>
                    No se pudo cargar el catálogo
                </h3>

                <p>
                    Intenta actualizar la página.
                </p>
            </div>
        `;
    }
}


/* =========================================================
   21. RENDERIZAR CATÁLOGO
========================================================= */

function renderizarCatalogoCanje() {

    if (!catalogoCanje) {
        return;
    }

    catalogoCanje.innerHTML =
        productosCanje
            .map(
                producto =>
                    crearCardProductoCanje(producto)
            )
            .join("");

    agregarEventosCatalogo();
}


/* =========================================================
   22. CREAR CARD
========================================================= */

function crearCardProductoCanje(producto) {

    const id =
        producto.id;

    const nombre =
        producto.nombre ||
        "Producto sin nombre";

    const descripcion =
        producto.descripcion ||
        "Sin descripción disponible.";

    const categoria =
        obtenerCategoriaProducto(producto) ||
        "Producto";

    const precio =
        obtenerPrecioProducto(producto);

    const puntos =
        obtenerPuntosProducto(producto);

    const imagen =
        obtenerImagenProducto(producto);

    const stock =
        Number(producto.stock ?? 0);

    const agotado =
        !Number.isFinite(stock) ||
        stock <= 0;

    const puntosUsuarioActual =
        Number(
            perfilActual?.["Puntos"] ??
            perfilActual?.puntos ??
            0
        );

    const sinPuntos =
        puntosUsuarioActual < puntos;

    let estadoClase = "";
    let estadoTexto = "";

    if (agotado) {

        estadoClase = "agotado";
        estadoTexto = "Agotado";

    } else if (sinPuntos) {

        estadoClase = "sin-puntos";
        estadoTexto = "Puntos insuficientes";

    } else {

        estadoTexto = "Canjear producto";
    }

    const imagenHTML = imagen
        ? `
            <img
                src="${escapeHTML(imagen)}"
                alt="${escapeHTML(nombre)}"
                loading="lazy"
                onerror="
                    this.style.display='none';
                    this.nextElementSibling.style.display='flex';
                "
            >

            <div
                class="producto-canje-sin-imagen"
                style="display:none;"
            >
                <i class="fa-solid fa-image"></i>
                <span>Sin imagen</span>
            </div>
        `
        : `
            <div class="producto-canje-sin-imagen">
                <i class="fa-solid fa-image"></i>
                <span>Sin imagen</span>
            </div>
        `;

    return `
        <article
            class="producto-canje-card ${estadoClase}"
            data-producto-id="${escapeHTML(id)}"
        >

            <div class="producto-canje-foto">

                ${imagenHTML}

                <span class="producto-canje-etiqueta">
                    ${escapeHTML(categoria)}
                </span>

            </div>

            <div class="producto-canje-info">

                <span class="producto-canje-categoria">
                    ${escapeHTML(categoria)}
                </span>

                <h3 class="producto-canje-nombre">
                    ${escapeHTML(nombre)}
                </h3>

                <p class="producto-canje-descripcion">
                    ${escapeHTML(descripcion)}
                </p>

                <div class="producto-canje-precio">

                    <span>Precio</span>

                    <strong>
                        Q${precio.toFixed(2)}
                    </strong>

                </div>

                <div class="producto-canje-puntos">

                    <i class="fa-solid fa-star"></i>

                    <span>
                        ${puntos}
                        ${puntos === 1
            ? "punto"
            : "puntos"}
                    </span>

                </div>

                <button
                    type="button"
                    class="btn-seleccionar-producto-canje"
                    data-producto-id="${escapeHTML(id)}"
                    ${agotado || sinPuntos ? "disabled" : ""}
                >

                    <i class="fa-solid ${agotado
            ? "fa-box-open"
            : sinPuntos
                ? "fa-star"
                : "fa-gift"
        }"></i>

                    ${estadoTexto}

                </button>

            </div>

        </article>
    `;
}


/* =========================================================
   23. EVENTOS CATÁLOGO
========================================================= */

function agregarEventosCatalogo() {

    if (!catalogoCanje) {
        return;
    }

    const tarjetas =
        catalogoCanje.querySelectorAll(
            ".producto-canje-card"
        );

    tarjetas.forEach(
        tarjeta => {

            tarjeta.addEventListener(
                "click",
                function () {

                    const id =
                        tarjeta.dataset.productoId;

                    abrirDetalleProducto(id);
                }
            );
        }
    );

    const botones =
        catalogoCanje.querySelectorAll(
            ".btn-seleccionar-producto-canje"
        );

    botones.forEach(
        boton => {

            boton.addEventListener(
                "click",
                async function (e) {

                    e.stopPropagation();

                    if (boton.disabled) {
                        return;
                    }

                    const id =
                        boton.dataset.productoId;

                    const producto =
                        encontrarProductoPorId(id);

                    if (!producto) {
                        return;
                    }

                    await confirmarProductoCanje(
                        producto
                    );
                }
            );
        }
    );
}


/* =========================================================
   24. BUSCAR PRODUCTO
========================================================= */

function encontrarProductoPorId(id) {

    return productosCanje.find(
        producto =>
            String(producto.id) ===
            String(id)
    );
}


/* =========================================================
   25. ABRIR DETALLE
========================================================= */

function abrirDetalleProducto(id) {

    const producto =
        encontrarProductoPorId(id);

    if (!producto) {

        console.warn(
            "Producto no encontrado:",
            id
        );

        return;
    }

    productoSeleccionadoCanje =
        producto;

    const nombre =
        producto.nombre ||
        "Producto";

    const categoria =
        obtenerCategoriaProducto(producto) ||
        "Producto";

    const descripcion =
        producto.descripcion ||
        "Sin descripción disponible.";

    const precio =
        obtenerPrecioProducto(producto);

    const puntos =
        obtenerPuntosProducto(producto);

    const imagen =
        obtenerImagenProducto(producto);

    const stock =
        Number(producto.stock ?? 0);

    const puntosActuales =
        Number(
            perfilActual?.["Puntos"] ??
            perfilActual?.puntos ??
            0
        );

    const agotado =
        !Number.isFinite(stock) ||
        stock <= 0;

    const sinPuntos =
        puntosActuales < puntos;

    if (detalleNombreProducto) {
        detalleNombreProducto.textContent =
            nombre;
    }

    if (detalleCategoriaProducto) {
        detalleCategoriaProducto.textContent =
            categoria;
    }

    if (detalleDescripcionProducto) {
        detalleDescripcionProducto.textContent =
            descripcion;
    }

    if (detallePrecioProducto) {
        detallePrecioProducto.textContent =
            `Q${precio.toFixed(2)}`;
    }

    if (detallePuntosProducto) {
        detallePuntosProducto.textContent =
            puntos.toLocaleString("es-GT");
    }

    if (detalleStockProducto) {

        if (
            Number.isFinite(stock) &&
            stock > 0
        ) {

            detalleStockProducto.textContent =
                `Disponible: ${stock} unidad${stock === 1 ? "" : "es"}`;

        } else {

            detalleStockProducto.textContent =
                "Producto agotado";
        }
    }

    if (detalleImagenProducto) {

        if (imagen) {

            detalleImagenProducto.src =
                imagen;

            detalleImagenProducto.alt =
                nombre;

            detalleImagenProducto.style.display =
                "block";

            if (detalleSinImagenProducto) {
                detalleSinImagenProducto.style.display =
                    "none";
            }

            detalleImagenProducto.onerror =
                function () {

                    this.style.display =
                        "none";

                    if (detalleSinImagenProducto) {

                        detalleSinImagenProducto.style.display =
                            "flex";
                    }
                };

        } else {

            detalleImagenProducto.src = "";

            detalleImagenProducto.style.display =
                "none";

            if (detalleSinImagenProducto) {

                detalleSinImagenProducto.style.display =
                    "flex";
            }
        }
    }

    if (btnCanjearDesdeDetalle) {

        btnCanjearDesdeDetalle.disabled =
            agotado ||
            sinPuntos;

        if (agotado) {

            btnCanjearDesdeDetalle.innerHTML = `
                <i class="fa-solid fa-box-open"></i>
                Producto agotado
            `;

        } else if (sinPuntos) {

            btnCanjearDesdeDetalle.innerHTML = `
                <i class="fa-solid fa-star"></i>
                Puntos insuficientes
            `;

        } else {

            btnCanjearDesdeDetalle.innerHTML = `
                <i class="fa-solid fa-gift"></i>
                Canjear producto
            `;
        }
    }

    if (modalDetalleProducto) {

        modalDetalleProducto.classList.add(
            "modal-abierto"
        );

        modalDetalleProducto.classList.add(
            "mostrar"
        );

        modalDetalleProducto.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "modal-abierto"
        );
    }
}


/* =========================================================
   26. CERRAR MODAL
========================================================= */

function cerrarModalDetalle() {

    if (!modalDetalleProducto) {
        return;
    }

    modalDetalleProducto.classList.remove(
        "modal-abierto"
    );

    modalDetalleProducto.classList.remove(
        "mostrar"
    );

    modalDetalleProducto.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "modal-abierto"
    );

    productoSeleccionadoCanje =
        null;
}


/* =========================================================
   27. BOTÓN CERRAR
========================================================= */

if (cerrarModalDetalleProducto) {

    cerrarModalDetalleProducto.addEventListener(
        "click",
        cerrarModalDetalle
    );
}


/* =========================================================
   28. CLICK FUERA DEL MODAL
========================================================= */

if (modalDetalleProducto) {

    modalDetalleProducto.addEventListener(
        "click",
        function (e) {

            if (
                e.target ===
                modalDetalleProducto
            ) {

                cerrarModalDetalle();
            }
        }
    );
}


/* =========================================================
   29. ESC
========================================================= */

document.addEventListener(
    "keydown",
    function (e) {

        if (
            e.key === "Escape" &&
            modalDetalleProducto?.classList.contains(
                "modal-abierto"
            )
        ) {

            cerrarModalDetalle();
        }
    }
);


/* =========================================================
   30. CANJEAR DESDE MODAL
========================================================= */

if (btnCanjearDesdeDetalle) {

    btnCanjearDesdeDetalle.addEventListener(
        "click",
        async function () {

            if (!productoSeleccionadoCanje) {
                return;
            }

            if (btnCanjearDesdeDetalle.disabled) {
                return;
            }

            const producto =
                productoSeleccionadoCanje;

            cerrarModalDetalle();

            await confirmarProductoCanje(
                producto
            );
        }
    );
}


/* =========================================================
   31. CONFIRMAR CANJE
========================================================= */

async function confirmarProductoCanje(producto) {

    if (!usuarioActual) {

        alert(
            "Debes iniciar sesión para canjear productos."
        );

        return;
    }

    if (!producto) {

        alert(
            "No se encontró el producto."
        );

        return;
    }

    try {

        const {
            data: productoActual,
            error: errorProducto
        } = await supabaseClient
            .from("productos")
            .select("*")
            .eq("id", producto.id)
            .maybeSingle();

        console.log(
            "PRODUCTO ENVIADO AL CANJE:",
            producto
        );

        console.log(
            "PRODUCTO ACTUAL EN SUPABASE:",
            productoActual
        );

        console.log(
            "ERROR CONSULTANDO PRODUCTO:",
            errorProducto
        );

        if (errorProducto) {
            throw errorProducto;
        }

        if (!productoActual) {

            alert(
                "El producto ya no existe."
            );

            await cargarCatalogoCanje();

            return;
        }

        if (productoActual.activo !== true) {

            alert(
                "Este producto ya no está disponible."
            );

            await cargarCatalogoCanje();

            return;
        }

        const stockActual =
            Number(
                productoActual.stock ?? 0
            );

        console.log(
            "STOCK ACTUAL:",
            stockActual
        );

        if (
            !Number.isFinite(stockActual) ||
            stockActual <= 0
        ) {

            alert(
                "Este producto está agotado."
            );

            await cargarCatalogoCanje();

            return;
        }

        const precio =
            obtenerPrecioProducto(
                productoActual
            );

        if (
            !Number.isFinite(precio) ||
            precio <= 0
        ) {

            alert(
                "El producto no tiene un precio válido."
            );

            return;
        }

        const puntosUtilizados =
            Math.ceil(precio);

        const {
            data: perfilReal,
            error: errorPerfil
        } = await supabaseClient
            .from("perfiles")
            .select("*")
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
                perfilReal?.["Puntos"] ??
                perfilReal?.puntos ??
                0
            );

        console.log(
            "PUNTOS ACTUALES:",
            puntosActuales
        );

        if (
            !Number.isFinite(puntosActuales)
        ) {

            alert(
                "No se pudieron consultar tus puntos."
            );

            return;
        }

        if (
            puntosActuales <
            puntosUtilizados
        ) {

            alert(
                `No tienes suficientes puntos.\n\n` +
                `Necesitas: ${puntosUtilizados}\n` +
                `Tienes: ${puntosActuales}`
            );

            return;
        }

        const nuevoSaldo =
            puntosActuales -
            puntosUtilizados;

        const nombreProducto =
            productoActual.nombre ||
            "Producto";

        const categoria =
            obtenerCategoriaProducto(
                productoActual
            ) ||
            "Producto";

        const descripcion =
            productoActual.descripcion ||
            "Sin descripción disponible.";

        const imagenProducto =
            obtenerImagenProducto(
                productoActual
            );

        const confirmar =
            window.confirm(
                `¿Deseas canjear este producto?\n\n` +
                `${nombreProducto}\n` +
                `Categoría: ${categoria}\n` +
                `Precio: Q${precio.toFixed(2)}\n` +
                `Puntos necesarios: ${puntosUtilizados}\n` +
                `Puntos actuales: ${puntosActuales}\n\n` +
                `Después del canje tendrás: ${nuevoSaldo} puntos.`
            );

        if (!confirmar) {
            return;
        }

        const codigo =
            "DL-" +
            Math.random()
                .toString(36)
                .substring(2, 8)
                .toUpperCase();

        const textoWhatsApp =
            `🎁 CANJE DE PRODUCTO - DL LUXURY\n\n` +

            `Hola, quiero realizar un canje utilizando mis puntos DL Luxury.\n\n` +

            `🛍️ PRODUCTO\n` +
            `Nombre: ${nombreProducto}\n` +
            `📂 Categoría: ${categoria}\n` +
            `📝 Descripción: ${descripcion}\n\n` +

            `💰 Precio normal: Q${precio.toFixed(2)}\n` +
            `⭐ Puntos utilizados: ${puntosUtilizados}\n` +
            `⭐ Puntos restantes: ${nuevoSaldo}\n\n` +

            `🔑 Código de canje: ${codigo}\n\n` +

            `📦 Este producto fue canjeado utilizando puntos DL Luxury.\n\n` +

            (
                imagenProducto
                    ? `📸 Foto del producto:\n${imagenProducto}\n\n`
                    : `📸 El producto no tiene una imagen disponible.\n\n`
            ) +

            `✅ Canje realizado correctamente.`;

        const urlWhatsApp =
            `https://wa.me/${NUMERO_WHATSAPP_CANJE}?text=${encodeURIComponent(
                textoWhatsApp
            )}`;

        console.log(
            "NÚMERO WHATSAPP:",
            NUMERO_WHATSAPP_CANJE
        );

        console.log(
            "URL WHATSAPP:",
            urlWhatsApp
        );

        console.log(
            "INTENTANDO DESCONTAR PUNTOS..."
        );

        const {
            data: puntosActualizados,
            error: errorPuntos
        } = await supabaseClient
            .from("perfiles")
            .update({
                "Puntos":
                    nuevoSaldo
            })
            .eq(
                "id",
                usuarioActual.id
            )
            .eq(
                "Puntos",
                puntosActuales
            )
            .select("*")
            .maybeSingle();

        console.log(
            "RESULTADO PUNTOS:",
            puntosActualizados
        );

        console.log(
            "ERROR PUNTOS:",
            errorPuntos
        );

        if (errorPuntos) {
            throw errorPuntos;
        }

        if (!puntosActualizados) {

            alert(
                "Tus puntos cambiaron o no se pudieron actualizar. " +
                "Actualiza la página e inténtalo nuevamente."
            );

            return;
        }

        const nuevoStock =
            Math.max(
                0,
                stockActual - 1
            );

        console.log(
            "================================="
        );

        console.log(
            "INTENTANDO ACTUALIZAR STOCK"
        );

        console.log(
            "ID PRODUCTO:",
            productoActual.id
        );

        console.log(
            "STOCK ANTERIOR:",
            stockActual
        );

        console.log(
            "STOCK NUEVO:",
            nuevoStock
        );

        console.log(
            "================================="
        );

        const {
            error: errorStock
        } = await supabaseClient
            .from("productos")
            .update({
                stock:
                    nuevoStock
            })
            .eq(
                "id",
                productoActual.id
            );

        console.log(
            "ERROR ACTUALIZANDO STOCK:",
            errorStock
        );

        if (errorStock) {

            console.error(
                "ERROR REAL DEL STOCK:",
                errorStock
            );

            console.error(
                "DETALLES ERROR STOCK:",
                {
                    message:
                        errorStock.message,

                    details:
                        errorStock.details,

                    hint:
                        errorStock.hint,

                    code:
                        errorStock.code
                }
            );

            const {
                error:
                errorRestaurarPuntos
            } = await supabaseClient
                .from("perfiles")
                .update({
                    "Puntos":
                        puntosActuales
                })
                .eq(
                    "id",
                    usuarioActual.id
                );

            if (
                errorRestaurarPuntos
            ) {

                console.error(
                    "ERROR RESTAURANDO PUNTOS:",
                    errorRestaurarPuntos
                );
            }

            await cargarPerfil(
                usuarioActual
            );

            alert(
                "No se pudo actualizar el stock.\n\n" +
                "Tus puntos fueron restaurados.\n\n" +
                "Revisa la consola para conocer el error."
            );

            return;
        }

        console.log(
            "STOCK ACTUALIZADO CORRECTAMENTE"
        );

        const {
            data: canjeRegistrado,
            error: errorCanje
        } = await supabaseClient
            .from("canjes")
            .insert({
                usuario_id:
                    usuarioActual.id,

                recompensa:
                    nombreProducto,

                puntos:
                    puntosUtilizados
            })
            .select("*")
            .maybeSingle();

        if (
            errorCanje ||
            !canjeRegistrado
        ) {

            console.error(
                "ERROR REGISTRANDO CANJE:",
                errorCanje
            );

            const {
                error:
                errorRestaurarPuntos
            } = await supabaseClient
                .from("perfiles")
                .update({
                    "Puntos":
                        puntosActuales
                })
                .eq(
                    "id",
                    usuarioActual.id
                );

            if (
                errorRestaurarPuntos
            ) {

                console.error(
                    "ERROR RESTAURANDO PUNTOS:",
                    errorRestaurarPuntos
                );
            }

            const {
                error:
                errorRestaurarStock
            } = await supabaseClient
                .from("productos")
                .update({
                    stock:
                        stockActual
                })
                .eq(
                    "id",
                    productoActual.id
                );

            if (
                errorRestaurarStock
            ) {

                console.error(
                    "ERROR RESTAURANDO STOCK:",
                    errorRestaurarStock
                );
            }

            await cargarPerfil(
                usuarioActual
            );

            alert(
                "No se pudo registrar el canje. " +
                "Se intentó restaurar tus puntos y el stock."
            );

            return;
        }

        perfilActual = {
            ...perfilReal,
            "Puntos":
                nuevoSaldo
        };

        const datosCanje = {

            id:
                canjeRegistrado?.id ||
                null,

            usuario_id:
                usuarioActual.id,

            producto_id:
                productoActual.id,

            recompensa:
                nombreProducto,

            producto_nombre:
                nombreProducto,

            categoria:
                categoria,

            producto_categoria:
                categoria,

            descripcion:
                descripcion,

            precio:
                precio,

            producto_precio:
                precio,

            puntos:
                puntosUtilizados,

            puntos_restantes:
                nuevoSaldo,

            codigo:
                codigo,

            imagen:
                imagenProducto,

            producto_imagen:
                imagenProducto,

            activo:
                true,

            creado_en:
                new Date().toISOString()
        };

        localStorage.setItem(
            CLAVE_CANJE,
            JSON.stringify(
                datosCanje
            )
        );

        console.log(
            "CANJE GUARDADO EN LOCALSTORAGE:",
            datosCanje
        );

        actualizarInterfazUsuario();

        const indice =
            productosCanje.findIndex(
                item =>
                    String(item.id) ===
                    String(productoActual.id)
            );

        if (indice !== -1) {

            productosCanje[indice] = {

                ...productosCanje[indice],

                stock:
                    nuevoStock
            };
        }

        renderizarCatalogoCanje();

        await cargarHistorialCanjes();

        alert(
            `¡Canje realizado correctamente!\n\n` +

            `Producto: ${nombreProducto}\n` +

            `Puntos utilizados: ${puntosUtilizados}\n` +

            `Puntos restantes: ${nuevoSaldo}\n\n` +

            `Código: ${codigo}\n\n` +

            `Ahora se abrirá WhatsApp.`
        );

        console.log(
            "ABRIENDO WHATSAPP..."
        );

        console.log(
            "URL:",
            urlWhatsApp
        );

        const ventanaWhatsApp =
            window.open(
                urlWhatsApp,
                "_blank"
            );

        if (!ventanaWhatsApp) {

            console.warn(
                "El navegador bloqueó la ventana de WhatsApp."
            );

            window.location.href =
                urlWhatsApp;
        }

        console.log(
            "CANJE REALIZADO:",
            datosCanje
        );

    } catch (error) {

        console.error(
            "ERROR REALIZANDO CANJE:",
            error
        );

        console.error(
            "DETALLES:",
            {
                message:
                    error?.message,

                details:
                    error?.details,

                hint:
                    error?.hint,

                code:
                    error?.code
            }
        );

        alert(
            "Ocurrió un error al realizar el canje. " +
            "Revisa la consola."
        );
    }
}


/* =========================================================
   32. ACTUALIZAR BOTONES SEGÚN PUNTOS
========================================================= */

function actualizarCatalogoSegunPuntos() {

    if (!catalogoCanje) {
        return;
    }

    if (!productosCanje.length) {
        return;
    }

    const puntos =
        Number(
            perfilActual?.["Puntos"] ??
            perfilActual?.puntos ??
            0
        );

    const tarjetas =
        catalogoCanje.querySelectorAll(
            ".producto-canje-card"
        );

    tarjetas.forEach(
        tarjeta => {

            const producto =
                encontrarProductoPorId(
                    tarjeta.dataset.productoId
                );

            if (!producto) {
                return;
            }

            const boton =
                tarjeta.querySelector(
                    ".btn-seleccionar-producto-canje"
                );

            if (!boton) {
                return;
            }

            const stock =
                Number(
                    producto.stock ?? 0
                );

            const puntosProducto =
                obtenerPuntosProducto(
                    producto
                );

            const agotado =
                !Number.isFinite(stock) ||
                stock <= 0;

            const sinPuntos =
                puntos <
                puntosProducto;

            boton.disabled =
                agotado ||
                sinPuntos;

            if (agotado) {

                boton.innerHTML = `
                    <i class="fa-solid fa-box-open"></i>
                    Agotado
                `;

            } else if (sinPuntos) {

                boton.innerHTML = `
                    <i class="fa-solid fa-star"></i>
                    Puntos insuficientes
                `;

            } else {

                boton.innerHTML = `
                    <i class="fa-solid fa-gift"></i>
                    Canjear producto
                `;
            }
        }
    );
}


/* =========================================================
   33. HISTORIAL
========================================================= */

async function cargarHistorialCanjes() {

    if (!historialCanjes) {
        return;
    }

    if (!usuarioActual) {

        historialCanjes.innerHTML =
            "";

        return;
    }

    historialCanjes.innerHTML = `
        <div class="historial-cargando">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>Cargando historial...</span>
        </div>
    `;

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("canjes")
            .select(
                "id, recompensa, puntos, creado_en"
            )
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

        if (!data?.length) {

            historialCanjes.innerHTML = `
                <div class="sin-historial">

                    <i class="fa-solid fa-gift"></i>

                    <h3>
                        Aún no tienes canjes
                    </h3>

                    <p>
                        Cuando realices tu primer
                        canje aparecerá aquí.
                    </p>

                </div>
            `;

            return;
        }

        historialCanjes.innerHTML =
            data
                .map(
                    canje =>
                        crearItemHistorial(
                            canje
                        )
                )
                .join("");

    } catch (error) {

        console.error(
            "Error cargando historial:",
            error
        );

        historialCanjes.innerHTML = `
            <div class="sin-historial">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <h3>
                    No se pudo cargar el historial
                </h3>

                <p>
                    Intenta actualizar la página.
                </p>

            </div>
        `;
    }
}


/* =========================================================
   34. ITEM HISTORIAL
========================================================= */

function crearItemHistorial(canje) {

    const nombre =
        canje.recompensa ||
        "Producto";

    const puntos =
        Number(
            canje.puntos ?? 0
        );

    const fecha =
        formatearFecha(
            canje.creado_en
        );

    return `
        <div class="historial-canje">

            <div class="historial-canje-icono">

                <i class="fa-solid fa-gift"></i>

            </div>

            <div class="historial-canje-info">

                <h3>
                    ${escapeHTML(nombre)}
                </h3>

                <span>
                    ${escapeHTML(fecha)}
                </span>

            </div>

            <div class="historial-canje-puntos">

                <strong>
                    -${puntos}
                </strong>

                <span>
                    puntos
                </span>

            </div>

        </div>
    `;
}


/* =========================================================
   35. FORMATEAR FECHA
========================================================= */

function formatearFecha(fecha) {

    if (!fecha) {
        return "Fecha no disponible";
    }

    try {

        const fechaObj =
            new Date(fecha);

        if (
            Number.isNaN(
                fechaObj.getTime()
            )
        ) {

            return "Fecha no disponible";
        }

        return fechaObj.toLocaleString(
            "es-GT",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    } catch {

        return "Fecha no disponible";
    }
}


/* =========================================================
   36. CERRAR SESIÓN
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
                    await supabaseClient
                        .auth
                        .signOut();

                if (error) {
                    throw error;
                }

                mostrarFormularioLogin();

                if (loginCorreo) {
                    loginCorreo.value = "";
                }

                if (loginPassword) {
                    loginPassword.value = "";
                }

                mostrarMensajeLogin(
                    "Sesión cerrada correctamente.",
                    "success"
                );

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
   37. CONTADOR DEL CARRITO
========================================================= */

function actualizarContadorCarrito() {

    if (!contadorCarrito) {
        return;
    }

    try {

        const carritoGuardado =
            localStorage.getItem(
                CLAVE_CARRITO
            );

        if (!carritoGuardado) {

            contadorCarrito.textContent =
                "0";

            contadorCarrito.style.display =
                "none";

            return;
        }

        const carrito =
            JSON.parse(
                carritoGuardado
            );

        if (!Array.isArray(carrito)) {

            contadorCarrito.textContent =
                "0";

            contadorCarrito.style.display =
                "none";

            return;
        }

        let cantidadTotal = 0;

        carrito.forEach(
            item => {

                const cantidad =
                    Number(
                        item?.cantidad ??
                        item?.qty ??
                        1
                    );

                if (
                    Number.isFinite(cantidad) &&
                    cantidad > 0
                ) {

                    cantidadTotal +=
                        cantidad;
                }
            }
        );

        contadorCarrito.textContent =
            cantidadTotal > 99
                ? "99+"
                : String(cantidadTotal);

        contadorCarrito.style.display =
            cantidadTotal > 0
                ? ""
                : "none";

    } catch (error) {

        console.warn(
            "Error leyendo carrito:",
            error
        );

        contadorCarrito.textContent =
            "0";

        contadorCarrito.style.display =
            "none";
    }
}


/* =========================================================
   38. CAMBIOS DEL CARRITO
========================================================= */

window.addEventListener(
    "storage",
    function (e) {

        if (
            e.key ===
            CLAVE_CARRITO
        ) {

            actualizarContadorCarrito();
        }
    }
);


/* =========================================================
   39. INICIAR PERFIL
========================================================= */

async function iniciarPerfil() {

    console.log(
        "INICIANDO PERFIL DL LUXURY..."
    );

    await cargarCategorias();

    actualizarContadorCarrito();

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth
                .getSession();

        if (error) {

            console.error(
                "Error obteniendo sesión:",
                error
            );

            mostrarFormularioLogin();

            return;
        }

        const session =
            data?.session;

        if (session?.user) {

            console.log(
                "SESIÓN ENCONTRADA:",
                session.user.email
            );

            await cargarPerfil(
                session.user
            );

        } else {

            console.log(
                "NO HAY SESIÓN ACTIVA"
            );

            mostrarFormularioLogin();
        }

    } catch (error) {

        console.error(
            "Error iniciando perfil:",
            error
        );

        mostrarFormularioLogin();
    }
}


/* =========================================================
   40. CAMBIOS DE AUTH
========================================================= */

supabaseClient.auth.onAuthStateChange(
    async function (
        event,
        session
    ) {

        console.log(
            "CAMBIO AUTH:",
            event
        );

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
   41. INICIAR
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        iniciarPerfil
    );

} else {

    iniciarPerfil();
}


/* =========================================================
   42. FUNCIONES GLOBALES
========================================================= */

window.abrirDetalleProducto =
    abrirDetalleProducto;

window.cerrarModalDetalle =
    cerrarModalDetalle;

window.cargarCatalogoCanje =
    cargarCatalogoCanje;

window.cargarHistorialCanjes =
    cargarHistorialCanjes;

window.confirmarProductoCanje =
    confirmarProductoCanje;

window.actualizarContadorCarrito =
    actualizarContadorCarrito;
