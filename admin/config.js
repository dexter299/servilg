/* ============================================================
   Servi LG · configuración del panel (edita solo este bloque)
   ============================================================ */
window.ADMIN_CONFIG = {
  // Supabase → Project Settings → API (la "anon public key" es pública por diseño)
  supabaseUrl: "",
  supabaseAnonKey: "",

  // Datos que salen en el encabezado de cada factura
  negocio: {
    nombre: "Servi LG",
    lema: "Servicio técnico especializado",
    documento: "",        // NIT o cédula, ej. "NIT 900.123.456-7"
    telefono: "",         // ej. "300 123 4567"
    direccion: "Medellín y Valle de Aburrá",
    web: "servilg.com"
  },

  garantiaMeses: 4
};
