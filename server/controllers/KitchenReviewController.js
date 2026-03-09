import KitchenReview from "../models/KitchenReview.js";

export const addReview = async (req, res) => {
  try {

    const { rating, comment } = req.body;
    const { kitchenId } = req.params;

    const existing = await KitchenReview.findOne({
      kitchen: kitchenId,
      user: req.user.id
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this kitchen"
      });
    }

    const review = new KitchenReview({
      kitchen: kitchenId,
      user: req.user.id,
      rating,
      comment
    });

    await review.save();

    res.json({
      success: true,
      message: "Review added",
      review
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateReview = async (req, res) => {
  try {

    const { rating, comment } = req.body;
    const { kitchenId } = req.params;

    const review = await KitchenReview.findOne({
      kitchen: kitchenId,
      user: req.user.id
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }

    review.rating = rating;
    review.comment = comment;

    await review.save();

    res.json({
      success: true,
      message: "Review updated",
      review
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getReviews = async (req, res) => {
  try {

    const { kitchenId } = req.params;

    const reviews = await KitchenReview.find({ kitchen: kitchenId })
      .populate("user", "name");

    const averageRating =
      reviews.reduce((acc, r) => acc + r.rating, 0) /
      (reviews.length || 1);

    res.json({
      success: true,
      data: {
        reviews,
        averageRating
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};