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

function validateReviewPayload({ userId, rating, comment }) {
  const errors = {};

  if (!userId) {
    errors.userId = "User id is required";
  } else if (typeof userId !== "string") {
    errors.userId = "User id must be a string";
  }

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

function formatReview(review) {
  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
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

export async function createVehicleReview(slug, payload) {
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
      id: payload.userId,
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
