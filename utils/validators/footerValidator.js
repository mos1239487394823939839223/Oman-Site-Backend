const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");

// Reusable helper – validates an optional { en, ar } object
const optionalTranslation = (field) => [
  check(`${field}.en`)
    .optional()
    .isString()
    .withMessage(`${field}.en must be a string`)
    .isLength({ max: 500 })
    .withMessage(`${field}.en must be at most 500 characters`),
  check(`${field}.ar`)
    .optional()
    .isString()
    .withMessage(`${field}.ar must be a string`)
    .isLength({ max: 500 })
    .withMessage(`${field}.ar must be at most 500 characters`),
];

const translationKeys = [
  "brand",
  "description",
  "quickLinks",
  "contactInfo",
  "home",
  "products",
  "reviews",
  "favorites",
  "cart",
  "rights",
];

exports.updateFooterValidator = [
  // ── Contact / Social ──────────────────────────────────────────────
  check("phone")
    .optional()
    .isString()
    .withMessage("Phone must be a string")
    .isLength({ max: 30 })
    .withMessage("Phone must be at most 30 characters"),

  check("whatsapp")
    .optional()
    .isString()
    .withMessage("WhatsApp must be a string")
    .isLength({ max: 30 })
    .withMessage("WhatsApp must be at most 30 characters"),

  check("email")
    .optional()
    .isEmail()
    .withMessage("Must be a valid email address"),

  check("address")
    .optional()
    .isString()
    .withMessage("Address must be a string")
    .isLength({ max: 300 })
    .withMessage("Address must be at most 300 characters"),

  check("addressAr")
    .optional()
    .isString()
    .withMessage("Arabic address must be a string")
    .isLength({ max: 300 })
    .withMessage("Arabic address must be at most 300 characters"),

  check("hours")
    .optional()
    .isString()
    .withMessage("Hours must be a string")
    .isLength({ max: 200 })
    .withMessage("Hours must be at most 200 characters"),

  check("hoursAr")
    .optional()
    .isString()
    .withMessage("Arabic hours must be a string")
    .isLength({ max: 200 })
    .withMessage("Arabic hours must be at most 200 characters"),

  check("instagram")
    .optional()
    .isURL()
    .withMessage("Instagram must be a valid URL"),

  check("facebook")
    .optional()
    .isURL()
    .withMessage("Facebook must be a valid URL"),

  check("twitter")
    .optional()
    .isURL()
    .withMessage("Twitter must be a valid URL"),

  // ── Translatable copy ─────────────────────────────────────────────
  ...translationKeys.flatMap(optionalTranslation),

  // ── Quick links array ─────────────────────────────────────────────
  check("links")
    .optional()
    .isArray()
    .withMessage("Links must be an array"),

  check("links.*.href")
    .optional()
    .notEmpty()
    .withMessage("Link href is required")
    .isString()
    .withMessage("Link href must be a string"),

  check("links.*.labelEn")
    .optional()
    .notEmpty()
    .withMessage("Link English label is required")
    .isString()
    .withMessage("Link English label must be a string"),

  check("links.*.labelAr")
    .optional()
    .notEmpty()
    .withMessage("Link Arabic label is required")
    .isString()
    .withMessage("Link Arabic label must be a string"),

  check("links.*.order")
    .optional()
    .isNumeric()
    .withMessage("Link order must be a number"),

  check("links.*.isActive")
    .optional()
    .isBoolean()
    .withMessage("Link isActive must be a boolean"),

  validatorMiddleware,
];

// Reusable link checks with required fields (used in createFooterValidator)
const requiredLinkChecks = [
  check("links.*.href")
    .notEmpty()
    .withMessage("Link href is required")
    .isString()
    .withMessage("Link href must be a string"),

  check("links.*.labelEn")
    .notEmpty()
    .withMessage("Link English label is required")
    .isString()
    .withMessage("Link English label must be a string"),

  check("links.*.labelAr")
    .notEmpty()
    .withMessage("Link Arabic label is required")
    .isString()
    .withMessage("Link Arabic label must be a string"),

  check("links.*.order")
    .optional()
    .isNumeric()
    .withMessage("Link order must be a number"),

  check("links.*.isActive")
    .optional()
    .isBoolean()
    .withMessage("Link isActive must be a boolean"),
];

exports.createFooterValidator = [
  // ── Contact / Social ──────────────────────────────────────────────
  check("phone")
    .optional()
    .isString()
    .withMessage("Phone must be a string")
    .isLength({ max: 30 })
    .withMessage("Phone must be at most 30 characters"),

  check("whatsapp")
    .optional()
    .isString()
    .withMessage("WhatsApp must be a string")
    .isLength({ max: 30 })
    .withMessage("WhatsApp must be at most 30 characters"),

  check("email")
    .optional()
    .isEmail()
    .withMessage("Must be a valid email address"),

  check("address")
    .optional()
    .isString()
    .withMessage("Address must be a string")
    .isLength({ max: 300 })
    .withMessage("Address must be at most 300 characters"),

  check("addressAr")
    .optional()
    .isString()
    .withMessage("Arabic address must be a string")
    .isLength({ max: 300 })
    .withMessage("Arabic address must be at most 300 characters"),

  check("hours")
    .optional()
    .isString()
    .withMessage("Hours must be a string")
    .isLength({ max: 200 })
    .withMessage("Hours must be at most 200 characters"),

  check("hoursAr")
    .optional()
    .isString()
    .withMessage("Arabic hours must be a string")
    .isLength({ max: 200 })
    .withMessage("Arabic hours must be at most 200 characters"),

  check("instagram")
    .optional()
    .isURL()
    .withMessage("Instagram must be a valid URL"),

  check("facebook")
    .optional()
    .isURL()
    .withMessage("Facebook must be a valid URL"),

  check("twitter")
    .optional()
    .isURL()
    .withMessage("Twitter must be a valid URL"),

  // ── Translatable copy ─────────────────────────────────────────────
  ...translationKeys.flatMap(optionalTranslation),

  // ── Quick links array ─────────────────────────────────────────────
  check("links")
    .optional()
    .isArray()
    .withMessage("Links must be an array"),

  ...requiredLinkChecks,

  validatorMiddleware,
];
