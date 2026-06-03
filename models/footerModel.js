const mongoose = require("mongoose");

const translationSchema = new mongoose.Schema(
  {
    en: { 
        type: String,
        trim: true, default: "" },
    ar: { 
        type: String,
        trim: true, default: "" },
  },
  { _id: false }
);

const quickLinkSchema = new mongoose.Schema(
  {
    href: { 
        type: String,
        trim: true,
        required: [true, "Link href is required"] }
    ,
    labelEn: { 
        type: String,
        trim: true,
        required: [true, "English label is required"] },
    labelAr: { 
        type: String,
        trim: true,
        required: [true, "Arabic label is required"] },
    order: { 
        type: Number,
        default: 0 },
    isActive: { 
        type: Boolean,
        default: true },
  },
  { _id: true }
);

const footerSchema = new mongoose.Schema(
  {
    // ── Contact / Social ─────────────────────────────────────────────
    phone: { 
        type: String,
        trim: true,
        default: "" 
    },
    whatsapp: { 
        type: String,
        trim: true,
        default: "" 
    },
    email: { 
        type: String,
        trim: true,
        default: "" 
    },
    address: { 
        type: String,
        trim: true,
        default: "" 
    },   // English
    addressAr: { 
        type: String,
        trim: true,
        default: "" 
    }, // Arabic
    hours: { 
        type: String,
        trim: true,
        default: "" 
    },     // English
    hoursAr: { 
        type: String,
        trim: true,
        default: "" 
    },   // Arabic

    // Social URLs
    instagram: { 
        type: String,
        trim: true,
        default: "" 
    },
    facebook: { 
        type: String,
        trim: true,
        default: "" 
    },  // stored, not shown in footer yet
    twitter: { 
        type: String,
        trim: true,
        default: "" 
    },   // stored, not shown in footer yet

    // ── Translatable copy ────────────────────────────────────────────
    brand: { 
        type: translationSchema,
        default: () => ({})
    },
    description: { 
        type: translationSchema,
        default: () => ({})
    },
    quickLinks: { 
        type: translationSchema,
        default: () => ({})
    },
    contactInfo: { 
        type: translationSchema,
        default: () => ({})
    },
    home: { 
        type: translationSchema,
        default: () => ({})
    },
    products: { 
        type: translationSchema,
        default: () => ({})
    },
    reviews: { 
        type: translationSchema,
        default: () => ({})
    },
    favorites: { 
        type: translationSchema,
        default: () => ({})
    },
    cart: { 
        type: translationSchema,
        default: () => ({})
    },
    rights: { 
        type: translationSchema,
        default: () => ({})
    },

    // ── Editable quick links ─────────────────────────────────────────
    links: { type: [quickLinkSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Footer", footerSchema);
