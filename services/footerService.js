const asyncHandler = require("express-async-handler");
const FooterModel = require("../models/footerModel");

// Helper – returns the single footer doc, creating it if it doesn't exist yet
const getOrCreateFooter = () =>
  FooterModel.findOneAndUpdate(
    {},
    { $setOnInsert: {} },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

// @desc    Get footer data
// @route   GET /api/v1/footer
// @access  Public
exports.getFooter = asyncHandler(async (req, res) => {
  const footer = await getOrCreateFooter();
  res.status(200).json({ status: "success", data: footer });
});

// @desc    Update (or create) footer data – singleton upsert
// @route   PUT /api/v1/footer
// @access  Private – Admin / Manager
exports.updateFooter = asyncHandler(async (req, res) => {
  // Strip read-only fields that should never be set by the client
  const { _id, __v, createdAt, updatedAt, ...updateData } = req.body;

  const footer = await FooterModel.findOneAndUpdate(
    {},
    { $set: updateData },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );

  res.status(200).json({ status: "success", data: footer });
});

// @desc    Create footer data – only allowed when no footer exists yet
// @route   POST /api/v1/footer
// @access  Private – Admin / Manager
exports.createFooter = asyncHandler(async (req, res) => {
  const existing = await FooterModel.findOne();
  if (existing) {
    return res
      .status(409)
      .json({ status: "fail", message: "Footer already exists. Use PUT to update it." });
  }

  const { _id, __v, createdAt, updatedAt, ...data } = req.body;
  const footer = await FooterModel.create(data);

  res.status(201).json({ status: "success", data: footer });
});
