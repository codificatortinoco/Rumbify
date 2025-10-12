const supabaseCli = require("../services/supabase.service");
const { geocodeAddress } = require("../services/mapsAPI.js");

// Mock data for demonstration
const mockParties = [
  {
    id: 1,
    title: "Chicago Night",
    attendees: "23/96",
    location: "Calle 23#32-26",
    date: "5/9/21 • 23:00-06:00",
    administrator: "Loco Foroko",
    price: "$65.000",
    image: "https://images.unsplash.com/photo-1571266028243-d220b6b0b8c5?w=400&h=200&fit=crop",
    tags: ["Elegant", "Cocktailing"],
    liked: true,
    category: "hot-topic"
  },
  {
    id: 2,
    title: "Summer Vibes",
    attendees: "45/100",
    location: "Calle 15#45-12",
    date: "12/9/21 • 20:00-04:00",
    administrator: "DJ Summer",
    price: "$45.000",
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=200&fit=crop",
    tags: ["Summer", "Outdoor"],
    liked: false,
    category: "hot-topic"
  },
  {
    id: 3,
    title: "Pre-New Year Pa...",
    attendees: "67/150",
    location: "Cra 51#39-26",
    date: "22/11/21 • 21:30-05:00",
    administrator: "DJ KC",
    price: "$80.000",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=150&fit=crop",
    tags: ["Disco Music", "Elegant"],
    liked: false,
    category: "upcoming"
  },
  {
    id: 4,
    title: "Neon Dreams",
    attendees: "89/120",
    location: "Calle 80#12-45",
    date: "15/9/21 • 22:00-05:00",
    administrator: "Neon DJ",
    price: "$55.000",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=150&fit=crop",
    tags: ["Electronic", "Neon"],
    liked: true,
    category: "upcoming"
  }
];

// Helper: attach prices array to parties and compute a display price
async function attachPricesToParties(parties) {
  try {
    const ids = parties.map(p => p.id).filter(Boolean);
    if (!ids.length) return parties;

    const { data: pricesData, error: pricesError } = await supabaseCli
      .from("prices")
      .select("*")
      .in("party_id", ids);

    if (pricesError) {
      console.error("Prices fetch error:", pricesError);
      return parties;
    }

    const byParty = new Map();
    pricesData.forEach(pr => {
      const arr = byParty.get(pr.party_id) || [];
      arr.push(pr);
      byParty.set(pr.party_id, arr);
    });

    return parties.map(party => {
      const prices = byParty.get(party.id) || [];
      // Compute a simple display price (first price or keep existing)
      const displayPrice = prices.length ? prices[0]?.price : party.price;
      return { ...party, prices, price: displayPrice };
    });
  } catch (e) {
    console.error("attachPricesToParties error:", e);
    return parties;
  }
}

const getHotTopicParties = async (req, res) => {
  try {
    // Try to get from database first
    const { data, error } = await supabaseCli
      .from("parties")
      .select("*")
      .eq("category", "hot-topic")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      // Fallback to mock data
      const hotTopicParties = mockParties.filter(party => party.category === "hot-topic");
      return res.json(hotTopicParties);
    }

    if (data && data.length > 0) {
      const enriched = await attachPricesToParties(data);
      return res.json(enriched);
    }

    // If no data in database, return mock data
    const hotTopicParties = mockParties.filter(party => party.category === "hot-topic");
    res.json(hotTopicParties);
  } catch (error) {
    console.error("Error fetching hot topic parties:", error);
    // Fallback to mock data
    const hotTopicParties = mockParties.filter(party => party.category === "hot-topic");
    res.json(hotTopicParties);
  }
};

const getUpcomingParties = async (req, res) => {
  try {
    // Try to get from database first
    const { data, error } = await supabaseCli
      .from("parties")
      .select("*")
      .eq("category", "upcoming")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      // Fallback to mock data
      const upcomingParties = mockParties.filter(party => party.category === "upcoming");
      return res.json(upcomingParties);
    }

    if (data && data.length > 0) {
      const enriched = await attachPricesToParties(data);
      return res.json(enriched);
    }

    // If no data in database, return mock data
    const upcomingParties = mockParties.filter(party => party.category === "upcoming");
    res.json(upcomingParties);
  } catch (error) {
    console.error("Error fetching upcoming parties:", error);
    // Fallback to mock data
    const upcomingParties = mockParties.filter(party => party.category === "upcoming");
    res.json(upcomingParties);
  }
};

const getAllParties = async (req, res) => {
  try {
    // Try to get from database first
    const { data, error } = await supabaseCli
      .from("parties")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      // Fallback to mock data
      return res.json(mockParties);
    }

    if (data && data.length > 0) {
      const enriched = await attachPricesToParties(data);
      return res.json(enriched);
    }

    // If no data in database, return mock data
    res.json(mockParties);
  } catch (error) {
    console.error("Error fetching all parties:", error);
    // Fallback to mock data
    res.json(mockParties);
  }
};

const searchParties = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.json([]);
    }

    // Try to get from database first
    const { data, error } = await supabaseCli
      .from("parties")
      .select("*")
      .or(`title.ilike.%${q}%,administrator.ilike.%${q}%,location.ilike.%${q}%`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      // Fallback to mock data search
      const filteredParties = mockParties.filter(party => 
        party.title.toLowerCase().includes(q.toLowerCase()) ||
        party.administrator.toLowerCase().includes(q.toLowerCase()) ||
        party.location.toLowerCase().includes(q.toLowerCase())
      );
      return res.json(filteredParties);
    }

    if (data && data.length > 0) {
      return res.json(data);
    }

    // If no data in database, search mock data
    const filteredParties = mockParties.filter(party => 
      party.title.toLowerCase().includes(q.toLowerCase()) ||
      party.administrator.toLowerCase().includes(q.toLowerCase()) ||
      party.location.toLowerCase().includes(q.toLowerCase())
    );
    res.json(filteredParties);
  } catch (error) {
    console.error("Error searching parties:", error);
    // Fallback to mock data search
    const { q } = req.query;
    const filteredParties = mockParties.filter(party => 
      party.title.toLowerCase().includes(q.toLowerCase()) ||
      party.administrator.toLowerCase().includes(q.toLowerCase()) ||
      party.location.toLowerCase().includes(q.toLowerCase())
    );
    res.json(filteredParties);
  }
};

const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const { liked } = req.body;

    // Try to update in database first
    const { data, error } = await supabaseCli
      .from("parties")
      .update({ liked })
      .eq("id", id)
      .select();

    if (error) {
      console.error("Database error:", error);
      // For mock data, just return success
      return res.json({ success: true, liked });
    }

    res.json({ success: true, liked, data });
  } catch (error) {
    console.error("Error toggling like:", error);
    res.json({ success: true, liked: req.body.liked });
  }
};

const getEventDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // Try to get from database first
    const { data, error } = await supabaseCli
      .from("parties")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Database error:", error);
      // Fallback to mock data
      const eventDetails = getMockEventDetails(id);
      return res.json(eventDetails);
    }

    if (data) {
      // Fetch prices for this party
      const { data: prices, error: pricesErr } = await supabaseCli
        .from("prices")
        .select("*")
        .eq("party_id", data.id);
      if (pricesErr) {
        console.error("Error fetching event prices:", pricesErr);
      }
      const displayPrice = (prices && prices.length) ? prices[0]?.price : data.price;
      return res.json({ ...data, prices: prices || [], price: displayPrice });
    }

    // If no data in database, return mock data
    const eventDetails = getMockEventDetails(id);
    res.json(eventDetails);
  } catch (error) {
    console.error("Error fetching event details:", error);
    // Fallback to mock data
    const eventDetails = getMockEventDetails(req.params.id);
    res.json(eventDetails);
  }
};

function getMockEventDetails(eventId) {
  const party = mockParties.find(p => String(p.id) === String(eventId));
  if (!party) return null;
  return {
    ...party,
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio vitae vestibulum vestibulum.",
    contact: {
      name: party.administrator,
      phone: "+57 300 123 4567"
    }
  };
}

// Helpers for automatic category assignment
function parseAttendees(attStr = "0/0") {
  try {
    const [curStr, maxStr] = String(attStr).split("/");
    const current = parseInt(curStr, 10) || 0;
    const max = parseInt(maxStr, 10) || 0;
    return { current, max };
  } catch {
    return { current: 0, max: 0 };
  }
}

function daysUntil(isoDate) {
  try {
    const target = new Date(isoDate);
    if (isNaN(target.getTime())) return null;
    const now = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.ceil((target.setHours(0,0,0,0) - now.setHours(0,0,0,0)) / msPerDay);
  } catch {
    return null;
  }
}

function formatDisplayDate(isoDate, hour) {
  try {
    const dt = new Date(isoDate);
    if (isNaN(dt.getTime())) return `${isoDate}${hour ? ` • ${hour}` : ""}`;
    const d = dt.getDate();
    const m = dt.getMonth() + 1;
    const y = String(dt.getFullYear()).slice(2);
    return `${d}/${m}/${y}${hour ? ` • ${hour}` : ""}`;
  } catch {
    return `${isoDate}${hour ? ` • ${hour}` : ""}`;
  }
}

function computeCategoryAuto(attendees, isoDate) {
  const { current, max } = parseAttendees(attendees);
  const percent = max > 0 ? current / max : 0;
  const days = daysUntil(isoDate);
  const HOT_PERCENT = 0.6; // 60% ocupación
  const UPCOMING_DAYS = 7; // Próximos 7 días
  if (percent >= HOT_PERCENT) return "hot-topic";
  if (days !== null && days >= 0 && days <= UPCOMING_DAYS) return "upcoming";
  // Por defecto, si es un evento futuro, lo tratamos como upcoming
  if (days !== null && days >= 0) return "upcoming";
  // Si la fecha ya pasó y no es hot, marcamos como hot-topic para no dejar sin categoría
  return "hot-topic";
}
const createParty = async (req, res) => {
  try {
    console.log("[createParty] Incoming body:", req.body);
    const {
      title,
      attendees,
      location,
      date,      // esperado como yyyy-mm-dd
      hour,      // HH:mm
      administrator,
      image,
      tags,
      prices, // Array de { price_name, price }
      description, // Texto opcional para tabla descriptions
    } = req.body || {};

    if (!title || !location || !date || !administrator) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const safeAttendees = attendees || "0/0";
    // Geocode: resolve user-entered location to formatted address
    let resolvedLocation = location;
    try {
      console.log("[createParty] Geocoding address via Nominatim:", location);
      const geo = await geocodeAddress(location);
      if (geo.ok && geo.formatted) {
          resolvedLocation = geo.formatted;
        }
      } catch { }
      const category = computeCategoryAuto(safeAttendees, date);
      const displayDate = formatDisplayDate(date, hour);

      // Normalizar campos
      const payload = {
        title,
        attendees: safeAttendees,
        location: resolvedLocation,
        date: displayDate,
        administrator,
        image: image || "",
        tags: Array.isArray(tags) ? tags : [],
        category,
      };
      console.log("[createParty] Insert payload:", payload);

      // Create party first
      const { data: created, error: insertErr } = await supabaseCli
        .from("parties")
        .insert([payload])
        .select();

      if (insertErr) {
        console.error("Database insert error:", insertErr);
        return res.status(500).json({ success: false, message: "Failed to create party", error: insertErr });
      }

      const party = created?.[0];

      // If description provided, insert into descriptions table
      let descriptionRecord = null;
      let descriptionInsertError = null;
      if (party?.id && description && String(description).trim().length) {
        const { data: descData, error: descErr } = await supabaseCli
          .from("descriptions")
          .insert([{ party_id: Number(party.id), description: String(description).trim() }])
          .select();
        if (descErr) {
          console.error("Description insert error:", descErr);
          descriptionInsertError = descErr;
        } else {
          descriptionRecord = descData?.[0] || null;
        }
      }

      // Insert prices if provided
      let insertedPrices = [];
      let pricesInsertError = null;
      if (Array.isArray(prices) && prices.length && party?.id) {
        const normalizedPrices = prices
          .filter(p => (p?.price_name || p?.name) && p?.price)
          .map(p => ({
            price_name: String(p.price_name || p.name).trim(),
            price: String(p.price).trim(),
            party_id: Number(party.id),
          }));

        if (normalizedPrices.length) {
          const { data: prData, error: prErr } = await supabaseCli
            .from("prices")
            .insert(normalizedPrices)
            .select();
          if (prErr) {
            console.error("Prices insert error:", prErr);
            pricesInsertError = prErr;
          } else {
            insertedPrices = prData || [];
          }
        }
      }

      const displayPrice = insertedPrices.length ? insertedPrices[0]?.price : party?.price;
      if (pricesInsertError || descriptionInsertError) {
        return res.status(201).json({
          success: true,
          party: { ...party, prices: insertedPrices, price: displayPrice },
          prices_error: pricesInsertError?.message || pricesInsertError,
          description_error: descriptionInsertError?.message || descriptionInsertError,
          description_record: descriptionRecord,
        });
      }
      return res.status(201).json({ success: true, party: { ...party, prices: insertedPrices, price: displayPrice }, description_record: descriptionRecord });
    } catch (error) {
      console.error("Error creating party:", error);
      return res.status(500).json({ success: false, message: "Unexpected error" });
    }
  };

module.exports = {
  getHotTopicParties,
  getUpcomingParties,
  getAllParties,
  searchParties,
  toggleLike,
  getEventDetails,
  createParty,
};
