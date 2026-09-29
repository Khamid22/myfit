import type { FoodUnit } from '../domain/models'

/**
 * Bundled reference foods — works fully offline.
 * `usda`: USDA FoodData Central (SR Legacy / Foundation) reference values.
 * `estimate`: typical-recipe estimates for mixed dishes; adjust to your portions.
 * Values are per `size` `unit`. `g` = grams in one piece/serving when relevant.
 */
export interface CatalogFood {
  key: string
  name: string
  size: number
  unit: FoodUnit
  kcal: number
  protein: number
  carbs: number
  fat: number
  g?: number
  src: 'usda' | 'estimate'
  cat: 'protein' | 'dairy' | 'grains' | 'fruit' | 'veg' | 'legumes' | 'fats' | 'drinks' | 'snacks' | 'fastfood' | 'dishes'
}

type Row = [key: string, name: string, size: number, unit: FoodUnit, kcal: number, p: number, c: number, f: number, g?: number]

const rows = (cat: CatalogFood['cat'], src: CatalogFood['src'], list: Row[]): CatalogFood[] =>
  list.map(([key, name, size, unit, kcal, protein, carbs, fat, g]) => ({ key, name, size, unit, kcal, protein, carbs, fat, g, src, cat }))

export const FOOD_DATABASE: CatalogFood[] = [
  ...rows('protein', 'usda', [
    ['chicken-breast', 'Chicken breast, cooked', 100, 'g', 165, 31, 0, 3.6],
    ['chicken-breast-raw', 'Chicken breast, raw', 100, 'g', 120, 22.5, 0, 2.6],
    ['chicken-thigh', 'Chicken thigh, cooked, skinless', 100, 'g', 179, 24.8, 0, 8.2],
    ['turkey-breast', 'Turkey breast, roasted', 100, 'g', 147, 30.1, 0, 2.1],
    ['beef-lean', 'Beef, lean, cooked', 100, 'g', 201, 29.3, 0, 8.5],
    ['beef-mince-90', 'Ground beef 90% lean, cooked', 100, 'g', 217, 26.1, 0, 11.7],
    ['beef-mince-80', 'Ground beef 80% lean, cooked', 100, 'g', 254, 25.8, 0, 16],
    ['lamb', 'Lamb, cooked', 100, 'g', 294, 25, 0, 21],
    ['pork-loin', 'Pork loin, cooked', 100, 'g', 242, 27, 0, 14],
    ['salmon', 'Salmon, cooked', 100, 'g', 206, 22.1, 0, 12.4],
    ['tuna-can', 'Tuna, canned in water', 100, 'g', 116, 25.5, 0, 0.8],
    ['cod', 'Cod, cooked', 100, 'g', 105, 22.8, 0, 0.9],
    ['shrimp', 'Shrimp, cooked', 100, 'g', 99, 24, 0.2, 0.3],
    ['egg', 'Egg, large', 1, 'piece', 72, 6.3, 0.4, 4.8, 50],
    ['egg-white', 'Egg white, large', 1, 'piece', 17, 3.6, 0.2, 0.1, 33],
    ['tofu', 'Tofu, firm', 100, 'g', 144, 17.3, 2.8, 8.7],
  ]),
  ...rows('dairy', 'usda', [
    ['greek-yogurt-0', 'Greek yogurt, plain, nonfat', 100, 'g', 59, 10.2, 3.6, 0.4],
    ['greek-yogurt-2', 'Greek yogurt, plain, 2%', 100, 'g', 73, 9.9, 3.9, 1.9],
    ['cottage-2', 'Cottage cheese, 2%', 100, 'g', 81, 10.5, 4.8, 2.3],
    ['milk-2', 'Milk, 2%', 100, 'ml', 50, 3.3, 4.8, 2],
    ['milk-whole', 'Milk, whole', 100, 'ml', 61, 3.2, 4.8, 3.3],
    ['kefir', 'Kefir, low-fat', 100, 'ml', 41, 3.8, 4.5, 1],
    ['cheddar', 'Cheddar cheese', 100, 'g', 403, 24.9, 1.3, 33.1],
    ['mozzarella', 'Mozzarella, part-skim', 100, 'g', 254, 24.3, 2.8, 15.9],
    ['feta', 'Feta cheese', 100, 'g', 264, 14.2, 4.1, 21.3],
  ]),
  ...rows('grains', 'usda', [
    ['rice-white', 'Rice, white, cooked', 100, 'g', 130, 2.7, 28.2, 0.3],
    ['rice-brown', 'Rice, brown, cooked', 100, 'g', 123, 2.7, 25.6, 1],
    ['buckwheat', 'Buckwheat, cooked', 100, 'g', 92, 3.4, 19.9, 0.6],
    ['oats', 'Oats, dry', 100, 'g', 379, 13.2, 67.7, 6.5],
    ['oatmeal', 'Oatmeal, cooked with water', 100, 'g', 71, 2.5, 12, 1.5],
    ['pasta', 'Pasta, cooked', 100, 'g', 158, 5.8, 30.9, 0.9],
    ['bulgur', 'Bulgur, cooked', 100, 'g', 83, 3.1, 18.6, 0.2],
    ['quinoa', 'Quinoa, cooked', 100, 'g', 120, 4.4, 21.3, 1.9],
    ['couscous', 'Couscous, cooked', 100, 'g', 112, 3.8, 23.2, 0.2],
    ['bread-white', 'Bread, white', 1, 'piece', 80, 2.3, 15.2, 1, 30],
    ['bread-wholewheat', 'Bread, whole wheat', 1, 'piece', 81, 4, 13.7, 1.1, 32],
    ['tortilla', 'Flour tortilla, medium', 1, 'piece', 146, 3.9, 24.6, 3.6, 45],
    ['potato-boiled', 'Potatoes, boiled', 100, 'g', 87, 1.9, 20.1, 0.1],
    ['sweet-potato', 'Sweet potato, baked', 100, 'g', 90, 2, 20.7, 0.2],
  ]),
  ...rows('fruit', 'usda', [
    ['banana', 'Banana, medium', 1, 'piece', 105, 1.3, 27, 0.4, 118],
    ['apple', 'Apple, medium', 1, 'piece', 95, 0.5, 25.1, 0.3, 182],
    ['orange', 'Orange, medium', 1, 'piece', 62, 1.2, 15.4, 0.2, 131],
    ['pear', 'Pear, medium', 1, 'piece', 101, 0.6, 27.1, 0.3, 178],
    ['kiwi', 'Kiwi', 1, 'piece', 42, 0.8, 10.1, 0.4, 69],
    ['dates', 'Dates, Medjool', 1, 'piece', 66, 0.4, 18, 0, 24],
    ['grapes', 'Grapes', 100, 'g', 69, 0.7, 18.1, 0.2],
    ['strawberries', 'Strawberries', 100, 'g', 32, 0.7, 7.7, 0.3],
    ['blueberries', 'Blueberries', 100, 'g', 57, 0.7, 14.5, 0.3],
    ['watermelon', 'Watermelon', 100, 'g', 30, 0.6, 7.6, 0.2],
    ['melon', 'Melon, cantaloupe', 100, 'g', 34, 0.8, 8.2, 0.2],
    ['pomegranate', 'Pomegranate', 100, 'g', 83, 1.7, 18.7, 1.2],
    ['apricots-dried', 'Apricots, dried', 100, 'g', 241, 3.4, 62.6, 0.5],
    ['avocado', 'Avocado', 100, 'g', 160, 2, 8.5, 14.7],
  ]),
  ...rows('veg', 'usda', [
    ['cucumber', 'Cucumber', 100, 'g', 15, 0.7, 3.6, 0.1],
    ['tomato', 'Tomato', 100, 'g', 18, 0.9, 3.9, 0.2],
    ['broccoli', 'Broccoli, cooked', 100, 'g', 35, 2.4, 7.2, 0.4],
    ['carrot', 'Carrot, raw', 100, 'g', 41, 0.9, 9.6, 0.2],
    ['romaine', 'Lettuce, romaine', 100, 'g', 17, 1.2, 3.3, 0.3],
    ['spinach', 'Spinach, raw', 100, 'g', 23, 2.9, 3.6, 0.4],
    ['onion', 'Onion', 100, 'g', 40, 1.1, 9.3, 0.1],
    ['bell-pepper', 'Bell pepper, red', 100, 'g', 31, 1, 6, 0.3],
    ['green-beans', 'Green beans, cooked', 100, 'g', 35, 1.9, 7.9, 0.3],
  ]),
  ...rows('legumes', 'usda', [
    ['lentils', 'Lentils, cooked', 100, 'g', 116, 9, 20.1, 0.4],
    ['chickpeas', 'Chickpeas, cooked', 100, 'g', 164, 8.9, 27.4, 2.6],
    ['black-beans', 'Black beans, cooked', 100, 'g', 132, 8.9, 23.7, 0.5],
  ]),
  ...rows('fats', 'usda', [
    ['almonds', 'Almonds', 100, 'g', 579, 21.2, 21.6, 49.9],
    ['walnuts', 'Walnuts', 100, 'g', 654, 15.2, 13.7, 65.2],
    ['peanuts', 'Peanuts', 100, 'g', 567, 25.8, 16.1, 49.2],
    ['sunflower-seeds', 'Sunflower seeds', 100, 'g', 584, 20.8, 20, 51.5],
    ['peanut-butter', 'Peanut butter, 1 tbsp', 1, 'serving', 94, 4, 3.2, 8, 16],
    ['olive-oil', 'Olive oil, 1 tbsp', 1, 'serving', 119, 0, 0, 13.5, 13.5],
    ['butter', 'Butter', 100, 'g', 717, 0.9, 0.1, 81.1],
    ['dark-chocolate', 'Dark chocolate 70–85%', 100, 'g', 598, 7.8, 45.9, 42.6],
  ]),
  ...rows('drinks', 'usda', [
    ['cola', 'Cola, 330 ml can', 1, 'serving', 139, 0, 35, 0, 330],
    ['energy-drink', 'Energy drink, 250 ml can', 1, 'serving', 112, 0, 28, 0, 250],
    ['orange-juice', 'Orange juice', 100, 'ml', 45, 0.7, 10.4, 0.2],
    ['beer', 'Beer', 100, 'ml', 43, 0.5, 3.6, 0],
    ['coffee-black', 'Coffee, black', 1, 'serving', 2, 0.3, 0, 0, 240],
    ['honey', 'Honey, 1 tbsp', 1, 'serving', 64, 0.1, 17.3, 0, 21],
    ['sugar', 'Sugar, 1 tsp', 1, 'serving', 16, 0, 4, 0, 4],
  ]),
  ...rows('snacks', 'estimate', [
    ['protein-shake', 'Protein shake', 1, 'serving', 120, 24, 3, 1.5, 30],
    ['protein-bar', 'Protein bar', 1, 'piece', 220, 20, 22, 7, 60],
  ]),
  ...rows('fastfood', 'usda', [
    ['cheeseburger', 'Cheeseburger, fast food', 1, 'piece', 300, 15, 32, 13, 114],
    ['double-burger', 'Double burger, fast food', 1, 'piece', 550, 25, 45, 30, 215],
    ['fries', 'French fries, fast food', 100, 'g', 312, 3.4, 41.4, 14.7],
    ['pizza-slice', 'Pizza, cheese, 1 slice', 1, 'piece', 285, 12.2, 35.7, 10.4, 107],
    ['fried-chicken', 'Fried chicken, breaded', 100, 'g', 260, 20, 10, 16],
  ]),
  ...rows('dishes', 'estimate', [
    ['plov', 'Plov', 100, 'g', 200, 6.5, 22, 9.5],
    ['samsa', 'Samsa', 1, 'piece', 330, 11, 28, 20, 100],
    ['lagman', 'Lagman', 100, 'g', 110, 5, 13, 4],
    ['manti', 'Manti', 1, 'piece', 110, 5, 10, 5.5, 50],
    ['non', 'Non (flatbread)', 100, 'g', 270, 8.5, 53, 2.5],
    ['shashlik', 'Shashlik (lamb/beef)', 100, 'g', 260, 24, 1, 18],
    ['shawarma', 'Shawarma / doner wrap', 1, 'piece', 650, 35, 55, 30, 350],
    ['soup', 'Vegetable soup', 100, 'ml', 45, 2.5, 5, 1.5],
  ]),
]

/** Foods created in "My Foods" on first launch. */
export const STARTER_FOODS = [
  'chicken-breast',
  'egg',
  'banana',
  'greek-yogurt-2',
  'rice-white',
  'buckwheat',
  'potato-boiled',
  'beef-lean',
  'protein-shake',
]
