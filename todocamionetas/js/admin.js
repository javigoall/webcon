// js/admin.js

const pantallaLogin = document.getElementById('pantalla-login');
const pantallaConfigInicial = document.getElementById('pantalla-config-inicial');
const pantallaNuevaPass = document.getElementById('pantalla-nueva-pass');
const pantallaPanel = document.getElementById('pantalla-panel');

const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');
const btnAbrirMiCuenta = document.getElementById('btn-abrir-mi-cuenta');
const badgeUsuarioLogueado = document.getElementById('usuario-logueado-badge');

// Login y Recuperación
const cajaLogin = document.getElementById('caja-login');
const cajaRecuperar = document.getElementById('caja-recuperar');
const formLogin = document.getElementById('form-login');
const msjError = document.getElementById('login-error');

const linkMostrarRecuperar = document.getElementById('link-mostrar-recuperar');
const linkVolverLogin = document.getElementById('link-volver-login');
const formRecuperar = document.getElementById('form-recuperar');
const recMensaje = document.getElementById('rec-mensaje');

// Configuración obligatoria 1er ingreso
const formConfigInicial = document.getElementById('form-config-inicial');
const configError = document.getElementById('config-error');

// Modal Mi Cuenta
const modalMiCuenta = document.getElementById('modal-mi-cuenta');
const formMiCuenta = document.getElementById('form-mi-cuenta');
const miCuentaMsj = document.getElementById('mi-cuenta-msj');

// Modal Usuarios del Dueño (Hasta 2 adicionales)
const btnAbrirUsuarios = document.getElementById('btn-abrir-usuarios');
const modalUsuarios = document.getElementById('modal-usuarios');
const listaUsuariosAdmin = document.getElementById('lista-usuarios-admin');
const formCrearUsuarioAdicional = document.getElementById('form-crear-usuario-adicional');
const cajaNuevoUsuarioAdicional = document.getElementById('caja-nuevo-usuario-adicional');
const msjUserAdicional = document.getElementById('msj-user-adicional');

// Elementos del Panel de Vehículos y Banners
const btnNuevoAuto = document.getElementById('btn-nuevo-auto');
const modalNuevoAuto = document.getElementById('modal-nuevo-auto');
const btnCerrarModal = document.getElementById('btn-cerrar-modal');
const formCargarAuto = document.getElementById('form-cargar-auto');
const msjCarga = document.getElementById('mensaje-carga');
const btnGuardarAuto = document.getElementById('btn-guardar-auto');
const tituloModal = document.getElementById('titulo-modal');
const idOculto = document.getElementById('auto-id-oculto');
const inputFoto = document.getElementById('auto-foto');
const btnSeleccionarFotos = document.getElementById('btn-seleccionar-fotos');
const previewNuevasFotos = document.getElementById('preview-nuevas-fotos');

const selectMarca = document.getElementById('auto-marca');
const inputMarcaManual = document.getElementById('auto-marca-manual');
const checkCuotas = document.getElementById('check-cuotas');
const contenedorCuotasInputs = document.getElementById('contenedor-cuotas-inputs');

const checkOferta = document.getElementById('check-oferta');
const checkNovedad = document.getElementById('check-novedad');

const btnAbrirBanners = document.getElementById('btn-abrir-banners');
const btnAbrirBannersMovil = document.getElementById('btn-abrir-banners-movil');
const modalBanners = document.getElementById('modal-banners');
const btnCerrarModalBanners = document.getElementById('btn-cerrar-modal-banners');
const listaBannersAdmin = document.getElementById('lista-banners-admin');
const btnSubirBanner = document.getElementById('btn-subir-banner');
const inputArchivoBanner = document.getElementById('input-archivo-banner');
const msjSubiendoBanner = document.getElementById('msj-subiendo-banner');
const contenedorSubirBanner = document.getElementById('contenedor-subir-banner');

let perfilUsuarioActual = null;
let agenciaIdActual = null;
let enModoRecuperacion = false;

function resetScrollModal(modal) {
    modal.scrollTop = 0;
    const contenido = modal.querySelector('.modal-contenido');
    if (contenido) contenido.scrollTop = 0;
}

// ==========================================
// CAMBIO ENTRE LOGIN Y RECUPERAR CLAVE
// ==========================================
if (linkMostrarRecuperar) {
    linkMostrarRecuperar.addEventListener('click', (e) => {
        e.preventDefault();
        msjError.style.display = 'none';
        recMensaje.style.display = 'none';
        const escrito = document.getElementById('login-username').value.trim();
        if (escrito) document.getElementById('rec-identificador').value = escrito;
        cajaLogin.style.display = 'none';
        cajaRecuperar.style.display = 'block';
    });
}

if (linkVolverLogin) {
    linkVolverLogin.addEventListener('click', (e) => {
        e.preventDefault();
        recMensaje.style.display = 'none';
        cajaRecuperar.style.display = 'none';
        cajaLogin.style.display = 'block';
    });
}

// ==========================================
// 1. INICIO DE SESIÓN (SOLO USUARIO Y CONTRASEÑA)
// ==========================================
formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    msjError.style.display = 'none';

    const usernameInput = document.getElementById('login-username').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;
    const btnSubmit = document.getElementById('btn-submit-login');

    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Ingresando...';

    try {
        // Buscamos el usuario por su username
        const { data: perfil, error: errBusqueda } = await clienteSupabase
            .from('usuarios_agencia')
            .select('*')
            .eq('username', usernameInput)
            .maybeSingle();

        if (errBusqueda || !perfil) {
            throw new Error('Nombre de usuario o contraseña incorrectos.');
        }

        // Si ya vinculó un correo real, su cuenta en Auth usa ese correo; si no, buscamos su correo interno
        let emailParaAuth = perfil.email_recuperacion;
        if (!emailParaAuth) {
            emailParaAuth = `${perfil.username}_${perfil.id.substring(0, 6)}@interno.goall.local`;
        }

        const { error: errAuth } = await clienteSupabase.auth.signInWithPassword({
            email: emailParaAuth,
            password: password
        });

        if (errAuth) {
            throw new Error('Nombre de usuario o contraseña incorrectos.');
        }

        formLogin.reset();
        await verificarSesion();

    } catch (err) {
        msjError.textContent = '❌ ' + err.message;
        msjError.style.display = 'block';
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Ingresar al Sistema';
    }
});

// ==========================================
// 2. CONFIGURACIÓN OBLIGATORIA EN PRIMER INGRESO (CLAVE PROPIA + MAIL)
// ==========================================
if (formConfigInicial) {
    formConfigInicial.addEventListener('submit', async (e) => {
        e.preventDefault();
        configError.style.display = 'none';

        const email = document.getElementById('config-email').value.trim().toLowerCase();
        const pass1 = document.getElementById('config-password').value;
        const pass2 = document.getElementById('config-password-repeat').value;
        const btnSubmit = document.getElementById('btn-submit-config');

        if (pass1 !== pass2) {
            configError.textContent = '❌ Las contraseñas no coinciden. Verificalas.';
            configError.style.display = 'block';
            return;
        }

        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Guardando configuración segura...';

        try {
            // 1. Vinculamos el correo de recuperación en la base de datos y en Auth
            const { error: errRpc } = await clienteSupabase.rpc('vincular_correo_recuperacion', {
                p_email: email
            });
            if (errRpc) throw errRpc;

            // 2. Actualizamos la contraseña a la elegida en privado por el usuario
            const { error: errPass } = await clienteSupabase.auth.updateUser({
                password: pass1
            });
            if (errPass) throw errPass;

            formConfigInicial.reset();
            alert('¡Perfecto! Tu contraseña privada y tu correo de recuperación quedaron configurados.');
            await verificarSesion();

        } catch (err) {
            configError.textContent = '❌ ' + (err.message || 'Error al guardar la configuración.');
            configError.style.display = 'block';
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = '🔒 Guardar mi Clave y Entrar al Panel';
        }
    });
}

// ==========================================
// 3. RECUPERAR CONTRASEÑA (ESCRIBIENDO USUARIO O MAIL)
// ==========================================
if (formRecuperar) {
    formRecuperar.addEventListener('submit', async (e) => {
        e.preventDefault();
        recMensaje.style.display = 'none';

        const identificador = document.getElementById('rec-identificador').value.trim().toLowerCase();
        const btnSubmit = document.getElementById('btn-submit-recuperar');

        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Enviando enlace...';

        try {
            let query = clienteSupabase.from('usuarios_agencia').select('username, email_recuperacion');
            if (identificador.includes('@')) {
                query = query.eq('email_recuperacion', identificador);
            } else {
                query = query.eq('username', identificador);
            }

            const { data: perfil } = await query.maybeSingle();

            if (!perfil) {
                throw new Error('No encontramos ningún usuario ni correo registrado con ese dato.');
            }

            if (!perfil.email_recuperacion) {
                throw new Error('Este usuario todavía no configuró su correo de recuperación.');
            }

            const { error } = await clienteSupabase.auth.resetPasswordForEmail(perfil.email_recuperacion, {
                redirectTo: window.location.origin + window.location.pathname
            });

            if (error) throw error;

            recMensaje.style.color = '#059669';
            recMensaje.innerHTML = '✅ ¡Listo! Te enviamos un correo con el enlace para blanquear y restablecer tu contraseña. Revisá tu bandeja de entrada.';
            recMensaje.style.display = 'block';
            formRecuperar.reset();

        } catch (err) {
            recMensaje.style.color = '#EF4444';
            recMensaje.textContent = '❌ ' + err.message;
            recMensaje.style.display = 'block';
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Enviar Correo de Recuperación';
        }
    });
}

// Detectar cuando el usuario abre el enlace de recuperación desde su mail
clienteSupabase.auth.onAuthStateChange(async (event) => {
    if (event === 'PASSWORD_RECOVERY') {
        enModoRecuperacion = true;
        pantallaLogin.style.display = 'none';
        pantallaConfigInicial.style.display = 'none';
        pantallaPanel.style.display = 'none';
        pantallaNuevaPass.style.display = 'block';
    }
});

const formNuevaPass = document.getElementById('form-nueva-pass');
if (formNuevaPass) {
    formNuevaPass.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nuevaClave = document.getElementById('nueva-password').value;
        const repetirClave = document.getElementById('nueva-password-repeat').value;

        if (nuevaClave !== repetirClave) {
            alert('Las contraseñas no coinciden.');
            return;
        }

        const btn = document.getElementById('btn-submit-nueva-pass');
        btn.disabled = true;
        btn.textContent = 'Actualizando...';

        const { error } = await clienteSupabase.auth.updateUser({
            password: nuevaClave
        });
        
        btn.disabled = false;
        btn.textContent = 'Actualizar Contraseña';

        if (error) {
            alert("Error al actualizar la contraseña: " + error.message);
        } else {
            alert("¡Contraseña actualizada con éxito! Ya podés ingresar con tu usuario y tu nueva clave.");
            enModoRecuperacion = false;
            window.location.hash = '';
            pantallaNuevaPass.style.display = 'none';
            await clienteSupabase.auth.signOut();
            verificarSesion();
        }
    });
}

// ==========================================
// 4. MODAL "MI CUENTA" (CAMBIAR CLAVE O CORREO DESDE ADENTRO DEL PANEL)
// ==========================================
if (btnAbrirMiCuenta) {
    btnAbrirMiCuenta.addEventListener('click', () => {
        if (!perfilUsuarioActual) return;
        miCuentaMsj.style.display = 'none';
        document.getElementById('mi-cuenta-username').value = perfilUsuarioActual.username;
        document.getElementById('mi-cuenta-email').value = perfilUsuarioActual.email_recuperacion || '';
        document.getElementById('mi-cuenta-pass').value = '';
        document.getElementById('mi-cuenta-pass-repeat').value = '';
        modalMiCuenta.style.display = 'flex';
    });
}

if (formMiCuenta) {
    formMiCuenta.addEventListener('submit', async (e) => {
        e.preventDefault();
        miCuentaMsj.style.display = 'none';

        const nuevoEmail = document.getElementById('mi-cuenta-email').value.trim().toLowerCase();
        const nuevaPass = document.getElementById('mi-cuenta-pass').value;
        const nuevaPassRepeat = document.getElementById('mi-cuenta-pass-repeat').value;
        const btn = document.getElementById('btn-guardar-mi-cuenta');

        if (nuevaPass && nuevaPass !== nuevaPassRepeat) {
            miCuentaMsj.style.color = '#EF4444';
            miCuentaMsj.textContent = '❌ Las contraseñas nuevas no coinciden.';
            miCuentaMsj.style.display = 'block';
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Guardando...';

        try {
            if (nuevoEmail !== perfilUsuarioActual.email_recuperacion) {
                const { error: errMail } = await clienteSupabase.rpc('vincular_correo_recuperacion', {
                    p_email: nuevoEmail
                });
                if (errMail) throw errMail;
                perfilUsuarioActual.email_recuperacion = nuevoEmail;
            }

            if (nuevaPass) {
                const { error: errPass } = await clienteSupabase.auth.updateUser({
                    password: nuevaPass
                });
                if (errPass) throw errPass;
            }

            miCuentaMsj.style.color = '#059669';
            miCuentaMsj.textContent = '✅ Datos de seguridad actualizados correctamente.';
            miCuentaMsj.style.display = 'block';
            document.getElementById('mi-cuenta-pass').value = '';
            document.getElementById('mi-cuenta-pass-repeat').value = '';

        } catch (err) {
            miCuentaMsj.style.color = '#EF4444';
            miCuentaMsj.textContent = '❌ ' + err.message;
            miCuentaMsj.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.textContent = '💾 Guardar Cambios';
        }
    });
}

// ==========================================
// 5. GESTIÓN DE HASTA 2 USUARIOS ADICIONALES (EXCLUSIVO DUEÑO)
// ==========================================
if (btnAbrirUsuarios) {
    btnAbrirUsuarios.addEventListener('click', () => {
        msjUserAdicional.style.display = 'none';
        modalUsuarios.style.display = 'flex';
        resetScrollModal(modalUsuarios);
        cargarUsuariosDelEquipo();
    });
}

async function cargarUsuariosDelEquipo() {
    if (!listaUsuariosAdmin) return;
    listaUsuariosAdmin.innerHTML = '<p>Cargando usuarios...</p>';

    const { data: usuarios, error } = await clienteSupabase
        .from('usuarios_agencia')
        .select('*')
        .eq('agencia_id', agenciaIdActual)
        .order('es_duenio', { ascending: false })
        .order('creado_en', { ascending: true });

    if (error) {
        listaUsuariosAdmin.innerHTML = '<p style="color:#EF4444;">Error al cargar usuarios.</p>';
        return;
    }

    listaUsuariosAdmin.innerHTML = '';
    const adicionales = usuarios.filter(u => !u.es_duenio);

    // Mostrar u ocultar formulario según el límite de 2 usuarios adicionales
    if (adicionales.length >= 2) {
        cajaNuevoUsuarioAdicional.style.display = 'none';
    } else {
        cajaNuevoUsuarioAdicional.style.display = 'block';
    }

    usuarios.forEach(u => {
        const estadoConfig = u.requiere_configuracion
            ? '<span style="background:#FEF3C7; color:#92400E; padding:3px 8px; border-radius:12px; font-size:0.72rem; font-weight:700;">⏳ Clave provisoria (Pendiente 1er ingreso)</span>'
            : '<span style="background:#DEF7EC; color:#03543F; padding:3px 8px; border-radius:12px; font-size:0.72rem; font-weight:700;">🔒 Clave privada activa</span>';

        const rolBadge = u.es_duenio
            ? '<span style="background:#DBEAFE; color:#1E40AF; padding:3px 8px; border-radius:12px; font-size:0.72rem; font-weight:800;">👑 DUEÑO</span>'
            : '<span style="background:#F3F4F6; color:#374151; padding:3px 8px; border-radius:12px; font-size:0.72rem; font-weight:700;">👤 ADICIONAL</span>';

        const div = document.createElement('div');
        div.style.cssText = 'display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; padding: 14px; border-radius: 8px; border: 1px solid #E5E7EB; background: #FFFFFF;';

        div.innerHTML = `
            <div>
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <strong style="font-size: 1rem; color: #1F2937;">${u.username}</strong>
                    ${rolBadge}
                    ${estadoConfig}
                </div>
                <p style="margin: 4px 0 0 0; font-size: 0.82rem; color: #6B7280;">
                    Correo vinculado: <strong>${u.email_recuperacion || 'Sin vincular aún'}</strong>
                </p>
            </div>
            <div>
                ${!u.es_duenio ? `
                    <button onclick="eliminarUsuarioEquipo('${u.id}', '${u.username}')" style="background: #EF4444; color: white; border: none; padding: 7px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.8rem;">
                        🗑️ Eliminar
                    </button>
                ` : ''}
            </div>
        `;
        listaUsuariosAdmin.appendChild(div);
    });
}

if (formCrearUsuarioAdicional) {
    formCrearUsuarioAdicional.addEventListener('submit', async (e) => {
        e.preventDefault();
        msjUserAdicional.style.display = 'none';

        const username = document.getElementById('nuevo-user-username').value.trim().toLowerCase();
        const password = document.getElementById('nuevo-user-password').value;
        const btn = document.getElementById('btn-submit-user-adicional');

        btn.disabled = true;
        btn.textContent = 'Creando...';

        try {
            const { error } = await clienteSupabase.rpc('crear_usuario_adicional', {
                p_username: username,
                p_password: password
            });

            if (error) throw error;

            formCrearUsuarioAdicional.reset();
            msjUserAdicional.style.color = '#059669';
            msjUserAdicional.textContent = `✅ Usuario "${username}" creado. Ya puede ingresar con su clave provisoria.`;
            msjUserAdicional.style.display = 'block';
            await cargarUsuariosDelEquipo();

        } catch (err) {
            msjUserAdicional.style.color = '#EF4444';
            msjUserAdicional.textContent = '❌ ' + err.message;
            msjUserAdicional.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.textContent = 'Crear Usuario';
        }
    });
}

window.eliminarUsuarioEquipo = async function(idUsuario, nombreUsuario) {
    if (!confirm(`¿Seguro que querés eliminar al usuario "${nombreUsuario}"?`)) return;

    const { error } = await clienteSupabase.rpc('eliminar_usuario_adicional', {
        p_target_id: idUsuario
    });

    if (error) {
        alert('Error al eliminar usuario: ' + error.message);
    } else {
        cargarUsuariosDelEquipo();
    }
};

// ==========================================
// VERIFICACIÓN DE SESIÓN Y ESTADO DE CONFIGURACIÓN
// ==========================================
async function verificarSesion() {
    if (window.location.hash && window.location.hash.includes('type=recovery')) {
        enModoRecuperacion = true;
        pantallaLogin.style.display = 'none';
        pantallaConfigInicial.style.display = 'none';
        pantallaPanel.style.display = 'none';
        pantallaNuevaPass.style.display = 'block';
        return;
    }

    if (enModoRecuperacion) return;

    const { data: { session } } = await clienteSupabase.auth.getSession();
    
    if (session) {
        const { data: perfil } = await clienteSupabase
            .from('usuarios_agencia')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

        if (!perfil) {
            await clienteSupabase.auth.signOut();
            pantallaLogin.style.display = 'block';
            pantallaConfigInicial.style.display = 'none';
            pantallaPanel.style.display = 'none';
            return;
        }

        perfilUsuarioActual = perfil;
        agenciaIdActual = perfil.agencia_id;

        btnCerrarSesion.style.display = 'block';
        if (badgeUsuarioLogueado) {
            badgeUsuarioLogueado.textContent = `👤 ${perfil.username}`;
            badgeUsuarioLogueado.style.display = 'inline-block';
        }

        // Si el usuario tiene clave provisoria (1er ingreso o reseteo de emergencia), obligarlo a poner clave propia y mail
        if (perfil.requiere_configuracion || !perfil.email_recuperacion) {
            pantallaLogin.style.display = 'none';
            pantallaPanel.style.display = 'none';
            pantallaNuevaPass.style.display = 'none';
            btnAbrirMiCuenta.style.display = 'none';
            pantallaConfigInicial.style.display = 'block';
            return;
        }

        // Si ya configuró su clave privada y su correo, entra directo al panel
        pantallaLogin.style.display = 'none';
        pantallaConfigInicial.style.display = 'none';
        pantallaNuevaPass.style.display = 'none';
        pantallaPanel.style.display = 'block';
        btnAbrirMiCuenta.style.display = 'inline-block';

        // Mostrar botón "Usuarios" solo si es el dueño de la concesionaria
        if (btnAbrirUsuarios) {
            btnAbrirUsuarios.style.display = perfil.es_duenio ? 'flex' : 'none';
        }

        cargarConfiguracion();
        cargarMisAutos();
    } else {
        perfilUsuarioActual = null;
        agenciaIdActual = null;
        pantallaLogin.style.display = 'block';
        pantallaConfigInicial.style.display = 'none';
        pantallaPanel.style.display = 'none';
        btnCerrarSesion.style.display = 'none';
        btnAbrirMiCuenta.style.display = 'none';
        if (badgeUsuarioLogueado) badgeUsuarioLogueado.style.display = 'none';
    }
}

// ==========================================
// LÓGICA DE ENTREGAS / CLIENTES
// ==========================================
const btnAbrirEntregas = document.getElementById('btn-abrir-entregas');
const modalVerEntregas = document.getElementById('modal-ver-entregas');
const btnNuevaEntrega = document.getElementById('btn-nueva-entrega');
const modalFormEntrega = document.getElementById('modal-form-entrega');
const formEntrega = document.getElementById('form-cargar-entrega');
const listaEntregasAdmin = document.getElementById('lista-entregas-admin');

let entregasActuales = [];

if (btnAbrirEntregas) {
    btnAbrirEntregas.addEventListener('click', () => {
        modalVerEntregas.style.display = 'flex';
        resetScrollModal(modalVerEntregas);
        cargarEntregasAdmin();
    });
}

if (btnNuevaEntrega) {
    btnNuevaEntrega.addEventListener('click', () => {
        formEntrega.reset();
        document.getElementById('entrega-id-oculto').value = '';
        document.getElementById('titulo-modal-entrega').textContent = 'Nueva Entrega';
        document.getElementById('entrega-foto').required = true;
        document.getElementById('entrega-foto-ayuda').style.display = 'none';
        modalFormEntrega.style.display = 'flex';
        resetScrollModal(modalFormEntrega);
    });
}

async function cargarEntregasAdmin() {
    if (!listaEntregasAdmin) return;
    listaEntregasAdmin.innerHTML = '<p>Cargando entregas...</p>';
    
    const { data, error } = await clienteSupabase
        .from('entregas')
        .select('*')
        .order('id', { ascending: false });
        
    if(error) { listaEntregasAdmin.innerHTML = '<p>Error cargando entregas.</p>'; return; }
    
    entregasActuales = data || [];
    renderizarEntregasAdmin();
}

function renderizarEntregasAdmin() {
    listaEntregasAdmin.innerHTML = '';
    if(entregasActuales.length === 0) {
        listaEntregasAdmin.innerHTML = '<p style="color: #6B7280; text-align: center; grid-column: 1/-1;">Todavía no hay entregas cargadas.</p>';
        return;
    }
    
    entregasActuales.forEach(entrega => {
        const div = document.createElement('div');
        div.style.cssText = 'background: white; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column;';
        
        const fechaTexto = entrega.fecha ? new Date(entrega.fecha).toLocaleDateString('es-AR') : 'Sin fecha';
        
        div.innerHTML = `
            <img src="${entrega.url_imagen}" style="width: 100%; height: 160px; object-fit: cover;">
            <div style="padding: 15px; flex-grow: 1; display: flex; flex-direction: column;">
                <h3 style="margin: 0 0 5px 0; font-size: 1.1rem; color: #1F2937;">${entrega.titulo}</h3>
                <p style="margin: 0 0 10px 0; font-size: 0.85rem; color: #6B7280; font-weight: bold;">📅 ${fechaTexto}</p>
                <p style="margin: 0 0 15px 0; font-size: 0.85rem; color: #4B5563; flex-grow: 1;">${entrega.descripcion || ''}</p>
                
                <div style="display: flex; gap: 10px; margin-top: auto;">
                    <button onclick="abrirEditarEntrega('${entrega.id}')" style="flex:1; background:#3B82F6; color:white; border:none; padding:8px; border-radius:6px; cursor:pointer; font-weight:bold;">✏️ Editar</button>
                    <button onclick="borrarEntrega('${entrega.id}')" style="flex:1; background:#EF4444; color:white; border:none; padding:8px; border-radius:6px; cursor:pointer; font-weight:bold;">🗑️ Borrar</button>
                </div>
            </div>
        `;
        listaEntregasAdmin.appendChild(div);
    });
}

window.abrirEditarEntrega = function(id) {
    const entrega = entregasActuales.find(e => e.id == id);
    if(!entrega) return;
    
    document.getElementById('entrega-id-oculto').value = entrega.id;
    document.getElementById('titulo-modal-entrega').textContent = 'Editar Entrega';
    document.getElementById('entrega-titulo').value = entrega.titulo;
    document.getElementById('entrega-fecha').value = entrega.fecha || '';
    document.getElementById('entrega-descripcion').value = entrega.descripcion || '';
    
    document.getElementById('entrega-foto').required = false;
    document.getElementById('entrega-foto-ayuda').style.display = 'block';
    
    modalFormEntrega.style.display = 'flex';
    resetScrollModal(modalFormEntrega);
};

window.borrarEntrega = async function(id) {
    if(confirm("¿Seguro que querés borrar esta entrega?")) {
        const { error } = await clienteSupabase.from('entregas').delete().eq('id', id);
        if(error) alert("Error al borrar: " + error.message);
        else cargarEntregasAdmin();
    }
};

if (formEntrega) {
    formEntrega.addEventListener('submit', async (e) => {
        e.preventDefault();
        const idEdicion = document.getElementById('entrega-id-oculto').value;
        const esEdicion = idEdicion !== '';
        const archivo = document.getElementById('entrega-foto').files[0];
        
        document.getElementById('btn-guardar-entrega').style.display = 'none';
        document.getElementById('msj-carga-entrega').style.display = 'block';
        
        try {
            let url_imagen_final = null;

            if (archivo) {
                const archivoComprimido = await comprimirImagen(archivo, false);
                const nombreFoto = `entrega_${Date.now()}_${agenciaIdActual}.jpg`;
                
                const { error: errorFoto } = await clienteSupabase.storage.from('fotos_vehiculos').upload(nombreFoto, archivoComprimido);
                if (errorFoto) throw errorFoto;
                
                const { data: linkPublico } = clienteSupabase.storage.from('fotos_vehiculos').getPublicUrl(nombreFoto);
                url_imagen_final = linkPublico.publicUrl;
            } else if (esEdicion) {
                const entregaOriginal = entregasActuales.find(e => e.id == idEdicion);
                url_imagen_final = entregaOriginal.url_imagen;
            }
            
            const fechaVal = document.getElementById('entrega-fecha').value;
            
            const datosEntrega = {
                titulo: document.getElementById('entrega-titulo').value,
                url_imagen: url_imagen_final,
                fecha: fechaVal ? fechaVal : null,
                descripcion: document.getElementById('entrega-descripcion').value
            };

            if (esEdicion) {
                const { error } = await clienteSupabase.from('entregas').update(datosEntrega).eq('id', idEdicion);
                if(error) throw error;
            } else {
                datosEntrega.agencia_id = agenciaIdActual;
                const { error } = await clienteSupabase.from('entregas').insert([datosEntrega]);
                if(error) throw error;
            }
            
            modalFormEntrega.style.display = 'none';
            cargarEntregasAdmin();
            alert(esEdicion ? "¡Entrega actualizada!" : "¡Entrega guardada con éxito!");
            
        } catch(err) {
            alert("Hubo un error: " + err.message);
        } finally {
            document.getElementById('btn-guardar-entrega').style.display = 'block';
            document.getElementById('msj-carga-entrega').style.display = 'none';
        }
    });
}

// ==========================================
// CONTROL DEL TIEMPO DEL CARRUSEL
// ==========================================
const selectTiempoCarrusel = document.getElementById('select-tiempo-carrusel');

if(selectTiempoCarrusel) {
    selectTiempoCarrusel.addEventListener('change', async (e) => {
        const nuevoTiempo = parseInt(e.target.value);
        if (!agenciaIdActual) return;
        
        const { error } = await clienteSupabase.from('configuracion').upsert({
            agencia_id: agenciaIdActual,
            tiempo: nuevoTiempo
        });
        
        if(error) alert("Error al guardar el tiempo: " + error.message);
    });
}

async function cargarConfiguracion() {
    const { data } = await clienteSupabase.from('configuracion').select('tiempo').limit(1).maybeSingle();
    if (data && data.tiempo && selectTiempoCarrusel) {
        selectTiempoCarrusel.value = data.tiempo;
    }
}

// ==========================================
// LÓGICA DEL BOTÓN DE CAMBIO DE VISTA
// ==========================================
const btnCambiarVista = document.getElementById('btn-cambiar-vista');
let modoLista = false;

if (btnCambiarVista) {
    btnCambiarVista.addEventListener('click', () => {
        modoLista = !modoLista;
        const grilla = document.getElementById('grilla-admin');
        if (modoLista) {
            grilla.classList.add('vista-lista');
            btnCambiarVista.innerHTML = '🖼️ Ver en Grilla';
        } else {
            grilla.classList.remove('vista-lista');
            btnCambiarVista.innerHTML = '📄 Ver en Lista';
        }
    });
}

let autosActuales = []; 
let fotosGuardadasEnEdicion = []; 
let archivosNuevosSeleccionados = []; 
let bannersActuales = [];
let tipoBannerActual = 'pc';

selectMarca.addEventListener('change', (e) => {
    if (e.target.value === 'Otra') {
        inputMarcaManual.style.display = 'block';
        inputMarcaManual.required = true;
    } else {
        inputMarcaManual.style.display = 'none';
        inputMarcaManual.required = false;
        inputMarcaManual.value = '';
    }
});

checkCuotas.addEventListener('change', (e) => {
    if (e.target.checked) {
        contenedorCuotasInputs.style.display = 'grid';
        document.getElementById('auto-cant-cuotas').required = true;
        document.getElementById('auto-monto-cuota').required = true;
    } else {
        contenedorCuotasInputs.style.display = 'none';
        document.getElementById('auto-entrega').value = '';
        document.getElementById('auto-cant-cuotas').required = false;
        document.getElementById('auto-monto-cuota').required = false;
        document.getElementById('auto-cant-cuotas').value = '';
        document.getElementById('auto-monto-cuota').value = '';
    }
});

// ==========================================
// GESTIÓN DE BANNERS (PC Y MÓVIL)
// ==========================================
btnAbrirBanners.addEventListener('click', () => {
    tipoBannerActual = 'pc';
    document.getElementById('titulo-modal-banners').innerText = '💻 Banners del Carrusel (PC)';
    document.getElementById('texto-modal-banners').innerHTML = 'Podés subir hasta <strong>7 imágenes horizontales</strong>. <span style="color: #EF4444; font-weight: bold; margin-left: 5px;">Medida ideal: 1920x681 px</span>';
    modalBanners.style.display = 'flex';
    resetScrollModal(modalBanners);
    cargarBannersAdmin();
});

btnAbrirBannersMovil.addEventListener('click', () => {
    tipoBannerActual = 'movil';
    document.getElementById('titulo-modal-banners').innerText = '📱 Banners del Carrusel (Celulares)';
    document.getElementById('texto-modal-banners').innerHTML = 'Podés subir hasta <strong>7 imágenes verticales</strong> para la vista móvil. <span style="color: #EF4444; font-weight: bold; margin-left: 5px;">Medida ideal: 1080x1350 px</span>';
    modalBanners.style.display = 'flex';
    resetScrollModal(modalBanners);
    cargarBannersAdmin();
});

btnCerrarModalBanners.addEventListener('click', () => {
    modalBanners.style.display = 'none';
});

async function cargarBannersAdmin() {
    listaBannersAdmin.innerHTML = '<p>Cargando banners...</p>';
    try {
        const { data: banners, error } = await clienteSupabase
            .from('banners')
            .select('*')
            .eq('tipo', tipoBannerActual) 
            .order('orden', { ascending: true });

        if (error) throw error;
        bannersActuales = banners || [];
        renderizarBannersAdmin();
    } catch (e) {
        listaBannersAdmin.innerHTML = '<p>Error al cargar banners.</p>';
    }
}

function renderizarBannersAdmin() {
    listaBannersAdmin.innerHTML = '';
    if (bannersActuales.length === 0) {
        listaBannersAdmin.innerHTML = '<p style="color: #6B7280;">No hay banners cargados todavía en esta vista.</p>';
    } else {
        bannersActuales.forEach((b, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === bannersActuales.length - 1;
            
            const div = document.createElement('div');
            div.style.cssText = 'display: flex; align-items: center; justify-content: space-between; background: #F9FAFB; padding: 10px 15px; border-radius: 8px; border: 1px solid #E5E7EB; flex-wrap: wrap; gap: 10px;';
            div.innerHTML = `
                <div style="display: flex; align-items: center; gap: 15px;">
                    <span style="font-weight: bold; color: var(--color-primario); font-size: 1.1rem;">#${idx + 1}</span>
                    <img src="${b.url_imagen}" style="width: 100px; height: 50px; object-fit: cover; border-radius: 6px; border: 1px solid #D1D5DB;">
                </div>
                
                <div style="display: flex; gap: 5px;">
                    <button onclick="moverBanner(${idx}, -1)" ${isFirst ? 'disabled' : ''} style="background: ${isFirst ? '#E5E7EB' : '#3B82F6'}; color: ${isFirst ? '#9CA3AF' : 'white'}; border: none; padding: 8px 12px; border-radius: 6px; cursor: ${isFirst ? 'not-allowed' : 'pointer'}; font-size: 1rem;" title="Subir orden">⬆️</button>
                    
                    <button onclick="moverBanner(${idx}, 1)" ${isLast ? 'disabled' : ''} style="background: ${isLast ? '#E5E7EB' : '#3B82F6'}; color: ${isLast ? '#9CA3AF' : 'white'}; border: none; padding: 8px 12px; border-radius: 6px; cursor: ${isLast ? 'not-allowed' : 'pointer'}; font-size: 1rem;" title="Bajar orden">⬇️</button>
                    
                    <button onclick="borrarBanner(${b.id})" style="background: #EF4444; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; margin-left: 5px;" title="Eliminar">🗑️</button>
                </div>
            `;
            listaBannersAdmin.appendChild(div);
        });
    }
    
    if (bannersActuales.length >= 7) {
        contenedorSubirBanner.style.display = 'none';
    } else {
        contenedorSubirBanner.style.display = 'block';
    }
}

window.moverBanner = async function(index, direccion) {
    const indexDestino = index + direccion;
    
    if (indexDestino < 0 || indexDestino >= bannersActuales.length) return;

    const bannerActual = bannersActuales[index];
    const bannerDestino = bannersActuales[indexDestino];

    listaBannersAdmin.innerHTML = '<p style="text-align: center; color: #2563EB; font-weight: bold;">Actualizando orden...</p>';

    try {
        const { error: err1 } = await clienteSupabase.from('banners').update({ orden: bannerDestino.orden }).eq('id', bannerActual.id);
        if (err1) throw err1;

        const { error: err2 } = await clienteSupabase.from('banners').update({ orden: bannerActual.orden }).eq('id', bannerDestino.id);
        if (err2) throw err2;

        await cargarBannersAdmin();
    } catch (error) {
        alert("Error al reordenar: " + error.message);
        await cargarBannersAdmin(); 
    }
};

btnSubirBanner.addEventListener('click', () => {
    inputArchivoBanner.click();
});

inputArchivoBanner.addEventListener('change', async function() {
    const archivo = this.files[0];
    if (!archivo) return;
    
    if (bannersActuales.length >= 7) {
        alert("Ya alcanzaste el máximo de 7 banners para esta vista.");
        this.value = '';
        return;
    }
    
    btnSubirBanner.style.display = 'none';
    msjSubiendoBanner.style.display = 'block';
    
    try {
        const archivoComprimido = await comprimirImagen(archivo, true);
        const nombreFoto = `banner_${tipoBannerActual}_${Date.now()}_${agenciaIdActual}.jpg`;
        
        const { error: errorFoto } = await clienteSupabase.storage
            .from('fotos_vehiculos')
            .upload(nombreFoto, archivoComprimido);
            
        if (errorFoto) throw errorFoto;
        
        const { data: linkPublico } = clienteSupabase.storage
            .from('fotos_vehiculos')
            .getPublicUrl(nombreFoto);
            
        const nuevoOrden = bannersActuales.length > 0 ? Math.max(...bannersActuales.map(b => b.orden)) + 1 : 1;
        
        const { error: errorDB } = await clienteSupabase
            .from('banners')
            .insert([{
                agencia_id: agenciaIdActual,
                url_imagen: linkPublico.publicUrl,
                orden: nuevoOrden,
                tipo: tipoBannerActual 
            }]);
            
        if (errorDB) throw errorDB;
        
        await cargarBannersAdmin();
        alert("¡Banner subido correctamente!");
    } catch (e) {
        alert("Error al subir el banner: " + e.message);
    } finally {
        inputArchivoBanner.value = '';
        btnSubirBanner.style.display = 'block';
        msjSubiendoBanner.style.display = 'none';
    }
});

window.borrarBanner = async function(idBanner) {
    if (confirm("¿Seguro que querés eliminar este banner del carrusel?")) {
        const { error } = await clienteSupabase.from('banners').delete().eq('id', idBanner);
        if (error) alert("Error al borrar: " + error.message);
        else cargarBannersAdmin();
    }
};

function comprimirImagen(archivo, esBanner = false) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(archivo);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width; 
                let height = img.height;
                
                const MAX_WIDTH = esBanner ? 1920 : 1200;
                
                if (width > MAX_WIDTH) { 
                    height = Math.round((height * MAX_WIDTH) / width); 
                    width = MAX_WIDTH; 
                }
                
                canvas.width = width; 
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                const calidad = esBanner ? 0.95 : 0.7;
                
                canvas.toBlob((blob) => resolve(blob), 'image/jpeg', calidad);
            };
        };
    });
}

// ==========================================
// GESTIÓN DE VEHÍCULOS (CATÁLOGO COMPARTIDO)
// ==========================================
async function cargarMisAutos() {
    const contenedorAdmin = document.getElementById('grilla-admin');
    contenedorAdmin.innerHTML = '<p style="text-align: center; padding: 40px; color: #6B7280; font-size: 1.1rem; grid-column: 1/-1;">Cargando tu stock...</p>';

    const { data: vehiculos, error } = await clienteSupabase
        .from('vehiculos')
        .select('*')
        .order('fecha_carga', { ascending: true });

    if (error) { contenedorAdmin.innerHTML = '<p>Error al cargar el stock.</p>'; return; }
    if (vehiculos.length === 0) { contenedorAdmin.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">Aún no tenés vehículos publicados.</p>'; return; }

    contenedorAdmin.innerHTML = ''; 
    autosActuales = vehiculos; 

    const encabezadoLista = `
        <div class="encabezado-lista-admin">
            <div class="col-num">Nº</div>
            <div class="col-vehiculo">VEHÍCULO</div>
            <div class="col-precios">PRECIOS</div>
            <div class="col-dato">AÑO</div>
            <div class="col-dato">KM</div>
            <div class="col-dato">COMBUSTIBLE</div>
            <div class="col-dato">TRANSMISIÓN</div>
        </div>
    `;
    contenedorAdmin.innerHTML += encabezadoLista;

    vehiculos.forEach((auto, index) => {
        const numeroVehiculo = index + 1;
        let htmlPrecios = '';
        const simboloMoneda = auto.moneda === 'USD' ? 'U$S' : '$';

        if (auto.precio) {
            const precioF = new Intl.NumberFormat('es-AR').format(auto.precio);
            htmlPrecios += `
                <div style="font-size: 0.7rem; color: #6B7280; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">
                    Precio contado:<br>
                    <span style="color: #2563EB; font-size: 1.05rem;">${simboloMoneda} ${precioF}</span>
                </div>
            `;
        }

        if (auto.tiene_cuotas && auto.texto_cuotas) {
            if (auto.entrega) {
                const entregaF = new Intl.NumberFormat('es-AR').format(auto.entrega);
                htmlPrecios += `<div style="font-size: 0.85rem; color: #1F2937; margin-top: 4px; font-weight: 600;">Entrega: ${simboloMoneda} ${entregaF}</div>`;
            }
            htmlPrecios += `<div style="font-size: 0.95rem; color: #D97706; margin-top: 2px; font-weight: bold;">💳 ${auto.texto_cuotas}</div>`;
        }

        if (!auto.precio && !auto.tiene_cuotas) {
            htmlPrecios = `<div style="color: #6B7280; font-size: 1rem; font-weight: bold;">Consultar Precio</div>`;
        }

        const fotoPrincipal = auto.fotos && auto.fotos.length > 0 ? auto.fotos[0] : 'https://via.placeholder.com/400x220?text=Sin+Foto';
        const esReservado = auto.estado_publicacion === 'Reservado';
        const btnReservaColor = esReservado ? '#10B981' : '#F59E0B';
        const btnReservaTexto = esReservado ? '✅ Quitar Reserva' : '🔒 Marcar Reservado';
        
        const etiquetaOferta = auto.en_oferta ? '<span class="etiqueta-oferta-admin">Oportunidad</span>' : '';
        const etiquetaNovedad = auto.en_novedad ? '<span class="etiqueta-novedad-admin">Nov</span>' : '';

        const anioTexto = auto.anio || '-';
        const kmTexto = auto.kilometraje !== null && auto.kilometraje !== undefined && auto.kilometraje !== '' 
            ? new Intl.NumberFormat('es-AR').format(auto.kilometraje) 
            : '-';
        const combTexto = auto.combustible || '-';
        const transTexto = auto.transmision || '-';

        const tarjetaHTML = `
            <div class="tarjeta-auto" id="auto-${auto.id}">
                ${esReservado ? '<div class="etiqueta-reservado">RESERVADO</div>' : ''}
                <img src="${fotoPrincipal}" class="imagen-auto">
                
                <div class="detalles-auto">
                    <div class="numero-vehiculo-lista">
                        ${numeroVehiculo}
                    </div>

                    <div class="info-titulo-admin">
                        <h3 style="margin-bottom: 2px; margin-top: 0;">${auto.marca} ${auto.modelo}</h3>
                        <p class="version-lista-admin">${auto.version || ''}</p>
                        ${etiquetaOferta}
                        ${etiquetaNovedad}
                    </div>
                    
                    <div class="contenedor-precios-admin">
                        ${htmlPrecios}
                    </div>
                    
                    <div class="columna-dato-lista"><span>${anioTexto}</span></div>
                    <div class="columna-dato-lista"><span>${kmTexto}</span></div>
                    <div class="columna-dato-lista"><span>${combTexto}</span></div>
                    <div class="columna-dato-lista"><span>${transTexto}</span></div>

                    <div class="botones-accion-admin" style="display: flex; flex-direction: column; gap: 8px; margin-top: 15px; width: 100%;">
                        <button onclick="toggleReserva('${auto.id}', '${auto.estado_publicacion}')" style="background: ${btnReservaColor}; color: white; border: none; padding: 10px; border-radius: 8px; cursor: pointer; font-weight: bold;">
                            ${btnReservaTexto}
                        </button>
                        <button onclick="abrirModalEditar('${auto.id}')" style="background: #3B82F6; color: white; border: none; padding: 10px; border-radius: 8px; cursor: pointer; font-weight: bold;">
                            ✏️ Editar Vehículo
                        </button>
                        <button onclick="borrarAuto('${auto.id}')" style="background: #EF4444; color: white; border: none; padding: 10px; border-radius: 8px; cursor: pointer; font-weight: bold;">
                            🗑️ Borrar Vehículo
                        </button>
                    </div>
                </div>
            </div>
        `;
        contenedorAdmin.innerHTML += tarjetaHTML;
    });
}

window.borrarAuto = async function(idAuto) {
    if (confirm("¿Estás seguro de que querés eliminar este vehículo?")) {
        const { error } = await clienteSupabase.from('vehiculos').delete().eq('id', idAuto);
        if (error) {
            alert("Hubo un error al borrar: " + error.message);
        } else {
            cargarMisAutos();
        }
    }
};

window.toggleReserva = async function(idAuto, estadoActual) {
    const nuevoEstado = estadoActual === 'Disponible' ? 'Reservado' : 'Disponible';
    const { error } = await clienteSupabase.from('vehiculos').update({ estado_publicacion: nuevoEstado }).eq('id', idAuto);
    if (error) alert("Error al actualizar: " + error.message);
    else cargarMisAutos(); 
};

btnCerrarSesion.addEventListener('click', async () => {
    await clienteSupabase.auth.signOut();
    verificarSesion();
});

function limpiarModal() {
    formCargarAuto.reset();
    idOculto.value = '';
    tituloModal.textContent = 'Cargar Nuevo Vehículo';
    btnGuardarAuto.textContent = 'Guardar Vehículo';
    
    inputMarcaManual.style.display = 'none';
    inputMarcaManual.required = false; 
    
    contenedorCuotasInputs.style.display = 'none';
    checkCuotas.checked = false;
    document.getElementById('auto-cant-cuotas').required = false;
    document.getElementById('auto-monto-cuota').required = false;

    if (checkOferta) checkOferta.checked = false;
    if (checkNovedad) checkNovedad.checked = false;
    
    document.getElementById('contenedor-fotos-existentes').style.display = 'none';
    document.getElementById('galeria-edicion').innerHTML = '';
    previewNuevasFotos.innerHTML = ''; 
    fotosGuardadasEnEdicion = [];
    archivosNuevosSeleccionados = [];
    inputFoto.value = '';
}

btnNuevoAuto.addEventListener('click', () => {
    limpiarModal();
    modalNuevoAuto.style.display = 'flex';
    resetScrollModal(modalNuevoAuto);
});

btnCerrarModal.addEventListener('click', () => { 
    modalNuevoAuto.style.display = 'none'; 
    limpiarModal();
});

btnSeleccionarFotos.addEventListener('click', () => {
    inputFoto.click();
});

inputFoto.addEventListener('change', function() {
    const nuevosArchivos = Array.from(this.files);
    if (fotosGuardadasEnEdicion.length + archivosNuevosSeleccionados.length + nuevosArchivos.length > 10) {
        alert("Límite superado. El máximo total permitido es de 10 fotos.");
        this.value = '';
        return;
    }
    archivosNuevosSeleccionados.push(...nuevosArchivos);
    this.value = ''; 
    renderizarPreviewNuevas();
});

function renderizarPreviewNuevas() {
    previewNuevasFotos.innerHTML = '';
    archivosNuevosSeleccionados.forEach((archivo, index) => {
        const div = document.createElement('div');
        div.style.position = 'relative';
        div.style.width = '80px';
        div.style.height = '80px';
        
        const urlTemporal = URL.createObjectURL(archivo);
        const img = document.createElement('img');
        img.src = urlTemporal;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        img.style.border = '2px solid #3B82F6';
        
        const btnBorrar = document.createElement('button');
        btnBorrar.innerHTML = '❌';
        btnBorrar.style.position = 'absolute';
        btnBorrar.style.top = '-6px';
        btnBorrar.style.right = '-6px';
        btnBorrar.style.background = 'white';
        btnBorrar.style.border = 'none';
        btnBorrar.style.borderRadius = '50%';
        btnBorrar.style.cursor = 'pointer';
        btnBorrar.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        
        btnBorrar.onclick = (e) => {
            e.preventDefault();
            archivosNuevosSeleccionados.splice(index, 1);
            renderizarPreviewNuevas();
        };
        
        div.appendChild(img);
        div.appendChild(btnBorrar);
        previewNuevasFotos.appendChild(div);
    });
}

function renderizarFotosEdicion() {
    const galeria = document.getElementById('galeria-edicion');
    const contenedor = document.getElementById('contenedor-fotos-existentes');
    galeria.innerHTML = '';

    if (fotosGuardadasEnEdicion.length === 0) {
        contenedor.style.display = 'none';
        return;
    }

    contenedor.style.display = 'block';
    fotosGuardadasEnEdicion.forEach((urlFoto, index) => {
        const div = document.createElement('div');
        div.style.position = 'relative';
        div.style.width = '100px';
        div.style.height = '80px';
        
        const img = document.createElement('img');
        img.src = urlFoto;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        img.style.border = '1px solid #D1D5DB';
        
        const btnBorrar = document.createElement('button');
        btnBorrar.innerHTML = '❌';
        btnBorrar.style.position = 'absolute';
        btnBorrar.style.top = '-6px';
        btnBorrar.style.right = '-6px';
        btnBorrar.style.background = 'white';
        btnBorrar.style.border = 'none';
        btnBorrar.style.borderRadius = '50%';
        btnBorrar.style.cursor = 'pointer';
        btnBorrar.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        
        btnBorrar.onclick = (e) => {
            e.preventDefault(); 
            fotosGuardadasEnEdicion.splice(index, 1); 
            renderizarFotosEdicion(); 
        };
        
        div.appendChild(img);
        div.appendChild(btnBorrar);
        galeria.appendChild(div);
    });
}

window.abrirModalEditar = function(idAuto) {
    const auto = autosActuales.find(a => a.id === idAuto);
    if (!auto) return;

    limpiarModal();
    
    tituloModal.textContent = 'Editar Vehículo';
    btnGuardarAuto.textContent = 'Guardar Cambios';
    idOculto.value = auto.id;

    document.getElementById('auto-modelo').value = auto.modelo;
    document.getElementById('auto-version').value = auto.version;
    document.getElementById('auto-anio').value = auto.anio || '';
    document.getElementById('auto-moneda').value = auto.moneda;
    document.getElementById('auto-precio').value = auto.precio || '';
    document.getElementById('auto-km').value = auto.kilometraje === null ? '' : auto.kilometraje;
    document.getElementById('auto-combustible').value = auto.combustible || 'Nafta';
    document.getElementById('auto-transmision').value = auto.transmision;
    document.getElementById('auto-descripcion').value = auto.descripcion || '';
    
    if (checkOferta) checkOferta.checked = auto.en_oferta || false;
    if (checkNovedad) checkNovedad.checked = auto.en_novedad || false;
    
    if (auto.tiene_cuotas) {
        checkCuotas.checked = true;
        contenedorCuotasInputs.style.display = 'grid';
        document.getElementById('auto-entrega').value = auto.entrega || '';
        document.getElementById('auto-cant-cuotas').value = auto.cant_cuotas || '';
        document.getElementById('auto-cant-cuotas').required = true;
        document.getElementById('auto-monto-cuota').value = auto.monto_cuota || '';
        document.getElementById('auto-monto-cuota').required = true;
    }

    const opcionesMarca = Array.from(selectMarca.options).map(opt => opt.value);
    if (opcionesMarca.includes(auto.marca)) {
        selectMarca.value = auto.marca;
    } else {
        selectMarca.value = 'Otra';
        inputMarcaManual.style.display = 'block';
        inputMarcaManual.required = true;
        inputMarcaManual.value = auto.marca;
    }

    if (auto.fotos && auto.fotos.length > 0) {
        fotosGuardadasEnEdicion = [...auto.fotos];
        renderizarFotosEdicion();
    }
    
    modalNuevoAuto.style.display = 'flex';
    resetScrollModal(modalNuevoAuto);
};

formCargarAuto.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const idAutoEditando = idOculto.value;
    const esEdicion = idAutoEditando !== '';
    
    if (fotosGuardadasEnEdicion.length === 0 && archivosNuevosSeleccionados.length === 0) {
        alert("Por favor, subí al menos una foto del vehículo.");
        return;
    }

    btnGuardarAuto.style.display = 'none';
    msjCarga.style.display = 'block';
    
    try {
        let urlsFotosSubidas = [];

        if (archivosNuevosSeleccionados.length > 0) {
            for (let i = 0; i < archivosNuevosSeleccionados.length; i++) {
                const archivoComprimido = await comprimirImagen(archivosNuevosSeleccionados[i]);
                const nombreFoto = `${Date.now()}_${agenciaIdActual}_${i}.jpg`;
                
                const { error: errorFoto } = await clienteSupabase.storage.from('fotos_vehiculos').upload(nombreFoto, archivoComprimido);
                if (errorFoto) throw errorFoto;
                
                const { data: linkPublico } = clienteSupabase.storage.from('fotos_vehiculos').getPublicUrl(nombreFoto);
                urlsFotosSubidas.push(linkPublico.publicUrl);
            }
        }

        let marcaFinal = selectMarca.value;
        if (marcaFinal === 'Otra') marcaFinal = inputMarcaManual.value;

        const anioInput = document.getElementById('auto-anio').value.trim();
        const anioFinal = anioInput !== '' ? parseInt(anioInput) : null;

        const precioInput = document.getElementById('auto-precio').value.trim();
        const precioFinal = precioInput !== '' ? parseFloat(precioInput) : null;
        
        const kmInput = document.getElementById('auto-km').value.trim();
        const kmFinal = kmInput !== '' ? parseInt(kmInput) : null;

        const esEnCuotas = checkCuotas.checked;
        let textoCuotasFinal = null;
        let cantCuotasVal = null;
        let montoCuotaVal = null;
        let entregaVal = null;

        if (esEnCuotas) {
            const entregaInput = document.getElementById('auto-entrega').value.trim();
            entregaVal = entregaInput !== '' ? parseFloat(entregaInput) : null;

            const cantInput = document.getElementById('auto-cant-cuotas').value.trim();
            cantCuotasVal = cantInput !== '' ? parseInt(cantInput) : null;

            const montoInput = document.getElementById('auto-monto-cuota').value.trim();
            montoCuotaVal = montoInput !== '' ? parseFloat(montoInput) : null;
            
            if (cantCuotasVal && montoCuotaVal) {
                const montoFormateado = new Intl.NumberFormat('es-AR').format(montoCuotaVal);
                textoCuotasFinal = `${cantCuotasVal} cuotas fijas de $${montoFormateado}`;
            }
        }

        const datosAuto = {
            marca: marcaFinal,
            modelo: document.getElementById('auto-modelo').value,
            version: document.getElementById('auto-version').value,
            anio: anioFinal,
            kilometraje: kmFinal,
            moneda: document.getElementById('auto-moneda').value,
            precio: precioFinal,
            combustible: document.getElementById('auto-combustible').value,
            transmision: document.getElementById('auto-transmision').value,
            descripcion: document.getElementById('auto-descripcion').value,
            tiene_cuotas: esEnCuotas,
            entrega: entregaVal,
            cant_cuotas: cantCuotasVal,
            monto_cuota: montoCuotaVal,
            texto_cuotas: textoCuotasFinal,
            en_oferta: checkOferta ? checkOferta.checked : false,
            en_novedad: checkNovedad ? checkNovedad.checked : false,
            fotos: [...fotosGuardadasEnEdicion, ...urlsFotosSubidas]
        };

        let errorDB;

        if (esEdicion) {
            const result = await clienteSupabase.from('vehiculos').update(datosAuto).eq('id', idAutoEditando);
            errorDB = result.error;
        } else {
            datosAuto.agencia_id = agenciaIdActual;
            datosAuto.tipo_vehiculo = 'Auto';
            datosAuto.estado_publicacion = 'Disponible';
            
            const result = await clienteSupabase.from('vehiculos').insert([datosAuto]);
            errorDB = result.error;
        }
            
        if (errorDB) throw errorDB;
        
        modalNuevoAuto.style.display = 'none';
        limpiarModal();
        cargarMisAutos();
        alert(esEdicion ? "¡Cambios guardados con éxito!" : "¡Vehículo cargado con éxito!");
        
    } catch (error) {
        console.error("Error al guardar:", error);
        alert("Hubo un problema: " + error.message);
    } finally {
        btnGuardarAuto.style.display = 'block';
        msjCarga.style.display = 'none';
    }
});

document.addEventListener('DOMContentLoaded', verificarSesion);