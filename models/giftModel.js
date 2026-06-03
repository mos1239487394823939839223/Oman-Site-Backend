const mongoose = require("mongoose");

// Gift schema mirrors Product but enforces price = 0
const GiftSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Gift title is required"],
      unique: true,
      minlength: [3, "Gift title must be at least 3 characters"],
      maxlength: [100, "Gift title must be less than 100 characters"],
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, "Gift description is required"],
      minlength: [20, "Gift description must be at least 20 characters"],
    },
    price: {
      type: Number,
      required: [true, "Gift price is required"],
      default: 0,
      min: [0, "Gift price must be 0"],
      max: [0, "Gift price must be 0"],
    },
    priceAfterDiscount: {
      type: Number,
      min: [0, "Price after discount must be 0"],
      max: [0, "Price after discount must be 0"],
      validate: {
        validator: function (value) {
          return value <= this.price;
        },
        message: "Price after discount must be less than or equal to price",
      },
    },
    quantity: {
      type: Number,
      required: [true, "Gift quantity is required"],
      min: [0, "Gift quantity must be greater than or equal to 0"],
    },
    sold: {
      type: Number,
      default: 0,
    },
    imageCover: {
      type: String,
      required: [true, "Gift image cover is required"],
    },
    images: [String],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Gift must belong to a category"],
    },
    subCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubCategory",
      },
    ],
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    ratingsAverage: {
      type: Number,
      default: 0,
      min: [0, "Rating must be greater than or equal to 0"],
      max: [5, "Rating must be less than or equal to 5"],
    },
    colors: [String],
    bestSeller: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

GiftSchema.pre(/^find/, function () {
  this.populate({ path: "category", select: "name" })
    .populate({ path: "subCategories", select: "name" })
    .populate({ path: "brand", select: "name" });
});

const setImageURL = (doc) => {
  if (doc.imageCover && !doc.imageCover.startsWith("http")) {
    doc.imageCover = `${process.env.BASE_URL}/uploads/gifts/${doc.imageCover}`;
  }
  if (doc.images && doc.images.length > 0) {
    doc.images = doc.images.map((image) =>
      image.startsWith("http") ? image : `${process.env.BASE_URL}/uploads/gifts/${image}`
    );
  }
};

// findOne, findAll, findById => post init
GiftSchema.post("init", (doc) => {
  setImageURL(doc);
});

// save => post save
GiftSchema.post("save", (doc) => {
  setImageURL(doc);
});

module.exports = mongoose.model("Gift", GiftSchema);
