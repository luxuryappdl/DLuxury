/* =========================================================
   DL LUXURY
   CARRITO
   JAVASCRIPT COMPLETO

   FUNCIONES:
   - Mostrar productos
   - Aumentar cantidad
   - Disminuir cantidad
   - Eliminar producto
   - Vaciar carrito
   - Calcular subtotal
   - Calcular total
   - Contador del carrito
   - Finalizar compra por WhatsApp
   - Mostrar descripción
   - Mostrar enlace de imagen
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       CONFIGURACIÓN
    ===================================================== */

    const CLAVE_CARRITO = "dlLuxuryCarrito";

    const NUMERO_WHATSAPP = "50257255468";


    /* =====================================================
       ELEMENTOS
    ===================================================== */

    const listaCarrito =
        document.getElementById("listaCarrito");

    const carritoVacio =
        document.getElementById("carritoVacio");

    const cantidadProductos =
        document.getElementById("cantidadProductos");

    const textoProductos =
        document.getElementById("textoProductos");

    const contadorCarrito =
        document.getElementById("contadorCarrito");

    const resumenCantidad =
        document.getElementById("resumenCantidad");

    const subtotalCarrito =
        document.getElementById("subtotalCarrito");

    const totalCarrito =
        document.getElementById("totalCarrito");

    const envioCarrito =
        document.getElementById("envioCarrito");

    const vaciarCarrito =
        document.getElementById("vaciarCarrito");

    const btnFinalizarCompra =
        document.getElementById("btnFinalizarCompra");


    /* =====================================================
       OBTENER CARRITO
    ===================================================== */

    function obtenerCarrito() {

        try {

            const datos =
                localStorage.getItem(
                    CLAVE_CARRITO
                );

            if (!datos) {
                return [];
            }

            const carrito =
                JSON.parse(datos);

            return Array.isArray(carrito)
                ? carrito
                : [];

        } catch (error) {

            console.error(
                "Error al obtener el carrito:",
                error
            );

            return [];
        }
    }


    /* =====================================================
       GUARDAR CARRITO
    ===================================================== */

    function guardarCarrito(carrito) {

        try {

            localStorage.setItem(
                CLAVE_CARRITO,
                JSON.stringify(carrito)
            );

        } catch (error) {

            console.error(
                "Error al guardar el carrito:",
                error
            );
        }
    }


    /* =====================================================
       FORMATO DE PRECIO
    ===================================================== */

    function formatoPrecio(valor) {

        const numero =
            Number(valor) || 0;

        return `Q ${numero.toFixed(2)}`;
    }


    /* =====================================================
       OBTENER PRECIO
    ===================================================== */

    function obtenerPrecio(producto) {

        const precioFinal =
            Number(producto.precio_final);

        if (
            Number.isFinite(precioFinal) &&
            precioFinal > 0
        ) {

            return precioFinal;
        }


        const precioFinalCamel =
            Number(producto.precioFinal);

        if (
            Number.isFinite(precioFinalCamel) &&
            precioFinalCamel > 0
        ) {

            return precioFinalCamel;
        }


        const precio =
            Number(producto.precio);

        if (
            Number.isFinite(precio) &&
            precio >= 0
        ) {

            return precio;
        }

        return 0;
    }


    /* =====================================================
       OBTENER NOMBRE
    ===================================================== */

    function obtenerNombre(producto) {

        return (
            producto.nombre ||
            producto.titulo ||
            "Producto"
        );
    }


    /* =====================================================
       OBTENER CATEGORÍA
    ===================================================== */

    function obtenerCategoria(producto) {

        return (
            producto.categoriaNombre ||
            producto.categoria ||
            "Producto"
        );
    }


    /* =====================================================
       OBTENER DESCRIPCIÓN
    ===================================================== */

    function obtenerDescripcion(producto) {

        return (
            producto.descripcion ||
            producto.descripcion_producto ||
            producto.detalle ||
            "Sin descripción disponible."
        );
    }


    /* =====================================================
       OBTENER IMAGEN
    ===================================================== */

    function obtenerImagen(producto) {

        return (
            producto.imagen ||
            producto.imagenBase64 ||
            producto.image ||
            producto.imagen_url ||
            ""
        );
    }


    /* =====================================================
       VERIFICAR SI LA IMAGEN ES URL
    ===================================================== */

    function imagenEsURL(imagen) {

        if (!imagen) {
            return false;
        }

        return (
            imagen.startsWith("http://") ||
            imagen.startsWith("https://")
        );
    }


    /* =====================================================
       ESCAPAR HTML
    ===================================================== */

    function escaparHTML(texto) {

        return String(texto)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* =====================================================
       OBTENER CANTIDAD
    ===================================================== */

    function obtenerCantidad(producto) {

        const cantidad =
            Number(producto.cantidad);

        if (
            !Number.isFinite(cantidad) ||
            cantidad < 1
        ) {

            return 1;
        }

        return Math.floor(cantidad);
    }


    /* =====================================================
       ACTUALIZAR CONTADORES
    ===================================================== */

    function actualizarContadores() {

        const carrito =
            obtenerCarrito();

        let cantidadTotal = 0;

        carrito.forEach(producto => {

            cantidadTotal +=
                obtenerCantidad(producto);

        });


        if (cantidadProductos) {

            cantidadProductos.textContent =
                cantidadTotal;
        }


        if (textoProductos) {

            textoProductos.textContent =
                cantidadTotal === 1
                    ? "producto"
                    : "productos";
        }


        if (contadorCarrito) {

            contadorCarrito.textContent =
                cantidadTotal;
        }


        if (resumenCantidad) {

            resumenCantidad.textContent =
                cantidadTotal;
        }
    }


    /* =====================================================
       CALCULAR SUBTOTAL
    ===================================================== */

    function calcularSubtotal() {

        const carrito =
            obtenerCarrito();

        let subtotal = 0;

        carrito.forEach(producto => {

            const precio =
                obtenerPrecio(producto);

            const cantidad =
                obtenerCantidad(producto);

            subtotal +=
                precio * cantidad;

        });

        return subtotal;
    }


    /* =====================================================
       ACTUALIZAR TOTALES
    ===================================================== */

    function actualizarTotales() {

        const subtotal =
            calcularSubtotal();


        if (subtotalCarrito) {

            subtotalCarrito.textContent =
                formatoPrecio(subtotal);
        }


        if (envioCarrito) {

            envioCarrito.textContent =
                "Por calcular";
        }


        if (totalCarrito) {

            totalCarrito.textContent =
                formatoPrecio(subtotal);
        }
    }


    /* =====================================================
       RENDERIZAR CARRITO
    ===================================================== */

    function renderizarCarrito() {

        const carrito =
            obtenerCarrito();


        if (!listaCarrito) {
            return;
        }


        listaCarrito.innerHTML = "";


        /* =================================================
           CARRITO VACÍO
        ================================================= */

        if (carrito.length === 0) {

            if (carritoVacio) {

                carritoVacio.classList.add(
                    "visible"
                );
            }


            actualizarContadores();
            actualizarTotales();

            return;
        }


        if (carritoVacio) {

            carritoVacio.classList.remove(
                "visible"
            );
        }


        /* =================================================
           PRODUCTOS
        ================================================= */

        carrito.forEach(
            (producto, indice) => {

                const nombre =
                    obtenerNombre(producto);

                const categoria =
                    obtenerCategoria(producto);

                const descripcion =
                    obtenerDescripcion(producto);

                const imagen =
                    obtenerImagen(producto);

                const precio =
                    obtenerPrecio(producto);

                const cantidad =
                    obtenerCantidad(producto);

                const subtotal =
                    precio * cantidad;


                const item =
                    document.createElement(
                        "article"
                    );


                item.className =
                    "carrito-item";


                /* =========================================
                   IMAGEN
                ========================================= */

                let imagenHTML = "";


                if (imagen) {

                    imagenHTML = `
                        <img
                            src="${escaparHTML(imagen)}"
                            alt="${escaparHTML(nombre)}"
                        >
                    `;

                } else {

                    imagenHTML = `
                        <div style="
                            width:100%;
                            height:100%;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            color:#c69a2b;
                            font-size:24px;
                        ">
                            <i class="fa-solid fa-box"></i>
                        </div>
                    `;
                }


                /* =========================================
                   CONTENIDO
                ========================================= */

                item.innerHTML = `

                    <div class="carrito-item-imagen">

                        ${imagenHTML}

                    </div>


                    <div class="carrito-item-info">

                        <span class="carrito-item-categoria">

                            ${escaparHTML(categoria)}

                        </span>


                        <h3>

                            ${escaparHTML(nombre)}

                        </h3>


                        <p class="carrito-item-descripcion">

                            ${escaparHTML(descripcion)}

                        </p>


                        <span class="carrito-item-precio">

                            ${formatoPrecio(precio)}

                        </span>

                    </div>


                    <div class="carrito-item-acciones">


                        <div class="cantidad-control">

                            <button
                                type="button"
                                class="cantidad-btn btn-menos"
                                data-indice="${indice}"
                                aria-label="Disminuir cantidad"
                            >

                                <i class="fa-solid fa-minus"></i>

                            </button>


                            <span class="cantidad-numero">

                                ${cantidad}

                            </span>


                            <button
                                type="button"
                                class="cantidad-btn btn-mas"
                                data-indice="${indice}"
                                aria-label="Aumentar cantidad"
                            >

                                <i class="fa-solid fa-plus"></i>

                            </button>

                        </div>


                        <div class="carrito-item-total">

                            <strong>

                                ${formatoPrecio(subtotal)}

                            </strong>

                        </div>


                        <button
                            type="button"
                            class="btn-eliminar-item"
                            data-indice="${indice}"
                            aria-label="Eliminar producto"
                        >

                            <i class="fa-solid fa-trash"></i>

                        </button>

                    </div>

                `;


                listaCarrito.appendChild(item);

            }
        );


        actualizarContadores();
        actualizarTotales();
    }


    /* =====================================================
       CAMBIAR CANTIDAD
    ===================================================== */

    function cambiarCantidad(
        indice,
        cambio
    ) {

        const carrito =
            obtenerCarrito();


        if (!carrito[indice]) {
            return;
        }


        let cantidad =
            obtenerCantidad(
                carrito[indice]
            );


        cantidad += cambio;


        const stock =
            Number(
                carrito[indice].stock
            );


        if (
            cambio > 0 &&
            Number.isFinite(stock) &&
            stock >= 0 &&
            cantidad > stock
        ) {

            alert(
                `Solo hay ${stock} unidades disponibles.`
            );

            return;
        }


        if (cantidad <= 0) {

            carrito.splice(
                indice,
                1
            );

        } else {

            carrito[indice].cantidad =
                cantidad;
        }


        guardarCarrito(carrito);

        renderizarCarrito();
    }


    /* =====================================================
       ELIMINAR PRODUCTO
    ===================================================== */

    function eliminarProducto(indice) {

        const carrito =
            obtenerCarrito();


        if (!carrito[indice]) {
            return;
        }


        const nombre =
            obtenerNombre(
                carrito[indice]
            );


        const confirmar =
            confirm(
                `¿Deseas eliminar "${nombre}" del carrito?`
            );


        if (!confirmar) {
            return;
        }


        carrito.splice(
            indice,
            1
        );


        guardarCarrito(carrito);

        renderizarCarrito();
    }


    /* =====================================================
       EVENTOS DE LA LISTA
    ===================================================== */

    if (listaCarrito) {

        listaCarrito.addEventListener(
            "click",
            event => {

                const botonMenos =
                    event.target.closest(
                        ".btn-menos"
                    );


                const botonMas =
                    event.target.closest(
                        ".btn-mas"
                    );


                const botonEliminar =
                    event.target.closest(
                        ".btn-eliminar-item"
                    );


                if (botonMenos) {

                    const indice =
                        Number(
                            botonMenos.dataset.indice
                        );


                    cambiarCantidad(
                        indice,
                        -1
                    );

                    return;
                }


                if (botonMas) {

                    const indice =
                        Number(
                            botonMas.dataset.indice
                        );


                    cambiarCantidad(
                        indice,
                        1
                    );

                    return;
                }


                if (botonEliminar) {

                    const indice =
                        Number(
                            botonEliminar.dataset.indice
                        );


                    eliminarProducto(
                        indice
                    );
                }

            }
        );
    }


    /* =====================================================
       VACIAR CARRITO
    ===================================================== */

    if (vaciarCarrito) {

        vaciarCarrito.addEventListener(
            "click",
            () => {

                const carrito =
                    obtenerCarrito();


                if (carrito.length === 0) {
                    return;
                }


                const confirmar =
                    confirm(
                        "¿Seguro que deseas vaciar todo el carrito?"
                    );


                if (!confirmar) {
                    return;
                }


                localStorage.removeItem(
                    CLAVE_CARRITO
                );


                renderizarCarrito();

            }
        );
    }


    /* =====================================================
       FINALIZAR COMPRA
       WHATSAPP
    ===================================================== */

    if (btnFinalizarCompra) {

        btnFinalizarCompra.addEventListener(
            "click",
            () => {

                const carrito =
                    obtenerCarrito();


                if (carrito.length === 0) {

                    alert(
                        "Tu carrito está vacío."
                    );

                    return;
                }


                /* =========================================
                   MENSAJE
                ========================================= */

                let mensaje =
                    "🛍️ *NUEVO PEDIDO - DL LUXURY*\n\n";


                mensaje +=
                    "Hola, quiero realizar el siguiente pedido:\n\n";


                let total = 0;


                /* =========================================
                   PRODUCTOS
                ========================================= */

                carrito.forEach(
                    (producto, indice) => {

                        const nombre =
                            obtenerNombre(
                                producto
                            );


                        const descripcion =
                            obtenerDescripcion(
                                producto
                            );


                        const precio =
                            obtenerPrecio(
                                producto
                            );


                        const cantidad =
                            obtenerCantidad(
                                producto
                            );


                        const imagen =
                            obtenerImagen(
                                producto
                            );


                        const subtotal =
                            precio * cantidad;


                        total += subtotal;


                        /* =================================
                           INFORMACIÓN DEL PRODUCTO
                        ================================= */

                        mensaje +=
                            `*${indice + 1}. ${nombre}*\n`;


                        mensaje +=
                            `📝 Descripción: ${descripcion}\n`;


                        mensaje +=
                            `🔢 Cantidad: ${cantidad}\n`;


                        mensaje +=
                            `💰 Precio: ${formatoPrecio(precio)}\n`;


                        mensaje +=
                            `🧾 Subtotal: ${formatoPrecio(subtotal)}\n`;


                        /* =================================
                           IMAGEN
                        ================================= */

                        if (
                            imagen &&
                            imagenEsURL(imagen)
                        ) {

                            mensaje +=
                                `🖼️ Imagen: ${imagen}\n`;

                        }


                        mensaje += "\n";

                    }
                );


                /* =========================================
                   TOTAL
                ========================================= */

                mensaje +=
                    "━━━━━━━━━━━━━━━━━━\n";


                mensaje +=
                    `🧾 *TOTAL: ${formatoPrecio(total)}*\n\n`;


                mensaje +=
                    "Quedo pendiente para confirmar mi pedido. 😊";


                /* =========================================
                   CODIFICAR MENSAJE
                ========================================= */

                const mensajeCodificado =
                    encodeURIComponent(
                        mensaje
                    );


                /* =========================================
                   WHATSAPP
                ========================================= */

                const urlWhatsApp =
                    `https://wa.me/${NUMERO_WHATSAPP}?text=${mensajeCodificado}`;


                window.open(
                    urlWhatsApp,
                    "_blank"
                );

            }
        );
    }


    /* =====================================================
       ACTUALIZAR SI CAMBIA EL LOCALSTORAGE
    ===================================================== */

    window.addEventListener(
        "storage",
        event => {

            if (
                event.key === CLAVE_CARRITO
            ) {

                renderizarCarrito();

            }
        }
    );


    /* =====================================================
       INICIAR
    ===================================================== */

    renderizarCarrito();

});