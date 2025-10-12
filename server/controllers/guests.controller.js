const supabaseCli = require("../services/supabase.service");

// GET /parties/:id/guests (id actualmente no usado; la tabla no tiene party_id)
async function getPartyGuests(req, res) {
  try {
    const { data, error } = await supabaseCli
      .from("Invitados_Lista")
      .select("id, name, validado")
      .order("id", { ascending: false });

    if (error) {
      console.error("Supabase Invitados_Lista error:", error);
      return res.status(500).json({ error: error.message });
    }

    const guests = (data || []).map(g => ({
      id: g.id,
      name: g.name,
      status: g.validado ? "Valid" : (g.validado === false ? "Invalid" : "Pending"),
      avatar: null,
      time: null,
    }));

    return res.json(guests);
  } catch (err) {
    console.error("getPartyGuests unexpected error:", err);
    return res.status(500).json({ error: "Unexpected server error" });
  }
}

// Nuevo: resumen de invitados
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

    const { data, error } = await supabaseCli
      .from("Invitados_Lista")
      .select("id, name, validado")
      .order("id", { ascending: false });

    if (error) {
      console.error("Supabase Invitados_Lista error:", error);
      return res.status(500).json({ error: error.message });
    }

    const all = Array.isArray(data) ? data : [];
    const pending = all.filter(g => g.validado === null || typeof g.validado === 'undefined');
    const validated = all.filter(g => g.validado === true);
    const denied = all.filter(g => g.validado === false);

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