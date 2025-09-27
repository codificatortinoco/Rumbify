const supabaseCli = require("../services/supabase.service");

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
      return res.json(data);
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
      return res.json(data);
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
      return res.json(data);
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
      return res.json(data);
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

// Helper function for mock event details
function getMockEventDetails(eventId) {
  const mockEvents = {
    1: {
      id: 1,
      title: "Chicago Night",
      attendees: "23/96",
      location: "Calle 23#32-26",
      date: "5/9/21 • 23:00-06:00",
      administrator: "Loco Foroko",
      price: "$65.000",
      image: "https://images.unsplash.com/photo-1571266028243-d220b6b0b8c5?w=400&h=300&fit=crop",
      tags: ["Elegant", "Cocktailing"],
      liked: true,
      category: "hot-topic",
      description: "Experience the best of Chicago nightlife with our exclusive party featuring top DJs and premium cocktails.",
      inclusions: ["Drink of courtesy", "After midnight kiss dinamic", "Premium sound system"],
      dressCode: ["Elegant attire", "Cocktail dresses", "Dress shoes"],
      openingHour: "21:30"
    },
    2: {
      id: 2,
      title: "Summer Vibes",
      attendees: "45/100",
      location: "Calle 15#45-12",
      date: "12/9/21 • 20:00-04:00",
      administrator: "DJ Summer",
      price: "$45.000",
      image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop",
      tags: ["Summer", "Outdoor"],
      liked: false,
      category: "hot-topic",
      description: "Celebrate summer with our outdoor party featuring tropical vibes and refreshing drinks.",
      inclusions: ["Welcome drink", "Tropical decorations", "Outdoor seating"],
      dressCode: ["Summer casual", "Bright colors", "Comfortable shoes"],
      openingHour: "20:00"
    },
    3: {
      id: 3,
      title: "Pre-New Year Pa...",
      attendees: "67/150",
      location: "Cra 51#39-26",
      date: "22/11/21 • 21:30-05:00",
      administrator: "DJ KC",
      price: "$80.000",
      image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=300&fit=crop",
      tags: ["Disco Music", "Elegant"],
      liked: false,
      category: "upcoming",
      description: "We do not need to be in the 31st of December to party as God intended.",
      inclusions: ["Drink of courtesy", "After midnight kiss dinamic", "New Year decorations"],
      dressCode: ["Neon Colors", "No formal attire required", "Comfortable dancing shoes"],
      openingHour: "21:30"
    },
    4: {
      id: 4,
      title: "Neon Dreams",
      attendees: "89/120",
      location: "Calle 80#12-45",
      date: "15/9/21 • 22:00-05:00",
      administrator: "Neon DJ",
      price: "$55.000",
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
      tags: ["Electronic", "Neon"],
      liked: true,
      category: "upcoming",
      description: "Immerse yourself in a neon-lit electronic music experience like no other.",
      inclusions: ["Neon accessories", "Electronic music", "Light show"],
      dressCode: ["Neon colors", "Glow-in-the-dark items", "Comfortable shoes"],
      openingHour: "22:00"
    }
  };

  return mockEvents[eventId] || mockEvents[3]; // Default to Pre-New Year party
}

module.exports = {
  getHotTopicParties,
  getUpcomingParties,
  getAllParties,
  searchParties,
  toggleLike,
  getEventDetails,
};
