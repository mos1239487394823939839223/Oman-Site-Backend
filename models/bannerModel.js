const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Banner name is required"],
      trim: true,
      minlength: [3, "Banner name must be at least 3 characters"],
      maxlength: [100, "Banner name must be at most 100 characters"],
    },
    image: {
      type: String,
    },
    images: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const setImageURL = (doc) => {
  let imageURL;
  if (doc.image) {
    imageURL = `${process.env.BASE_URL}/banners/${doc.image}`;
    doc.image = imageURL;
  }

  if (doc.images && doc.images.length > 0) {
    doc.images = doc.images.map(
      (image) => `${process.env.BASE_URL}/banners/${image}`
    );
    return;
  }

  if (imageURL) {
    doc.images = [imageURL];
  }
};

bannerSchema.post("init", (doc) => {
  setImageURL(doc);
});

bannerSchema.post("save", (doc) => {
  setImageURL(doc);
});

module.exports = mongoose.model("Banner", bannerSchema);
