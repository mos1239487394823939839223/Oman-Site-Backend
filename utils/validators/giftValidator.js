const { check, body } = require("express-validator");
const slugify = require("slugify");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const CategoryModel = require("../../models/categoryModel");
const SubCategory = require("../../models/subCategoryModel");

const normalizeToArray = (value) => {
  if (value === undefined) {
    return value;
  }

  return Array.isArray(value) ? value : [value];
};

const toBoolean = (value) => {
  if (value === undefined || value === null || value === "") {
    return false;
  }
  if (value === "true" || value === true || value === "1" || value === 1) {
    return true;
  }
  if (value === "false" || value === false || value === "0" || value === 0) {
    return false;
  }
  return Boolean(value);
};

exports.createGiftValidator = [
  check("title")
    .notEmpty()
    .withMessage("Gift title is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Gift title must be between 3 and 100 characters long"),
  check("description")
    .notEmpty()
    .withMessage("Gift description is required")
    .isLength({ min: 20 })
    .withMessage("Gift description must be at least 20 characters long"),
  check("price")
    .optional()
    .isFloat({ min: 0, max: 0 })
    .withMessage("Gift price must be 0"),
  check("priceAfterDiscount")
    .optional()
    .isFloat({ min: 0, max: 0 })
    .withMessage("Price after discount must be 0"),
  check("quantity")
    .notEmpty()
    .withMessage("Gift quantity is required")
    .isInt({ min: 0 })
    .withMessage("Gift quantity must be an integer greater than or equal to 0"),
  check("sold")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Gift sold must be an integer greater than or equal to 0"),
  check("imageCover")
    .notEmpty()
    .withMessage("Gift image cover is required"),
  check("images")
    .optional()
    .isArray()
    .withMessage("Gift images must be an array of image names"),
  check("category")
    .notEmpty()
    .withMessage("Category ID is required")
    .isMongoId()
    .withMessage("Invalid category ID")
    .custom(async (value) => {
      const category = await CategoryModel.findById(value);
      if (!category) {
        return Promise.reject(new Error("Category not found"));
      }
    }),
  check("subCategories")
    .optional()
    .customSanitizer(normalizeToArray)
    .isArray()
    .withMessage("Subcategories IDs must be an array")
    .custom(async (subCategoryIds, { req }) => {
      const subCategories = await SubCategory.find({ _id: { $in: subCategoryIds } });

      if (subCategories.length !== subCategoryIds.length) {
        return Promise.reject(new Error("One or more subcategory IDs are invalid"));
      }

      const invalidCategory = subCategories.some(
        (subCategory) => subCategory.category.toString() !== req.body.category
      );

      if (invalidCategory) {
        return Promise.reject(new Error("Subcategories must belong to the provided category"));
      }
    }),
  check("subCategories.*")
    .optional()
    .isMongoId()
    .withMessage("Invalid subcategory ID"),
  check("brand")
    .optional()
    .isMongoId()
    .withMessage("Invalid brand ID"),
  check("ratingsAverage")
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage("Ratings average must be between 1 and 5"),
  check("colors")
    .optional()
    .isArray()
    .withMessage("Colors must be an array of strings"),
  check("bestSeller")
    .optional()
    .customSanitizer(toBoolean)
    .isBoolean()
    .withMessage("bestSeller must be a boolean"),
  body("title").custom((value, { req }) => {
    if (value) {
      req.body.slug = slugify(value);
    }
    return true;
  }),
  validatorMiddleware,
];

exports.updateGiftValidator = [
  check("id").isMongoId().withMessage("Invalid gift ID"),
  check("title")
    .optional()
    .notEmpty()
    .withMessage("Gift title cannot be empty")
    .isLength({ min: 3, max: 100 })
    .withMessage("Gift title must be between 3 and 100 characters long"),
  check("description")
    .optional()
    .notEmpty()
    .withMessage("Gift description cannot be empty")
    .isLength({ min: 20 })
    .withMessage("Gift description must be at least 20 characters long"),
  check("price")
    .optional()
    .isFloat({ min: 0, max: 0 })
    .withMessage("Gift price must be 0"),
  check("priceAfterDiscount")
    .optional()
    .isFloat({ min: 0, max: 0 })
    .withMessage("Price after discount must be 0"),
  check("quantity")
    .optional()
    .notEmpty()
    .withMessage("Gift quantity cannot be empty")
    .isInt({ min: 0 })
    .withMessage("Gift quantity must be an integer greater than or equal to 0"),
  check("sold")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Gift sold must be an integer greater than or equal to 0"),
  check("imageCover")
    .optional()
    .notEmpty()
    .withMessage("Gift image cover cannot be empty"),
  check("images")
    .optional()
    .isArray()
    .withMessage("Gift images must be an array of image names"),
  check("category")
    .optional()
    .notEmpty()
    .withMessage("Category ID cannot be empty")
    .isMongoId()
    .withMessage("Invalid category ID"),
  check("subCategories")
    .optional()
    .customSanitizer(normalizeToArray)
    .isArray()
    .withMessage("Subcategories IDs must be an array")
    .custom(async (subCategoryIds, { req }) => {
      const subCategories = await SubCategory.find({ _id: { $in: subCategoryIds } });

      if (subCategories.length !== subCategoryIds.length) {
        return Promise.reject(new Error("One or more subcategory IDs are invalid"));
      }

      if (req.body.category) {
        const invalidCategory = subCategories.some(
          (subCategory) => subCategory.category.toString() !== req.body.category
        );

        if (invalidCategory) {
          return Promise.reject(new Error("Subcategories must belong to the provided category"));
        }
      }
    }),
  check("subCategories.*")
    .optional()
    .isMongoId()
    .withMessage("Invalid subcategory ID"),
  check("brand")
    .optional()
    .isMongoId()
    .withMessage("Invalid brand ID"),
  check("ratingsAverage")
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage("Ratings average must be between 1 and 5"),
  check("colors")
    .optional()
    .isArray()
    .withMessage("Colors must be an array of strings"),
  check("bestSeller")
    .optional()
    .customSanitizer(toBoolean)
    .isBoolean()
    .withMessage("bestSeller must be a boolean"),
  body("title").custom((value, { req }) => {
    if (value) {
      req.body.slug = slugify(value);
    }
    return true;
  }),
  validatorMiddleware,
];

exports.getGiftByIdValidator = [
  check("id").isMongoId().withMessage("Invalid gift ID"),
  validatorMiddleware,
];

exports.deleteGiftValidator = [
  check("id").isMongoId().withMessage("Invalid gift ID"),
  validatorMiddleware,
];

exports.getGiftsValidator = [
  check("page")
    .optional()
    .isInt({ gt: 0 })
    .withMessage("Page number must be a positive integer"),
  check("limit")
    .optional()
    .isInt({ gt: 0 })
    .withMessage("Limit must be a positive integer"),
  check("category")
    .optional()
    .isMongoId()
    .withMessage("Invalid category ID"),
  check("brand")
    .optional()
    .isMongoId()
    .withMessage("Invalid brand ID"),
  check("subCategories")
    .optional()
    .custom((value) => {
      if (Array.isArray(value)) {
        return true;
      }

      if (typeof value === "string") {
        return true;
      }

      throw new Error("Subcategories filter must be an array or comma-separated IDs");
    }),
  check("sort")
    .optional()
    .isString()
    .withMessage("Sort must be a string"),
  check("sortBy")
    .optional()
    .isIn([
      "title",
      "price",
      "ratingsAverage",
      "sold",
      "quantity",
      "createdAt",
      "updatedAt",
    ])
    .withMessage(
      "sortBy must be one of: title, price, ratingsAverage, sold, quantity, createdAt, updatedAt"
    ),
  check("order")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("order must be asc or desc"),
  check("sortPreset")
    .optional()
    .isIn([
      "newest",
      "oldest",
      "price_asc",
      "price_desc",
      "rating_desc",
      "best_selling",
      "title_asc",
      "title_desc",
    ])
    .withMessage("Invalid sortPreset value"),
  check("fields")
    .optional()
    .isString()
    .withMessage("Fields must be a string"),
  check("keyword")
    .optional()
    .isString()
    .withMessage("Keyword must be a string"),
  check("bestSeller")
    .optional()
    .isIn(["true", "false"])
    .withMessage("bestSeller must be true or false"),
  validatorMiddleware,
];
