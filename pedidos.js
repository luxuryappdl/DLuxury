/* =========================================================
   DL LUXURY
   PEDIDOS.JS

   FUNCIONES:
   - Obtener cliente actual
   - Obtener perfil del cliente
   - Registrar pedido en Supabase
   - Conectar con el botón Finalizar compra
   - NO modifica el carrito
   - NO agrega puntos automáticamente
   - INCLUYE CANJE ACTIVO
   - INCLUYE IMÁGENES EN WHATSAPP
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_PEDIDOS_URL =
    "https://brnyvkqwkosgtpugxcge.supabase.co";

const SUPABASE_PEDIDOS_KEY =
    "sb_publishable_Qdae9GUtmuosAPP4kemF3A_Vr4HFo0n";


const supabasePedidos =
    window.supabase.createClient(
        SUPABASE_PEDIDOS_URL,
        SUPABASE_PEDIDOS_KEY
    );


/* =========================================================
   CONFIGURACIÓN
========================================================= */

const CLAVE_CARRITO_PEDIDOS =
    "dlLuxuryCarrito";

const CLAVE_CANJE_PEDIDOS =
    "dlLuxuryCanje";

const NUMERO_WHATSAPP_PEDIDOS =
    "50257255468";


/* =========================================================
   OBTENER CARRITO
========================================================= */

function obtenerCarritoParaPedido() {

    try {

        const datos =
            localStorage.getItem(
                CLAVE_CARRITO_PEDIDOS
            );

        if (!datos) {
            return [];
        }

        const carrito =
            JSON.parse(datos);

        if (!Array.isArray(carrito)) {
            return [];
        }

        return carrito;

    } catch (error) {

        console.error(
            "Error leyendo carrito para pedido:",
            error
        );

        return [];
    }
}


/* =========================================================
   OBTENER CANJE ACTIVO
========================================================= */

function obtenerCanjeParaPedido() {

    try {

        const datos =
            localStorage.getItem(
                CLAVE_CANJE_PEDIDOS
            );

        if (!datos) {
            return null;
        }

        const canje =
            JSON.parse(datos);

        if (
            !canje ||
            typeof canje !== "object"
        ) {

            return null;
        }

        if (!canje.activo) {
            return null;
        }

        return canje;

    } catch (error) {

        console.error(
            "Error leyendo canje para pedido:",
            error
        );

        return null;
    }
}


/* =========================================================
   OBTENER NOMBRE
========================================================= */

function obtenerNombrePedido(producto) {

    return (
        producto.nombre ||
        producto.titulo ||
        "Producto"
    );
}


/* =========================================================
   OBTENER CATEGORÍA
========================================================= */

function obtenerCategoriaPedido(producto) {

    return (
        producto.categoriaNombre ||
        producto.categoria_nombre ||
        producto.categoria ||
        "Producto"
    );
}


/* =========================================================
   OBTENER DESCRIPCIÓN
========================================================= */

function obtenerDescripcionPedido(producto) {

    return (
        producto.descripcion ||
        producto.descripcion_producto ||
        producto.detalle ||
        "Sin descripción disponible."
    );
}


/* =========================================================
   OBTENER IMAGEN
========================================================= */

function obtenerImagenPedido(producto) {

    return (
        producto.imagen ||
        producto.imagenBase64 ||
        producto.image ||
        producto.imagen_url ||
        producto.url_imagen ||
        ""
    );
}


/* =========================================================
   CONVERTIR IMAGEN A URL PÚBLICA
========================================================= */

function convertirImagenPublicaPedido(imagen) {

    if (!imagen) {
        return "";
    }


    const imagenTexto =
        String(imagen).trim();


    if (!imagenTexto) {
        return "";
    }


    /* =====================================================
       SI YA ES URL COMPLETA
    ===================================================== */

    if (
        imagenTexto.startsWith("http://") ||
        imagenTexto.startsWith("https://")
    ) {

        return imagenTexto;
    }


    /* =====================================================
       SI ES BASE64
    ===================================================== */

    if (
        imagenTexto.startsWith("data:image/")
    ) {

        return imagenTexto;
    }


    /* =====================================================
       QUITAR RUTAS INNECESARIAS
    ===================================================== */

    let ruta =
        imagenTexto
            .replace(/^\/+/, "")
            .trim();


    /* =====================================================
       SI YA VIENE CON productos/
    ===================================================== */

    if (
        ruta.startsWith("productos/")
    ) {

        ruta =
            ruta.substring(
                "productos/".length
            );
    }


    /* =====================================================
       CREAR URL PÚBLICA DE SUPABASE STORAGE
       
       BUCKET:
       productos
    ===================================================== */

    const {
        data
    } =
        supabasePedidos
            .storage
            .from("productos")
            .getPublicUrl(ruta);


    if (
        data &&
        data.publicUrl
    ) {

        return data.publicUrl;
    }


    return "";
}


/* =========================================================
   OBTENER PRECIO
========================================================= */

function obtenerPrecioPedido(producto) {

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


    const precioFinalCamel =
        Number(
            producto.precioFinal
        );

    if (
        Number.isFinite(precioFinalCamel) &&
        precioFinalCamel > 0
    ) {

        return precioFinalCamel;
    }


    const precio =
        Number(
            producto.precio
        );

    if (
        Number.isFinite(precio) &&
        precio >= 0
    ) {

        return precio;
    }


    return 0;
}


/* =========================================================
   OBTENER CANTIDAD
========================================================= */

function obtenerCantidadPedido(producto) {

    const cantidad =
        Number(
            producto.cantidad
        );

    if (
        !Number.isFinite(cantidad) ||
        cantidad < 1
    ) {

        return 1;
    }

    return Math.floor(cantidad);
}


/* =========================================================
   OBTENER CLIENTE
========================================================= */

async function obtenerClientePedido() {

    try {

        const respuesta =
            await supabasePedidos.auth.getUser();

        const user =
            respuesta?.data?.user || null;


        /* =================================================
           USUARIO NO LOGUEADO
        ================================================= */

        if (!user) {

            return {

                usuarioId: null,

                nombre: "Cliente",

                correo: ""

            };
        }


        let nombre =
            user.user_metadata?.nombre ||
            "";

        let apellido =
            user.user_metadata?.apellido ||
            "";


        /* =================================================
           BUSCAR PERFIL
        ================================================= */

        try {

            const {
                data: perfil,
                error: errorPerfil
            } =
                await supabasePedidos
                    .from("perfiles")
                    .select(
                        'id,nombre,apellido,"Puntos"'
                    )
                    .eq(
                        "id",
                        user.id
                    )
                    .maybeSingle();


            if (
                !errorPerfil &&
                perfil
            ) {

                nombre =
                    perfil.nombre ||
                    nombre;

                apellido =
                    perfil.apellido ||
                    apellido;
            }

        } catch (errorPerfil) {

            console.warn(
                "No se pudo consultar el perfil:",
                errorPerfil
            );
        }


        const nombreCompleto =
            `${nombre} ${apellido}`.trim();


        return {

            usuarioId:
                user.id,

            nombre:
                nombreCompleto ||
                "Cliente",

            correo:
                user.email ||
                ""

        };

    } catch (error) {

        console.error(
            "Error obteniendo cliente:",
            error
        );


        return {

            usuarioId: null,

            nombre: "Cliente",

            correo: ""

        };
    }
}


/* =========================================================
   PREPARAR PRODUCTOS
========================================================= */

function prepararProductosPedido(carrito) {

    return carrito.map(
        producto => {

            const precio =
                obtenerPrecioPedido(
                    producto
                );

            const cantidad =
                obtenerCantidadPedido(
                    producto
                );

            return {

                id:
                    producto.id ??
                    null,

                nombre:
                    obtenerNombrePedido(
                        producto
                    ),

                categoria:
                    obtenerCategoriaPedido(
                        producto
                    ),

                descripcion:
                    obtenerDescripcionPedido(
                        producto
                    ),

                precio:
                    precio,

                cantidad:
                    cantidad,

                subtotal:
                    Number(
                        (
                            precio *
                            cantidad
                        ).toFixed(2)
                    ),

                imagen:
                    obtenerImagenPedido(
                        producto
                    )
            };
        }
    );
}


/* =========================================================
   CALCULAR TOTAL
========================================================= */

function calcularTotalPedido(carrito) {

    let total = 0;


    carrito.forEach(
        producto => {

            const precio =
                obtenerPrecioPedido(
                    producto
                );

            const cantidad =
                obtenerCantidadPedido(
                    producto
                );

            total +=
                precio *
                cantidad;
        }
    );


    return Number(
        total.toFixed(2)
    );
}


/* =========================================================
   CALCULAR PUNTOS
========================================================= */

function calcularPuntosPedido(total) {

    /*
       Q150 = 1 punto
       Q300 = 2 puntos
       Q450 = 3 puntos

       IMPORTANTE:
       AQUÍ SOLAMENTE SE CALCULAN.

       NO SE AGREGAN AL PERFIL.
    */

    return Math.floor(
        Number(total) / 150
    );
}


/* =========================================================
   REGISTRAR PEDIDO
========================================================= */

async function registrarPedidoDL() {

    console.log(
        "===================================="
    );

    console.log(
        "DL LUXURY - INICIANDO PEDIDO"
    );

    console.log(
        "===================================="
    );


    /* =================================================
       OBTENER CARRITO
    ================================================= */

    const carrito =
        obtenerCarritoParaPedido();


    console.log(
        "Carrito encontrado:",
        carrito
    );


    if (
        !Array.isArray(carrito) ||
        carrito.length === 0
    ) {

        return {

            exito: false,

            pedido: null,

            error:
                "No se encontraron productos en el carrito."

        };
    }


    /* =================================================
       OBTENER CLIENTE
    ================================================= */

    const cliente =
        await obtenerClientePedido();


    console.log(
        "Cliente:",
        cliente
    );


    /* =================================================
       CALCULAR TOTAL
    ================================================= */

    const total =
        calcularTotalPedido(
            carrito
        );


    console.log(
        "Total:",
        total
    );


    if (
        !Number.isFinite(total) ||
        total <= 0
    ) {

        return {

            exito: false,

            pedido: null,

            error:
                "El total del pedido no es válido."

        };
    }


    /* =================================================
       CALCULAR PUNTOS
    ================================================= */

    const puntos =
        calcularPuntosPedido(
            total
        );


    /* =================================================
       PREPARAR PRODUCTOS
    ================================================= */

    const productos =
        prepararProductosPedido(
            carrito
        );


    /* =================================================
       OBTENER CANJE ACTIVO
    ================================================= */

    const canje =
        obtenerCanjeParaPedido();


    console.log(
        "Canje activo:",
        canje
    );


    /* =================================================
       DATOS DEL PEDIDO
    ================================================= */

    const datosPedido = {

        usuario_id:
            cliente.usuarioId,

        cliente_nombre:
            cliente.nombre,

        cliente_correo:
            cliente.correo,

        productos:
            productos,

        total:
            total,

        estado:
            "pendiente",

        puntos_generados:
            puntos,

        puntos_validados:
            false

    };


    console.log(
        "Datos que se enviarán a Supabase:",
        datosPedido
    );


    /* =================================================
       INSERTAR EN SUPABASE
       
       IMPORTANTE:
       NO usamos .select().single()
    ================================================= */

    try {

        const {
            error
        } =
            await supabasePedidos
                .from("pedidos")
                .insert(
                    datosPedido
                );


        if (error) {

            console.error(
                "===================================="
            );

            console.error(
                "ERROR SUPABASE AL GUARDAR PEDIDO"
            );

            console.error(
                error
            );

            console.error(
                "===================================="
            );


            return {

                exito: false,

                pedido: null,

                error:
                    error.message ||
                    "No se pudo registrar el pedido."

            };
        }


        console.log(
            "===================================="
        );

        console.log(
            "PEDIDO GUARDADO CORRECTAMENTE"
        );

        console.log(
            "===================================="
        );


        return {

            exito: true,

            pedido:
                datosPedido,

            canje:
                canje,

            error:
                null

        };


    } catch (error) {

        console.error(
            "Error inesperado registrando pedido:",
            error
        );


        return {

            exito: false,

            pedido: null,

            error:
                error.message ||
                "Error inesperado al registrar el pedido."

        };
    }
}


/* =========================================================
   ABRIR WHATSAPP
========================================================= */

function abrirWhatsAppPedido(carrito) {

    const total =
        calcularTotalPedido(
            carrito
        );


    let mensaje =
        "Hola, quiero realizar el siguiente pedido en DL Luxury:\n\n";


    carrito.forEach(
        (producto, indice) => {

            const nombre =
                obtenerNombrePedido(
                    producto
                );

            const categoria =
                obtenerCategoriaPedido(
                    producto
                );

            const cantidad =
                obtenerCantidadPedido(
                    producto
                );

            const precio =
                obtenerPrecioPedido(
                    producto
                );

            const subtotal =
                Number(
                    (
                        precio *
                        cantidad
                    ).toFixed(2)
                );


            /* =============================================
               OBTENER IMAGEN
            ============================================= */

            const imagenOriginal =
                obtenerImagenPedido(
                    producto
                );


            const imagenPublica =
                convertirImagenPublicaPedido(
                    imagenOriginal
                );


            mensaje +=
                `${indice + 1}. ${nombre}\n`;

            mensaje +=
                `Categoría: ${categoria}\n`;

            mensaje +=
                `Cantidad: ${cantidad}\n`;

            mensaje +=
                `Precio: Q ${precio.toFixed(2)}\n`;

            mensaje +=
                `Subtotal: Q ${subtotal.toFixed(2)}\n`;


            /* =============================================
               AGREGAR IMAGEN
            ============================================= */

            if (imagenPublica) {

                mensaje +=
                    `Imagen: ${imagenPublica}\n`;
            }


            mensaje +=
                "\n";
        }
    );


    /* =====================================================
       CANJE ACTIVO
    ===================================================== */

    const canje =
        obtenerCanjeParaPedido();


    if (canje) {

        mensaje +=
            "🎁 CANJE DE PUNTOS\n\n";


        mensaje +=
            `Producto canjeado: ${canje.producto_nombre ||
            canje.nombre ||
            canje.recompensa ||
            "Producto"
            }\n`;


        if (
            canje.producto_categoria ||
            canje.categoria
        ) {

            mensaje +=
                `Categoría: ${canje.producto_categoria ||
                canje.categoria
                }\n`;
        }


        if (
            canje.producto_precio !==
            undefined
        ) {

            mensaje +=
                `Precio del producto: Q ${Number(
                    canje.producto_precio
                ).toFixed(2)
                }\n`;
        }


        mensaje +=
            `Puntos utilizados: ${Number(
                canje.puntos
            ) || 0
            }\n`;


        if (canje.codigo) {

            mensaje +=
                `Código de canje: ${canje.codigo
                }\n`;
        }


        const imagenCanje =
            convertirImagenPublicaPedido(
                canje.producto_imagen
            );


        if (imagenCanje) {

            mensaje +=
                `Imagen del producto canjeado: ${imagenCanje}\n`;
        }


        mensaje +=
            "\n";
    }


    mensaje +=
        `TOTAL: Q ${total.toFixed(2)}\n\n`;


    mensaje +=
        "Gracias.";


    const url =
        `https://wa.me/${NUMERO_WHATSAPP_PEDIDOS}?text=${encodeURIComponent(mensaje)}`;


    window.open(
        url,
        "_blank"
    );
}


/* =========================================================
   FINALIZAR COMPRA
========================================================= */

async function finalizarCompraDL() {

    const boton =
        document.getElementById(
            "btnFinalizarCompra"
        );


    /* =================================================
       DESACTIVAR BOTÓN
    ================================================= */

    if (boton) {

        boton.disabled = true;

        boton.dataset.textoOriginal =
            boton.innerHTML;

        boton.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Procesando...';
    }


    try {

        /* =================================================
           OBTENER CARRITO
        ================================================= */

        const carrito =
            obtenerCarritoParaPedido();


        if (
            !Array.isArray(carrito) ||
            carrito.length === 0
        ) {

            alert(
                "Tu carrito está vacío."
            );

            return;
        }


        /* =================================================
           REGISTRAR PEDIDO
        ================================================= */

        console.log(
            "Intentando guardar pedido en Supabase..."
        );


        const resultado =
            await registrarPedidoDL();


        /* =================================================
           ERROR
        ================================================= */

        if (!resultado.exito) {

            console.error(
                "No se pudo registrar el pedido:",
                resultado.error
            );


            alert(
                "No se pudo registrar tu pedido.\n\n" +
                resultado.error
            );

            return;
        }


        /* =================================================
           PEDIDO GUARDADO
        ================================================= */

        console.log(
            "Pedido guardado correctamente."
        );


        /* =================================================
           ABRIR WHATSAPP
        ================================================= */

        abrirWhatsAppPedido(
            carrito
        );


    } catch (error) {

        console.error(
            "Error finalizando compra:",
            error
        );


        alert(
            "Ocurrió un error al finalizar la compra.\n\n" +
            error.message
        );

    } finally {

        /* =================================================
           RESTAURAR BOTÓN
        ================================================= */

        if (boton) {

            boton.disabled = false;

            if (
                boton.dataset.textoOriginal
            ) {

                boton.innerHTML =
                    boton.dataset.textoOriginal;
            }
        }
    }
}


/* =========================================================
   HACER FUNCIONES DISPONIBLES
========================================================= */

window.registrarPedidoDL =
    registrarPedidoDL;

window.finalizarCompraDL =
    finalizarCompraDL;


/* =========================================================
   CONECTAR BOTÓN
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const boton =
            document.getElementById(
                "btnFinalizarCompra"
            );


        if (!boton) {

            console.warn(
                "No se encontró #btnFinalizarCompra."
            );

            return;
        }


        /*
           carrito.js también tiene un evento
           para este botón.

           Clonamos el botón para eliminar
           el evento anterior y conectamos
           solamente finalizarCompraDL().
        */

        const botonNuevo =
            boton.cloneNode(true);


        boton.parentNode.replaceChild(
            botonNuevo,
            boton
        );


        botonNuevo.addEventListener(
            "click",
            finalizarCompraDL
        );


        console.log(
            "Botón Finalizar compra conectado correctamente."
        );
    }
);


/* =========================================================
   CONFIRMACIÓN
========================================================= */

console.log(
    "DL Luxury - pedidos.js cargado correctamente."
);