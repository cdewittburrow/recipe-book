#!/usr/bin/env node
// Inserts the 11 remaining recipes (parsed manually) into Supabase.

const SUPABASE_URL = 'https://zbyhtcsccjvmhvswlzbg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpieWh0Y3NjY2p2bWh2c3dsemJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5OTA0MzksImV4cCI6MjA5MDU2NjQzOX0.QxnLcNfeOkbf-vp1utN_461vhq3693Bzngn4av-Aemo';

async function insert(table, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message || res.status); }
  return res.json();
}

async function addRecipe({ title, description, base_servings, prep_time_minutes, cook_time_minutes, tags, ingredients, steps }) {
  const [recipe] = await insert('recipes', {
    title, description: description || null,
    base_servings: base_servings || 4,
    prep_time_minutes: prep_time_minutes || null,
    cook_time_minutes: cook_time_minutes || null,
    source_type: 'google_doc', tags: tags || [],
  });
  if (ingredients?.length) await insert('ingredients', ingredients.map((i, idx) => ({
    recipe_id: recipe.id, sort_order: idx,
    quantity: i.quantity ?? null, unit: i.unit ?? null,
    name: i.name, prep_note: i.prep_note ?? null,
  })));
  if (steps?.length) await insert('steps', steps.map((content, idx) => ({ recipe_id: recipe.id, sort_order: idx, content })));
  return recipe;
}

const recipes = [
  {
    title: 'Vegetable Stock',
    description: 'Golden vegetable stock built on browned onions and mushrooms. Deep, savory, and versatile. Omit salt if reducing the stock significantly.',
    base_servings: 10,
    prep_time_minutes: 15,
    cook_time_minutes: 55,
    tags: ['stock', 'vegetarian', 'instant-pot', 'pantry'],
    ingredients: [
      { quantity: 1, unit: 'tbsp', name: 'vegetable oil' },
      { quantity: 2, unit: null, name: 'medium onions', prep_note: 'unpeeled, halved' },
      { quantity: 2, unit: null, name: 'celery stalks', prep_note: 'halved crosswise' },
      { quantity: 2, unit: null, name: 'large carrots', prep_note: 'scrubbed, halved crosswise' },
      { quantity: 8, unit: 'oz', name: 'white button or crimini mushrooms', prep_note: 'torn in half if large' },
      { quantity: 1, unit: null, name: 'head of garlic', prep_note: 'halved crosswise' },
      { quantity: 1, unit: null, name: 'bunch fresh parsley' },
      { quantity: 2, unit: null, name: 'bay leaves' },
      { quantity: 2, unit: 'tsp', name: 'whole black peppercorns' },
      { quantity: null, unit: null, name: 'kosher salt', prep_note: 'optional' },
    ],
    steps: [
      'Heat oil in Instant Pot on Sauté setting (or medium-high in a pressure cooker). Add onions cut-side down and cook undisturbed until golden brown, about 3 minutes.',
      'Add celery, carrots, mushrooms, and garlic; toss to coat. Reduce heat to medium and cook with lid askew, stirring occasionally, until vegetables are browned in spots, 5–6 minutes.',
      'Stir in parsley, bay leaves, and peppercorns. Pour in 3 quarts water.',
      'Lock lid and cook on high pressure for 40 minutes, then release pressure manually.',
      'Strain stock through a fine-mesh sieve into a large bowl; discard solids. Add salt if using. Let cool. Refrigerate up to 4 days or freeze up to 6 months.',
    ],
  },
  {
    title: 'Victoria Sandwich',
    description: 'Classic British sponge cake filled with raspberry jam and whipped cream, finished with icing sugar.',
    base_servings: 8,
    prep_time_minutes: 30,
    cook_time_minutes: 25,
    tags: ['british', 'cake', 'baking', 'dessert'],
    ingredients: [
      { quantity: 4, unit: null, name: 'medium eggs', prep_note: 'room temperature' },
      { quantity: 175, unit: 'g', name: 'unsalted butter', prep_note: 'softened (weigh eggs and match weight)' },
      { quantity: 175, unit: 'g', name: 'caster sugar' },
      { quantity: 0.75, unit: 'tsp', name: 'vanilla extract' },
      { quantity: 175, unit: 'g', name: 'self-raising flour' },
      { quantity: 1, unit: 'tbsp', name: 'warm water' },
      { quantity: 6, unit: 'tbsp', name: 'raspberry jam', prep_note: 'good quality' },
      { quantity: 150, unit: 'ml', name: 'double or whipping cream', prep_note: 'well chilled, optional' },
      { quantity: null, unit: null, name: 'icing sugar', prep_note: 'for dusting' },
    ],
    steps: [
      'Preheat oven to 180°C/160°C fan/350°F. Grease and line two 20.5cm round sandwich cake tins.',
      'Weigh the eggs in their shells — use that same weight for the butter, sugar, and flour.',
      'Beat softened butter until creamy and mayonnaise-like. Gradually beat in the sugar a couple of tablespoons at a time until light and fluffy, about 1 minute after all sugar is added.',
      'Beat the eggs with vanilla in a small jug, then add to the butter mixture a tablespoon at a time, beating well after each addition. If it looks like it might curdle, stir in 1 tbsp flour with the last two egg additions.',
      'Sift the flour over the mixture. Fold in gently with a large metal spoon, adding the warm water after the first few folds. Continue until just combined with no streaks.',
      'Divide batter between the two tins and spread evenly.',
      'Bake 20–25 minutes until light golden and starting to pull away from the sides. The sponge should spring back when lightly pressed in the center.',
      'Run a knife around the inside of each tin, leave 1 minute to firm, then turn out onto a wire rack and cool completely.',
      'To assemble: set one sponge crust-side down on a serving plate. Spread with all the raspberry jam.',
      'Whip the cream to soft peaks and spread over the jam. Top with the second sponge crust-side up. Dust with icing sugar.',
    ],
  },
  {
    title: 'Instant Pot Greek Yogurt',
    description: 'Thick, creamy Greek yogurt made from a gallon of Fairlife whole milk. Yields about 2–2.5 quarts after straining.',
    base_servings: 8,
    prep_time_minutes: 20,
    cook_time_minutes: 630,
    tags: ['yogurt', 'instant-pot', 'dairy', 'breakfast'],
    ingredients: [
      { quantity: 1, unit: 'gallon', name: 'Fairlife whole milk', prep_note: '2 bottles — slightly under a gallon is fine' },
      { quantity: 2, unit: 'tbsp', name: 'nonfat powdered milk', prep_note: 'for smoother texture' },
      { quantity: 3, unit: 'tbsp', name: 'plain Greek yogurt', prep_note: 'starter — Costco works; freeze leftover starter in 1 tbsp ice cubes' },
    ],
    steps: [
      'Add milk to Instant Pot inner pot. Whisk in powdered milk until fully dissolved with no clumps.',
      'Press YOGURT → BOIL (glass lid or no lid). Let it complete — about 30–45 minutes.',
      'Cool milk to 105–110°F. Do not add starter above ~115°F or you will kill it.',
      'In a cup, mix 3 tbsp starter with ¼ cup of the warm milk until smooth. Pour back into pot and stir gently.',
      'Press YOGURT → NORMAL and set for 9.5–10 hours. Longer = more tang.',
      'Refrigerate the whole insert (or transfer to containers) for at least 4 hours to set.',
      'Scoop yogurt into a straining bag or strainer over a bowl. Refrigerate while straining — check at 2.5 hours, stop at your preferred thickness. Do not squeeze.',
      'Transfer to containers. Optionally whisk briefly for extra smoothness. Refrigerate.',
    ],
  },
  {
    title: 'Blueberry Muffins',
    description: 'Classic blueberry muffins with crushed and whole berries folded into a buttery batter, finished with a sugar crust.',
    base_servings: 12,
    prep_time_minutes: 15,
    cook_time_minutes: 33,
    tags: ['muffins', 'baking', 'breakfast', 'blueberry'],
    ingredients: [
      { quantity: 0.5, unit: 'cup', name: 'butter', prep_note: 'softened' },
      { quantity: 1.25, unit: 'cups', name: 'sugar' },
      { quantity: 2, unit: null, name: 'eggs' },
      { quantity: 1, unit: 'tsp', name: 'vanilla extract' },
      { quantity: 2, unit: 'cups', name: 'all-purpose flour' },
      { quantity: 0.5, unit: 'tsp', name: 'salt' },
      { quantity: 2, unit: 'tsp', name: 'baking powder' },
      { quantity: 0.5, unit: 'cup', name: 'milk' },
      { quantity: 2, unit: 'cups', name: 'blueberries', prep_note: 'washed, drained, and picked over' },
      { quantity: 3, unit: 'tsp', name: 'sugar', prep_note: 'for topping' },
    ],
    steps: [
      'Preheat oven to 375°F.',
      'Cream butter and 1¼ cups sugar until light.',
      'Add eggs one at a time, beating well after each. Add vanilla.',
      'Sift together flour, salt, and baking powder. Add to creamed mixture alternately with the milk.',
      'Crush ½ cup of blueberries with a fork and mix into the batter. Fold in the remaining whole berries.',
      'Line a 12-cup muffin tin with cupcake liners and fill with batter. Sprinkle 3 tsp sugar over the tops.',
      'Bake at 375°F for 30–35 minutes. Remove from tin and cool at least 30 minutes. Store uncovered.',
    ],
  },
  {
    title: 'Coleslaw',
    description: 'Creamy, tangy coleslaw with green and red cabbage, carrots, and a honey-cider dressing.',
    base_servings: 8,
    prep_time_minutes: 20,
    cook_time_minutes: null,
    tags: ['salad', 'side', 'american', 'cold'],
    ingredients: [
      { quantity: 1, unit: 'cup', name: 'mayonnaise' },
      { quantity: 1.5, unit: 'tbsp', name: 'apple cider vinegar' },
      { quantity: 1, unit: 'tbsp', name: 'honey' },
      { quantity: 0.75, unit: 'tsp', name: 'celery seeds' },
      { quantity: 1, unit: 'tsp', name: 'kosher salt' },
      { quantity: 0.5, unit: 'tsp', name: 'freshly ground black pepper' },
      { quantity: 0.5, unit: null, name: 'medium green cabbage', prep_note: 'very thinly sliced, about 4 cups' },
      { quantity: 1.5, unit: null, name: 'medium red cabbage', prep_note: 'very thinly sliced, about 4 cups' },
      { quantity: 2, unit: null, name: 'medium carrots', prep_note: 'peeled, julienned or grated' },
    ],
    steps: [
      'Whisk together mayonnaise, apple cider vinegar, honey, celery seeds, salt, and pepper in a large bowl.',
      'Add both cabbages and the carrots. Toss until evenly coated.',
      'Refrigerate until ready to serve. Best after at least 30 minutes for the flavors to meld.',
    ],
  },
  {
    title: 'Drop Biscuits',
    description: 'Freeform biscuits built on butter and shortening, layered before baking for flaky results. No rolling pin needed.',
    base_servings: 9,
    prep_time_minutes: 75,
    cook_time_minutes: 20,
    tags: ['biscuits', 'baking', 'bread', 'american'],
    ingredients: [
      { quantity: null, unit: null, name: 'sugar', prep_note: 'a small handful' },
      { quantity: 1, unit: 'stick', name: 'butter', prep_note: 'cut into small pieces' },
      { quantity: 2, unit: 'tbsp', name: 'shortening', prep_note: 'broken into small pieces' },
      { quantity: 2, unit: 'cups', name: 'all-purpose flour' },
      { quantity: 1, unit: 'tbsp', name: 'salt' },
      { quantity: 1, unit: 'tbsp', name: 'baking powder' },
      { quantity: 0.75, unit: 'cup', name: 'buttermilk', prep_note: 'or oat milk with a splash of apple cider vinegar' },
    ],
    steps: [
      'Add sugar, butter, and shortening to a bowl. Add flour, salt, and baking powder.',
      'Using your hands, mix everything together, breaking up the butter and shortening until the mixture has the consistency of wet sand.',
      'Add buttermilk and mix with your hands until the liquid is fully incorporated and the flour is fully hydrated.',
      'Turn out onto a counter and fold several times to create layers. Form into a slab, wrap in plastic wrap, and rest at least 1 hour (or overnight).',
      'Preheat oven to 400°F. Cut slab into 8 or 9 equal pieces. Lay on a lined baking sheet and bake until golden brown.',
    ],
  },
  {
    title: 'Focaccia',
    description: 'Light, bubbly focaccia with a crisp golden crust. Long cold ferment (12–14 hours) develops the flavor.',
    base_servings: 12,
    prep_time_minutes: 30,
    cook_time_minutes: 35,
    tags: ['bread', 'italian', 'baking', 'focaccia'],
    ingredients: [
      { quantity: 600, unit: 'g', name: 'lukewarm water', prep_note: '2½ cups' },
      { quantity: 0.5, unit: 'tsp', name: 'active dry yeast' },
      { quantity: 15, unit: 'g', name: 'honey', prep_note: '2½ tsp' },
      { quantity: 800, unit: 'g', name: 'all-purpose flour', prep_note: '5⅓ cups' },
      { quantity: 18, unit: 'g', name: 'Diamond Crystal kosher salt', prep_note: '2 tbsp, or 1 tbsp fine sea salt' },
      { quantity: 50, unit: 'g', name: 'extra-virgin olive oil', prep_note: '¼ cup, plus more for pan and finishing' },
      { quantity: null, unit: null, name: 'flaky salt', prep_note: 'for finishing' },
      { quantity: 5, unit: 'g', name: 'Diamond Crystal kosher salt', prep_note: '1½ tsp — for brine' },
      { quantity: 80, unit: 'g', name: 'lukewarm water', prep_note: '⅓ cup — for brine' },
    ],
    steps: [
      'Stir together water, yeast, and honey in a medium bowl to dissolve. In a large bowl, whisk flour and salt, then add yeast mixture and olive oil. Stir with a rubber spatula until just incorporated. Scrape down sides, cover with plastic wrap, and ferment at room temperature 12–14 hours until at least doubled.',
      'Oil an 18x13-inch rimmed baking sheet with 2–3 tbsp olive oil. Release dough from bowl, fold gently, and pour onto pan. Add 2 more tbsp olive oil over the top and gently spread. Stretch dough to edges by placing hands underneath and pulling outward. Repeat stretching once or twice over 30 minutes.',
      'Dimple the dough deeply with the pads of your first three fingers. Make the brine by stirring salt into water until dissolved. Pour brine over dough to fill the dimples. Proof 45 minutes until light and bubbly.',
      'Thirty minutes into the final proof, adjust rack to center and preheat oven to 450°F with a baking stone or inverted baking sheet on the rack.',
      'Sprinkle focaccia with flaky salt. Bake 25–30 minutes until bottom crust is crisp and golden. Move to upper rack and bake 5–7 minutes more to brown the top.',
      'Remove from oven and brush with 2–3 tbsp olive oil over the whole surface. Cool 5 minutes, then release with a metal spatula and transfer to a wire rack to cool completely.',
    ],
  },
  {
    title: "Mom's Cookies",
    description: 'Big, chewy chocolate chip cookies with butter and Crisco for a tender, rich texture. Freeze the dough flat for baking later.',
    base_servings: 24,
    prep_time_minutes: 15,
    cook_time_minutes: 10,
    tags: ['cookies', 'baking', 'dessert', 'chocolate'],
    ingredients: [
      { quantity: 2, unit: 'sticks', name: 'butter' },
      { quantity: 1, unit: null, name: 'Crisco (shortening)', prep_note: 'one standard stick' },
      { quantity: 1.5, unit: 'cups', name: 'brown sugar' },
      { quantity: 1.5, unit: 'cups', name: 'white sugar' },
      { quantity: 4, unit: null, name: 'eggs' },
      { quantity: 2, unit: 'tsp', name: 'vanilla extract' },
      { quantity: 2, unit: 'tsp', name: 'baking soda' },
      { quantity: 2, unit: 'tsp', name: 'salt' },
      { quantity: 4.75, unit: 'cups', name: 'all-purpose flour' },
      { quantity: null, unit: null, name: 'chocolate chips', prep_note: 'to taste' },
    ],
    steps: [
      'Cream butter and both sugars together.',
      'Add Crisco and mix thoroughly.',
      'Add eggs and mix well.',
      'Add baking soda, salt, flour, and chocolate chips. Mix until combined.',
      'Portion ¼ to ⅓ cup of dough per cookie. Mush the ball down slightly.',
      'Bake at 375°F for 10 minutes.',
      'To freeze: flatten dough balls before freezing. Bake from frozen at 350°F for about 12 minutes.',
    ],
  },
  {
    title: 'Pasta Fagioli',
    description: 'Hearty, deeply flavored pasta e fagioli built on a slow-cooked soffritto base with beans and big umami from miso or anchovies.',
    base_servings: 6,
    prep_time_minutes: 30,
    cook_time_minutes: 60,
    tags: ['pasta', 'italian', 'beans', 'soup'],
    ingredients: [
      { quantity: 4, unit: null, name: 'large carrots' },
      { quantity: 4, unit: null, name: 'celery stalks' },
      { quantity: 1, unit: null, name: 'large onion' },
      { quantity: 1, unit: 'lb', name: 'dried beans' },
      { quantity: 0.5, unit: 'cup', name: 'extra-virgin olive oil', prep_note: 'at least — be generous' },
      { quantity: 2, unit: 'tsp', name: 'oregano' },
      { quantity: 2, unit: 'tsp', name: 'fennel seed' },
      { quantity: 2, unit: 'tsp', name: 'Aleppo pepper or mild chili flake' },
      { quantity: 0.5, unit: 'tsp', name: 'cumin' },
      { quantity: 0.5, unit: 'tsp', name: 'turmeric' },
      { quantity: null, unit: null, name: 'miso', prep_note: 'a big blob — or substitute 6 anchovies' },
      { quantity: 0.25, unit: 'cup', name: 'tomato paste' },
      { quantity: null, unit: null, name: 'broth', prep_note: 'a few ladles' },
      { quantity: null, unit: null, name: 'dried shiitake mushrooms', prep_note: 'a few' },
      { quantity: null, unit: null, name: 'Parmesan rind' },
    ],
    steps: [
      'Puree the carrots, celery, and onion (or finely dice).',
      'Cook all the pureed vegetables in at least ½ cup olive oil with the lid on over a gentle simmer. Check every 5–10 minutes, stirring, until all the water has cooked off and you see pools of oil — about 30–40 minutes total.',
      'Pull half the soffritto and freeze it for next time.',
      'Add oregano, fennel seed, Aleppo pepper, cumin, and turmeric to the remaining soffritto.',
      'Stir in miso (or anchovies) and tomato paste.',
      'Add a few ladles of broth, dried shiitakes, and Parmesan rind. Add the beans and enough liquid to cover.',
      'Simmer until beans are tender. Cook pasta separately and add to serving bowls; ladle the fagioli over the top.',
    ],
  },
  {
    title: 'Pound Cake 2.0',
    description: 'A moist, rich loaf cake with a deeply browned crust and perfectly cracked top. Sour cream is the key to the tender crumb.',
    base_servings: 10,
    prep_time_minutes: 20,
    cook_time_minutes: 65,
    tags: ['cake', 'baking', 'dessert', 'loaf'],
    ingredients: [
      { quantity: 196, unit: 'g', name: 'unsalted butter', prep_note: '14 tbsp, room temperature, plus more for pan' },
      { quantity: 250, unit: 'g', name: 'granulated sugar', prep_note: '1¼ cups' },
      { quantity: 0.5, unit: 'tsp', name: 'baking powder' },
      { quantity: 0.5, unit: 'tsp', name: 'kosher salt' },
      { quantity: 3, unit: null, name: 'large eggs', prep_note: 'room temperature' },
      { quantity: 1, unit: null, name: 'large egg yolk', prep_note: 'room temperature' },
      { quantity: 120, unit: 'g', name: 'sour cream', prep_note: '½ cup, room temperature' },
      { quantity: 1, unit: 'tsp', name: 'vanilla extract' },
      { quantity: 187, unit: 'g', name: 'all-purpose flour', prep_note: '1½ cups' },
    ],
    steps: [
      'Set rack in lower-middle position. Heat oven to 350°F. Grease a 9x5-inch metal loaf pan with butter.',
      'Beat butter, sugar, baking powder, and salt on medium-high until pale and very fluffy, stopping to scrape down once — 6 to 8 full minutes. Don\'t stop early.',
      'On medium-high, beat in the eggs and yolk one at a time, scraping down after each. The batter should look fluffy and emulsified.',
      'Stir sour cream and vanilla together in a small bowl until smooth.',
      'Add half the sour cream; mix on medium-low until just incorporated, about 15 seconds. Add half the flour; mix 15 seconds. Repeat with remaining sour cream then flour. Scrape and fold a few times by hand.',
      'Scrape batter into prepared pan and level roughly. Swipe a butter knife through the batter to eliminate air pockets and tap pan against the counter a few times. Wet a butter knife and slice down the center of the loaf (this creates an even crack).',
      'Bake 60–70 minutes until deeply browned, risen, split, and firm when pressed. Better to overbake than underbake. Shield with a baking sheet if the top darkens too fast.',
      'Cool in pan 10 minutes, loosen the sides with a spatula, tip onto your hand, and transfer to a wire rack to cool completely before slicing.',
    ],
  },
  {
    title: 'Thanksgiving Stock',
    description: 'Rich, gelatinous turkey and chicken stock with roasted wings, ham hock, and aromatics. The base for great gravy.',
    base_servings: 16,
    prep_time_minutes: 30,
    cook_time_minutes: 270,
    tags: ['stock', 'thanksgiving', 'turkey', 'sauce'],
    ingredients: [
      { quantity: 2, unit: 'lb', name: 'chicken wings' },
      { quantity: 6, unit: 'lb', name: 'turkey wings', prep_note: 'or substitute more chicken wings' },
      { quantity: 2, unit: 'tbsp', name: 'extra-virgin olive oil', prep_note: 'divided' },
      { quantity: 1, unit: null, name: 'large onion', prep_note: 'halved through root end' },
      { quantity: 2, unit: null, name: 'medium carrots', prep_note: 'scrubbed, very coarsely chopped' },
      { quantity: 2, unit: null, name: 'celery stalks', prep_note: 'very coarsely chopped' },
      { quantity: 1, unit: null, name: 'head of garlic', prep_note: 'halved crosswise' },
      { quantity: 8, unit: 'oz', name: 'crimini mushrooms', prep_note: 'halved' },
      { quantity: 1, unit: null, name: 'smoked ham hock' },
      { quantity: 1, unit: null, name: 'bunch parsley' },
      { quantity: 3, unit: null, name: 'bay leaves' },
      { quantity: 0.25, unit: 'cup', name: 'dry white wine' },
      { quantity: 1, unit: 'tsp', name: 'black peppercorns' },
      { quantity: null, unit: null, name: 'kosher salt' },
    ],
    steps: [
      'Preheat oven to 425°F. Spread wings on a rimmed baking sheet, drizzle with 1 tbsp oil, and rub to coat. Roast, turning every 10 minutes, until deep brown, 30–40 minutes.',
      'Heat remaining 1 tbsp oil in a 3-gallon stockpot over medium. Add onion, carrots, celery, garlic, and mushrooms. Cook, stirring occasionally, until softened and lightly browned, 10–15 minutes.',
      'Add ham hock, parsley, bay leaves, wine, peppercorns, and a pinch of salt. Bring to a boil and cook until wine evaporates, about 5 minutes.',
      'Add roasted wings. Scrape any crispy bits from the baking sheet into the pot with a little water. Add another pinch of salt and 2 gallons water. Bring to a boil, then reduce heat and simmer uncovered until meat is falling apart and liquid is reduced by half, 3½–4½ hours.',
      'Scoop out large vegetable pieces and discard. Strain stock into a large pot; discard solids. Let cool, then refrigerate until cold. Skim the solidified fat from the top. Ladle into containers. Keeps 1 week in the fridge or up to 6 months frozen.',
    ],
  },
];

(async () => {
  console.log(`\nInserting ${recipes.length} recipes…\n`);
  for (const r of recipes) {
    process.stdout.write(`  ⏳  ${r.title}… `);
    try {
      await addRecipe(r);
      console.log('✅');
    } catch (e) {
      console.log(`❌  ${e.message}`);
    }
  }
  console.log('\nDone! https://cdewittburrow.github.io/recipe-book/\n');
})();
