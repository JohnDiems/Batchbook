import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { calculate, example } from "../calculator";
import "../style.css";

const storageKey = "batchbook-recipe-v1";
const currencies = ["USD", "TWD", "PHP", "EUR", "GBP", "CAD", "AUD"];
const numericFields = {
  yield: { label: "Items per batch", min: 1, step: 1 },
  packaging: { label: "Packaging per batch" },
  overhead: { label: "Overhead per batch" },
  hours: { label: "Labor hours per batch" },
  rate: { label: "Hourly pay" },
  margin: { label: "Profit margin (%)", max: 99.99 },
};
const fieldNames = ["name", "currency", ...Object.keys(numericFields)];

function makeDraft(recipe) {
  return {
    ...Object.fromEntries(fieldNames.map(field => [field, String(recipe[field])])),
    ingredients: recipe.ingredients.map(({ name, cost }) => ({ id: crypto.randomUUID?.() ?? String(Math.random()), name, cost: String(cost) })),
  };
}

function readDraft() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && currencies.includes(saved.currency)
      && fieldNames.every(field => typeof saved[field] === "string")
      && Array.isArray(saved.ingredients)
      && saved.ingredients.every(item => typeof item?.name === "string" && typeof item.cost === "string")) {
      return makeDraft(saved);
    }
  } catch {
    // Start with the example when storage is unavailable.
  }
  return makeDraft(example);
}

function isValidNumber(value, { min = 0, max = Infinity, step = 0.01 } = {}) {
  const number = Number(value);
  const steps = (number - min) / step;
  return value !== "" && Number.isFinite(number) && number >= min && number <= max
    && Math.abs(steps - Math.round(steps)) < 1e-7;
}

function PriceSlip({ draft }) {
  const money = new Intl.NumberFormat("en-US", { style: "currency", currency: draft.currency });
  const valid = Boolean(draft.name.trim())
    && Object.entries(numericFields).every(([field, constraints]) => isValidNumber(draft[field], constraints))
    && draft.ingredients.every(item => isValidNumber(item.cost));
  const recipe = {
    ...Object.fromEntries(Object.keys(numericFields).map(field => [field, Number(draft[field])])),
    ingredients: draft.ingredients.map(item => ({ cost: Number(item.cost) })),
  };
  const totals = valid ? calculate(recipe, money.resolvedOptions().maximumFractionDigits) : null;
  const usable = totals && Object.values(totals).every(Number.isFinite);
  const format = value => usable ? money.format(value) : "—";
  const rows = [
    ["Ingredients", totals?.ingredientCost],
    ["Packaging", recipe.packaging],
    ["Labor", totals?.laborCost],
    ["Overhead", recipe.overhead],
    ["Batch cost", totals?.batchCost, "total"],
    ["Cost per item", totals?.itemCost],
    ["Revenue per batch", totals?.revenue],
    ["Profit per batch", totals?.profit],
  ];

  return (
    <aside className="receipt" aria-labelledby="summary">
      <div className="receipt-top"><h2 id="summary">Price slip</h2><span id="slip-currency">{draft.currency}</span></div>
      <p id="slip-recipe">
        {draft.name.trim() || "Untitled recipe"}{recipe.yield > 0 && ` · ${recipe.yield} per batch`}
      </p>
      <div className="price">
        <span id="price-label">Suggested price per item</span>
        <output form="recipe" aria-labelledby="price-label">{format(totals?.price)}</output>
      </div>
      {!usable && <p className="hint" role="status">
        {valid ? "Use smaller amounts to calculate a price." : "Complete the fields and correct any invalid values to see your price."}
      </p>}
      <dl>
        {rows.map(([label, value, className]) => (
          <div key={label} className={className}><dt>{label}</dt><dd>{format(value)}</dd></div>
        ))}
      </dl>
      <p className="hint">Suggested prices round up to the next currency increment to meet your target margin.</p>
    </aside>
  );
}

function App() {
  const [draft, setDraft] = useState(readDraft);
  const formRef = useRef(null);
  const focusTarget = useRef(null);

  useEffect(() => {
    const { ingredients, ...fields } = draft;
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        ...fields, ingredients: ingredients.map(({ name, cost }) => ({ name, cost })),
      }));
    } catch {
      // The calculator still works without storage.
    }
    if (focusTarget.current) {
      formRef.current.querySelector(focusTarget.current)?.focus();
      focusTarget.current = null;
    }
  }, [draft]);

  function updateField(event) {
    const { name, value } = event.currentTarget;
    setDraft(current => ({ ...current, [name]: value }));
  }

  function updateIngredient(id, field, value) {
    setDraft(current => ({
      ...current,
      ingredients: current.ingredients.map(item => item.id === id ? { ...item, [field]: value } : item),
    }));
  }

  function addIngredient() {
    const id = crypto.randomUUID?.() ?? String(Math.random());
    focusTarget.current = `[data-ingredient="${id}"] .ingredient-name`;
    setDraft(current => ({ ...current, ingredients: [...current.ingredients, { id, name: "", cost: "0" }] }));
  }

  function removeIngredient(index) {
    const next = draft.ingredients[index + 1] ?? draft.ingredients[index - 1];
    focusTarget.current = next ? `[data-ingredient="${next.id}"] .remove` : "#add";
    setDraft(current => ({ ...current, ingredients: current.ingredients.filter((_, row) => row !== index) }));
  }

  function numberField(name, className) {
    const { label, min = 0, max, step = 0.01 } = numericFields[name];
    return (
      <label key={name} className={className}>
        {label}
        <Input name={name} type="number" min={min} max={max} step={step} required value={draft[name]} onChange={updateField} />
      </label>
    );
  }

  return (
    <>
      <header className="masthead">
        <div className="shell bar">
          <a className="brand" href="./"><span aria-hidden="true">✳</span> Batchbook</a>
          <Button variant="outline" onClick={() => {
            if (window.confirm("Replace your current recipe with the cupcake example?")) setDraft(makeDraft(example));
          }}>Load cupcake example</Button>
        </div>
      </header>
      <main className="shell">
        <div className="intro">
          <h1>Price your bake.</h1>
          <p>Work out what a batch costs and what to charge for each item.</p>
        </div>
        <div className="workspace">
          <form ref={formRef} id="recipe" onSubmit={event => event.preventDefault()}>
            <section>
              <h2>Recipe</h2>
              <div className="fields recipe-fields">
                <label>Recipe name<Input name="name" maxLength={80} required value={draft.name} onChange={updateField} /></label>
                {numberField("yield")}
                <label>Currency
                  <NativeSelect name="currency" value={draft.currency} onChange={updateField}>
                    {currencies.map(currency => <option key={currency}>{currency}</option>)}
                  </NativeSelect>
                </label>
              </div>
            </section>
            <section>
              <h2>Ingredients</h2>
              <p className="hint">Enter the cost of the amount you use in one batch.</p>
              <div className="ingredient-head" aria-hidden="true"><span>Ingredient</span><span>Batch cost</span></div>
              {draft.ingredients.map((item, index) => (
                <div className="ingredient-row" key={item.id} data-ingredient={item.id}>
                  <Input className="ingredient-name" aria-label={`Ingredient ${index + 1} name`} placeholder="e.g. Flour" maxLength={80}
                    value={item.name} onChange={event => updateIngredient(item.id, "name", event.currentTarget.value)} />
                  <Input aria-label={`Ingredient ${index + 1} batch cost`} type="number" min={0} step={0.01} required
                    value={item.cost} onChange={event => updateIngredient(item.id, "cost", event.currentTarget.value)} />
                  <Button variant="outline" className="remove px-0 text-xl leading-none" aria-label={`Remove ${item.name || `ingredient ${index + 1}`}`}
                    onClick={() => removeIngredient(index)}>×</Button>
                </div>
              ))}
              <Button className="add" id="add" onClick={addIngredient}>+ Add ingredient</Button>
            </section>
            <section>
              <h2>Other costs</h2>
              <div className="fields">{["packaging", "overhead", "hours", "rate"].map(name => numberField(name))}</div>
            </section>
            <section>
              <h2>Target profit</h2>
              {numberField("margin", "margin")}
              <p className="hint">The share of the selling price you keep after the costs above.</p>
            </section>
          </form>
          <PriceSlip draft={draft} />
        </div>
      </main>
    </>
  );
}

createRoot(document.querySelector("#root")).render(<App />);
