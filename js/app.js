// js/app.js

let autosGlobal = [];
let slideActual = 0;
let totalSlides = 0;
let intervaloCarrusel = null;
let filtroEstadoActual = 'todos';

async function cargarBanners() {
    try {
        if (typeof clienteSupabase === 'undefined') return;
        const { data: banners, error } = await clienteSupabase
            .from('banners')
            .select('*')
            .order('orden', { ascending: true });

        if (error) throw error;
        if (banners && banners.length > 0) iniciarCarrusel(banners);
    } catch (e) {
        console.error("Error al cargar banners:", e);
    }
}

function iniciarCarrusel(banners) {
    const contenedor = document.getElementById('carrusel-contenedor');
    const slidesDiv = document.getElementById('carrusel-slides');
    const indicadoresDiv = document.getElementById('carrusel-indicadores');
    if (!contenedor || !slidesDiv || !indicadoresDiv) return;

    const btnPrev = contenedor.querySelector('.btn-prev');
    const btnNext = contenedor.querySelector('.btn-next');

    slidesDiv.innerHTML = '';
    indicadoresDiv.innerHTML = '';
    totalSlides = banners.length;
    slideActual = 0;

    banners.forEach((b, index) => {
        const slide = document.createElement('div');
        slide.className = 'slide';
        slide.innerHTML = `<img src="${b.url_imagen}" alt="Banner ${index + 1}">`;
        slidesDiv.appendChild(slide);

        if (totalSlides > 1) {
            const dot = document.createElement('div');
            dot.className = `indicador ${index === 0 ? 'activo' : ''}`;
            dot.onclick = () => irASlide(index);
            indicadoresDiv.appendChild(dot);
        }
    });

    if (totalSlides <= 1) {
        if (btnPrev) btnPrev.style.display = 'none';
        if (btnNext) btnNext.style.display = 'none';
        indicadoresDiv.style.display = 'none';
    } else {
        if (btnPrev) btnPrev.style.display = 'block';
        if (btnNext) btnNext.style.display = 'block';
        indicadoresDiv.style.display = 'flex';
    }

    contenedor.style.display = 'block';
    actualizarCarrusel();

    clearInterval(intervaloCarrusel);
    if (totalSlides > 1) {
        intervaloCarrusel = setInterval(() => moverCarrusel(1), 5000);
        contenedor.onmouseenter = () => clearInterval(intervaloCarrusel);
        contenedor.onmouseleave = () => {
            clearInterval(intervaloCarrusel);
            intervaloCarrusel = setInterval(() => moverCarrusel(1), 5000);
        };
    }
}

window.moverCarrusel = function(direccion) {
    if (totalSlides <= 1) return;
    slideActual = (slideActual + direccion + totalSlides) % totalSlides;
    actualizarCarrusel();
};

window.irASlide = function(index) {
    slideActual = index;
    actualizarCarrusel();
};

function actualizarCarrusel() {
    const slidesDiv = document.getElementById('carrusel-slides');
    if (slidesDiv) slidesDiv.style.transform = `translateX(-${slideActual * 100}%)`;

    const puntos = document.querySelectorAll('.indicador');
    puntos.forEach((p, idx) => {
        p.classList.toggle('activo', idx === slideActual);
    });
}

// ----------------------------------------------------
// CARGA Y RENDERIZADO DE VEHÍCULOS
// ----------------------------------------------------
async function cargarVehiculos() {
    const contenedor = document.getElementById('grilla-vehiculos');
    const tituloAgencia = document.getElementById('marca-agencia');
    
    if (tituloAgencia) tituloAgencia.textContent = "Todo Camionetas";
    
    try {
        if (typeof clienteSupabase === 'undefined') throw new Error("Supabase no está conectado.");
        
        const { data: vehiculos, error } = await clienteSupabase
            .from('vehiculos')
            .select('*')
            .order('fecha_carga', { ascending: false });
            
        if (error) throw error;
        
        autosGlobal = vehiculos || [];
        generarFiltroMarcas(autosGlobal);
        renderizarVehiculos(autosGlobal);
        
    } catch (error) {
        console.error("Error de conexión:", error);
        if (contenedor) {
            contenedor.innerHTML = '<p style="text-align:center; grid-column: 1 / -1; padding: 40px;">Hubo un error al cargar el inventario. Verificá la conexión.</p>';
        }
    }
}

function generarFiltroMarcas(vehiculos) {
    const selectMarca = document.getElementById('filtro-marca');
    if (!selectMarca) return;
    
    const marcasUnicas = [...new Set(vehiculos.map(auto => auto.marca))].filter(Boolean).sort();
    
    selectMarca.innerHTML = '<option value="">Todas las marcas</option>';
    marcasUnicas.forEach(marca => {
        selectMarca.innerHTML += `<option value="${marca}">${marca}</option>`;
    });
}

function crearTarjetaAuto(auto, tipoTarjeta = 'normal') {
    const simboloMoneda = auto.moneda === 'USD' ? 'U$S' : '$';
    let htmlPrecios = '';

    const tienePrecioContado = auto.precio !== null && auto.precio !== undefined;
    const tieneCuotas = auto.tiene_cuotas && auto.texto_cuotas;

    if (tienePrecioContado && tieneCuotas) {
        const precioF = new Intl.NumberFormat('es-AR').format(auto.precio);
        if (auto.entrega) {
            const entregaF = new Intl.NumberFormat('es-AR').format(auto.entrega);
            htmlPrecios = `
                <div style="text-align: center; margin-bottom: 2px;">
                    <div class="txt-rojo" style="font-size: 1.25rem; font-weight: bold; line-height: 1;">${simboloMoneda} ${precioF}</div>
                    <div class="txt-rojo" style="font-size: 0.65rem; font-weight: bold; text-transform: uppercase;">PRECIO CONTADO</div>
                </div>
                <div class="txt-negro" style="text-align: center; font-size: 0.8rem; line-height: 1.2; margin-top: 0; font-weight: 500;">
                    <div>o financiando con entrega de:</div>
                    <div style="font-weight: bold; font-size: 0.95rem;">${simboloMoneda} ${entregaF}</div>
                    <div>y ${auto.texto_cuotas}</div>
                </div>
            `;
        } else {
            htmlPrecios = `
                <div style="text-align: center; margin-bottom: 2px;">
                    <div class="txt-rojo" style="font-size: 1.25rem; font-weight: bold; line-height: 1;">${simboloMoneda} ${precioF}</div>
                    <div class="txt-rojo" style="font-size: 0.65rem; font-weight: bold; text-transform: uppercase;">PRECIO CONTADO</div>
                </div>
                <div class="txt-negro" style="text-align: center; font-size: 0.8rem; line-height: 1.2; margin-top: 0; font-weight: 500;">
                    <div>o financiando con</div>
                    <div style="font-weight: bold;">${auto.texto_cuotas}</div>
                </div>
            `;
        }
    } else if (tienePrecioContado) {
        const precioF = new Intl.NumberFormat('es-AR').format(auto.precio);
        htmlPrecios = `
            <div style="text-align: center;">
                <div class="txt-rojo" style="font-size: 1.6rem; font-weight: bold; line-height: 1;">${simboloMoneda} ${precioF}</div>
                <div class="txt-rojo" style="font-size: 0.8rem; font-weight: bold; text-transform: uppercase; margin-top: 2px;">PRECIO CONTADO</div>
            </div>
        `;
    } else if (tieneCuotas) {
        if (auto.entrega) {
            const entregaF = new Intl.NumberFormat('es-AR').format(auto.entrega);
            htmlPrecios = `
                <div class="txt-negro" style="text-align: center;">
                    <div style="font-size: 1rem; margin-bottom: 2px; font-weight: 500;">Entrega de:</div>
                    <div style="font-size: 1.6rem; font-weight: bold; line-height: 1;">${simboloMoneda} ${entregaF}</div>
                    <div style="font-size: 1rem; font-weight: 500; margin-top: 4px;">y ${auto.texto_cuotas}</div>
                </div>
            `;
        } else {
            htmlPrecios = `
                <div class="txt-negro" style="text-align: center; font-size: 1.2rem; font-weight: bold;">
                    ${auto.texto_cuotas}
                </div>
            `;
        }
    } else {
        htmlPrecios = `
            <div class="txt-negro" style="text-align: center; font-size: 1.3rem; font-weight: bold;">
                Consultar Precio
            </div>
        `;
    }
    
    const fotoPrincipal = (auto.fotos && auto.fotos.length > 0) ? auto.fotos[0] : 'https://via.placeholder.com/400x220?text=Sin+Foto';
    const etiquetaReservado = auto.estado_publicacion === 'Reservado' ? '<div class="etiqueta-reservado">RESERVADO</div>' : '';
    
    const marcaSegura = auto.marca || '';
    const modeloSeguro = auto.modelo || '';
    const versionSegura = auto.version || '';
    
    let specsArr = [];
    if (auto.anio) specsArr.push(auto.anio);
    
    if (auto.kilometraje !== null && auto.kilometraje !== undefined && auto.kilometraje !== '') {
        specsArr.push(new Intl.NumberFormat('es-AR').format(auto.kilometraje) + ' km');
    } else {
        specsArr.push('-');
    }
    
    specsArr.push(auto.combustible || 'Nafta'); 
    
    if (auto.transmision) specsArr.push(auto.transmision);
    
    const specsHTML = specsArr.join(' <span style="color: #9CA3AF; margin: 0 4px;">|</span> ');

    const esDestacado = (tipoTarjeta === 'oportunidad' || tipoTarjeta === 'novedad');
    let bloqueTitulo = '';

    if (tipoTarjeta === 'oportunidad') {
        bloqueTitulo = `
            <div class="encabezado-oferta">
                <h3>${marcaSegura} ${modeloSeguro}</h3>
                <div class="version-auto">${versionSegura}</div>
            </div>
        `;
    } else if (tipoTarjeta === 'novedad') {
        bloqueTitulo = `
            <div class="encabezado-novedad">
                <h3>${marcaSegura} ${modeloSeguro}</h3>
                <div class="version-auto">${versionSegura}</div>
            </div>
        `;
    } else {
        bloqueTitulo = `
            <h3 class="txt-negro" style="text-align: center; margin: 0; font-size: 1.3rem; line-height: 1.2;">${marcaSegura} ${modeloSeguro}</h3>
            <div style="text-align: center; margin: 0; font-size: 0.95rem; color: #6B7280; font-weight: 500; line-height: 1.2; margin-top: 4px;">${versionSegura}</div>
        `;
    }

    const paddingExtra = esDestacado ? 'padding: 10px 15px 15px 15px;' : 'padding: 15px;';
    const estiloSpecs = esDestacado 
        ? "font-weight: bold; color: #4B5563; margin: 0 0 12px 0; padding-top: 0; border-top: none; display: flex; justify-content: center; align-items: center; font-size: 0.8rem; flex-wrap: wrap;"
        : "font-weight: bold; color: #4B5563; margin: 2px 0 10px 0; display: flex; justify-content: center; align-items: center; font-size: 0.8rem; flex-wrap: wrap;";

    return `
        <div class="tarjeta-auto" id="auto-${auto.id}" onclick="window.location.href='detalle.html?id=${auto.id}'" style="display: flex; flex-direction: column; height: 100%; cursor: pointer; overflow: hidden;">
            ${etiquetaReservado}
            <img src="${fotoPrincipal}" alt="${marcaSegura} ${modeloSeguro}" class="imagen-auto" style="flex-shrink: 0; height: 190px;">
            
            ${esDestacado ? bloqueTitulo : ''}

            <div class="detalles-auto" style="display: flex; flex-direction: column; flex-grow: 1; ${paddingExtra}">
                
                ${!esDestacado ? bloqueTitulo : ''}
                
                <div class="especificaciones" style="${estiloSpecs}">
                    ${specsHTML}
                </div>
                
                <div style="flex-grow: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                    ${htmlPrecios}
                </div>
                
            </div>
        </div>
    `;
}

function renderizarVehiculos(vehiculosAMostrar) {
    const contenedorNormal = document.getElementById('grilla-vehiculos');
    const contenedorOfertas = document.getElementById('grilla-ofertas');
    const seccionOfertas = document.getElementById('seccion-ofertas');
    const contenedorNovedades = document.getElementById('grilla-novedades');
    const seccionNovedades = document.getElementById('seccion-novedades');
    
    if (!contenedorNormal) return;
    
    contenedorNormal.innerHTML = ''; 
    if (contenedorOfertas) contenedorOfertas.innerHTML = '';
    if (contenedorNovedades) contenedorNovedades.innerHTML = '';
    
    if (!vehiculosAMostrar || vehiculosAMostrar.length === 0) {
        contenedorNormal.innerHTML = '<p style="text-align:center; grid-column: 1 / -1; padding: 40px; font-size: 1.1rem; color: #6B7280;">No se encontraron vehículos que coincidan con tu búsqueda.</p>';
        if (seccionOfertas) seccionOfertas.style.display = 'none';
        if (seccionNovedades) seccionNovedades.style.display = 'none';
        return;
    }
    
    const autosEnOferta = vehiculosAMostrar.filter(auto => auto.en_oferta);
    const autosEnNovedad = vehiculosAMostrar.filter(auto => auto.en_novedad);
    const autosNormales = vehiculosAMostrar.filter(auto => !auto.en_oferta && !auto.en_novedad);

    if (autosEnOferta.length > 0 && seccionOfertas && contenedorOfertas) {
        seccionOfertas.style.display = 'block';
        autosEnOferta.forEach(auto => {
            contenedorOfertas.innerHTML += crearTarjetaAuto(auto, 'oportunidad');
        });
    } else if (seccionOfertas) {
        seccionOfertas.style.display = 'none';
    }

    if (autosEnNovedad.length > 0 && seccionNovedades && contenedorNovedades) {
        seccionNovedades.style.display = 'block';
        autosEnNovedad.forEach(auto => {
            contenedorNovedades.innerHTML += crearTarjetaAuto(auto, 'novedad');
        });
    } else if (seccionNovedades) {
        seccionNovedades.style.display = 'none';
    }

    if (autosNormales.length > 0) {
        autosNormales.forEach(auto => {
            contenedorNormal.innerHTML += crearTarjetaAuto(auto, 'normal');
        });
    } else {
        contenedorNormal.innerHTML = '<p style="text-align:center; grid-column: 1 / -1; padding: 40px; color: #6B7280;">Todos los vehículos filtrados se encuentran destacados en las secciones superiores.</p>';
    }
}

function filtrarResultados() {
    const inputBuscador = document.getElementById('buscador-texto');
    const selectMarca = document.getElementById('filtro-marca');
    if (!inputBuscador || !selectMarca) return;

    const textoBuscado = inputBuscador.value.toLowerCase();
    const marcaSeleccionada = selectMarca.value;

    const autosFiltrados = autosGlobal.filter(auto => {
        const modeloSeguro = auto.modelo || '';
        const versionSegura = auto.version || '';
        
        const coincideTexto = (modeloSeguro + " " + versionSegura).toLowerCase().includes(textoBuscado);
        const coincideMarca = marcaSeleccionada === "" || auto.marca === marcaSeleccionada;
        
        let coincideEstado = true;
        if (filtroEstadoActual === '0km') {
            coincideEstado = auto.kilometraje === 0;
        } else if (filtroEstadoActual === 'usados') {
            coincideEstado = auto.kilometraje !== 0; 
        }

        return coincideTexto && coincideMarca && coincideEstado;
    });

    renderizarVehiculos(autosFiltrados);
}

window.filtrarPorEstado = function(estado) {
    filtroEstadoActual = estado;
    
    const tituloFiltro = document.getElementById('titulo-filtro');
    if (tituloFiltro) {
        if (estado === '0km') tituloFiltro.textContent = "Vehículos 0 km";
        else if (estado === 'usados') tituloFiltro.textContent = "Vehículos Usados";
        else tituloFiltro.textContent = "Catálogo Completo";
    }

    filtrarResultados();

    const seccionInventario = document.getElementById('seccion-inventario');
    if (seccionInventario) {
        seccionInventario.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

// ----------------------------------------------------
// CARGA DE ENTREGAS (CLIENTES) - SOLO PARA PÁGINA INICIO SI APLICA
// ----------------------------------------------------
async function cargarEntregas() {
    const contenedorEntregas = document.getElementById('grilla-entregas');
    const seccionEntregas = document.getElementById('seccion-entregas');
    if (!contenedorEntregas || !seccionEntregas) return;

    try {
        const { data: entregas, error } = await clienteSupabase
            .from('entregas')
            .select('*')
            .order('id', { ascending: false });
        
        if (error) throw error;

        if (!entregas || entregas.length === 0) {
            seccionEntregas.style.display = 'none';
            return;
        }

        seccionEntregas.style.display = 'block';
        contenedorEntregas.innerHTML = '';

        entregas.forEach(entrega => {
            let fechaTexto = '';
            if (entrega.fecha) {
                const partes = entrega.fecha.split('-');
                if(partes.length === 3) {
                    fechaTexto = `${partes[2]}/${partes[1]}/${partes[0]}`;
                }
            }

            const tarjetaHTML = `
                <div class="tarjeta-entrega">
                    <img src="${entrega.url_imagen || 'https://via.placeholder.com/400x250?text=Entrega'}" alt="${entrega.titulo}">
                    <div class="tarjeta-entrega-info">
                        <h3 class="txt-negro">${entrega.titulo}</h3>
                        ${fechaTexto ? `<div class="fecha">📅 ${fechaTexto}</div>` : ''}
                        <p class="desc">${entrega.descripcion || ''}</p>
                    </div>
                </div>
            `;
            contenedorEntregas.innerHTML += tarjetaHTML;
        });
    } catch (error) {
        console.error("Error al cargar entregas:", error);
    }
}

async function inicializarApp() {
    try {
        const { data: config, error } = await clienteSupabase
            .from('configuracion')
            .select('sitio_activo')
            .limit(1)
            .single();
            
        if (config && config.sitio_activo === false) {
            document.body.innerHTML = `
                <div style="display: flex; height: 100vh; flex-direction: column; justify-content: center; align-items: center; background: #F3F4F6; text-align: center; font-family: 'Poppins', sans-serif; padding: 20px;">
                    <div style="background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); max-width: 500px;">
                        <span style="font-size: 4rem;">⚙️</span>
                        <h1 class="txt-negro" style="margin: 15px 0; font-size: 2rem;">Sitio en Mantenimiento</h1>
                        <p style="color: #4B5563; font-size: 1.1rem; margin-bottom: 0;">Estamos realizando tareas de actualización en la plataforma. Por favor, volvé a ingresar a la brevedad.</p>
                    </div>
                </div>
            `;
            return;
        }
    } catch (e) {
        console.error("Error verificando estado del sitio:", e);
    }

    const inputBuscador = document.getElementById('buscador-texto');
    const selectMarca = document.getElementById('filtro-marca');
    
    if (inputBuscador) inputBuscador.addEventListener('input', filtrarResultados);
    if (selectMarca) selectMarca.addEventListener('change', filtrarResultados);

    cargarBanners();
    cargarVehiculos();
    cargarEntregas(); 
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarApp);
} else {
    inicializarApp();
}

// ----------------------------------------------------
// LÓGICA DE COMPARTIR VEHÍCULO (PARA DETALLE.HTML)
// ----------------------------------------------------
window.abrirModalCompartirAuto = function(titulo, id) {
    const urlCompartir = `${window.location.origin}/detalle.html?id=${id}`;
    const textoCompartir = `¡Mirá este ${titulo} en Todo Camionetas! 🚘🔥`;

    const btnWpp = document.getElementById('btn-share-auto-wpp');
    if (btnWpp) btnWpp.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoCompartir + '\n\n' + urlCompartir)}`;

    const btnFb = document.getElementById('btn-share-auto-fb');
    if (btnFb) btnFb.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(urlCompartir)}`;

    const btnCopy = document.getElementById('btn-copy-auto-link');
    const msjCopiado = document.getElementById('msj-auto-copiado');
    if (msjCopiado) msjCopiado.style.display = 'none';

    if (btnCopy) {
        btnCopy.onclick = async function() {
            try {
                await navigator.clipboard.writeText(`${textoCompartir}\n${urlCompartir}`);
                if (msjCopiado) msjCopiado.style.display = 'block';
            } catch (err) {
                alert(`Copiá este enlace manualmente:\n\n${urlCompartir}`);
            }
        };
    }

    const modal = document.getElementById('modal-compartir-auto');
    if (modal) modal.style.display = 'flex';
};