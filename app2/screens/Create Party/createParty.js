import { navigateTo, makeRequest } from "../../app.js";

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
        <form id="create-party-form" novalidate>
          <div class="form-group">
            <div id="image-upload-card" class="image-upload-card" role="button" tabindex="0" aria-label="Upload image">
              <div class="upload-inner">
                <img src="./assets/uploadImage.svg" alt="Upload" class="upload-img" />
                <span class="upload-text">Upload Image</span>
              </div>
            </div>
            <input type="file" id="party-image-file" accept="image/*" hidden />
            <input type="hidden" id="party-image" />
          </div>

          <div class="form-group">
            <label>Title</label>
            <input type="text" id="party-title" required placeholder="ej: Rumbify Party" />
          </div>

          <div class="form-group">
            <label>Description</label>
            <textarea id="party-description" placeholder="Describe your party..." rows="4"></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Date</label>
              <input type="text" id="party-date" placeholder="dd/mm/aaaa" required />
            </div>
            <div class="form-group">
              <label>Hour</label>
              <input type="text" id="party-hour" placeholder="hh:mm" required />
            </div>
          </div>

          <div class="form-group">
            <label>Dirección</label>
            <input type="text" id="party-address" placeholder="Calle 23 #32-26" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Ciudad</label>
              <input type="text" id="party-city" placeholder="Cali" required />
            </div>
            <div class="form-group">
              <label>País</label>
              <input type="text" id="party-country" placeholder="Colombia" value="Colombia" required />
            </div>
          </div>

          <div class="form-group">
            <label>Maximum Attendees</label>
            <input type="number" id="party-attendees-max" min="1" required placeholder="ejemplo: 100" />
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
            <div class="tickets-header">
              <label>Tickets management</label>
              <button type="button" id="add-price-btn">Add</button>
            </div>
            <div class="tickets-card">
              <div id="prices-list"></div>
            </div>
          </div>

          <div class="form-group">
            <label>Contact</label>
          </div>
          <div class="gradient-card contact-card">
            <div class="form-row">
              <div class="form-group">
                <input type="text" id="party-administrator" value="${administratorName}" required placeholder="Administrator Name" />
              </div>
              <div class="form-group">
                <input type="text" id="party-number" placeholder="Contact number" />
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" id="create-btn">Create</button>
          </div>
        </form>
      </div>
      <nav class="bottom-nav">
        <div class="nav-item" id="nav-parties" data-nav="parties">
          <span class="nav-icon icon-party" aria-hidden="true"></span>
          <span class="nav-label">My Parties</span>
        </div>
        <div class="nav-item active" id="nav-new" data-nav="new">
          <span class="nav-icon icon-plus" aria-hidden="true"></span>
          <span class="nav-label">New Party</span>
        </div>
        <div class="nav-item" id="nav-profile" data-nav="profile">
          <span class="nav-icon icon-user" aria-hidden="true"></span>
          <span class="nav-label">Profile</span>
        </div>
      </nav>
    </div>
  `;

  // Cargar estilos específicos de la pantalla desde su propia carpeta
  const head = document.querySelector('head');
  const existing = document.querySelector('link[data-create-party-css]');
  if (!existing) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './screens/Create Party/createParty.css';
    link.setAttribute('data-create-party-css', 'true');
    head.appendChild(link);
  }

  const form = document.getElementById("create-party-form");
  const addPriceBtn = document.getElementById("add-price-btn");
  const pricesList = document.getElementById("prices-list");

  const pricesState = [];

  // Image upload: bind handlers after DOM is created
  const imageCard = document.getElementById("image-upload-card");
  const imageFileInput = document.getElementById("party-image-file");
  const imageHidden = document.getElementById("party-image");

  const openFileDialog = () => imageFileInput && imageFileInput.click();
  const setPreview = (url) => {
    if (!imageCard) return;
    imageCard.style.backgroundImage = `url('${url}')`;
    imageCard.style.backgroundSize = 'cover';
    imageCard.style.backgroundPosition = 'center';
    imageCard.classList.add('has-image');
  };

  if (imageCard && imageFileInput) {
    imageCard.addEventListener('click', openFileDialog);
    imageCard.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openFileDialog();
      }
    });

    imageFileInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      // Preview with object URL
      const localUrl = URL.createObjectURL(file);
      setPreview(localUrl);

      // Try upload to Supabase Storage if available
      try {
        const { supabaseCli } = await import('../../services/supabase.service.js');
        const bucket = 'party-images';
        const filePath = `party_${Date.now()}_${file.name}`.replace(/\s+/g, '_');
        const { data, error } = await supabaseCli.storage.from(bucket).upload(filePath, file, { upsert: true, contentType: file.type });
        if (error) throw error;
        const { data: pub } = await supabaseCli.storage.from(bucket).getPublicUrl(filePath);
        if (pub && pub.publicUrl) {
          imageHidden.value = pub.publicUrl;
        } else {
          imageHidden.value = localUrl;
        }
      } catch (err) {
        // Fallback: keep local object URL
        imageHidden.value = localUrl;
        console.warn('Image upload fallback:', err);
      }
    });
  }

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
    pricesState.push({ price_name: "", price: "" });
    renderPriceItems();
  });

  // Render dynamic editable rows for prices (two inputs per row: name + value)
  function renderPriceItems() {
    pricesList.innerHTML = pricesState
      .map((p, idx) => `
      <div class="price-item" data-idx="${idx}">
        <input type="text" class="price-name-input" placeholder="Name" value="${p.price_name || ""}" ${idx === 0 ? "required" : ""} />
        <input type="text" class="price-value-input" placeholder="$10.000" value="${p.price || ""}" ${idx === 0 ? "required" : ""} />
        ${idx > 0 ? `<button type="button" data-idx="${idx}" class="remove-price" aria-label="Delete price"></button>` : `<button type="button" class="remove-price placeholder" aria-hidden="true" tabindex="-1"></button>`}
      </div>
    `)
      .join("");
  
    // Bind input events to update state
    Array.from(pricesList.querySelectorAll(".price-item")).forEach((row) => {
      const idx = parseInt(row.getAttribute("data-idx"), 10);
      const nameInput = row.querySelector(".price-name-input");
      const valueInput = row.querySelector(".price-value-input");
      nameInput.addEventListener("input", (e) => {
        pricesState[idx].price_name = e.target.value;
      });
      valueInput.addEventListener("input", (e) => {
        pricesState[idx].price = e.target.value;
      });
    });
  
    // Bind remove buttons
    Array.from(pricesList.querySelectorAll(".remove-price")).forEach((btn) => {
      if (btn.classList.contains("placeholder")) return; // no bind
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.currentTarget.getAttribute("data-idx"), 10);
        pricesState.splice(idx, 1);
        renderPriceItems();
      });
    });
  }

  // Initialize with one empty price row (required)
  pricesState.push({ price_name: "", price: "" });
  renderPriceItems();

  // Initialize flatpickr for date and time with Spanish locale and altInput
  if (window.flatpickr) {
    // Date picker: display dd/mm/aaaa, submit Y-m-d
    flatpickr("#party-date", {
      altInput: true,
      altFormat: "d/m/Y",
      dateFormat: "Y-m-d",
      locale: flatpickr.l10ns.es,
      allowInput: true,
    });

    // Time picker: display hh:mm K, submit H:i
    flatpickr("#party-hour", {
      enableTime: true,
      noCalendar: true,
      altInput: true,
      altFormat: "h:i K",
      dateFormat: "H:i",
      locale: flatpickr.l10ns.es,
      time_24hr: false,
      allowInput: true,
    });
  }

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
      const number = document.getElementById("party-number").value.trim();
      const image = document.getElementById("party-image").value.trim();
      const description = document.getElementById("party-description")?.value.trim() || "";
      const attendees = `0/${maxAtt}`;

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

      const tags = Array.from(document.querySelectorAll('input[name="party-tag"]:checked')).map(el => el.value);

      // Validación: al menos un precio ingresado
      const rows = Array.from(pricesList.querySelectorAll(".price-item"));
      const collectedPrices = rows.map((row, i) => {
        const name = row.querySelector(".price-name-input")?.value.trim();
        const val = row.querySelector(".price-value-input")?.value.trim();
        if (!val) return null; // omit rows without price
        return { price_name: name || `Ticket ${i + 1}`, price: val };
      }).filter(Boolean);
      if (collectedPrices.length === 0) {
        alert("Por favor ingresa al menos un precio.");
        const firstInput = pricesList.querySelector(".price-value-input");
        if (firstInput) firstInput.focus();
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
      }

      const payload = {
        title,
        location,
        date: dateVal,
        hour: hourVal,
        attendees,
        administrator,
        number,
        category: "upcoming",
        image,
        tags,
        description,
      };

      const createRes = await makeRequest("/newParty", "POST", payload);
      if (!createRes || createRes.error) {
        throw new Error(createRes?.error || "Error creating party");
      }

      const partyId = createRes.data?.id || createRes.id;
      if (!partyId) {
        throw new Error("No party id returned");
      }

      // Insertar precios
      for (const price of collectedPrices) {
        const priceRes = await makeRequest(`/parties/${partyId}/prices`, "POST", price);
        if (!priceRes || priceRes.error) {
          throw new Error(priceRes?.error || "Error inserting price");
        }
      }

      alert("Party creada correctamente");
      navigateTo("/admin-dashboard");
    } catch (err) {
      console.error(err);
      alert(err.message || "Error creando la fiesta");
    } finally {
      const submitBtn = document.getElementById("create-btn");
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });

  // Bottom navigation interactions for Create Party screen
  const bottomNav = document.querySelector('.bottom-nav');
  if (bottomNav) {
    const navItems = Array.from(bottomNav.querySelectorAll('.nav-item'));
    navItems.forEach((item) => {
      item.style.touchAction = 'manipulation';
      item.addEventListener('click', () => {
        navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const target = item.dataset.nav;
        if (target === 'parties') {
          navigateTo('/admin-dashboard');
        } else if (target === 'new') {
          navigateTo('/create-party');
        } else if (target === 'profile') {
          navigateTo('/admin-dashboard');
        }
      });
    });
  } else {
    console.warn('bottom-nav not found on create-party');
  }
}

function formatDate(yyyyMmDd) {
  const [y, m, d] = yyyyMmDd.split("-");
  return `${d}/${m}/${y}`;
}

// [REMOVED] Global bottom-nav setup blocks to avoid duplicate/conflicting listeners
// Setup bottom navigation for Create Party screen (moved inside renderCreateParty)
// Setup bottom navigation interactions (moved inside renderCreateParty)
/* bottom-nav binding moved inside renderCreateParty */
