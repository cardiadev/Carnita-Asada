export interface ShoppingTemplate {
    id: string
    name: string
    description: string
    icon: string
    items: ShoppingTemplateItem[]
}

export interface ShoppingTemplateItem {
    name: string
    quantity: number
    unit: string
    categoryName: string
}

export const shoppingTemplates: ShoppingTemplate[] = [
    {
        id: "carnita-basica",
        name: "Carnita Asada Básica",
        description: "Lo esencial para una carnita asada tradicional",
        icon: "🥩",
        items: [
            // Carnes
            { name: "Arrachera", quantity: 2, unit: "kg", categoryName: "Carnes" },
            { name: "Carne para asar", quantity: 1.5, unit: "kg", categoryName: "Carnes" },
            { name: "Chorizo", quantity: 500, unit: "g", categoryName: "Carnes" },
            { name: "Salchichas", quantity: 1, unit: "paquetes", categoryName: "Carnes" },

            // Verduras
            { name: "Cebolla", quantity: 3, unit: "piezas", categoryName: "Verduras" },
            { name: "Limón", quantity: 10, unit: "piezas", categoryName: "Verduras" },
            { name: "Chile serrano", quantity: 10, unit: "piezas", categoryName: "Verduras" },
            { name: "Tomate", quantity: 5, unit: "piezas", categoryName: "Verduras" },
            { name: "Cilantro", quantity: 1, unit: "manojos", categoryName: "Verduras" },
            { name: "Aguacate", quantity: 4, unit: "piezas", categoryName: "Verduras" },

            // Tortillas y pan
            { name: "Tortillas de maíz", quantity: 2, unit: "kg", categoryName: "Otros" },
            { name: "Tortillas de harina", quantity: 1, unit: "paquetes", categoryName: "Otros" },

            // Salsas y condimentos
            { name: "Salsa verde", quantity: 1, unit: "piezas", categoryName: "Otros" },
            { name: "Salsa roja", quantity: 1, unit: "piezas", categoryName: "Otros" },
            { name: "Sal", quantity: 1, unit: "piezas", categoryName: "Otros" },
            { name: "Pimienta", quantity: 1, unit: "piezas", categoryName: "Otros" },

            // Bebidas
            { name: "Cerveza", quantity: 2, unit: "six", categoryName: "Bebidas" },
            { name: "Refrescos", quantity: 2, unit: "litros", categoryName: "Bebidas" },
            { name: "Agua", quantity: 1, unit: "paquetes", categoryName: "Bebidas" },
        ],
    },
    {
        id: "carnita-premium",
        name: "Carnita Premium",
        description: "Para una carnita asada con todo incluido",
        icon: "🔥",
        items: [
            // Carnes premium
            { name: "Ribeye", quantity: 2, unit: "kg", categoryName: "Carnes" },
            { name: "Arrachera premium", quantity: 2, unit: "kg", categoryName: "Carnes" },
            { name: "Costilla de res", quantity: 1.5, unit: "kg", categoryName: "Carnes" },
            { name: "Chorizo artesanal", quantity: 500, unit: "g", categoryName: "Carnes" },
            { name: "Camarón", quantity: 1, unit: "kg", categoryName: "Carnes" },

            // Verduras
            { name: "Cebolla cambray", quantity: 2, unit: "manojos", categoryName: "Verduras" },
            { name: "Cebolla blanca", quantity: 3, unit: "piezas", categoryName: "Verduras" },
            { name: "Limón", quantity: 15, unit: "piezas", categoryName: "Verduras" },
            { name: "Chile serrano", quantity: 15, unit: "piezas", categoryName: "Verduras" },
            { name: "Tomate", quantity: 6, unit: "piezas", categoryName: "Verduras" },
            { name: "Cilantro", quantity: 2, unit: "manojos", categoryName: "Verduras" },
            { name: "Aguacate", quantity: 6, unit: "piezas", categoryName: "Verduras" },
            { name: "Nopales", quantity: 6, unit: "piezas", categoryName: "Verduras" },
            { name: "Papa", quantity: 1, unit: "kg", categoryName: "Verduras" },

            // Tortillas
            { name: "Tortillas de maíz", quantity: 3, unit: "kg", categoryName: "Otros" },
            { name: "Tortillas de harina", quantity: 2, unit: "paquetes", categoryName: "Otros" },

            // Salsas y condimentos
            { name: "Guacamole", quantity: 1, unit: "piezas", categoryName: "Otros" },
            { name: "Salsa verde", quantity: 2, unit: "piezas", categoryName: "Otros" },
            { name: "Salsa molcajeteada", quantity: 1, unit: "piezas", categoryName: "Otros" },
            { name: "Chimichurri", quantity: 1, unit: "piezas", categoryName: "Otros" },

            // Bebidas
            { name: "Cerveza artesanal", quantity: 3, unit: "six", categoryName: "Bebidas" },
            { name: "Cerveza clara", quantity: 2, unit: "six", categoryName: "Bebidas" },
            { name: "Refrescos", quantity: 3, unit: "litros", categoryName: "Bebidas" },
            { name: "Agua mineral", quantity: 2, unit: "litros", categoryName: "Bebidas" },
            { name: "Hielo", quantity: 2, unit: "bolsas", categoryName: "Bebidas" },
        ],
    },
    {
        id: "carnita-express",
        name: "Carnita Express",
        description: "Lista rápida solo lo básico",
        icon: "⚡",
        items: [
            { name: "Carne para asar", quantity: 2, unit: "kg", categoryName: "Carnes" },
            { name: "Chorizo", quantity: 500, unit: "g", categoryName: "Carnes" },
            { name: "Cebolla", quantity: 2, unit: "piezas", categoryName: "Verduras" },
            { name: "Limón", quantity: 6, unit: "piezas", categoryName: "Verduras" },
            { name: "Tortillas", quantity: 1, unit: "kg", categoryName: "Otros" },
            { name: "Salsa", quantity: 1, unit: "piezas", categoryName: "Otros" },
            { name: "Cerveza", quantity: 1, unit: "six", categoryName: "Bebidas" },
        ],
    },
]
