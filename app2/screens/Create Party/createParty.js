import { navigateTo, makeRequest } from "../../app.js";

export default function renderCreateParty(data = {}) {
  const storedUser = localStorage.getItem("adminUser");
  const adminUser = storedUser ? JSON.parse(storedUser) : null;
  const administratorName = adminUser?.name || "";

  // Recuperar contexto de edición desde URL/localStorage si no vino en data
  try {
    const params = new URLSearchParams(window.location.search);
    const qsEdit = params.get('edit');
    const qsId = params.get('id') || params.get('partyId');
    const storedCtx = JSON.parse(localStorage.getItem('createPartyEditContext') || 'null');
    if ((!data || (!data.edit && !data.partyId)) && (qsEdit || qsId)) {
      data = { ...data, edit: (qsEdit === '1' || qsEdit === 'true'), partyId: qsId ? Number(qsId) : undefined };
    }
    if ((!data.edit || !data.partyId) && storedCtx && storedCtx.partyId) {
      data = { ...data, edit: true, partyId: Number(storedCtx.partyId) };
    }
  } catch (_) {}

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

  // Log render context to aid debugging
  console.log('[create-party] renderCreateParty data:', data);

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
  // Track edit mode context
  let editContext = null;

  // Image upload: bind handlers after DOM is created
  const imageCard = document.getElementById("image-upload-card");
  const imageFileInput = document.getElementById("party-image-file");
  const imageHidden = document.getElementById("party-image");

  // Safe DOM helpers
  const getEl = (id) => document.getElementById(id);
  const getVal = (id) => {
    const el = getEl(id);
    return el ? el.value : "";
  };

  const openFileDialog = () => imageFileInput && imageFileInput.click();
  const setPreview = (url) => {
    if (!imageCard) return;
    imageCard.style.backgroundImage = `url('${url}')`;
    imageCard.style.backgroundSize = 'cover';
    imageCard.style.backgroundPosition = 'center';
    imageCard.classList.add('has-image');
  };
  // Helper to convert File -> dataURL (base64)
  const fileToDataURL = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // Prefill helpers for edit mode
  const prefillFromParty = async (partyId) => {
    try {
      console.log('[create-party] Prefill start for id:', partyId);
      const res = await makeRequest(`/parties/${partyId}`, 'GET');
      console.log('[create-party] GET /parties/:id response:', res);
      let details = (res && (res.party || res.data)) || (Array.isArray(res) ? res[0] : res);
      console.log('[create-party] Parsed details:', details);

      // Fallback: if no details returned (e.g., DB error and no mock for id)
      if (!details) {
        try {
          const adminUserLocal = JSON.parse(localStorage.getItem('adminUser') || '{}');
          const adminEmailLocal = adminUserLocal?.email;
          console.log('[create-party] Trying fallback via /admin/parties with email:', adminEmailLocal);
          if (adminEmailLocal) {
            const listRes = await makeRequest('/admin/parties', 'POST', { email: adminEmailLocal });
            console.log('[create-party] Fallback /admin/parties response:', listRes);
            const candidate = listRes?.parties?.find(p => String(p.id) === String(partyId));
            if (candidate) {
              details = candidate;
              console.warn('[create-party] Using fallback data from /admin/parties for id', partyId);
            } else {
              console.warn('[create-party] No party found for id', partyId, 'in /admin/parties');
            }
          } else {
            console.warn('[create-party] No admin email in localStorage; cannot fetch fallback list');
          }
        } catch (fallbackErr) {
          console.warn('[create-party] Fallback fetch failed:', fallbackErr);
        }
      }

      if (!details) {
        console.warn('[create-party] No details available for partyId', partyId, 'response:', res);
        return;
      }

      // Title
      const titleEl = document.getElementById('party-title');
      if (titleEl) {
        const t = details.title || details.name;
        if (t) {
          titleEl.value = t;
          console.log('[create-party] Title set to:', t);
        }
      }

      // Description (if available)
      const descEl = document.getElementById('party-description');
      if (descEl && details.description) {
        descEl.value = details.description;
        console.log('[create-party] Description set');
      }

      // Location -> best-effort split
      const addrEl = document.getElementById('party-address');
      const cityEl = document.getElementById('party-city');
      const countryEl = document.getElementById('party-country');
      if (details.location) {
        const parts = String(details.location).split(',').map(s => s.trim());
        addrEl && (addrEl.value = parts[0] || details.location);
        cityEl && (cityEl.value = parts[1] || '');
        countryEl && (countryEl.value = parts[parts.length - 1] || '');
        console.log('[create-party] Location set to:', addrEl?.value, cityEl?.value, countryEl?.value);
      }

      // Date and hour: prefer backend parsed fields, fallback to parsing string
      const dateEl = document.getElementById('party-date');
      const hourEl = document.getElementById('party-hour');
      let iso = details.date_iso || null;
      let hour = details.hour_24 || null;
      if (!iso || !hour) {
        const raw = String(details.date || '');
        if (raw) {
          if (!iso) {
            const m1 = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
            if (m1) {
              const d = m1[1].padStart(2, '0');
              const m = m1[2].padStart(2, '0');
              let y = m1[3];
              if (y.length === 2) y = `20${y}`; // assume 20xx
              iso = `${y}-${m}-${d}`;
            }
          }
          if (!iso) {
            const m2 = raw.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
            if (m2) {
              const y = m2[1];
              const m = m2[2].padStart(2, '0');
              const d = m2[3].padStart(2, '0');
              iso = `${y}-${m}-${d}`;
            }
          }
          if (!hour) {
            const t = raw.match(/(\d{1,2}:\d{2})/);
            if (t) {
              const [h, mm] = t[1].split(':');
              const hh = String(h).padStart(2, '0');
              hour = `${hh}:${mm}`;
            }
          }
        }
      }
      if (iso && dateEl) {
        dateEl.value = iso;
        if (dateEl._flatpickr) {
          try { dateEl._flatpickr.setDate(iso, true, "Y-m-d"); } catch {}
        }
        console.log('[create-party] Date set to:', iso);
      }
      if (hour && hourEl) {
        hourEl.value = hour;
        if (hourEl._flatpickr) {
          try { hourEl._flatpickr.setDate(hour, true, "H:i"); } catch {}
        }
        console.log('[create-party] Hour set to:', hour);
      }

      // Image
      if (details.image) {
        imageHidden.value = details.image;
        setPreview(details.image);
        console.log('[create-party] Image set');
      }

      // Attendees -> use current/max to prefill max and keep current for update
      let current = 0, max = 0;
      if (details.attendees) {
        const [currStr, maxStr] = String(details.attendees).split('/');
        current = parseInt(currStr, 10) || 0;
        max = parseInt(maxStr, 10) || 0;
      }
      const maxEl = document.getElementById('party-attendees-max');
      if (maxEl) {
        maxEl.value = max || '';
        console.log('[create-party] Attendees max set to:', maxEl.value);
      }

      // Administrator and number
      const adminEl = document.getElementById('party-administrator');
      const numberEl = document.getElementById('party-number');
      if (adminEl && details.administrator) {
        adminEl.value = details.administrator;
        console.log('[create-party] Administrator set:', details.administrator);
      }
      if (numberEl && details.number) {
        numberEl.value = details.number;
        console.log('[create-party] Number set:', details.number);
      }

      // Tags
      const tagCheckboxes = Array.from(document.querySelectorAll('input[name="party-tag"]'));
      let tagsArray = [];
      if (Array.isArray(details.tags)) {
        tagsArray = details.tags;
      } else if (typeof details.tags === 'string') {
        try {
          const parsed = JSON.parse(details.tags);
          if (Array.isArray(parsed)) tagsArray = parsed; else tagsArray = details.tags.split(',').map(s => s.trim()).filter(Boolean);
        } catch {
          tagsArray = details.tags.split(',').map(s => s.trim()).filter(Boolean);
        }
      }
      tagCheckboxes.forEach(cb => { cb.checked = tagsArray.includes(cb.value); });
      console.log('[create-party] Tags selected:', tagsArray);

      // Refresh tag chips
      const tagsToggle = document.getElementById('party-tags-toggle');
      const tagsChips = document.getElementById('party-tags-chips');
      const selected = Array.from(document.querySelectorAll('input[name="party-tag"]:checked')).map(el => el.value);
      if (tagsToggle) tagsToggle.textContent = selected.length ? `Tags (${selected.length})` : 'Selecciona tags';
      if (tagsChips) tagsChips.innerHTML = selected.map(v => `<span class="chip">${v}</span>`).join('');

      // Prices: prefill from details
      const prices = Array.isArray(details.prices) ? details.prices : [];
      pricesState.splice(0, pricesState.length);
      if (prices.length) {
        prices.forEach(p => {
          pricesState.push({ price_name: p.price_name || p.name || '', price: p.price || '' });
        });
      } else {
        // fallback: one empty row to keep UI consistent
        pricesState.push({ price_name: "", price: "" });
      }
      renderPriceItems();
      console.log('[create-party] Prices rows:', pricesState.length);

      // Change CTA to Save
      const submitBtnPrefill = document.getElementById('create-btn');
      if (submitBtnPrefill) submitBtnPrefill.textContent = 'Save';

      // Save edit context with current attendees
      editContext = { partyId, currentAttendees: current };
      try { localStorage.setItem('createPartyEditContext', JSON.stringify({ partyId })); } catch (_) {}
      console.log('[create-party] Prefill completed for id:', partyId);
    } catch (e) {
      console.warn('Prefill failed:', e);
    }
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

      // Upload via backend to persist and get a public URL
      try {
        const dataUrl = await fileToDataURL(file);
        const uploadRes = await makeRequest('/parties/upload-image', 'POST', {
          dataUrl,
          fileName: file.name,
          contentType: file.type,
        });
        if (uploadRes && uploadRes.success && uploadRes.publicUrl) {
          imageHidden.value = uploadRes.publicUrl;
        } else {
          console.warn('Upload responded without publicUrl, using placeholder');
          imageHidden.value = 'https://placehold.co/600x350?text=Party';
        }
      } catch (err) {
        // Fallback: usar placeholder en vez de Base64/blob para evitar roturas posteriores
        console.warn('Image upload fallback:', err);
        imageHidden.value = 'https://placehold.co/600x350?text=Party';
      }
    });
  }
  // Remove duplicate setPreview defined later
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

  // If edit mode, prefill fields from existing party
  // (Updated) Prefill whenever we have an id in URL or data
  try {
    const paramsPrefill = new URLSearchParams(window.location.search);
    const qsId = paramsPrefill.get('id') || paramsPrefill.get('partyId');
    const effectiveId = Number((data && data.partyId) || qsId);
    console.log('[create-party] Prefill trigger check. data.partyId:', data?.partyId, 'qsId:', qsId, 'effectiveId:', effectiveId);
    if (effectiveId) {
      try { localStorage.setItem('createPartyEditContext', JSON.stringify({ partyId: effectiveId })); } catch (_) {}
      prefillFromParty(effectiveId);
    } else {
      try { localStorage.removeItem('createPartyEditContext'); } catch (_) {}
    }
  } catch (_) {
    // ignore
  }

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

  // Initialize with one empty price row (required) only if not in edit
  if (!editContext) {
    pricesState.push({ price_name: "", price: "" });
    renderPriceItems();
  }

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
    // Sync alt input if prefilled before init
    const dateInputEl = document.getElementById("party-date");
    if (dateInputEl && dateInputEl._flatpickr && dateInputEl.value) {
      try { dateInputEl._flatpickr.setDate(dateInputEl.value, true, "Y-m-d"); } catch {}
    }

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
    const hourInputEl = document.getElementById("party-hour");
    if (hourInputEl && hourInputEl._flatpickr && hourInputEl.value) {
      try { hourInputEl._flatpickr.setDate(hourInputEl.value, true, "H:i"); } catch {}
    }
  }

  // Submit handler (create or update)
  const partyForm = document.getElementById("create-party-form");
  partyForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitBtn = document.getElementById("create-btn");
    const originalText = submitBtn ? submitBtn.textContent : 'Create';
    if (submitBtn) { submitBtn.textContent = 'Saving...'; submitBtn.disabled = true; }

    try {
      const title = getVal("party-title").trim();
      const address = getVal("party-address").trim();
      const cityVal = getVal("party-city").trim();
      const countryVal = getVal("party-country").trim();
      const location = `${address}${cityVal ? ", " + cityVal : ""}${countryVal ? ", " + countryVal : ""}`;
      const dateVal = getVal("party-date");
      const hourVal = getVal("party-hour");
      const maxAtt = parseInt(getVal("party-attendees-max"), 10) || 0;
      const administrator = getVal("party-administrator").trim();
      const number = getVal("party-number").trim();
      const image = getVal("party-image");

      const selectedTags = Array.from(document.querySelectorAll('input[name="party-tag"]:checked')).map(el => el.value);
      const tags = selectedTags;

      const description = getVal("party-description").trim();

      // Collect prices from dynamic inputs
      const collectedPrices = pricesState
        .map(p => ({ price_name: (p.price_name || "").trim(), price: (p.price || "").trim() }))
        .filter(p => p.price_name || p.price);

      if (!title || !location || !dateVal || !hourVal || maxAtt <= 0 || !administrator) {
        alert("Por favor completa los campos requeridos");
        const firstInput = pricesList.querySelector(".price-value-input");
        if (firstInput) firstInput.focus();
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
      }

      // Compute attendees string
      const attendees = editContext
        ? `${editContext.currentAttendees}/${maxAtt}`
        : `0/${maxAtt}`;

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
        prices: collectedPrices, // Include prices in the main payload
        email: adminUser?.email, // Include admin email for authentication
      };

      let apiRes;
      if (editContext) {
        apiRes = await makeRequest(`/parties/${editContext.partyId}`, 'PATCH', payload);
        console.log("Update party response:", apiRes);
      } else {
        apiRes = await makeRequest("/create-party", "POST", payload);
        console.log("Create party response:", apiRes);
      }
      
      if (!apiRes || !apiRes.success) {
        throw new Error(apiRes?.message || apiRes?.error || (editContext ? "Error updating party" : "Error creating party"));
      }

      const partyId = (apiRes.party?.id || apiRes.data?.id || apiRes.id || editContext?.partyId);
      if (!partyId) {
        console.error("No party id found in response:", apiRes);
        throw new Error("No party id returned");
      }

      // Prices/description messages
      const pricesError = apiRes.prices_error;
      const descriptionError = apiRes.description_error;
      if (pricesError || descriptionError) {
        const msgParts = [];
        if (pricesError) msgParts.push(`Error guardando precios: ${pricesError}`);
        else msgParts.push('Precios guardados');
        if (descriptionError) msgParts.push(`Error guardando descripción: ${descriptionError}`);
        else msgParts.push('Descripción guardada');
        alert(`${editContext ? 'Party actualizada' : 'Party creada'}. ${msgParts.join(' | ')}`);
      } else {
        alert(editContext ? "Party actualizada correctamente" : "Party creada correctamente");
      }

      navigateTo("/my-parties");
    } catch (err) {
      console.error(err);
      alert(err.message || (editContext ? "Error actualizando la fiesta" : "Error creando la fiesta"));
    } finally {
      const submitBtn = document.getElementById("create-btn");
      if (submitBtn) {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
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
          navigateTo('/my-parties');
        } else if (target === 'new') {
          navigateTo('/create-party');
        } else if (target === 'profile') {
          navigateTo('/profile');
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
