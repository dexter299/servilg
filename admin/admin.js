/* Servi LG · Panel administrativo */
(function () {
  "use strict";
  const C = window.ADMIN_CONFIG || {};
  const N = C.negocio || {};
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const fmt = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
  const money = (n) => fmt.format(Math.round(Number(n) || 0));
  const num = (v) => Number(String(v == null ? "" : v).replace(/[^\d]/g, "")) || 0;
  const pad = (n) => String(n).padStart(4, "0");
  const fecha = (d) => new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric", timeZone: "America/Bogota" });

  function show(id) {
    ["view-setup", "view-login", "view-app"].forEach((v) => { $("#" + v).hidden = v !== id; });
  }
  function panel(id) {
    ["list", "form", "detail"].forEach((p) => { $("#" + p).hidden = p !== id; });
    window.scrollTo(0, 0);
  }

  if (!C.supabaseUrl || !C.supabaseAnonKey || !window.supabase) { show("view-setup"); return; }
  const sb = window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey);

  /* ---------- Sesión ---------- */
  let booted = false;
  async function onSession(session) {
    if (!session) {
      booted = false;
      $("#login-form").hidden = false; $("#code-form").hidden = true;
      show("view-login"); return;
    }
    if (booted) return;
    const { data, error } = await sb.from("admins").select("email").maybeSingle();
    if (error || !data) {
      await sb.auth.signOut();
      $("#login-msg").textContent = "Esta cuenta no tiene acceso al panel.";
      show("view-login");
      return;
    }
    booted = true;
    show("view-app");
    panel("list");
    loadList();
  }
  sb.auth.getSession().then(({ data }) => onSession(data.session));
  sb.auth.onAuthStateChange((_e, session) => { setTimeout(() => onSession(session), 0); });

  const loginForm = $("#login-form"), codeForm = $("#code-form");
  let loginEmail = "";
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("button", loginForm);
    $("#login-msg").textContent = "";
    loginEmail = loginForm.email.value.trim().toLowerCase();
    btn.disabled = true;
    const { error } = await sb.auth.signInWithOtp({
      email: loginEmail,
      options: { shouldCreateUser: false, emailRedirectTo: location.origin + location.pathname }
    });
    btn.disabled = false;
    if (error) {
      $("#login-msg").textContent = /rate|seconds/i.test(error.message)
        ? "Espera un momento antes de pedir otro código."
        : "Este correo no tiene acceso al panel.";
      return;
    }
    $("#code-email").textContent = loginEmail;
    loginForm.hidden = true; codeForm.hidden = false;
  });
  codeForm.addEventListener("submit", (e) => e.preventDefault());
  $("#code-back").addEventListener("click", () => { codeForm.hidden = true; loginForm.hidden = false; });
  $("#logout").addEventListener("click", () => sb.auth.signOut());

  $$("[data-go]").forEach((b) => b.addEventListener("click", () => {
    const to = b.dataset.go;
    if (to === "form") resetForm();
    if (to === "list") loadList();
    panel(to);
  }));

  /* ---------- Lista ---------- */
  let all = [];
  async function loadList() {
    $("#list-msg").textContent = "Cargando…";
    const { data, error } = await sb.from("facturas").select("*").order("numero", { ascending: false }).limit(500);
    if (error) { $("#list-msg").textContent = "No se pudieron cargar las facturas."; return; }
    all = data || [];
    renderList();
  }
  function renderList() {
    const q = $("#search").value.trim().toLowerCase();
    const rows = all.filter((f) => !q || [pad(f.numero), f.numero, f.cliente_nombre, f.cliente_telefono, f.equipo, f.modelo]
      .join(" ").toLowerCase().includes(q));
    const ul = $("#list-items");
    ul.textContent = "";
    $("#list-msg").textContent = all.length ? (rows.length ? "" : "Sin resultados.") : "Aún no hay facturas. Crea la primera con “+ Nueva”.";
    rows.forEach((f) => {
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      b.innerHTML = '<span class="inv-num"></span><span class="inv-main"><b></b><span></span></span><span class="inv-total"></span>';
      $(".inv-num", b).textContent = pad(f.numero);
      $(".inv-main b", b).textContent = f.cliente_nombre;
      $(".inv-main span", b).textContent = fecha(f.created_at) + " · " + [f.equipo, f.modelo].filter(Boolean).join(" ");
      $(".inv-total", b).textContent = money(f.total);
      b.addEventListener("click", () => openDetail(f));
      li.appendChild(b);
      ul.appendChild(li);
    });
  }
  $("#search").addEventListener("input", renderList);

  /* ---------- Formulario ---------- */
  const form = $("#inv-form");
  function addItem(d) {
    d = d || {};
    const row = document.createElement("div");
    row.className = "item";
    row.innerHTML =
      '<label class="desc">Descripción<input data-k="desc" placeholder="Mano de obra, repuesto…"></label>' +
      '<label>Cant.<input data-k="cant" inputmode="numeric" value="1"></label>' +
      '<label>Valor unitario<input data-k="valor" inputmode="numeric" placeholder="0"></label>' +
      '<button type="button" class="rm" aria-label="Quitar ítem">×</button>';
    if (d.desc) $('[data-k="desc"]', row).value = d.desc;
    $(".rm", row).addEventListener("click", () => { row.remove(); if (!$(".item")) addItem(); calc(); });
    $('[data-k="valor"]', row).addEventListener("blur", (e) => { const v = num(e.target.value); e.target.value = v ? v.toLocaleString("es-CO") : ""; });
    $("#items").appendChild(row);
  }
  function readItems() {
    return $$(".item").map((r) => ({
      desc: $('[data-k="desc"]', r).value.trim(),
      cant: num($('[data-k="cant"]', r).value) || 1,
      valor: num($('[data-k="valor"]', r).value)
    })).filter((i) => i.desc || i.valor);
  }
  function calc() {
    const items = readItems();
    const sub = items.reduce((s, i) => s + i.cant * i.valor, 0);
    const desc = Math.min(num(form.descuento.value), sub);
    $("#t-sub").textContent = money(sub);
    $("#t-desc").textContent = "−" + money(desc);
    $("#t-total").textContent = money(sub - desc);
    return { items, sub, desc, total: sub - desc };
  }
  function resetForm() {
    form.reset();
    $("#items").textContent = "";
    addItem({ desc: "Mano de obra" });
    form.garantia_meses.value = C.garantiaMeses || 4;
    $("#form-msg").textContent = "";
    calc();
  }
  form.addEventListener("input", calc);
  $("#add-item").addEventListener("click", () => { addItem(); $(".item:last-child input").focus(); });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = $("#form-msg");
    msg.textContent = "";
    const t = calc();
    if (!form.cliente_nombre.value.trim()) { msg.textContent = "Falta el nombre del cliente."; form.cliente_nombre.focus(); return; }
    if (!t.items.length || t.sub <= 0) { msg.textContent = "Agrega al menos un ítem con valor."; return; }
    const v = (k) => (form[k].value || "").trim() || null;
    const row = {
      cliente_nombre: v("cliente_nombre"), cliente_telefono: v("cliente_telefono"),
      cliente_documento: v("cliente_documento"), cliente_direccion: v("cliente_direccion"),
      equipo: v("equipo"), marca: v("marca"), modelo: v("modelo"), serial: v("serial"),
      falla: v("falla"), trabajo: v("trabajo"), items: t.items,
      subtotal: t.sub, descuento: t.desc, total: t.total,
      metodo_pago: v("metodo_pago"), garantia_meses: num(form.garantia_meses.value),
      notas: v("notas")
    };
    const btn = $('button[type="submit"]', form);
    btn.disabled = true; btn.textContent = "Guardando…";
    const { data, error } = await sb.from("facturas").insert(row).select().single();
    btn.disabled = false; btn.textContent = "Guardar y generar imagen";
    if (error) { msg.textContent = "No se pudo guardar: " + error.message; return; }
    all.unshift(data);
    openDetail(data);
  });

  /* ---------- Detalle ---------- */
  let current = null, currentBlob = null;
  async function openDetail(f) {
    current = f; currentBlob = null;
    $("#d-title").textContent = "Factura " + pad(f.numero) + " · " + f.cliente_nombre;
    $("#d-msg").textContent = ""; $("#d-msg").className = "msg";
    $("#d-img").removeAttribute("src");
    $("#a-delete").textContent = "Eliminar factura";
    $("#a-chat").hidden = !waPhone(f.cliente_telefono);
    panel("detail");
    const canvas = await drawInvoice(f);
    currentBlob = await new Promise((r) => canvas.toBlob(r, "image/png"));
    $("#d-img").src = URL.createObjectURL(currentBlob);
  }
  const fileName = (f) => "Factura-ServiLG-" + pad(f.numero) + ".png";
  function waPhone(p) {
    let d = String(p || "").replace(/\D/g, "");
    if (d.length === 10 && d[0] === "3") d = "57" + d;
    return d.length >= 11 ? d : "";
  }
  function waText(f) {
    const nombre = (f.cliente_nombre || "").split(" ")[0];
    return "Hola " + nombre + ", te enviamos el comprobante No. " + pad(f.numero) + " de " + (N.nombre || "Servi LG") +
      " por " + money(f.total) + ". Tu reparación tiene " + f.garantia_meses + " meses de garantía. ¡Gracias por confiar en nosotros!";
  }
  function note(t, ok) { const m = $("#d-msg"); m.textContent = t; m.className = "msg" + (ok ? " ok" : ""); }
  function openChat() {
    const p = waPhone(current.cliente_telefono);
    window.open("https://wa.me/" + p + "?text=" + encodeURIComponent(waText(current)), "_blank", "noopener");
  }
  function download() {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(currentBlob); a.download = fileName(current);
    document.body.appendChild(a); a.click(); a.remove();
  }

  $("#a-share").addEventListener("click", async () => {
    if (!currentBlob) return;
    const file = new File([currentBlob], fileName(current), { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], text: waText(current) }); return; }
      catch (err) { if (err && err.name === "AbortError") return; }
    }
    // Computador: copia la imagen y abre el chat para pegarla
    let copied = false;
    try { await navigator.clipboard.write([new ClipboardItem({ "image/png": currentBlob })]); copied = true; } catch (_) {}
    if (!copied) download();
    if (waPhone(current.cliente_telefono)) openChat();
    note(copied ? "Imagen copiada. En el chat de WhatsApp pégala con Ctrl+V." : "Imagen descargada. Adjúntala en el chat de WhatsApp.", true);
  });
  $("#a-copy").addEventListener("click", async () => {
    try { await navigator.clipboard.write([new ClipboardItem({ "image/png": currentBlob })]); note("Imagen copiada.", true); }
    catch (_) { note("Este navegador no permite copiar imágenes. Usa Descargar."); }
  });
  $("#a-download").addEventListener("click", download);
  $("#a-chat").addEventListener("click", openChat);
  $("#a-delete").addEventListener("click", async (e) => {
    const b = e.currentTarget;
    if (b.dataset.armed !== "1") {
      b.dataset.armed = "1"; b.textContent = "¿Seguro? Toca otra vez para eliminar";
      setTimeout(() => { b.dataset.armed = ""; b.textContent = "Eliminar factura"; }, 4000);
      return;
    }
    b.dataset.armed = "";
    const { error } = await sb.from("facturas").delete().eq("id", current.id);
    if (error) { note("No se pudo eliminar."); return; }
    all = all.filter((f) => f.id !== current.id);
    panel("list"); renderList();
  });

  /* ---------- Imagen de la factura ---------- */
  let logoP = null;
  function logo() {
    if (!logoP) logoP = new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = "../assets/logo.jpg"; });
    return logoP;
  }
  function wrap(ctx, text, maxW) {
    const out = [];
    String(text || "").split(/\n/).forEach((para) => {
      let line = "";
      para.split(/\s+/).forEach((w) => {
        const t = line ? line + " " + w : w;
        if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
      });
      out.push(line);
    });
    return out;
  }

  async function drawInvoice(f) {
    try { await document.fonts.ready; await document.fonts.load("800 italic 40px 'Barlow Condensed'"); await document.fonts.load("600 20px Barlow"); } catch (_) {}
    const W = 1080, P = 64, RED = "#E6002D", INK = "#111114", GREY = "#6b6b75", LINE = "#e4e4e7";
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = 4000;
    const x = cv.getContext("2d");
    x.textBaseline = "alphabetic";
    const font = (w, s, d) => (d ? "italic " + w + " " + s + "px 'Barlow Condensed', sans-serif" : w + " " + s + "px Barlow, system-ui, sans-serif");
    x.fillStyle = "#fff"; x.fillRect(0, 0, W, cv.height);

    // Encabezado
    const H = 250;
    x.fillStyle = "#0a0a0b"; x.fillRect(0, 0, W, H);
    const g = x.createRadialGradient(W * 0.85, 0, 10, W * 0.85, 0, 520);
    g.addColorStop(0, "rgba(230,0,45,.45)"); g.addColorStop(1, "rgba(230,0,45,0)");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    const img = await logo();
    if (img) {
      x.save(); x.beginPath(); x.arc(P + 60, 110, 60, 0, Math.PI * 2); x.clip();
      x.drawImage(img, P, 50, 120, 120); x.restore();
    }
    const tx = P + 150;
    x.fillStyle = "#fff"; x.font = font(800, 54, true); x.fillText((N.nombre || "Servi LG").toUpperCase(), tx, 108);
    x.fillStyle = "#ff5470"; x.font = font(600, 20); x.fillText((N.lema || "").toUpperCase(), tx, 140);
    x.fillStyle = "#d4d4d8"; x.font = font(500, 19);
    const contact = [N.documento, N.telefono, N.web].filter(Boolean).join("  ·  ");
    if (contact) x.fillText(contact, tx, 172);
    if (N.direccion) x.fillText(N.direccion, tx, 200);
    x.textAlign = "right";
    x.fillStyle = "#a1a1aa"; x.font = font(600, 18); x.fillText("COMPROBANTE DE SERVICIO", W - P, 80);
    x.fillStyle = "#fff"; x.font = font(800, 64, true); x.fillText("No. " + pad(f.numero), W - P, 146);
    x.fillStyle = "#d4d4d8"; x.font = font(500, 19); x.fillText(fecha(f.created_at), W - P, 180);
    x.textAlign = "left";
    x.fillStyle = RED; x.fillRect(0, H, W, 8);

    let y = H + 70;
    const label = (t, lx, ly) => { x.fillStyle = RED; x.font = font(700, 17); x.fillText(t.toUpperCase(), lx, ly); };
    const para = (t, lx, ly, mw, size) => {
      x.fillStyle = INK; x.font = font(500, size || 23);
      const lines = wrap(x, t, mw);
      lines.forEach((l, i) => x.fillText(l, lx, ly + i * 32));
      return lines.length * 32;
    };

    // Cliente / Equipo
    const col = (W - P * 2 - 40) / 2, cx2 = P + col + 40;
    label("Cliente", P, y); label("Equipo", cx2, y);
    y += 36;
    const cli = [f.cliente_nombre, f.cliente_documento && "Doc. " + f.cliente_documento, f.cliente_telefono && "Tel. " + f.cliente_telefono, f.cliente_direccion].filter(Boolean);
    const eq = [[f.equipo, f.marca].filter(Boolean).join(" "), f.modelo && "Modelo " + f.modelo, f.serial && "Serial " + f.serial].filter(Boolean);
    let hy1 = 0, hy2 = 0;
    cli.forEach((t, i) => { hy1 += para(t, P, y + hy1, col, i === 0 ? 26 : 22); });
    eq.forEach((t, i) => { hy2 += para(t, cx2, y + hy2, col, i === 0 ? 26 : 22); });
    y += Math.max(hy1, hy2, 32) + 28;

    [["Falla reportada", f.falla], ["Trabajo realizado", f.trabajo]].forEach(([t, v]) => {
      if (!v) return;
      x.fillStyle = LINE; x.fillRect(P, y - 10, W - P * 2, 2);
      y += 34; label(t, P, y); y += 36;
      y += para(v, P, y, W - P * 2) + 20;
    });

    // Tabla
    y += 16;
    const cQ = W - P - 380, cV = W - P - 200, cT = W - P;
    x.fillStyle = "#0a0a0b"; x.fillRect(P, y, W - P * 2, 52);
    x.fillStyle = "#fff"; x.font = font(700, 18);
    x.fillText("DESCRIPCIÓN", P + 20, y + 33);
    x.textAlign = "right";
    x.fillText("CANT.", cQ, y + 33); x.fillText("VALOR", cV, y + 33); x.fillText("TOTAL", cT - 20, y + 33);
    x.textAlign = "left";
    y += 52;
    (f.items || []).forEach((it, i) => {
      x.font = font(500, 22);
      const lines = wrap(x, it.desc || "—", cQ - 80 - P - 20);
      const rh = Math.max(64, 24 + lines.length * 30);
      if (i % 2) { x.fillStyle = "#f6f6f7"; x.fillRect(P, y, W - P * 2, rh); }
      x.fillStyle = INK;
      lines.forEach((l, k) => x.fillText(l, P + 20, y + 40 + k * 30));
      x.textAlign = "right";
      x.fillText(String(it.cant), cQ, y + 40);
      x.fillText(money(it.valor), cV, y + 40);
      x.font = font(600, 22); x.fillText(money(it.cant * it.valor), cT - 20, y + 40);
      x.textAlign = "left";
      y += rh;
    });
    x.fillStyle = LINE; x.fillRect(P, y, W - P * 2, 2);

    // Totales
    y += 50;
    const lx = W - P - 400;
    x.font = font(500, 22);
    const tline = (t, v) => { x.fillStyle = GREY; x.textAlign = "left"; x.fillText(t, lx, y); x.textAlign = "right"; x.fillStyle = INK; x.fillText(v, cT - 20, y); x.textAlign = "left"; y += 40; };
    tline("Subtotal", money(f.subtotal));
    if (Number(f.descuento) > 0) tline("Descuento", "−" + money(f.descuento));
    if (f.metodo_pago) tline("Método de pago", f.metodo_pago);
    y += 6;
    x.fillStyle = RED; x.fillRect(lx - 20, y - 8, cT - lx + 20, 76);
    x.fillStyle = "#fff"; x.font = font(800, 30, true); x.fillText("TOTAL", lx, y + 41);
    x.textAlign = "right"; x.font = font(800, 42, true); x.fillText(money(f.total), cT - 20, y + 44); x.textAlign = "left";
    y += 120;

    // Garantía
    if (Number(f.garantia_meses) > 0) {
      x.strokeStyle = RED; x.lineWidth = 3;
      x.strokeRect(P, y, W - P * 2, 92);
      x.fillStyle = RED; x.font = font(800, 32, true); x.fillText(f.garantia_meses + " MESES DE GARANTÍA", P + 28, y + 42);
      x.fillStyle = GREY; x.font = font(500, 19); x.fillText("Sobre el trabajo realizado y los repuestos instalados en esta visita.", P + 28, y + 74);
      y += 132;
    }
    if (f.notas) { label("Notas", P, y); y += 36; y += para(f.notas, P, y, W - P * 2, 21) + 24; }

    // Pie
    y += 20;
    x.fillStyle = "#0a0a0b"; x.fillRect(0, y, W, 110);
    x.fillStyle = "#fff"; x.font = font(800, 30, true); x.textAlign = "center";
    x.fillText("GRACIAS POR CONFIAR EN " + (N.nombre || "Servi LG").toUpperCase(), W / 2, y + 50);
    x.fillStyle = "#a1a1aa"; x.font = font(500, 16);
    x.fillText("Este comprobante no es una factura electrónica de venta.", W / 2, y + 82);
    x.textAlign = "left";
    y += 110;

    const out = document.createElement("canvas");
    out.width = W; out.height = y;
    out.getContext("2d").drawImage(cv, 0, 0);
    return out;
  }
})();
