import { navigateTo, makeRequest } from "../app.js";

export default function renderCreateParty(data = {}) {
  const storedUser = localStorage.getItem("adminUser");
  const adminUser = storedUser ? JSON.parse(storedUser) : null;
  const administratorName = adminUser?.name || "";

  // Opciones predefinidas de tags
  const TAG_OPTIONS = [
    "Elegant", "Cocktailing", "Summer", "Outdoor", "Disco Music", "Electronic", "Neon", "House", "Techno", "Deep House", "Funk", "Lounge", "Chill", "Retro", "Synthwave", "Jazz", "Tropical", "Minimalist", "Luxury", "Futuristic", "Vintage", "Bohemian", "Industrial", "Art Deco", "Neon Lights", "Cyberpunk", "Urban", "Beach", "Nightlife", "Rooftop", "Pool Party", "Brunch", "Afterwork", "Festival", "Concert", "Bar", "Club", "Energetic", "Romantic", "Relaxed", "Vibrant", "Playful", "Bold", "Mysterious", "Dreamy", "Confident", "Trendy"
  ];
  const tagsOptionsHtml = TAG_OPTIONS.map(tag => `
    <label class="tag-option">
      <input type="checkbox" name="party-tag" value="${tag}"> ${tag}
    </label>
  `).join("");
  const app = document.getElementById("app");
  app.innerHTML = `
    <div id="create-party-screen">
      <div class="create-party-content">
        <h1>Create Party</h1>
        <form id="create-party-form" novalidate>
          <div class="form-group">
            <label>Title</label>
            <input type="text" id="party-title" required />
          </div>

          <div class="form-group">
            <label>Dirección</label>
            <input type="text" id="party-address" placeholder="Calle 23 #32-26" required />
          </div>
           <div class="form-group">
             <label>Ciudad</label>
             <input type="text" id="party-city" placeholder="Cali" required />
           </div>
           <div class="form-group">
             <label>País</label>
             <input type="text" id="party-country" placeholder="Colombia" value="Colombia" required />
           </div>
           <small class="hint">Se enviará como: Dirección, Ciudad, País</small>

          <div class="form-row">
            <div class="form-group">
              <label>Date</label>
              <input type="date" id="party-date" required />
            </div>
            <div class="form-group">
              <label>Hour</label>
              <input type="time" id="party-hour" required />
            </div>
          </div>

          <div class="form-group">
            <label>Maximum Attendees</label>
            <input type="number" id="party-attendees-max" min="1" required />
          </div>

          <div class="form-group">
            <label>Administrator Name</label>
            <input type="text" id="party-administrator" value="${administratorName}" required />
          </div>

          <div class="form-group">
            <label>Image URL</label>
            <input type="url" id="party-image" placeholder="https://..." />
          </div>

          <div class="form-group">
            <label>Tags (elige uno o más)</label>
            <div id="party-tags-multiselect" class="multi-select">
              <button type="button" id="party-tags-toggle" class="multi-select-toggle">Selecciona tags</button>
              <div id="party-tags-menu" class="multi-select-menu">
                ${tagsOptionsHtml}
              </div>
              <div id="party-tags-chips" class="multi-select-chips"></div>
            </div>
          </div>

          <div class="form-group">
            <!-- Category removed: it will be auto-assigned -->
            <!--
            <select id="party-category" required>
              <option value="hot-topic">hot-topic</option>
              <option value="upcoming">upcoming</option>
            </select>
            -->
          </div>

          <div class="form-group">
            <label>Tickets management</label>
            <div id="prices-list">
              <div class="price-item" data-idx="0">
                <input type="text" class="price-value-input" placeholder="$10.000" required />
              </div>
            </div>
            <div class="form-row">
              <button type="button" id="add-price-btn">+ Add</button>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" id="create-btn">Create</button>
            <button type="button" id="cancel-btn">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const form = document.getElementById("create-party-form");
  const cancelBtn = document.getElementById("cancel-btn");
  const addPriceBtn = document.getElementById("add-price-btn");
  const pricesList = document.getElementById("prices-list");

  const pricesState = [];

  // Setup tags multiselect behavior
  const tagsMulti = document.getElementById("party-tags-multiselect");
  const tagsToggle = document.getElementById("party-tags-toggle");
  const tagsMenu = document.getElementById("party-tags-menu");
  const tagsChips = document.getElementById("party-tags-chips");
  const tagCheckboxes = Array.from(document.querySelectorAll('input[name="party-tag"]'));

  const updateTagSummary = () => {
    const selected = tagCheckboxes.filter(cb => cb.checked).map(cb => cb.value);
    tagsToggle.textContent = selected.length ? `Tags (${selected.length})` : 'Selecciona tags';
    tagsChips.innerHTML = selected.map(tag => `<span class="chip">${tag}</span>`).join('');
  };

  tagsToggle.addEventListener('click', () => {
    tagsMenu.classList.toggle('open');
  });

  document.addEventListener('click', (ev) => {
    if (!tagsMulti.contains(ev.target)) {
      tagsMenu.classList.remove('open');
    }
  });

  tagCheckboxes.forEach(cb => cb.addEventListener('change', updateTagSummary));
  updateTagSummary();

  // Add a new editable price row (single input)
  addPriceBtn.addEventListener("click", () => {
    pricesState.push({ price: "" });
    renderPriceItems();
  });

  // Render dynamic editable rows for prices (single input per row)
  function renderPriceItems() {
    pricesList.innerHTML = pricesState
      .map((p, idx) => `
      <div class="price-item" data-idx="${idx}">
        <input type="text" class="price-value-input" placeholder="$10.000" value="${p.price || ""}" ${idx === 0 ? "required" : ""} />
        ${idx > 0 ? `<button type="button" data-idx="${idx}" class="remove-price">🗑️</button>` : ""}
      </div>
    `)
      .join("");

    // Bind input events to update state
    Array.from(pricesList.querySelectorAll(".price-item")).forEach((row) => {
      const idx = parseInt(row.getAttribute("data-idx"), 10);
      const valueInput = row.querySelector(".price-value-input");
      valueInput.addEventListener("input", (e) => {
        pricesState[idx].price = e.target.value;
      });
    });

    // Bind remove buttons
    Array.from(pricesList.querySelectorAll(".remove-price")).forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.currentTarget.getAttribute("data-idx"), 10);
        pricesState.splice(idx, 1);
        renderPriceItems();
      });
    });
  }

  // Initialize with one empty price row (required)
  pricesState.push({ price: "" });
  renderPriceItems();

  cancelBtn.addEventListener("click", () => navigateTo("/admin-dashboard"));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById("create-btn");
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Creating...";
    submitBtn.disabled = true;

    try {
      const title = document.getElementById("party-title").value.trim();
      const address = document.getElementById("party-address").value.trim();
      const city = document.getElementById("party-city").value.trim();
      const country = document.getElementById("party-country").value.trim();
      const location = [address, city, country].filter(Boolean).join(", ");
       const dateVal = document.getElementById("party-date").value; // yyyy-mm-dd
       const hourVal = document.getElementById("party-hour").value; // HH:mm
       const maxAtt = parseInt(document.getElementById("party-attendees-max").value, 10);
       const administrator = document.getElementById("party-administrator").value.trim();
       const image = document.getElementById("party-image").value.trim();
       // category selector fue eliminado; no leerlo del DOM
      if (!title || !address || !city || !country || !dateVal || !hourVal || !administrator) {
         alert("Por favor, completa todos los campos obligatorios.");
         submitBtn.textContent = originalText;
         submitBtn.disabled = false;
         return;
       }
      if (!maxAtt || maxAtt < 1) {
        alert("Maximum attendees must be at least 1.");
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
      }

      const attendees = `0/${maxAtt}`;
      const tags = Array.from(document.querySelectorAll('input[name="party-tag"]:checked')).map(el => el.value);

      // Validación: al menos un precio ingresado
      const priceInputs = Array.from(pricesList.querySelectorAll(".price-value-input"));
      const priceValues = priceInputs.map(inp => inp.value.trim()).filter(Boolean);
      if (priceValues.length === 0) {
        alert("Por favor ingresa al menos un precio.");
        const firstInput = pricesList.querySelector(".price-value-input");
        if (firstInput) firstInput.focus();
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
      }

      // Colectar precios y autogenerar nombres secuenciales
      const collectedPrices = priceValues.map((val, i) => ({
        price_name: `Ticket ${i + 1}`,
        price: val,
      }));

      const payload = {
        title,
        location,
        date: dateVal,
        hour: hourVal,
        attendees,
        administrator,
        image,
        tags,
        prices: collectedPrices,
      };

      console.log("[createParty] submitting payload:", payload);

      const resp = await makeRequest("/newParty", "POST", payload);
      if (resp && resp.success) {
        alert("Party created successfully!");
        navigateTo("/admin-dashboard");
      } else {
        alert(resp?.message || "Failed to create party");
      }
    } catch (err) {
      console.error("Create party error:", err);
      alert("An error occurred creating the party.");
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });
}

function formatDate(yyyyMmDd) {
  try {
    const [y, m, d] = yyyyMmDd.split("-");
    return `${parseInt(d, 10)}/${parseInt(m, 10)}/${String(y).slice(2)}`;
  } catch {
    return yyyyMmDd;
  }
}