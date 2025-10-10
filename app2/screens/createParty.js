import { navigateTo, makeRequest } from "../app.js";

export default function renderCreateParty(data = {}) {
  const storedUser = localStorage.getItem("adminUser");
  const adminUser = storedUser ? JSON.parse(storedUser) : null;
  const administratorName = adminUser?.name || "";

  const app = document.getElementById("app");
  app.innerHTML = `
    <div id="create-party-screen">
      <div class="create-party-content">
        <h1>Create Party</h1>
        <form id="create-party-form">
          <div class="form-group">
            <label>Title</label>
            <input type="text" id="party-title" required />
          </div>

          <div class="form-group">
            <label>Location</label>
            <input type="text" id="party-location" required />
          </div>

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

          <div class="form-row">
            <div class="form-group">
              <label>Current Attendees</label>
              <input type="number" id="party-attendees-current" min="0" value="0" required />
            </div>
            <div class="form-group">
              <label>Maximum Attendees</label>
              <input type="number" id="party-attendees-max" min="1" required />
            </div>
          </div>

          <div class="form-group">
            <label>Administrator Name</label>
            <input type="text" id="party-administrator" value="${administratorName}" required />
          </div>

          <div class="form-group">
            <label>Price</label>
            <input type="text" id="party-price" placeholder="$65.000" required />
          </div>

          <div class="form-group">
            <label>Image URL</label>
            <input type="url" id="party-image" placeholder="https://..." />
          </div>

          <div class="form-group">
            <label>Tags (comma separated)</label>
            <input type="text" id="party-tags" placeholder="Electronic, Neon" />
          </div>

          <div class="form-group">
            <label>Category</label>
            <select id="party-category" required>
              <option value="hot-topic">hot-topic</option>
              <option value="upcoming">upcoming</option>
            </select>
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

  cancelBtn.addEventListener("click", () => navigateTo("/admin-dashboard"));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById("create-btn");
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Creating...";
    submitBtn.disabled = true;

    try {
      const title = document.getElementById("party-title").value.trim();
      const location = document.getElementById("party-location").value.trim();
      const dateVal = document.getElementById("party-date").value; // yyyy-mm-dd
      const hourVal = document.getElementById("party-hour").value; // HH:mm
      const currentAtt = parseInt(document.getElementById("party-attendees-current").value || "0", 10);
      const maxAtt = parseInt(document.getElementById("party-attendees-max").value, 10);
      const administrator = document.getElementById("party-administrator").value.trim();
      const price = document.getElementById("party-price").value.trim();
      const image = document.getElementById("party-image").value.trim();
      const tagsInput = document.getElementById("party-tags").value.trim();
      const category = document.getElementById("party-category").value;

      if (!title || !location || !dateVal || !hourVal || !administrator || !price || !category) {
        alert("Please fill in all required fields.");
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
      if (currentAtt < 0 || currentAtt > maxAtt) {
        alert("Current attendees must be between 0 and the maximum.");
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
      }

      const attendees = `${currentAtt}/${maxAtt}`;
      const formattedDate = formatDate(dateVal);
      const date = `${formattedDate} • ${hourVal}`;
      const tags = tagsInput
        ? tagsInput.split(",").map(t => t.trim()).filter(Boolean)
        : [];

      const body = {
        title,
        attendees,
        location,
        date,
        administrator,
        price,
        image,
        tags,
        category,
      };

      const resp = await makeRequest("/newParty", "POST", body);
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