export const example = {
  name: "Vanilla cupcakes", yield: 12, currency: "USD",
  packaging: 3, overhead: 2, hours: 1.25, rate: 16, margin: 30,
  ingredients: [
    { name: "Flour", cost: 0.85 },
    { name: "Sugar", cost: 0.7 },
    { name: "Butter", cost: 3.4 },
    { name: "Eggs", cost: 1.2 },
    { name: "Milk and vanilla", cost: 1.35 },
  ],
};

export function calculate(recipe, currencyDigits) {
  const ingredientCost = recipe.ingredients.reduce((sum, ingredient) => sum + ingredient.cost, 0);
  const laborCost = recipe.hours * recipe.rate;
  const batchCost = ingredientCost + recipe.packaging + laborCost + recipe.overhead;
  const itemCost = batchCost / recipe.yield;
  const increment = 10 ** currencyDigits;
  const target = itemCost / (1 - recipe.margin / 100) * increment;
  const nearest = Math.round(target);
  const price = (Math.abs(nearest - target) <= Number.EPSILON * Math.abs(target) * 4
    ? nearest : Math.ceil(target)) / increment;
  const revenue = price * recipe.yield;
  return { ingredientCost, laborCost, batchCost, itemCost, price, revenue, profit: revenue - batchCost };
}

