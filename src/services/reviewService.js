import { prisma } from "../lib/prisma.js";

function validationError(errors) {
  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      statusCode: 400,
      body: {
        message: "Validation failed",
        errors,
      },
    };
  }

  return {
    ok: true,
  };
}

function validateReviewPayload({ rating, comment }) {
  const errors = {};

  if (rating === undefined || rating === null) {
    errors.rating = "Rating is required";
  } else if (!Number.isInteger(rating)) {
    errors.rating = "Rating must be a whole number";
  } else if (rating < 1 || rating > 5) {
    errors.rating = "Rating must be between 1 and 5";
  }

  if (comment !== undefined && comment !== null && typeof comment !== "string") {
    errors.comment = "Comment must be a string";
  }

  return validationError(errors);
}

function validateReviewUpdatePayload({ rating, comment }) {
  const errors = {};

  if (rating === undefined && comment === undefined) {
    errors.review = "Rating or comment is required";
  }

  if (rating !== undefined) {
    if (!Number.isInteger(rating)) {
      errors.rating = "Rating must be a whole number";
    } else if (rating < 1 || rating > 5) {
      errors.rating = "Rating must be between 1 and 5";
    }
  }

  if (comment !== undefined && comment !== null && typeof comment !== "string") {
    errors.comment = "Comment must be a string";
  }

  return validationError(errors);
}

function formatReview(review) {
  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    deletedAt: review.deletedAt,
    createdAt: review.createdAt,
    user: review.user,
    vehicle: review.vehicle
      ? {
          id: review.vehicle.id,
          slug: review.vehicle.slug,
          name: review.vehicle.name,
        }
      : undefined,
  };
}

async function findVehicleBySlug(slug) {
  if (!slug || typeof slug !== "string") {
    return null;
  }

  return prisma.vehicle.findUnique({
    where: {
      slug,
    },
  });
}

export async function getVehicleReviews(slug) {
  const vehicle = await findVehicleBySlug(slug);

  if (!vehicle) {
    return {
      ok: false,
      statusCode: 404,
      body: {
        message: "Vehicle not found",
      },
    };
  }

  const reviews = await prisma.review.findMany({
    where: {
      vehicleId: vehicle.id,
      deletedAt: null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((total, review) => total + review.rating, 0) /
        reviews.length
      : 0;

  return {
    ok: true,
    statusCode: 200,
    body: {
      message: "Vehicle reviews fetched successfully",
      data: {
        vehicle: {
          id: vehicle.id,
          slug: vehicle.slug,
          name: vehicle.name,
        },
        averageRating,
        reviewCount: reviews.length,
        reviews: reviews.map(formatReview),
      },
    },
  };
}

export async function createVehicleReview(userId, slug, payload) {
  const validation = validateReviewPayload(payload);

  if (!validation.ok) {
    return validation;
  }

  const vehicle = await findVehicleBySlug(slug);

  if (!vehicle) {
    return {
      ok: false,
      statusCode: 404,
      body: {
        message: "Vehicle not found",
      },
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    return {
      ok: false,
      statusCode: 404,
      body: {
        message: "User not found",
      },
    };
  }

  const review = await prisma.review.create({
    data: {
      userId: user.id,
      vehicleId: vehicle.id,
      rating: payload.rating,
      comment: payload.comment?.trim() || null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      vehicle: {
        select: {
          id: true,
          slug: true,
          name: true,
        },
      },
    },
  });

  return {
    ok: true,
    statusCode: 201,
    body: {
      message: "Review created successfully",
      data: formatReview(review),
    },
  };
}

export async function getUserReviews(userId) {
  const reviews = await prisma.review.findMany({
    where: {
      userId,
      deletedAt: null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      vehicle: {
        select: {
          id: true,
          slug: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    ok: true,
    statusCode: 200,
    body: {
      message: "Your reviews fetched successfully",
      data: reviews.map(formatReview),
    },
  };
}

export async function updateUserReview(userId, reviewId, payload) {
  const validation = validateReviewUpdatePayload(payload);

  if (!validation.ok) {
    return validation;
  }

  const review = await prisma.review.findFirst({
    where: {
      id: reviewId,
      userId,
      deletedAt: null,
    },
  });

  if (!review) {
    return {
      ok: false,
      statusCode: 404,
      body: {
        message: "Review not found",
      },
    };
  }

  const updatedReview = await prisma.review.update({
    where: {
      id: review.id,
    },
    data: {
      rating: payload.rating ?? review.rating,
      comment:
        payload.comment === undefined ? review.comment : payload.comment?.trim() || null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      vehicle: {
        select: {
          id: true,
          slug: true,
          name: true,
        },
      },
    },
  });

  return {
    ok: true,
    statusCode: 200,
    body: {
      message: "Review updated successfully",
      data: formatReview(updatedReview),
    },
  };
}

export async function softDeleteUserReview(userId, reviewId) {
  const review = await prisma.review.findFirst({
    where: {
      id: reviewId,
      userId,
      deletedAt: null,
    },
  });

  if (!review) {
    return {
      ok: false,
      statusCode: 404,
      body: {
        message: "Review not found",
      },
    };
  }

  const deletedReview = await prisma.review.update({
    where: {
      id: review.id,
    },
    data: {
      deletedAt: new Date(),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      vehicle: {
        select: {
          id: true,
          slug: true,
          name: true,
        },
      },
    },
  });

  return {
    ok: true,
    statusCode: 200,
    body: {
      message: "Review deleted successfully",
      data: formatReview(deletedReview),
    },
  };
}
