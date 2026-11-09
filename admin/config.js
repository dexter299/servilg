/* ============================================================
   Servi LG · configuración del panel (edita solo este archivo)
   ============================================================ */
window.ADMIN_CONFIG = {
  // Supabase → Project Settings → API (la llave publicable es pública por diseño)
  supabaseUrl: "https://gzhdynphqyrfvpsmoahq.supabase.co",
  supabaseAnonKey: "sb_publishable_u6BNQrHeCD016grCoSLN1w_6T5vAaB_",

  // Datos que salen en el encabezado de cada factura
  negocio: {
    nombre: "Servi LG",
    lema: "Servicio técnico especializado",
    documento: "",        // NIT o cédula, ej. "NIT 900.123.456-7"
    telefono: "301 425 0810",
    direccion: "Medellín y Valle de Aburrá",
    web: "servilg.com"
  },

  garantiaMeses: 4,

  // Técnicos. Sube la foto a assets/tecnicos/ con el nombre indicado (cuadrada, mínimo 300×300).
  // Si la foto no existe, sale un círculo con las iniciales.
  tecnicos: [
    { nombre: "Julián Hernández", foto: "../assets/tecnicos/julian.jpg?v=2" },
    { nombre: "Héctor López", foto: "../assets/tecnicos/hector.jpg?v=2" }
  ],

  marcas: ["LG", "Samsung", "Whirlpool", "Mabe", "Haceb", "Electrolux", "Challenger", "Kalley",
    "Frigidaire", "General Electric", "Indurama", "Centrales", "Panasonic", "Midea", "Hisense", "Abba", "Bosch"],

  // Cobros frecuentes: al escribir la descripción aparecen como lista; si tienen valor, se llena solo.
  cobros: [
    { desc: "Revisión y diagnóstico", valor: 50000 },
    { desc: "Mano de obra", valor: 0 },
    { desc: "Mantenimiento preventivo nevera (con filtro externo)", valor: 245000 },
    { desc: "Mantenimiento lavadora carga superior", valor: 160000 },
    { desc: "Mantenimiento preventivo lavadora carga frontal", valor: 220000 },
    { desc: "Mantenimiento general lavadora carga frontal", valor: 460000 },
    { desc: "Repuesto: bomba de desagüe", valor: 0 },
    { desc: "Repuesto: tarjeta electrónica", valor: 0 },
    { desc: "Repuesto: válvula de entrada de agua", valor: 0 },
    { desc: "Repuesto: amortiguadores / suspensión", valor: 0 },
    { desc: "Repuesto: chapa de puerta", valor: 0 },
    { desc: "Repuesto: rodamientos y retenedor", valor: 0 },
    { desc: "Repuesto: correa", valor: 0 },
    { desc: "Repuesto: resistencia", valor: 0 },
    { desc: "Repuesto: termostato / sensor", valor: 0 },
    { desc: "Repuesto: ventilador", valor: 0 },
    { desc: "Repuesto: empaque de puerta", valor: 0 },
    { desc: "Carga de gas refrigerante", valor: 0 },
    { desc: "Transporte", valor: 0 }
  ],

  // Fallas y trabajos más comunes por tipo de equipo
  fallas: {
    Lavadora: ["Error OE: no desagua", "Error UE: desbalance", "Error IE: no entra agua", "Error dE: puerta",
      "Error LE: motor", "Error FE: exceso de agua", "No enciende", "No centrifuga", "Hace ruido", "Bota agua", "No gira"],
    Nevera: ["No enfría", "Enfría poco", "Congela de más", "Hace ruido", "Bota agua", "Escarcha en el congelador",
      "No enciende", "No sale hielo / agua", "Ventilador no funciona"],
    Secadora: ["No calienta", "No gira", "No enciende", "Hace ruido", "Tarda mucho en secar", "Se apaga sola"],
    Lavasecadora: ["Error OE: no desagua", "Error UE: desbalance", "Error IE: no entra agua", "No seca", "No calienta",
      "No centrifuga", "Hace ruido", "Bota agua", "No enciende"],
    Microondas: ["No calienta", "No enciende", "Chispea por dentro", "No gira el plato", "Teclado no responde", "Se apaga solo"],
    Otro: ["No enciende", "Hace ruido", "No funciona correctamente"]
  },
  trabajos: {
    Lavadora: ["Revisión y diagnóstico", "Limpieza de filtro de bomba", "Cambio de bomba de desagüe", "Cambio de válvula de entrada",
      "Cambio de amortiguadores / suspensión", "Cambio de chapa de puerta", "Cambio de rodamientos y retenedor",
      "Revisión de motor y conexiones", "Cambio de tarjeta electrónica", "Mantenimiento general", "Prueba de ciclo completo"],
    Nevera: ["Revisión y diagnóstico", "Carga de gas refrigerante", "Cambio de termostato / sensor", "Cambio de ventilador",
      "Destape de desagüe", "Cambio de resistencia de deshielo", "Cambio de empaque de puerta", "Cambio de tarjeta electrónica",
      "Mantenimiento preventivo", "Prueba de funcionamiento"],
    Secadora: ["Revisión y diagnóstico", "Cambio de resistencia", "Cambio de correa", "Limpieza de ducto y filtro",
      "Cambio de termostato / sensor", "Cambio de tarjeta electrónica", "Mantenimiento general", "Prueba de funcionamiento"],
    Lavasecadora: ["Revisión y diagnóstico", "Limpieza de filtro de bomba", "Cambio de bomba de desagüe", "Cambio de resistencia de secado",
      "Cambio de amortiguadores / suspensión", "Cambio de rodamientos y retenedor", "Cambio de tarjeta electrónica",
      "Mantenimiento general", "Prueba de ciclo completo"],
    Microondas: ["Revisión y diagnóstico", "Cambio de magnetrón", "Cambio de fusible", "Cambio de mica", "Cambio de motor del plato",
      "Cambio de teclado / tarjeta", "Prueba de funcionamiento"],
    Otro: ["Revisión y diagnóstico", "Reparación", "Prueba de funcionamiento"]
  }
};
