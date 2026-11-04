/* ============================================================
   Servi LG · configuración (edita solo este bloque)
   ============================================================ */
const CONFIG = {
  // Número de WhatsApp con código de país y sin signos. Ejemplo: "573001234567"
  whatsapp: "",
  // Mensaje que se escribe solo al abrir WhatsApp
  mensaje: "Hola, quiero agendar una visita con Servi LG.",
  // Textos de la sección final (déjalos vacíos para mostrar el aviso pendiente)
  telefonoVisible: "",
  horario: ""
};

/* ---------- WhatsApp ---------- */
(function () {
  const ok = /^\d{8,15}$/.test(CONFIG.whatsapp);
  const url = ok
    ? "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(CONFIG.mensaje)
    : "#contacto";
  document.querySelectorAll("[data-wa]").forEach(function (a) {
    a.setAttribute("href", url);
    if (ok) {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener");
    }
  });
  const tel = document.getElementById("tel");
  const hor = document.getElementById("horario");
  if (tel && CONFIG.telefonoVisible) tel.textContent = CONFIG.telefonoVisible;
  if (hor && CONFIG.horario) hor.textContent = CONFIG.horario;
})();

/* ---------- Botón flotante de WhatsApp: aparece al salir del banner ---------- */
(function () {
  const fab = document.querySelector(".fab");
  const hero = document.querySelector(".hero");
  if (!fab) return;
  if (!hero || !("IntersectionObserver" in window)) { fab.classList.add("show"); return; }
  new IntersectionObserver(function (entries) {
    fab.classList.toggle("show", !entries[0].isIntersecting);
  }).observe(hero);
})();

/* ---------- Lavadora interactiva ---------- */
(function () {
  const CODES = [
    { c: "OE", t: "Error de desagüe: el agua no sale. Puede ser el filtro tapado o la bomba." },
    { c: "UE", t: "Carga desbalanceada: la ropa se acomodó mal o falla la suspensión." },
    { c: "IE", t: "No entra agua: llave cerrada, manguera obstruida o válvula de entrada." },
    { c: "dE", t: "Puerta mal detectada: falla el sensor o la chapa de la puerta." },
    { c: "LE", t: "Motor bloqueado: requiere revisión del motor y sus conexiones." },
    { c: "FE", t: "Exceso de agua: falla la válvula o el sensor de nivel." }
  ];
  const washer = document.getElementById("washer");
  const code = document.getElementById("code");
  const status = document.getElementById("status");
  const meaning = document.getElementById("meaning");
  const fix = document.getElementById("fix");
  const knob = document.getElementById("knob");
  const door = document.getElementById("door");
  const list = document.getElementById("codes");
  let idx = 0, fixed = false;

  const buttons = CODES.map(function (item, i) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "code-btn";
    b.textContent = item.c;
    b.setAttribute("aria-label", "Código " + item.c);
    b.addEventListener("click", function () { go(i); });
    list.appendChild(b);
    return b;
  });

  function render() {
    washer.classList.toggle("is-fixed", fixed);
    fix.classList.toggle("is-fixed", fixed);
    code.textContent = fixed ? "OK" : CODES[idx].c;
    status.textContent = fixed ? "Equipo funcionando" : "Falla detectada";
    meaning.textContent = fixed
      ? "Listo. Así deja tu equipo nuestro técnico: sin errores y funcionando como nuevo."
      : CODES[idx].t;
    fix.textContent = fixed ? "Probar otro código" : "Repararlo";
    knob.style.transform = "rotate(" + (-125 + idx * 50) + "deg)";
    buttons.forEach(function (b, i) { b.setAttribute("aria-pressed", String(i === idx)); });
  }
  function go(i) { idx = i; fixed = false; render(); }
  function next() { go((idx + 1) % CODES.length); }

  knob.addEventListener("click", next);
  door.addEventListener("click", next);
  fix.addEventListener("click", function () { fixed = !fixed; render(); });
  render();
})();

/* ---------- Mapa de cobertura ---------- */
(function () {
  // x, y: posición de la etiqueta sobre el mapa, en % del contenedor
  const ZONES = [
    { key: "medellin", name: "Medellín", x: 64.3, y: 37.6 },
    { key: "envigado", name: "Envigado", x: 53.6, y: 56.8 },
    { key: "sabaneta", name: "Sabaneta", x: 43.0, y: 61.4 },
    { key: "itagui", name: "Itagüí", x: 37.0, y: 55.1 },
    { key: "belen", name: "Belén", x: 40.5, y: 47.6 },
    { key: "laureles", name: "Laureles", x: 43.3, y: 38.4 },
    { key: "bello", name: "Bello", x: 59.0, y: 22.1 },
    { key: "copacabana", name: "Copacabana", x: 78.5, y: 20.0 },
    { key: "caldas", name: "Caldas", x: 30.6, y: 72.3 },
    { key: "laestrella", name: "La Estrella", x: 26.3, y: 59.3 }
  ];
  const grid = document.getElementById("zones");
  const map = document.getElementById("map");
  const note = document.getElementById("zone-note");
  const svg = map.querySelector("svg");
  let current = "medellin";

  const chips = {}, pins = {};
  ZONES.forEach(function (z) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "zbtn";
    b.innerHTML = "<i></i>" + z.name;
    b.addEventListener("click", function () { select(z.key); });
    grid.appendChild(b);
    chips[z.key] = b;

    const p = document.createElement("button");
    p.type = "button";
    p.className = "pin";
    p.style.left = z.x + "%";
    p.style.top = z.y + "%";
    p.setAttribute("aria-label", z.name);
    p.innerHTML = '<span class="pin-pill"><i></i>' + z.name + "</span>";
    p.addEventListener("click", function () { select(z.key); });
    map.appendChild(p);
    pins[z.key] = p;
  });

  svg.addEventListener("click", function (e) {
    const el = e.target.closest(".zone");
    if (el) select(el.getAttribute("data-zone"));
  });

  function select(key) {
    current = key;
    const name = ZONES.filter(function (z) { return z.key === key; })[0].name;
    ZONES.forEach(function (z) {
      const on = z.key === key;
      chips[z.key].setAttribute("aria-pressed", String(on));
      pins[z.key].classList.toggle("is-selected", on);
    });
    svg.querySelectorAll(".zone").forEach(function (el) {
      const k = el.getAttribute("data-zone");
      el.classList.toggle("is-selected", k === key);
      el.classList.toggle("is-dim", key === "medellin" && (k === "laureles" || k === "belen"));
    });
    note.textContent = "Zona seleccionada: " + name + ". Si no ves tu barrio en la lista, escríbenos y te confirmamos.";
  }
  select(current);
})();
