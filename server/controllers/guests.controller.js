const supabaseCli = require("../services/supabase.service");

// Helper robusto para leer invitados por fiesta, soportando distintos nombres/columnas
async function fetchGuestsByParty(partyId) {
  // Primero intentar con Invitados_Lista filtrando por party_id
  let { data, error } = await supabaseCli
    .from("Invitados_Lista")
    .select("id, name, validado, party_id")
    .eq("party_id", partyId)
    .order("id", { ascending: false });

  if (error) {
    console.error("Invitados_Lista query error:", error);
  }

  // Si falla por tabla/columna, intentar con Invitados_Fiesta
  const isMissingTableOrColumn = (err) => !!err && (
    String(err?.message || "").toLowerCase().includes("could not find") ||
    String(err?.message || "").toLowerCase().includes("schema cache") ||
    String(err?.message || "").toLowerCase().includes("relation") ||
    String(err?.message || "").toLowerCase().includes("column")
  );

  if (error && isMissingTableOrColumn(error)) {
    ({ data, error } = await supabaseCli
      .from("Invitados_Fiesta")
      .select("id, name, validado, party_id")
      .eq("party_id", partyId)
      .order("id", { ascending: false }));
  }

  // Si aún falla por columna party_id, caer sin filtro (por compatibilidad)
  if (error && String(error?.message || "").toLowerCase().includes("column") && String(error?.message || "").toLowerCase().includes("party_id")) {
    ({ data, error } = await supabaseCli
      .from("Invitados_Lista")
      .select("id, name, validado, party_id")
      .order("id", { ascending: false }));
  }

  return { data, error };
}

// GET /parties/:id/guests
async function getPartyGuests(req, res) {
  try {
    const { id } = req.params;

    const { data, error } = await fetchGuestsByParty(id);

    if (error) {
      console.error("Supabase Invitados error:", error);
      return res.status(500).json({ error: error.message });
    }

    const guests = (Array.isArray(data) ? data : []).map(g => {
      const flag = typeof g.validado !== 'undefined' ? g.validado : g.valid;
      return {
        id: g.id,
        name: g.name,
        status: flag === true ? "Valid" : (flag === false ? "Invalid" : "Pending"),
        avatar: null,
        time: null,
      };
    });

    return res.json(guests);
  } catch (err) {
    console.error("getPartyGuests unexpected error:", err);
    return res.status(500).json({ error: "Unexpected server error" });
  }
}

// GET /parties/:id/guests/summary
async function getGuestsSummary(req, res) {
  try {
    const { id } = req.params;

    // Obtener nombre de la fiesta
    let partyTitle = null;
    try {
      const { data: party, error: partyErr } = await supabaseCli
        .from("parties")
        .select("id, title")
        .eq("id", id)
        .single();
      if (!partyErr && party) partyTitle = party.title || null;
    } catch (e) {
      console.warn("No se pudo leer party title:", e?.message);
    }

    const { data, error } = await fetchGuestsByParty(id);

    if (error) {
      console.error("Supabase Invitados error:", error);
      return res.status(500).json({ error: error.message });
    }

    const all = Array.isArray(data) ? data : [];
    const flagOf = (g) => (typeof g.validado !== 'undefined' ? g.validado : g.valid);
    const pending = all.filter(g => flagOf(g) === null || typeof flagOf(g) === 'undefined');
    const validated = all.filter(g => flagOf(g) === true);
    const denied = all.filter(g => flagOf(g) === false);

    return res.json({
      party: { id, title: partyTitle },
      totals: {
        total: all.length,
        pending: pending.length,
        validated: validated.length,
        denied: denied.length,
      },
      lists: {
        pending: pending.map(g => ({ id: g.id, name: g.name })),
        validated: validated.map(g => ({ id: g.id, name: g.name })),
        denied: denied.map(g => ({ id: g.id, name: g.name })),
      },
    });
  } catch (err) {
    console.error("getGuestsSummary unexpected error:", err);
    return res.status(500).json({ error: "Unexpected server error" });
  }
}

module.exports = { getPartyGuests, getGuestsSummary };