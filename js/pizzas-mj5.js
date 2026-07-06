// MINIJUEGO 5 - BANCO DE PIZZAS
// Validado contra recetas oficiales Pizza Hut El Salvador
// Diego Fuentes | Junio 2026

const PIZZAS_MJ5 = [
    {
        id: "pepperoni",
        nombre: "Pepperoni",
        pasos: [
            "Selecciona la masa correcta",
            "Aplica salsa Pan Pizza",
            "Agrega queso mozzarella",
            "Distribuye las lascas de pepperoni"
        ],
        tiempoBase: 20 // segundos base * cantidad de pasos
    },
    {
        id: "jamon",
        nombre: "Jamón",
        pasos: [
            "Selecciona la masa correcta",
            "Aplica salsa Pan Pizza",
            "Agrega una base de queso mozzarella",
            "Distribuye las lascas de jamón",
            "Cubre con queso mozzarella"
        ],
        tiempoBase: 25
    },
    {
        id: "suprema",
        nombre: "Suprema",
        pasos: [
            "Selecciona la masa correcta",
            "Aplica salsa Pan Pizza",
            "Agrega una base de queso mozzarella",
            "Distribuye las lascas de pepperoni",
            "Agrega la mezcla de carnes",
            "Distribuye la mezcla de vegetales julianos",
            "Cubre con queso mozzarella"
        ],
        tiempoBase: 35
    },
    {
        id: "super-suprema",
        nombre: "Súper Suprema",
        pasos: [
            "Elige la masa correcta",
            "Extiende salsa Pan Pizza",
            "Coloca una base de queso mozzarella",
            "Acomoda las lascas de pepperoni",
            "Agrega las lascas de jamón",
            "Incorpora la mezcla de carnes",
            "Distribuye la mezcla de vegetales julianos",
            "Finaliza con queso mozzarella",
            "Agrega el topping de aceituna"
        ],
        tiempoBase: 45
    },
    {
        id: "chipotle-boom",
        nombre: "Chipotle Boom",
        pasos: [
            "Selecciona la masa correcta",
            "Aplica salsa Alfredo Local",
            "Traza 5 espirales de aderezo Chipotle Ranch",
            "Coloca una base de queso mozzarella",
            "Agrega la mezcla de carnes",
            "Distribuye el tocino",
            "Agrega cebolla blanca",
            "Cubre con queso mozzarella",
            "Finaliza con topping de maíz dulce"
        ],
        tiempoBase: 45
    },
    {
        id: "pollo-alfredo",
        nombre: "Pollo Alfredo",
        pasos: [
            "Selecciona la masa correcta",
            "Aplica salsa Alfredo Local",
            "Coloca una base de queso mozzarella",
            "Distribuye las lascas de jamón",
            "Agrega el pollo",
            "Incorpora la espinaca cocida",
            "Cubre con queso mozzarella",
            "Finaliza con tomate en cubos",
            "Finaliza con aceite en spray y parmesano rallado"
        ],
        tiempoBase: 45
    },
    {
        id: "meat-lovers",
        nombre: "Meat Lovers",
        pasos: [
            "Elige la masa correcta",
            "Extiende salsa Pan Pizza",
            "Agrega una base de queso mozzarella",
            "Coloca las lascas de pepperoni",
            "Distribuye las lascas de jamón",
            "Incorpora la mezcla de carnes",
            "Agrega la salchicha italiana",
            "Finaliza con queso mozzarella",
            "Completa con topping de tocino"
        ],
        tiempoBase: 45
    },
    {
        id: "hawaiana-tocino",
        nombre: "Hawaiana Tocino",
        pasos: [
            "Selecciona la masa correcta",
            "Aplica salsa Pan Pizza",
            "Coloca una base de queso mozzarella",
            "Distribuye las lascas de jamón",
            "Agrega la piña",
            "Cubre con queso mozzarella",
            "Finaliza con topping de tocino"
        ],
        tiempoBase: 35
    },
    {
        id: "hawaiana-cebolla",
        nombre: "Hawaiana Cebolla",
        pasos: [
            "Elige la masa correcta",
            "Extiende salsa Pan Pizza",
            "Agrega una base de queso mozzarella",
            "Coloca las lascas de jamón",
            "Distribuye la piña",
            "Agrega cebolla blanca",
            "Finaliza con queso mozzarella"
        ],
        tiempoBase: 35
    }
];

// Función para obtener una pizza aleatoria
function getPizzaAleatoria() {
    const indice = Math.floor(Math.random() * PIZZAS_MJ5.length);
    return PIZZAS_MJ5[indice];
}

// Función para mezclar pasos
function mezclarPasos(pasos) {
    const copia = [...pasos];
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
}