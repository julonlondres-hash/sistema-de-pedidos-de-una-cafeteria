import { supabase } from './supabase.js';
// ======================================
// ELEMENTOS HTML
// ======================================

const $ = id => document.getElementById(id);

const pantallaPortada = $("pantallaPortada");
const pantallaAcceso = $("pantallaAcceso");
const aplicacion = $("aplicacion");

const panelCliente = $("panelCliente");
const panelAdministrador = $("panelAdministrador");

const btnCliente = $("btnCliente");
const btnAdministrador = $("btnAdministrador");
const btnVolverPortada = $("btnVolverPortada");
const btnCerrarSesion = $("btnCerrarSesion");

const formAcceso = $("formAcceso");
const formProducto = $("formProducto");

const campoNombre = $("campoNombre");
const nombre = $("nombre");
const correo = $("correo");
const contrasena = $("contrasena");

const tituloAcceso = $("tituloAcceso");
const descripcionAcceso = $("descripcionAcceso");
const btnAcceder = $("btnAcceder");
const btnMostrarRegistro = $("btnMostrarRegistro");
const alternarRegistro = $("alternarRegistro");
const mensajeAcceso = $("mensajeAcceso");

const listaProductos = $("listaProductos");
const listaCarrito = $("listaCarrito");
const misPedidos = $("misPedidos");

const tablaProductos = $("tablaProductos");
const tablaPedidos = $("tablaPedidos");

const buscarProducto = $("buscarProducto");
const filtroCategoria = $("filtroCategoria");

const btnConfirmarPedido = $("btnConfirmarPedido");
const btnActualizarPedidos = $("btnActualizarPedidos");

const productoId = $("productoId");
const productoNombre = $("productoNombre");
const productoCategoria = $("productoCategoria");
const productoPrecio = $("productoPrecio");
const productoImagen = $("productoImagen");
const productoDescripcion = $("productoDescripcion");

const mensajeProducto = $("mensajeProducto");
const mensajeCarrito = $("mensajeCarrito");


// ======================================
// VARIABLES
// ======================================

let modoAcceso = "cliente";
let modoRegistro = false;

let usuarioActual = null;
let perfilActual = null;

let productos = [];
let carrito = [];
let pedidos = [];

const ESTADOS = [
    "Pendiente",
    "En preparación",
    "Listo",
    "Entregado",
    "Cancelado"
];


// ======================================
// FUNCIONES GENERALES
// ======================================

function mostrarMensaje(elemento, texto, tipo = "") {
    elemento.textContent = texto;
    elemento.className = `mensaje ${tipo}`;
}

function escapar(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caracter]);
}

function dinero(valor) {
    return Number(valor).toLocaleString("es-DO", {
        style: "currency",
        currency: "DOP"
    });
}

function mostrarPortada() {
    pantallaPortada.classList.remove("oculto");
    pantallaAcceso.classList.add("oculto");
    aplicacion.classList.add("oculto");
}

function mostrarAcceso() {
    pantallaPortada.classList.add("oculto");
    pantallaAcceso.classList.remove("oculto");
    aplicacion.classList.add("oculto");
}

function mostrarAplicacion() {
    pantallaPortada.classList.add("oculto");
    pantallaAcceso.classList.add("oculto");
    aplicacion.classList.remove("oculto");

    $("nombreUsuario").textContent = perfilActual.nombre;
    $("etiquetaRol").textContent =
        perfilActual.rol === "administrador"
            ? "Administrador"
            : "Cliente";

    panelCliente.classList.toggle(
        "oculto",
        perfilActual.rol !== "cliente"
    );

    panelAdministrador.classList.toggle(
        "oculto",
        perfilActual.rol !== "administrador"
    );

    if (perfilActual.rol === "cliente") {
        cargarProductos();
        cargarMisPedidos();
    } else {
        cargarProductos();
        cargarPedidosAdministrador();
        cargarVentas();
    }
}


// ======================================
// ACCESO Y REGISTRO
// ======================================

function prepararAcceso(rol) {
    modoAcceso = rol;
    modoRegistro = false;

    tituloAcceso.textContent = "Iniciar sesión";

    descripcionAcceso.textContent =
        rol === "cliente"
            ? "Accede a tu cuenta de cliente."
            : "Acceso exclusivo para administradores.";

    campoNombre.classList.add("oculto");
    alternarRegistro.classList.toggle("oculto", rol !== "cliente");

    nombre.required = false;
    contrasena.value = "";
    correo.value = "";

    mostrarMensaje(mensajeAcceso, "");

    mostrarAcceso();
}

btnCliente.addEventListener("click", () => {
    prepararAcceso("cliente");
});

btnAdministrador.addEventListener("click", () => {
    prepararAcceso("administrador");
});

btnVolverPortada.addEventListener("click", mostrarPortada);

btnMostrarRegistro.addEventListener("click", () => {
    modoRegistro = !modoRegistro;

    tituloAcceso.textContent = modoRegistro
        ? "Crear cuenta"
        : "Iniciar sesión";

    descripcionAcceso.textContent = modoRegistro
        ? "Regístrate para realizar tus pedidos."
        : "Accede a tu cuenta para continuar.";

    campoNombre.classList.toggle("oculto", !modoRegistro);

    nombre.required = modoRegistro;

    btnAcceder.textContent = modoRegistro
        ? "Registrarme"
        : "Iniciar sesión";

    btnMostrarRegistro.textContent = modoRegistro
        ? "Iniciar sesión"
        : "Regístrate";

    mostrarMensaje(mensajeAcceso, "");
});

formAcceso.addEventListener("submit", async evento => {
    evento.preventDefault();

    btnAcceder.disabled = true;
    mostrarMensaje(mensajeAcceso, "Procesando...");

    try {
        if (modoRegistro) {

            const { data, error } = await supabase.auth.signUp({
                email: correo.value.trim(),
                password: contrasena.value,
                options: {
                    data: {
                        nombre: nombre.value.trim()
                    }
                }
            });

            if (error) throw error;

            if (!data.session) {
                mostrarMensaje(
                    mensajeAcceso,
                    "Cuenta creada. Revisa tu correo para confirmar el registro.",
                    "exito"
                );
            } else {
                mostrarMensaje(
                    mensajeAcceso,
                    "Cuenta creada correctamente.",
                    "exito"
                );
            }

        } else {

            const { error } = await supabase.auth.signInWithPassword({
                email: correo.value.trim(),
                password: contrasena.value
            });

            if (error) throw error;

            await comprobarUsuario();

        }

    } catch (error) {
        mostrarMensaje(mensajeAcceso, error.message, "error");
    } finally {
        btnAcceder.disabled = false;
    }
});


// ======================================
// COMPROBAR USUARIO Y ROL
// ======================================

async function comprobarUsuario() {

    const { data: { user }, error } =
        await supabase.auth.getUser();

    if (error) throw error;

    if (!user) {
        throw new Error("No hay una sesión activa.");
    }

    const { data: perfil, error: errorPerfil } = await supabase
        .from("usuarios")
        .select("id, nombre, correo, rol")
        .eq("id", user.id)
        .single();

    if (errorPerfil) throw errorPerfil;

    if (!perfil) {
        throw new Error("No se encontró el perfil del usuario.");
    }

    if (
        modoAcceso === "administrador" &&
        perfil.rol !== "administrador"
    ) {
        await supabase.auth.signOut();

        throw new Error(
            "Esta cuenta no tiene permisos de administrador."
        );
    }

    if (
        modoAcceso === "cliente" &&
        perfil.rol !== "cliente"
    ) {
        await supabase.auth.signOut();

        throw new Error(
            "Esta cuenta no tiene permisos de cliente."
        );
    }

    usuarioActual = user;
    perfilActual = perfil;

    carrito = [];

    mostrarAplicacion();
}


// ======================================
// CARGAR PRODUCTOS
// ======================================

async function cargarProductos() {

    const { data, error } = await supabase
        .from("productos")
        .select("*")
        .order("nombre");

    if (error) {
        console.error(error);
        alert("No se pudieron cargar los productos.");
        return;
    }

    productos = data || [];

    $("totalProductos").textContent =
        productos.filter(p => p.activo).length;

    $("totalProductosAdmin").textContent = productos.length;

    dibujarProductos();
    dibujarCarrito();

    if (perfilActual?.rol === "administrador") {
        dibujarTablaProductos();
    }
}


// ======================================
// MOSTRAR MENÚ
// ======================================

function dibujarProductos() {

    const busqueda = buscarProducto.value.toLowerCase().trim();
    const categoria = filtroCategoria.value;

    const resultados = productos.filter(producto => {

        const coincideNombre =
            producto.nombre.toLowerCase().includes(busqueda);

        const coincideCategoria =
            !categoria || producto.categoria === categoria;

        return producto.activo &&
            coincideNombre &&
            coincideCategoria;
    });

    listaProductos.innerHTML = "";

    $("estadoMenu").classList.toggle(
        "oculto",
        resultados.length > 0
    );

    resultados.forEach(producto => {

        const tarjeta = document.createElement("article");
        tarjeta.className = "producto-card";

        const imagen = producto.imagen
            ? escapar(producto.imagen)
            : "";

        tarjeta.innerHTML = `
            <img
                src="${imagen}"
                alt="${escapar(producto.nombre)}"
                onerror="this.style.display='none'"
            >

            <div class="producto-info">

                <h4>${escapar(producto.nombre)}</h4>

                <p>${escapar(producto.descripcion || "")}</p>

                <span class="producto-precio">
                    ${dinero(producto.precio)}
                </span>

                <button class="btn btn-principal" type="button">
                    Agregar al carrito
                </button>

            </div>
        `;

        tarjeta.querySelector("button").addEventListener(
            "click",
            () => agregarAlCarrito(producto.id)
        );

        listaProductos.appendChild(tarjeta);
    });
}

buscarProducto.addEventListener("input", dibujarProductos);
filtroCategoria.addEventListener("change", dibujarProductos);


// ======================================
// CARRITO
// ======================================

function agregarAlCarrito(id) {

    const producto = productos.find(p => p.id === id);

    if (!producto || !producto.activo) return;

    const existente = carrito.find(p => p.id === id);

    if (existente) {
        existente.cantidad++;
    } else {
        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: Number(producto.precio),
            cantidad: 1
        });
    }

    dibujarCarrito();
}

function cambiarCantidad(id, cambio) {

    const producto = carrito.find(p => p.id === id);

    if (!producto) return;

    producto.cantidad += cambio;

    if (producto.cantidad <= 0) {
        carrito = carrito.filter(p => p.id !== id);
    }

    dibujarCarrito();
}

function quitarDelCarrito(id) {
    carrito = carrito.filter(p => p.id !== id);
    dibujarCarrito();
}

function calcularTotal() {
    return carrito.reduce(
        (total, producto) =>
            total + producto.precio * producto.cantidad,
        0
    );
}

function dibujarCarrito() {

    listaCarrito.innerHTML = "";

    if (carrito.length === 0) {
        listaCarrito.textContent = "Tu carrito está vacío.";
    }

    carrito.forEach(producto => {

        const fila = document.createElement("div");
        fila.className = "item-carrito";

        fila.innerHTML = `
            <div>
                <strong>${escapar(producto.nombre)}</strong>
                <p>${dinero(producto.precio)} × ${producto.cantidad}</p>
            </div>

            <div>
                <button type="button" class="menos">−</button>
                <button type="button" class="mas">+</button>
                <button type="button" class="eliminar">Quitar</button>
            </div>
        `;

        fila.querySelector(".menos").addEventListener(
            "click",
            () => cambiarCantidad(producto.id, -1)
        );

        fila.querySelector(".mas").addEventListener(
            "click",
            () => cambiarCantidad(producto.id, 1)
        );

        fila.querySelector(".eliminar").addEventListener(
            "click",
            () => quitarDelCarrito(producto.id)
        );

        listaCarrito.appendChild(fila);
    });

    $("totalCarrito").textContent = dinero(calcularTotal());
}


// ======================================
// CONFIRMAR PEDIDO
// ======================================

btnConfirmarPedido.addEventListener("click", confirmarPedido);

async function confirmarPedido() {

    if (carrito.length === 0) {
        mostrarMensaje(
            mensajeCarrito,
            "Agrega productos antes de confirmar.",
            "error"
        );
        return;
    }

    btnConfirmarPedido.disabled = true;

    try {

        // Consultar precios y disponibilidad actuales
        const ids = carrito.map(p => p.id);

        const { data: actuales, error: errorProductos } =
            await supabase
                .from("productos")
                .select("id, nombre, precio, activo")
                .in("id", ids);

        if (errorProductos) throw errorProductos;

        if (
            !actuales ||
            actuales.length !== carrito.length ||
            actuales.some(p => !p.activo)
        ) {
            throw new Error(
                "Uno de los productos ya no está disponible. Actualiza el menú."
            );
        }

        const detalles = carrito.map(item => {

            const producto = actuales.find(p => p.id === item.id);

            if (!producto) {
                throw new Error("No se encontró un producto del carrito.");
            }

            const precio = Number(producto.precio);

            return {
                producto_id: producto.id,
                nombre_producto: producto.nombre,
                precio: precio,
                cantidad: item.cantidad,
                subtotal: precio * item.cantidad
            };
        });

        const total = detalles.reduce(
            (suma, item) => suma + item.subtotal,
            0
        );

        // Crear pedido
        const { data: pedido, error: errorPedido } = await supabase
            .from("pedidos")
            .insert({
                usuario_id: usuarioActual.id,
                total: total,
                estado: "Pendiente"
            })
            .select()
            .single();

        if (errorPedido) throw errorPedido;

        // Guardar detalles
        const registros = detalles.map(item => ({
            ...item,
            pedido_id: pedido.id
        }));

        const { error: errorDetalles } = await supabase
            .from("pedido_detalles")
            .insert(registros);

        if (errorDetalles) {
            throw new Error(
                "El pedido se creó, pero hubo un problema al guardar sus detalles. Comunica el número de pedido al administrador: " +
                pedido.id
            );
        }

        carrito = [];

        dibujarCarrito();

        mostrarMensaje(
            mensajeCarrito,
            "¡Pedido realizado correctamente!",
            "exito"
        );

        await cargarMisPedidos();

    } catch (error) {

        mostrarMensaje(
            mensajeCarrito,
            error.message,
            "error"
        );

    } finally {
        btnConfirmarPedido.disabled = false;
    }
}


// ======================================
// HISTORIAL DEL CLIENTE
// ======================================

async function cargarMisPedidos() {

    const { data, error } = await supabase
        .from("pedidos")
        .select(`
            id,
            total,
            estado,
            created_at,
            pedido_detalles (
                nombre_producto,
                cantidad,
                subtotal
            )
        `)
        .eq("usuario_id", usuarioActual.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        misPedidos.textContent = "No se pudo cargar el historial.";
        return;
    }

    misPedidos.innerHTML = "";

    if (!data || data.length === 0) {
        misPedidos.textContent = "Todavía no tienes pedidos.";
        return;
    }

    data.forEach(pedido => {

        const tarjeta = document.createElement("article");
        tarjeta.className = "item-carrito";

        const detalle = (pedido.pedido_detalles || [])
            .map(item =>
                `${escapar(item.nombre_producto)} × ${item.cantidad}`
            )
            .join(", ");

        tarjeta.innerHTML = `
            <div>
                <strong>Pedido #${pedido.id}</strong>
                <p>${detalle}</p>
                <span class="estado ${claseEstado(pedido.estado)}">
                    ${escapar(pedido.estado)}
                </span>
            </div>

            <strong>${dinero(pedido.total)}</strong>
        `;

        misPedidos.appendChild(tarjeta);
    });
}


// ======================================
// ADMINISTRAR PRODUCTOS
// ======================================

formProducto.addEventListener("submit", guardarProducto);

async function guardarProducto(evento) {

    evento.preventDefault();

    if (perfilActual?.rol !== "administrador") return;

    const id = productoId.value;

    const datos = {
        nombre: productoNombre.value.trim(),
        categoria: productoCategoria.value,
        precio: Number(productoPrecio.value),
        imagen: productoImagen.value.trim() || null,
        descripcion: productoDescripcion.value.trim(),
        activo: true
    };

    if (
        !datos.nombre ||
        !datos.categoria ||
        !Number.isFinite(datos.precio) ||
        datos.precio <= 0
    ) {
        mostrarMensaje(
            mensajeProducto,
            "Completa los datos correctamente.",
            "error"
        );
        return;
    }

    try {

        let resultado;

        if (id) {

            resultado = await supabase
                .from("productos")
                .update(datos)
                .eq("id", id);

        } else {

            resultado = await supabase
                .from("productos")
                .insert(datos);

        }

        if (resultado.error) throw resultado.error;

        mostrarMensaje(
            mensajeProducto,
            id ? "Producto actualizado." : "Producto agregado.",
            "exito"
        );

        limpiarProducto();
        await cargarProductos();

    } catch (error) {
        mostrarMensaje(mensajeProducto, error.message, "error");
    }
}

function limpiarProducto() {

    formProducto.reset();
    productoId.value = "";

    $("tituloProducto").textContent = "Agregar producto";
    $("btnGuardarProducto").textContent = "Guardar producto";

    $("btnCancelarProducto").classList.add("oculto");
}

$("btnCancelarProducto").addEventListener("click", limpiarProducto);


// ======================================
// TABLA DE PRODUCTOS DEL ADMINISTRADOR
// ======================================

function dibujarTablaProductos() {

    tablaProductos.innerHTML = `
        <div class="tabla-contenedor">
            <table>
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Categoría</th>
                        <th>Precio</th>
                        <th>Disponibilidad</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${productos.map(p => `
                        <tr>
                            <td>${escapar(p.nombre)}</td>
                            <td>${escapar(p.categoria)}</td>
                            <td>${dinero(p.precio)}</td>
                            <td>${p.activo ? "Disponible" : "No disponible"}</td>
                            <td>
                                <button class="btn-tabla btn-editar"
                                    data-editar="${p.id}">
                                    Editar
                                </button>

                                <button class="btn-tabla btn-eliminar"
                                    data-eliminar="${p.id}">
                                    ${p.activo ? "Desactivar" : "Activar"}
                                </button>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;

    tablaProductos.querySelectorAll("[data-editar]").forEach(boton => {

        boton.addEventListener("click", () => {

            const producto = productos.find(
                p => p.id === boton.dataset.editar
            );

            if (!producto) return;

            productoId.value = producto.id;
            productoNombre.value = producto.nombre;
            productoCategoria.value = producto.categoria;
            productoPrecio.value = producto.precio;
            productoImagen.value = producto.imagen || "";
            productoDescripcion.value = producto.descripcion || "";

            $("tituloProducto").textContent = "Editar producto";
            $("btnGuardarProducto").textContent = "Guardar cambios";
            $("btnCancelarProducto").classList.remove("oculto");

            formProducto.scrollIntoView({
                behavior: "smooth"
            });
        });
    });

    tablaProductos.querySelectorAll("[data-eliminar]").forEach(boton => {

        boton.addEventListener("click", async () => {

            const producto = productos.find(
                p => p.id === boton.dataset.eliminar
            );

            if (!producto) return;

            const nuevoEstado = !producto.activo;

            if (!confirm(
                `¿Deseas ${nuevoEstado ? "activar" : "desactivar"} este producto?`
            )) return;

            const { error } = await supabase
                .from("productos")
                .update({ activo: nuevoEstado })
                .eq("id", producto.id);

            if (error) {
                alert(error.message);
                return;
            }

            await cargarProductos();
        });
    });
}


// ======================================
// PEDIDOS DEL ADMINISTRADOR
// ======================================

async function cargarPedidosAdministrador() {

    const { data, error } = await supabase
        .from("pedidos")
        .select(`
            id,
            usuario_id,
            total,
            estado,
            created_at,
            usuarios (
                nombre,
                correo
            ),
            pedido_detalles (
                nombre_producto,
                cantidad,
                subtotal
            )
        `)
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        tablaPedidos.textContent = "No se pudieron cargar los pedidos.";
        return;
    }

    pedidos = data || [];

    dibujarTablaPedidos();
}

function dibujarTablaPedidos() {

    tablaPedidos.innerHTML = `
        <div class="tabla-contenedor">
            <table>
                <thead>
                    <tr>
                        <th>Número</th>
                        <th>Cliente</th>
                        <th>Productos</th>
                        <th>Total</th>
                        <th>Estado</th>
                        <th>Actualizar</th>
                    </tr>
                </thead>

                <tbody>
                    ${pedidos.map(pedido => {

                        const cliente = pedido.usuarios?.nombre ||
                            "Cliente";

                        const detalle = (pedido.pedido_detalles || [])
                            .map(p =>
                                `${escapar(p.nombre_producto)} × ${p.cantidad}`
                            )
                            .join(", ");

                        return `
                            <tr>
                                <td>#${pedido.id}</td>
                                <td>${escapar(cliente)}</td>
                                <td>${detalle}</td>
                                <td>${dinero(pedido.total)}</td>
                                <td>
                                    <span class="estado ${claseEstado(pedido.estado)}">
                                        ${escapar(pedido.estado)}
                                    </span>
                                </td>
                                <td>
                                    <select data-estado="${pedido.id}">
                                        ${ESTADOS.map(estado => `
                                            <option value="${estado}"
                                                ${estado === pedido.estado ? "selected" : ""}>
                                                ${estado}
                                            </option>
                                        `).join("")}
                                    </select>
                                </td>
                            </tr>
                        `;
                    }).join("")}
                </tbody>
            </table>
        </div>
    `;

    tablaPedidos.querySelectorAll("[data-estado]").forEach(select => {

        select.addEventListener("change", async () => {

            const resultado = await supabase
                .from("pedidos")
                .update({ estado: select.value })
                .eq("id", select.dataset.estado);

            if (resultado.error) {
                alert(resultado.error.message);
                return;
            }

            await cargarPedidosAdministrador();
            await cargarVentas();
        });
    });
}

function claseEstado(estado) {

    return {
        "Pendiente": "estado-pendiente",
        "En preparación": "estado-preparacion",
        "Listo": "estado-listo",
        "Entregado": "estado-entregado",
        "Cancelado": "estado-cancelado"
    }[estado] || "";
}


// ======================================
// RESUMEN DE VENTAS
// ======================================

async function cargarVentas() {

    const { data, error } = await supabase
        .from("pedidos")
        .select("total")
        .eq("estado", "Entregado");

    if (error) {
        console.error(error);
        return;
    }

    const total = (data || []).reduce(
        (suma, pedido) => suma + Number(pedido.total),
        0
    );

    $("totalVentas").textContent = dinero(total);
}


// ======================================
// ACTUALIZAR PEDIDOS
// ======================================

btnActualizarPedidos.addEventListener("click", async () => {

    await cargarPedidosAdministrador();
    await cargarVentas();

});


// ======================================
// CERRAR SESIÓN
// ======================================

btnCerrarSesion.addEventListener("click", async () => {

    const { error } = await supabase.auth.signOut();

    if (error) {
        alert(error.message);
        return;
    }

    usuarioActual = null;
    perfilActual = null;
    carrito = [];

    mostrarPortada();
});


// ======================================
// COMPROBAR SESIÓN AL ABRIR
// ======================================

async function iniciarSistema() {

    const { data, error } = await supabase.auth.getSession();

    if (error) {
        console.error(error);
        return;
    }

    if (data.session) {

        usuarioActual = data.session.user;

        try {
            await comprobarUsuario();
        } catch (error) {
            console.error(error);
            await supabase.auth.signOut();
            mostrarPortada();
        }

    } else {
        mostrarPortada();
    }
}

iniciarSistema();

console.log("Sistema de Pedidos de Cafetería cargado.");
