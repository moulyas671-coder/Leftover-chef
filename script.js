// ==========================================
// LEFTOVER CHEF - SMART FOOD MANAGEMENT
// ==========================================

// Backend API address
const API_URL = "http://localhost:5000";

// HTML elements
const foodList = document.getElementById("foodList");
const foodModal = document.getElementById("foodModal");
const foodForm = document.getElementById("foodForm");

const totalItems = document.getElementById("totalItems");
const expiringItems = document.getElementById("expiringItems");

const recipeSuggestions = document.getElementById("recipeSuggestions");
const recipeDetailView = document.getElementById("recipeDetailView");
const closeRecipeDetailsButton = document.getElementById("closeRecipeDetails");

let foods = [];
let currentRecipes = [];
let recipeImageCache = {};


// ==========================================
// GET TODAY'S DATE
// ==========================================

function getToday() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// ==========================================
// FORMAT DATE
// ==========================================

function formatDate(dateValue) {
    return new Date(dateValue + "T00:00:00").toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


// ==========================================
// CHECK EXPIRY STATUS
// ==========================================

function getExpiry(dateValue) {
    const today = new Date(getToday() + "T00:00:00");
    const expiry = new Date(dateValue + "T00:00:00");

    const difference = Math.round(
        (expiry - today) / (1000 * 60 * 60 * 24)
    );

    if (difference < 0) {
        return { text: "Expired", className: "danger" };
    }

    if (difference === 0) {
        return { text: "Expires today", className: "danger" };
    }

    if (difference === 1) {
        return { text: "1 day left", className: "danger" };
    }

    if (difference <= 3) {
        return {
            text: difference + " days left",
            className: "danger"
        };
    }

    return {
        text: difference + " days left",
        className: "warning"
    };
}


// ==========================================
// SAVE FOOD ITEMS
// ==========================================

function saveFoods() {
    localStorage.setItem(
        "leftoverChefFoods",
        JSON.stringify(foods)
    );
}


// ==========================================
// LOAD FOOD ITEMS
// ==========================================

function loadFoods() {
    const savedFoods = localStorage.getItem("leftoverChefFoods");

    if (savedFoods !== null) {
        try {
            foods = JSON.parse(savedFoods);

            if (!Array.isArray(foods)) {
                foods = [];
            }

            return;
        } catch (error) {
            console.error("Could not load saved food items:", error);
        }
    }

    // Load sample food items from HTML the first time

    foods = [];

    document.querySelectorAll("#foodList .food-item").forEach(function(item) {

        const name = item.querySelector("h3").textContent;
        const image = item.querySelector("img")?.src || "";

        const dateText = item.querySelector(".food-details p").textContent;

        const parsedDate = new Date(
            dateText.replace("Expires: ", "")
        );

        const dateValue =
            parsedDate.getFullYear() + "-" +
            String(parsedDate.getMonth() + 1).padStart(2, "0") + "-" +
            String(parsedDate.getDate()).padStart(2, "0");

        foods.push({
            id: Date.now() + Math.random(),
            name: name,
            expiry: dateValue,
            image: image
        });
    });

    saveFoods();
}


// ==========================================
// DISPLAY FOOD ITEMS
// ==========================================


function displayFoods() {

    foodList.innerHTML = "";

    foods.forEach(function(food) {

        const status = getExpiry(food.expiry);

        const item = document.createElement("div");
        item.className = "food-item";

        const image = food.image
            ? `<img src="${escapeHTML(food.image)}" alt="${escapeHTML(food.name)}">`
            : `<div class="food-placeholder">
                   <i class="fa-solid fa-carrot"></i>
               </div>`;

        item.innerHTML = `
            ${image}

            <div class="food-details">
                <h3>${escapeHTML(food.name)}</h3>
                <p>Expires: ${formatDate(food.expiry)}</p>
            </div>

            <span class="expiry ${status.className}">
                ${status.text}
            </span>

            <button class="remove-btn" aria-label="Remove food item">
                <i class="fa-solid fa-check"></i>
            </button>
        `;

        item.dataset.id = food.id;

        foodList.appendChild(item);

        if (!food.image) {
            loadFoodImage(food, item);
        }

    });

    updateCounts();
    filterFoods();
    updateRecipeRecommendation();
}


async function loadFoodImage(food, item) {

    try {

        const response = await fetch(
            `${API_URL}/api/food-image?name=${encodeURIComponent(food.name)}`
        );

        if (!response.ok) {
            throw new Error("Image request failed");
        }

        const data = await response.json();

        if (data.photo && data.photo.imageUrl) {

            food.image = data.photo.imageUrl;
            saveFoods();
            
            const imageContainer = item.querySelector(".food-placeholder");

            if (imageContainer) {

                const img = document.createElement("img");

                img.src = data.photo.imageUrl;
                img.alt = food.name;
                img.className = "food-item-image";

                imageContainer.replaceWith(img);
            }
        }

    } catch (error) {

        console.log(
            "Could not load image for " + food.name,
            error.message
        );

    }

}


// ==========================================
// UPDATE DASHBOARD STATISTICS
// ==========================================

function updateCounts() {

    totalItems.textContent = foods.length;

    let count = 0;

    foods.forEach(function(food) {

        const today = new Date(getToday() + "T00:00:00");
        const expiry = new Date(food.expiry + "T00:00:00");

        const difference = Math.round(
            (expiry - today) / (1000 * 60 * 60 * 24)
        );

        if (difference >= 0 && difference <= 3) {
            count++;
        }
    });

    expiringItems.textContent = count;
}


// ==========================================
// PROTECT FOOD NAME AND IMAGE
// ==========================================

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function(character) {

        const replacements = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return replacements[character];
    });
}


// ==========================================
// OPEN AND CLOSE FOOD MODAL
// ==========================================

function openModal() {
    foodModal.classList.add("show");
}

function closeModal() {
    foodModal.classList.remove("show");
}

document.getElementById("addFoodBtn").addEventListener("click", openModal);

document.getElementById("welcomeAddBtn").addEventListener("click", openModal);

document.getElementById("closeModal").addEventListener("click", closeModal);

foodModal.addEventListener("click", function(event) {

    if (event.target === foodModal) {
        closeModal();
    }
});


// ==========================================
// ADD NEW FOOD ITEM
// ==========================================

foodForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const name = document.getElementById("foodName").value.trim();
    const expiry = document.getElementById("expiryDate").value;

    if (!name || !expiry) {
        alert("Please enter all details.");
        return;
    }

    foods.push({
        id: Date.now() + Math.random(),
        name: name,
        expiry: expiry,
        image: ""
    });

    saveFoods();
    displayFoods();

    foodForm.reset();
    closeModal();

    alert(name + " added successfully!");
});


// ==========================================
// REMOVE FOOD ITEM
// ==========================================

foodList.addEventListener("click", function(event) {

    const button = event.target.closest(".remove-btn");

    if (!button) return;

    const item = button.closest(".food-item");
    const id = Number(item.dataset.id);

    const food = foods.find(function(f) {
        return Number(f.id) === id;
    });

    if (food && confirm("Remove " + food.name + " from your inventory?")) {

        foods = foods.filter(function(f) {
            return Number(f.id) !== id;
        });

        saveFoods();
        displayFoods();
    }
});


// ==========================================
// SEARCH FOOD ITEMS
// ==========================================

const searchInput = document.getElementById("searchInput");

function filterFoods() {

    const searchValue = searchInput.value.toLowerCase();

    document.querySelectorAll("#foodList .food-item").forEach(function(item) {

        const name = item.querySelector("h3").textContent.toLowerCase();

        item.style.display = name.includes(searchValue) ? "flex" : "none";
    });
}

searchInput.addEventListener("input", filterFoods);


// ==========================================
// QUICK ACTION BUTTONS
// ==========================================

document.getElementById("scanBtn").addEventListener("click", function() {
    alert("Barcode and OCR scanning will be developed next.");
});

document.getElementById("shareBtn").addEventListener("click", function() {
    alert("Food sharing and donation will be developed next.");
});

document.getElementById("trackBtn").addEventListener("click", function() {
    document.getElementById("savings").scrollIntoView({
        behavior: "smooth"
    });
});


// ==========================================
// FIND THE FOOD THAT EXPIRES FIRST
// ==========================================

function getFirstExpiringFood() {

    const today = new Date(getToday() + "T00:00:00");

    const upcomingFoods = foods
        .filter(function(food) {

            const expiry = new Date(food.expiry + "T00:00:00");

            return expiry >= today;
        })
        .sort(function(a, b) {
            return a.expiry.localeCompare(b.expiry);
        });

    return upcomingFoods.length > 0 ? upcomingFoods[0] : null;
}


// ==========================================
// GET THE BEST THREE MATCHING RECIPES
// ==========================================

async function updateRecipeRecommendation() {
    const firstFood = getFirstExpiringFood();
    currentRecipes = [];
    recipeSuggestions.innerHTML = "";

    if (!firstFood) {
        recipeSuggestions.innerHTML = '<p class="recipe-empty">Add a food item with a future expiry date to receive recipe suggestions.</p>';
        return;
    }

    recipeSuggestions.innerHTML = '<p class="recipe-loading">Finding recipes using ' +
        escapeHTML(firstFood.name) + '...</p>';

    try {
        const response = await fetch(API_URL + "/api/recipes?ingredient=" + encodeURIComponent(firstFood.name));
        if (!response.ok) throw new Error("Unable to fetch recipes.");

        const data = await response.json();
        const recipes = Array.isArray(data.recipes) ? data.recipes.slice(0, 3) : [];

        if (recipes.length === 0) {
            recipeSuggestions.innerHTML = '<p class="recipe-empty">No matching recipes were found for ' +
                escapeHTML(firstFood.name) + '. Try adding another ingredient.</p>';
            return;
        }

        currentRecipes = recipes;
        recipeSuggestions.innerHTML = "";

        recipes.forEach(function(recipe, index) {
            const card = document.createElement("article");
            card.className = "recipe-option";

            const image = document.createElement("img");
            image.className = "recipe-option-image";
            image.alt = recipe.name || "Recipe";
            image.src = "https://images.unsplash.com/photo-1547592180-85f173990554?w=400";
            card.appendChild(image);

            const content = document.createElement("div");
            const title = document.createElement("h3");
            title.textContent = recipe.name || "Suggested recipe";

            const description = document.createElement("p");
            description.textContent = "A recipe suggestion using " + firstFood.name + ".";

            const meta = document.createElement("div");
            meta.className = "recipe-option-meta";
            meta.innerHTML = '<span><i class="fa-regular fa-clock"></i>' +
                escapeHTML(recipe.totalTime || recipe.total_time || "Time unavailable") +
                '</span><span><i class="fa-solid fa-users"></i>' +
                escapeHTML(recipe.servings || "Not specified") + ' servings</span>';

            const button = document.createElement("button");
            button.type = "button";
            button.className = "recipe-button";
            button.innerHTML = 'View recipe <i class="fa-solid fa-arrow-right"></i>';
            button.addEventListener("click", function() { openRecipeDetails(index); });

            content.append(title, description, meta, button);
            card.appendChild(content);
            recipeSuggestions.appendChild(card);

            loadRecipeImage(recipe.name).then(function(url) {
                if (url) image.src = url;
            });
        });
    } catch (error) {
        console.error("Recipe loading error:", error);
        recipeSuggestions.innerHTML = '<p class="recipe-empty">Unable to load recipes. Please check that the Leftover Chef recipe server is running at localhost:5000.</p>';
    }
}


// ==========================================
// LOAD A RECIPE PHOTOGRAPH FROM UNSPLASH
// ==========================================

async function loadRecipeImage(recipeName) {
    if (!recipeName) return "";
    if (recipeImageCache[recipeName]) return recipeImageCache[recipeName];

    try {
        const response = await fetch(API_URL + "/api/recipe-image?name=" + encodeURIComponent(recipeName));
        if (!response.ok) return "";

        const data = await response.json();

        if (data.photo && data.photo.imageUrl) {
            recipeImageCache[recipeName] = data.photo.imageUrl;
            return data.photo.imageUrl;
        }
    } catch (error) {
        console.error("Image loading error:", error);
    }

    return "";
}


// ==========================================
// OPEN THE RECIPE DETAILS VIEW
// ==========================================

function openRecipeDetails(index) {
    const recipe = currentRecipes[index];
    if (!recipe) return;

    document.getElementById("detailRecipeName").textContent =
        recipe.name || "Recipe details";

    document.getElementById("detailRecipeSummary").textContent =
        "Make the most of your ingredients with this recipe.";

    document.getElementById("detailPrepTime").textContent =
        recipe.prepTime || recipe.prep_time || "Not available";

    document.getElementById("detailCookTime").textContent =
        recipe.cookTime || recipe.cook_time || "Not available";

    document.getElementById("detailServings").textContent =
        recipe.servings || "Not specified";

    const ingredientList = document.getElementById("detailIngredients");
    ingredientList.innerHTML = "";

    const ingredients = splitRecipeText(recipe.ingredients);

    if (!ingredients.length) {
        ingredients.push("Ingredient details are not available.");
    }

    ingredients.forEach(function(item) {
        const li = document.createElement("li");
        li.textContent = item;
        ingredientList.appendChild(li);
    });

    const instructionList = document.getElementById("detailInstructions");
    instructionList.innerHTML = "";

    const steps = splitInstructions(recipe.instructions);

    if (!steps.length) {
        steps.push("Preparation instructions are not available in the dataset.");
    }

    steps.forEach(function(step) {
        const li = document.createElement("li");
        li.textContent = step;
        instructionList.appendChild(li);
    });

    const sourceLink = document.getElementById("detailSourceLink");
    const source = recipe.source || recipe.url || "";

    if (source && /^https?:\/\//i.test(source)) {
        sourceLink.href = source;
        sourceLink.hidden = false;
    } else {
        sourceLink.hidden = true;
        sourceLink.removeAttribute("href");
    }

    const detailImage = document.getElementById("detailRecipeImage");

    detailImage.src =
        "https://images.unsplash.com/photo-1547592180-85f173990554?w=900";

    detailImage.alt = recipe.name || "Recipe";

    loadRecipeImage(recipe.name).then(function(url) {
        if (
            url &&
            document.getElementById("detailRecipeName").textContent === recipe.name
        ) {
            detailImage.src = url;
        }
    });

    recipeDetailView.classList.add("show");
    recipeDetailView.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
}


// ==========================================
// CLOSE THE RECIPE DETAILS VIEW
// ==========================================

function closeRecipeDetails() {
    recipeDetailView.classList.remove("show");
    recipeDetailView.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
}


// ==========================================
// FORMAT INGREDIENTS
// ==========================================

function splitRecipeText(value) {
    if (!value) return [];

    if (Array.isArray(value)) {
        return value.map(x => String(x).trim()).filter(Boolean);
    }

    return String(value)
        .replace(/^\s*\[|\]\s*$/g, "")
        .split(/\r?\n|,(?=\s*[A-Z0-9])/)
        .map(x => x.replace(/^['"\s-]+|['"\s]+$/g, "").trim())
        .filter(Boolean);
}


// ==========================================
// FORMAT COOKING INSTRUCTIONS
// ==========================================

function splitInstructions(value) {
    if (!value) return [];

    if (Array.isArray(value)) {
        return value.map(x => String(x).trim()).filter(Boolean);
    }

    return String(value)
        .split(/\r?\n|(?<=[.!?])\s+(?=[A-Z0-9])/)
        .map(x => x.replace(/^\s*\d+[.)-]?\s*/, "").trim())
        .filter(Boolean);
}


// ==========================================
// RECIPE DETAILS EVENT LISTENERS
// ==========================================

closeRecipeDetailsButton.addEventListener("click", closeRecipeDetails);

recipeDetailView.addEventListener("click", function(event) {
    if (event.target === recipeDetailView) {
        closeRecipeDetails();
    }
});

document.addEventListener("keydown", function(event) {
    if (
        event.key === "Escape" &&
        recipeDetailView.classList.contains("show")
    ) {
        closeRecipeDetails();
    }
});


// ==========================================
// SHOW TODAY'S DATE
// ==========================================

document.getElementById("todayDate").textContent =
    new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });


// ==========================================
// START DASHBOARD
// ==========================================

loadFoods();
displayFoods();
