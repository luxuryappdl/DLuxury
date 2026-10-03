/* =====================================================
   SLIDER PRINCIPAL
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* =================================================
       ELEMENTOS
    ================================================= */

    const slider =
        document.querySelector(".hero-slider");

    const slides =
        document.querySelectorAll(
            ".hero-slider .hero-silder"
        );

    const dots =
        document.querySelectorAll(
            ".slider-dots span"
        );


    /* =================================================
       COMPROBAR
    ================================================= */

    if (
        !slider ||
        slides.length === 0
    ) {

        console.warn(
            "No se encontró el slider."
        );

        return;
    }


    /* =================================================
       VARIABLES
    ================================================= */

    let currentSlide = 0;

    let autoSlide = null;

    let startX = 0;

    let endX = 0;

    let isDragging = false;

    let mouseStartX = 0;

    let mouseEndX = 0;


    /* =================================================
       MOSTRAR SLIDE
    ================================================= */

    function showSlide(index) {

        /* ---------------------------------------------
           CONTROLAR LÍMITES
        --------------------------------------------- */

        if (index >= slides.length) {

            index = 0;

        }

        if (index < 0) {

            index = slides.length - 1;

        }


        currentSlide = index;


        /* ---------------------------------------------
           QUITAR ACTIVE DE TODOS
        --------------------------------------------- */

        slides.forEach(slide => {

            slide.classList.remove(
                "active"
            );

        });


        /* ---------------------------------------------
           QUITAR ACTIVE DE PUNTOS
        --------------------------------------------- */

        dots.forEach(dot => {

            dot.classList.remove(
                "active"
            );

        });


        /* ---------------------------------------------
           ACTIVAR SLIDE
        --------------------------------------------- */

        slides[currentSlide]
            .classList.add(
                "active"
            );


        /* ---------------------------------------------
           ACTIVAR PUNTO
        --------------------------------------------- */

        if (dots[currentSlide]) {

            dots[currentSlide]
                .classList.add(
                    "active"
                );

        }

    }


    /* =================================================
       SIGUIENTE
    ================================================= */

    function nextSlide() {

        showSlide(
            currentSlide + 1
        );

    }


    /* =================================================
       ANTERIOR
    ================================================= */

    function previousSlide() {

        showSlide(
            currentSlide - 1
        );

    }


    /* =================================================
       CLIC EN LOS PUNTOS
    ================================================= */

    dots.forEach(
        (dot, index) => {

            dot.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();

                    showSlide(index);

                    reiniciarAutoSlide();

                }
            );

        }
    );


    /* =================================================
       TOUCHSTART
    ================================================= */

    slider.addEventListener(
        "touchstart",
        event => {

            startX =
                event.changedTouches[0]
                    .screenX;

        },
        {
            passive: true
        }
    );


    /* =================================================
       TOUCHEND
    ================================================= */

    slider.addEventListener(
        "touchend",
        event => {

            endX =
                event.changedTouches[0]
                    .screenX;

            detectarSwipe();

        },
        {
            passive: true
        }
    );


    /* =================================================
       DETECTAR SWIPE
    ================================================= */

    function detectarSwipe() {

        const diferencia =
            startX - endX;


        /* ---------------------------------------------
           MOVIMIENTO MUY PEQUEÑO
        --------------------------------------------- */

        if (
            Math.abs(diferencia) < 50
        ) {

            return;

        }


        /* ---------------------------------------------
           DESLIZAR HACIA LA IZQUIERDA
        --------------------------------------------- */

        if (diferencia > 50) {

            nextSlide();

        }


        /* ---------------------------------------------
           DESLIZAR HACIA LA DERECHA
        --------------------------------------------- */

        else if (
            diferencia < -50
        ) {

            previousSlide();

        }


        reiniciarAutoSlide();

    }


    /* =================================================
       MOUSE DOWN
    ================================================= */

    slider.addEventListener(
        "mousedown",
        event => {

            isDragging = true;

            mouseStartX =
                event.clientX;

            mouseEndX =
                event.clientX;

        }
    );


    /* =================================================
       MOUSE MOVE
    ================================================= */

    slider.addEventListener(
        "mousemove",
        event => {

            if (!isDragging) {

                return;

            }

            mouseEndX =
                event.clientX;

        }
    );


    /* =================================================
       MOUSE UP
    ================================================= */

    slider.addEventListener(
        "mouseup",
        () => {

            if (!isDragging) {

                return;

            }

            isDragging = false;


            const diferencia =
                mouseStartX -
                mouseEndX;


            if (
                Math.abs(diferencia) < 50
            ) {

                return;

            }


            if (diferencia > 50) {

                nextSlide();

            }

            else {

                previousSlide();

            }


            reiniciarAutoSlide();

        }
    );


    /* =================================================
       MOUSE SALE DEL SLIDER
    ================================================= */

    slider.addEventListener(
        "mouseleave",
        () => {

            isDragging = false;

        }
    );


    /* =================================================
       SLIDER AUTOMÁTICO
    ================================================= */

    function iniciarAutoSlide() {

        autoSlide =
            setInterval(
                () => {

                    nextSlide();

                },
                5000
            );

    }


    /* =================================================
       REINICIAR AUTOMÁTICO
    ================================================= */

    function reiniciarAutoSlide() {

        clearInterval(
            autoSlide
        );

        iniciarAutoSlide();

    }


    /* =================================================
       INICIAR
    ================================================= */

    showSlide(0);

    iniciarAutoSlide();

});