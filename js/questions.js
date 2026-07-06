/* ============================================================
   GAMEHUT - BANCO DE PREGUNTAS
   Minijuego 1: ¿Qué hago ahora?
   Área: Introductorios
   Total: 47 preguntas distribuidas en 4 subtemas
   ============================================================ */

const BANCO_PREGUNTAS_INTRODUCTORIOS = [

  /* ---------- SEGURIDAD INDUSTRIAL (13 preguntas) ---------- */
  {
    id: "P01",
    subtema: "seguridad-industrial",
    pregunta: "Hay un derrame en el piso de la cocina. ¿Qué haces primero?",
    opciones: [
      "Limpiar el derrame de inmediato",
      "Avisar a los demás para que tengan cuidado",
      "Poner el rótulo de PISO MOJADO y seguir trabajando"
    ],
    correcta: 0,
    tiempo: 20
  },
  {
    id: "P02",
    subtema: "seguridad-industrial",
    pregunta: "¿Cuál de estas es una regla para evitar accidentes?",
    opciones: [
      "Levantar objetos pesados adecuadamente",
      "Trabajar rápido aunque el área esté desordenada",
      "Usar el equipo aunque esté dañado"
    ],
    correcta: 0,
    tiempo: 20
  },
  {
    id: "P03",
    subtema: "seguridad-industrial",
    pregunta: "Vas a levantar una caja pesada. ¿Cuál es la técnica correcta?",
    opciones: [
      "Separar los pies, doblar rodillas, enderezar la espalda y levantar uniformemente",
      "Doblar la espalda hacia adelante y tirar con los brazos",
      "Pedir ayuda siempre, nunca levantar solo"
    ],
    correcta: 0,
    tiempo: 20
  },
  {
    id: "P04",
    subtema: "seguridad-industrial",
    pregunta: "¿Qué equipo JAMÁS debe ser operado ni limpiado por menores de 18 años?",
    opciones: [
      "La roladora y la mezcladora de masa",
      "La maquina lavaplatos y el horno",
      "El refrigerador y la freidora"
    ],
    correcta: 0,
    tiempo: 12
  },
  {
    id: "P05",
    subtema: "seguridad-industrial",
    pregunta: "Hay un incendio pequeño en la cocina. ¿A dónde apuntas el extintor?",
    opciones: [
      "A la base de las llamas",
      "A la parte más alta del fuego",
      "Al techo para dispersar el agente"
    ],
    correcta: 0,
    tiempo: 12
  },
  {
    id: "P06",
    subtema: "seguridad-industrial",
    pregunta: "¿Para qué tipo de fuego sirve un extintor ABC?",
    opciones: [
      "Todo tipo de fuego: químicos, electricidad y calor",
      "Solo para fuegos eléctricos",
      "Solo para fuegos por químicos"
    ],
    correcta: 0,
    tiempo: 12
  },
  {
    id: "P07",
    subtema: "seguridad-industrial",
    pregunta: "Hay un incendio que no puedes apagar con el extintor. ¿Qué haces?",
    opciones: [
      "Llamar a los bomberos y evacuar a todos de la unidad",
      "Buscar más extintores y seguir intentando",
      "Cerrar la puerta del área y esperar que se apague solo"
    ],
    correcta: 0,
    tiempo: 20
  },
  {
    id: "P08",
    subtema: "seguridad-industrial",
    pregunta: "Tu unidad está siendo asaltada. ¿Cuál es la acción correcta?",
    opciones: [
      "Conservar la serenidad y colaborar con el asaltante",
      "Intentar detener al asaltante",
      "Gritar para alertar a los clientes"
    ],
    correcta: 0,
    tiempo: 20
  },
  {
    id: "P09",
    subtema: "seguridad-industrial",
    pregunta: "Después de un robo, ¿qué características del asaltante debes recordar?",
    opciones: [
      "Edad, peso, estatura, color de pelo, ojos, ropa y zapatos",
      "Solo su altura y el arma que usaba",
      "El vehículo en que llegó y hacia dónde se fue"
    ],
    correcta: 0,
    tiempo: 20
  },
  {
    id: "P10",
    subtema: "seguridad-industrial",
    pregunta: "Estás cerrando la unidad. ¿Cuál es el último paso del procedimiento de seguridad?",
    opciones: [
      "Encender la alarma",
      "Verificar que los alimentos estén guardados",
      "Apagar todas las luces del local"
    ],
    correcta: 0,
    tiempo: 12
  },
  {
    id: "P11",
    subtema: "seguridad-industrial",
    pregunta: "¿Por qué es importante la Seguridad Industrial en Pizza Hut?",
    opciones: [
      "Porque protege la salud y el bienestar de todos los asociados",
      "Porque evita multas para la empresa",
      "Porque lo exige la corporación Premium Restaurants of America"
    ],
    correcta: 0,
    tiempo: 20
  },
  {
    id: "P12",
    subtema: "seguridad-industrial",
    pregunta: "Al usar la maquina lavaplatos, ¿cuál es la distancia correcta para evitar quemaduras?",
    opciones: [
      "Mantener distancia del equipo mientras opera",
      "Usar guantes y tocar la máquina normalmente",
      "No hay riesgo de quemadura con la lavaplatos"
    ],
    correcta: 0,
    tiempo: 20
  },
  {
    id: "P13",
    subtema: "seguridad-industrial",
    pregunta: "¿Qué significa \"Respetar el equipo\" en Pizza Hut?",
    opciones: [
      "No meter manos en equipos en funcionamiento y verificar que las barreras de seguridad estén activas",
      "Mantener el equipo limpio en todo momento",
      "Usar el equipo solo cuando el encargado esté presente"
    ],
    correcta: 0,
    tiempo: 20
  },

  /* ---------- SEGURIDAD DE ALIMENTOS (14 preguntas) ---------- */
  {
    id: "P14",
    subtema: "seguridad-alimentos",
    pregunta: "¿Qué es un alimento seguro?",
    opciones: [
      "El que está en condiciones que evitan su descomposición o proliferación de bacterias",
      "El que tiene fecha de vencimiento vigente",
      "El que está refrigerado a cualquier temperatura"
    ],
    correcta: 0,
    tiempo: 20
  },
  {
    id: "P15",
    subtema: "seguridad-alimentos",
    pregunta: "Terminas de lavar tus manos. ¿Cuál es el último paso correcto?",
    opciones: [
      "Aplicar higienizante con el papel toalla sin tocar el dispensador",
      "Sacudir las manos y continuar trabajando",
      "Secarse con el uniforme"
    ],
    correcta: 0,
    tiempo: 20
  },
  {
    id: "P16",
    subtema: "seguridad-alimentos",
    pregunta: "¿Cuál es la temperatura máxima aceptable en el cuarto frío?",
    opciones: ["41°F", "33°F", "50°F"],
    correcta: 0,
    tiempo: 12
  },
  {
    id: "P17",
    subtema: "seguridad-alimentos",
    pregunta: "¿Cuál es la temperatura estándar de los productos refrigerados?",
    opciones: ["33° a 41°F", "41° a 50°F", "28° a 33°F"],
    correcta: 0,
    tiempo: 12
  },
  {
    id: "P18",
    subtema: "seguridad-alimentos",
    pregunta: "¿A qué temperatura deben mantenerse los alimentos calientes?",
    opciones: ["Por encima de 145°F", "Por encima de 120°F", "Por encima de 90°F"],
    correcta: 0,
    tiempo: 12
  },
  {
    id: "P19",
    subtema: "seguridad-alimentos",
    pregunta: "¿Qué es la Zona de Peligro de temperaturas?",
    opciones: [
      "El rango entre 41°F y 145°F donde las bacterias se reproducen con mayor facilidad",
      "Temperaturas por debajo de los 32°F",
      "Cualquier temperatura mayor a 145°F"
    ],
    correcta: 0,
    tiempo: 20
  },
  {
    id: "P20",
    subtema: "seguridad-alimentos",
    pregunta: "¿Dónde deben descongelarse los productos congelados?",
    opciones: [
      "En el cuarto frío entre 33° y 41°F",
      "A temperatura ambiente en la cocina",
      "En agua caliente para acelerar el proceso"
    ],
    correcta: 0,
    tiempo: 12
  },
  {
    id: "P21",
    subtema: "seguridad-alimentos",
    pregunta: "Te llega producto congelado a la unidad. ¿Cuándo debes guardarlo?",
    opciones: ["Inmediatamente", "Cuando termines tu tarea actual", "Al finalizar el turno"],
    correcta: 0,
    tiempo: 12
  },
  {
    id: "P22",
    subtema: "seguridad-alimentos",
    pregunta: "¿Por qué no debes volver a congelar un producto ya descongelado?",
    opciones: [
      "Porque se acorta su vida útil",
      "Porque pierde sabor y textura",
      "Porque el equipo no lo permite"
    ],
    correcta: 0,
    tiempo: 20
  },
  {
    id: "P23",
    subtema: "seguridad-alimentos",
    pregunta: "¿Cuál es la temperatura máxima permisible en el congelador?",
    opciones: ["10°F", "20°F", "32°F"],
    correcta: 0,
    tiempo: 12
  },
  {
    id: "P24",
    subtema: "seguridad-alimentos",
    pregunta: "¿Qué significa PEPS?",
    opciones: [
      "Primero en entrar, primero en salir",
      "Producto estándar para su servicio",
      "Preparación estricta para sanitizar"
    ],
    correcta: 0,
    tiempo: 12
  },
  {
    id: "P25",
    subtema: "seguridad-alimentos",
    pregunta: "¿Cuáles son los sistemas de rotulación que usa Pizza Hut?",
    opciones: [
      "PLV y Stiker diarios",
      "Etiquetas de fecha y color",
      "Códigos QR y tarjetas de producto"
    ],
    correcta: 0,
    tiempo: 12
  },
  {
    id: "P26",
    subtema: "seguridad-alimentos",
    pregunta: "¿A qué altura del suelo deben guardarse los alimentos?",
    opciones: ["16 cm", "10 cm", "25 cm"],
    correcta: 0,
    tiempo: 12
  },
  {
    id: "P27",
    subtema: "seguridad-alimentos",
    pregunta: "¿Qué debes hacer si un cliente reporta una enfermedad por los alimentos?",
    opciones: [
      "Mostrar preocupación, no admitir culpas y notificar al encargado de inmediato",
      "Ofrecer un descuento y no escalar el caso",
      "Pedir disculpas y admitir que fue un error de preparación"
    ],
    correcta: 0,
    tiempo: 20
  },

  /* ---------- LIMPIEZA DIARIA (9 preguntas) ---------- */
  {
    id: "P28",
    subtema: "limpieza-diaria",
    pregunta: "¿Para qué se usa el mascón negro?",
    opciones: [
      "Para partes internas del horno y superficies con alto contenido de grasa",
      "Para lavar utensilios y recipientes de preparación",
      "Para lavamanos y baños"
    ],
    correcta: 0,
    tiempo: 12
  },
  {
    id: "P29",
    subtema: "limpieza-diaria",
    pregunta: "¿Qué se limpia con toalla blanca?",
    opciones: [
      "Áreas y superficies en contacto con alimentos",
      "Superficies que no tocan alimentos",
      "El piso y los zócalos"
    ],
    correcta: 0,
    tiempo: 12
  },
  {
    id: "P30",
    subtema: "limpieza-diaria",
    pregunta: "¿Qué se limpia con toalla azul?",
    opciones: [
      "Áreas que NO están en contacto con alimentos",
      "Superficies donde se preparan alimentos",
      "Equipos de cocina"
    ],
    correcta: 0,
    tiempo: 12
  },
  {
    id: "P31",
    subtema: "limpieza-diaria",
    pregunta: "¿Qué fibra de color se usa en el área de COCINA?",
    opciones: ["Fibra azul", "Fibra verde", "Fibra roja"],
    correcta: 0,
    tiempo: 12
  },
  {
    id: "P32",
    subtema: "limpieza-diaria",
    pregunta: "¿Qué fibra de color se usa en el área de SERVICIO?",
    opciones: ["Fibra verde", "Fibra azul", "Fibra amarilla"],
    correcta: 0,
    tiempo: 12
  },
  {
    id: "P33",
    subtema: "limpieza-diaria",
    pregunta: "¿Cuál es la función del químico Virex II 256?",
    opciones: [
      "Sanitizante para mesas de preparación de alimentos y mesas de clientes",
      "Jabón para lavado de manos",
      "Detergente para el primer compartimiento"
    ],
    correcta: 0,
    tiempo: 12
  },
  {
    id: "P34",
    subtema: "limpieza-diaria",
    pregunta: "¿Para qué sirve el Suma Edén?",
    opciones: [
      "Sanitizante exclusivo para frutas, verduras y utilería en la prepara",
      "Detergente multiusos para pisos y azulejos",
      "Detergente para la maquina lavaplatos"
    ],
    correcta: 0,
    tiempo: 12
  },
  {
    id: "P35",
    subtema: "limpieza-diaria",
    pregunta: "Hay basura en el estacionamiento, el piso necesita barrerse, y un compañero tiene dificultad despachando un pedido. ¿Qué haces primero?",
    opciones: [
      "Ayudar al compañero a dar servicio al cliente",
      "Barrer el piso porque es riesgo de accidente",
      "Recoger la basura del estacionamiento primero"
    ],
    correcta: 0,
    tiempo: 20
  },
  {
    id: "P36",
    subtema: "limpieza-diaria",
    pregunta: "¿Qué químico va en el primer compartimiento de lavado?",
    opciones: ["Suma Detergente para ollas", "J-512", "Virex II 256"],
    correcta: 0,
    tiempo: 12
  },

  /* ---------- LAVADO (11 preguntas) ---------- */
  {
    id: "P37",
    subtema: "lavado",
    pregunta: "¿Cuál es el orden correcto de los 3 compartimientos de lavado?",
    opciones: [
      "Agua jabonosa → Agua para enjuagar → Solución higienizante",
      "Solución higienizante → Agua jabonosa → Agua para enjuagar",
      "Agua para enjuagar → Agua jabonosa → Solución higienizante"
    ],
    correcta: 0,
    tiempo: 20
  },
  {
    id: "P38",
    subtema: "lavado",
    pregunta: "¿Cuáles son las temperaturas del primer y segundo compartimiento?",
    opciones: ["120° a 130°F", "90° a 100°F", "150° a 160°F"],
    correcta: 0,
    tiempo: 12
  },
  {
    id: "P39",
    subtema: "lavado",
    pregunta: "¿Por cuánto tiempo deben higienizarse los utensilios en el tercer compartimiento?",
    opciones: ["1 minuto", "30 segundos", "3 minutos"],
    correcta: 0,
    tiempo: 12
  },
  {
    id: "P40",
    subtema: "lavado",
    pregunta: "¿Cuándo debes cambiar el agua del primer compartimiento?",
    opciones: [
      "Cuando ya no haga espuma o esté turbia",
      "Cada hora sin importar el estado",
      "Al finalizar el turno"
    ],
    correcta: 0,
    tiempo: 12
  },
  {
    id: "P41",
    subtema: "lavado",
    pregunta: "¿Cuál es el orden correcto para lavar utilería en los 3 compartimientos?",
    opciones: [
      "Cristalería → Cubiertos → Platos → Utensilios → Recipientes plásticos → Pírex y moldes",
      "Moldes → Platos → Cubiertos → Cristalería",
      "Todo puede lavarse en cualquier orden"
    ],
    correcta: 0,
    tiempo: 20
  },
  {
    id: "P42",
    subtema: "lavado",
    pregunta: "¿Cuántos cubiertos es el máximo por rack en la lavaplatos?",
    opciones: ["100 cubiertos", "50 cubiertos", "150 cubiertos"],
    correcta: 0,
    tiempo: 12
  },
  {
    id: "P43",
    subtema: "lavado",
    pregunta: "¿Cuántas veces deben pasarse los cubiertos y espátulas en la maquina lavaplatos?",
    opciones: ["2 veces", "1 vez", "3 veces"],
    correcta: 0,
    tiempo: 12
  },
  {
    id: "P44",
    subtema: "lavado",
    pregunta: "¿Cuál es el químico de lavado de la maquina lavaplatos?",
    opciones: ["Suma Lima", "Suma Rinse", "J-512"],
    correcta: 0,
    tiempo: 12
  },
  {
    id: "P45",
    subtema: "lavado",
    pregunta: "¿Cuál es el químico de secado y abrillantado de la maquina lavaplatos?",
    opciones: ["Suma Rinse", "Suma Lima", "Metalshine"],
    correcta: 0,
    tiempo: 12
  },
  {
    id: "P46",
    subtema: "lavado",
    pregunta: "¿Cómo verificas el nivel de cloro en el tercer compartimiento?",
    opciones: [
      "Sumergir la cinta de medición 10 segundos y comparar con la guía de colores (100–200 ppm)",
      "Oler el agua para verificar concentración",
      "Verificar visualmente el color del agua"
    ],
    correcta: 0,
    tiempo: 20
  },
  {
    id: "P47",
    subtema: "lavado",
    pregunta: "¿Cuáles son los ciclos de la maquina lavaplatos en orden?",
    opciones: [
      "Lavado → Enjuague → Sanitizado → Rinse",
      "Enjuague → Lavado → Rinse → Sanitizado",
      "Sanitizado → Lavado → Enjuague → Rinse"
    ],
    correcta: 0,
    tiempo: 20
  }

];