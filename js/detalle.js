// js/detalle.js

let fotosVehiculo = [];
let indiceFotoActual = 0;

async function cargarDetalleVehiculo() {
    const contenedor = document.getElementById('detalle-contenedor');
    if (!contenedor) return;

    // Obtenemos el ID del auto desde la URL
    const params = new URLSearchParams(window.location.search);
    const idAuto = params.get('id');

    if (!idAuto) {
        contenedor.innerHTML = '<p style="text-align:center; padding: 40px;">No se especificó ningún vehículo. <a href="index.html">Volver al inicio</a></p>';
        return;
    }

    try {
        if (typeof clienteSupabase === 'undefined') throw new Error("Supabase no conectado");

        const { data: auto, error } = await clienteSupabase
            .from('vehiculos')
            .select('*')
            .eq('id', idAuto)
            .single();

        if (error || !auto) throw error;

        document.title = `${auto.marca} ${auto.modelo} | Ernesto Gutierrez`;
        renderizarDetalle(auto);

    } catch (error) {
        console.error("Error al cargar el detalle:", error);
        contenedor.innerHTML = '<p style="text-align:center; padding: 40px;">Hubo un error al cargar el vehículo o ya no se encuentra disponible. <a href="index.html">Volver al catálogo</a></p>';
    }
}

function renderizarDetalle(auto) {
    const contenedor = document.getElementById('detalle-contenedor');
    const simboloMoneda = auto.moneda === 'USD' ? 'U$S' : '$';
    
    // Galería de fotos
    fotosVehiculo = (auto.fotos && auto.fotos.length > 0) 
        ? auto.fotos 
        : ['https://via.placeholder.com/800x500?text=Sin+Foto'];
    
    indiceFotoActual = 0;

    let miniaturasHTML = '';
    let flechasHTML = '';

    if (fotosVehiculo.length > 1) {
        flechasHTML = `
            <button class="detalle-flecha flecha-izq" onclick="moverFotoDetalle(-1)" aria-label="Foto anterior">&#10094;</button>
            <button class="detalle-flecha flecha-der" onclick="moverFotoDetalle(1)" aria-label="Siguiente foto">&#10095;</button>
        `;

        miniaturasHTML = `<div class="galeria-miniaturas">`;
        fotosVehiculo.forEach((foto, idx) => {
            miniaturasHTML += `
                <img src="${foto}" alt="Miniatura ${idx + 1}" 
                     class="miniatura-img ${idx === 0 ? 'activa' : ''}" 
                     onclick="cambiarFotoPrincipal(${idx})" id="thumb-${idx}">
            `;
        });
        miniaturasHTML += `</div>`;
    }

    // Precios y financiación
    let htmlPrecios = '';
    const tienePrecioContado = auto.precio !== null && auto.precio !== undefined;
    const tieneCuotas = auto.tiene_cuotas && auto.texto_cuotas;

    if (tienePrecioContado && tieneCuotas) {
        const precioF = new Intl.NumberFormat('es-AR').format(auto.precio);
        const entregaHTML = auto.entrega 
            ? `con entrega de <strong>${simboloMoneda} ${new Intl.NumberFormat('es-AR').format(auto.entrega)}</strong> y ` 
            : `con `;
        
        htmlPrecios = `
            <div class="caja-precio-detalle">
                <div class="etiqueta-contado-detalle">PRECIO CONTADO</div>
                <div class="numero-precio-detalle">${simboloMoneda} ${precioF}</div>
                <div class="divisor-precio"></div>
                <div class="caja-financiacion-detalle">
                    🔥 Financiación disponible ${entregaHTML}<strong>${auto.texto_cuotas}</strong>
                </div>
            </div>
        `;
    } else if (tienePrecioContado) {
        const precioF = new Intl.NumberFormat('es-AR').format(auto.precio);
        htmlPrecios = `
            <div class="caja-precio-detalle">
                <div class="etiqueta-contado-detalle">PRECIO CONTADO</div>
                <div class="numero-precio-detalle">${simboloMoneda} ${precioF}</div>
            </div>
        `;
    } else if (tieneCuotas) {
        const entregaHTML = auto.entrega 
            ? `<div style="font-size: 0.9rem;">Entrega de:</div><div style="font-size: 1.8rem; font-weight: 700;">${simboloMoneda} ${new Intl.NumberFormat('es-AR').format(auto.entrega)}</div>` 
            : '';
        htmlPrecios = `
            <div class="caja-precio-detalle" style="background-color: #FFFBEB; border-color: #FDE68A;">
                <div style="color: #D97706;">
                    ${entregaHTML}
                    <div style="font-size: 1.1rem; font-weight: 600; margin-top: 5px;">${auto.texto_cuotas}</div>
                </div>
            </div>
        `;
    } else {
        htmlPrecios = `
            <div class="caja-precio-detalle">
                <div class="numero-precio-detalle" style="font-size: 1.6rem; color: #4B5563;">Consultar Precio</div>
            </div>
        `;
    }

    const kmTexto = (auto.kilometraje !== null && auto.kilometraje !== undefined && auto.kilometraje !== '') 
        ? new Intl.NumberFormat('es-AR').format(auto.kilometraje) + ' km' 
        : '-';

    const badgeReservado = auto.estado_publicacion === 'Reservado' 
        ? '<span class="badge-reservado-detalle">RESERVADO</span>' 
        : '<span class="badge-disponible-detalle">DISPONIBLE</span>';

    // CREAMOS EL TEXTO DESTACADO PARA EL TÍTULO
    let textoDestacadoHTML = '';
    if (auto.en_oferta) {
        textoDestacadoHTML = '<span style="color: #cc5c00; font-weight: 800; font-size: 1.6rem; letter-spacing: -0.5px;">OPORTUNIDAD</span>';
    } else if (auto.en_novedad) {
        textoDestacadoHTML = '<span style="color: #65A30D; font-weight: 800; font-size: 1.6rem; letter-spacing: -0.5px;">NOVEDAD</span>';
    }

    const textoPlano = `Hola Ernesto Gutierrez! Estoy interesado en el ${auto.marca} ${auto.modelo} ${auto.version || ''} (${auto.anio || ''}) que vi en el catálogo web.`;
    const mensajeCodificado = encodeURIComponent(textoPlano);
    
    const linkWhatsapp = `https://wa.me/5491100000000?text=${mensajeCodificado}`;
    const linkFacebook = `https://m.me/ernestogutierrez?text=${mensajeCodificado}`;
    const linkInstagram = `https://ig.me/m/ernestogutierrez`;

    const descripcionHTML = auto.descripcion 
        ? `<div class="descripcion-auto-detalle">
               <h4>Descripción y equipamiento</h4>
               <p>${auto.descripcion}</p>
           </div>` 
        : '';

    contenedor.innerHTML = `
        <div class="detalle-card">
            <!-- COLUMNA IZQUIERDA: FOTOS -->
            <div class="detalle-galeria">
                <div class="foto-principal-contenedor">
                    ${flechasHTML}
                    <img id="foto-principal-vista" src="${fotosVehiculo[0]}" alt="${auto.marca} ${auto.modelo}">
                </div>
                ${miniaturasHTML}
            </div>

            <!-- COLUMNA DERECHA: INFORMACIÓN Y COMPRA -->
            <div class="detalle-info">
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
                    <div>${badgeReservado}</div>
                    
                    <!-- BOTONES DE COMPARTIR Y VOLVER ALINEADOS -->
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <button onclick="abrirModalCompartir('${auto.marca || ''}', '${auto.modelo || ''}')" style="background: #F8FAFC; color: #1E293B; border: 1px solid #CBD5E1; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.9rem; display: flex; align-items: center; gap: 6px; transition: all 0.2s; font-family: 'Poppins', sans-serif;" onmouseover="this.style.background='#EFF6FF'; this.style.color='#002DCC'; this.style.borderColor='#BFDBFE';" onmouseout="this.style.background='#F8FAFC'; this.style.color='#1E293B'; this.style.borderColor='#CBD5E1';">
                            📤 Compartir
                        </button>
                        <a href="index.html" class="btn-volver-sobrio">&#8592; Volver</a>
                    </div>
                </div>

                <!-- TÍTULO Y TEXTO DESTACADO JUNTOS -->
                <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap; margin: 8px 0 4px 0;">
                    <h1 class="titulo-auto-detalle" style="margin: 0;">${auto.marca || ''} ${auto.modelo || ''}</h1>
                    ${textoDestacadoHTML}
                </div>
                
                <p class="version-auto-detalle">${auto.version || ''}</p>

                ${htmlPrecios}

                <div class="ficha-tecnica-grid">
                    <div class="ficha-item">
                        <span class="ficha-label">Año</span>
                        <span class="ficha-valor">${auto.anio || 'Consultar'}</span>
                    </div>
                    <div class="ficha-item">
                        <span class="ficha-label">Kilometraje</span>
                        <span class="ficha-valor">${kmTexto}</span>
                    </div>
                    <div class="ficha-item">
                        <span class="ficha-label">Combustible</span>
                        <span class="ficha-valor">${auto.combustible || 'Nafta'}</span>
                    </div>
                    <div class="ficha-item">
                        <span class="ficha-label">Transmisión</span>
                        <span class="ficha-valor">${auto.transmision || 'Manual'}</span>
                    </div>
                </div>

                ${descripcionHTML}

                <!-- BOTONES EN FILA -->
                <div class="botones-consulta-contenedor">
                    <a href="${linkWhatsapp}" target="_blank" class="btn-consultar-wsp">
                        <img src="https://cdn.simpleicons.org/whatsapp/white" alt="WhatsApp" style="width: 24px; height: 24px;">
                        <span>Consúltanos aquí</span>
                    </a>
                    <a href="${linkFacebook}" target="_blank" class="btn-consultar-fb" onclick="copiarTextoAlPortapapeles('${textoPlano.replace(/'/g, "\\'")}')">
                        <img src="https://cdn.simpleicons.org/facebook/white" alt="Facebook" style="width: 24px; height: 24px;">
                        <span>Consúltanos aquí</span>
                    </a>
                    <a href="${linkInstagram}" target="_blank" class="btn-consultar-ig" onclick="copiarTextoAlPortapapeles('${textoPlano.replace(/'/g, "\\'")}')">
                        <img src="https://cdn.simpleicons.org/instagram/white" alt="Instagram" style="width: 24px; height: 24px;">
                        <span>Consúltanos aquí</span>
                    </a>
                </div>
            </div>
        </div>
    `;

    // Aplicar color de fondo a la tarjeta si es Oportunidad o Novedad
    const tarjetaDetalle = document.querySelector('.detalle-card');
    if (tarjetaDetalle) {
        if (auto.en_oferta) {
            tarjetaDetalle.classList.add('tema-oportunidad');
        } else if (auto.en_novedad) {
            tarjetaDetalle.classList.add('tema-novedad');
        }
    }
}

window.copiarTextoAlPortapapeles = function(texto) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(texto).catch(() => {});
    }
};

window.cambiarFotoPrincipal = function(index) {
    indiceFotoActual = index;
    const imgPrincipal = document.getElementById('foto-principal-vista');
    if (imgPrincipal && fotosVehiculo[index]) {
        imgPrincipal.src = fotosVehiculo[index];
    }
    const thumbs = document.querySelectorAll('.miniatura-img');
    thumbs.forEach((t, i) => {
        t.classList.toggle('activa', i === index);
    });
};

window.moverFotoDetalle = function(direccion) {
    if (!fotosVehiculo || fotosVehiculo.length <= 1) return;
    let nuevoIndice = (indiceFotoActual + direccion + fotosVehiculo.length) % fotosVehiculo.length;
    cambiarFotoPrincipal(nuevoIndice);
};

document.addEventListener('DOMContentLoaded', cargarDetalleVehiculo);