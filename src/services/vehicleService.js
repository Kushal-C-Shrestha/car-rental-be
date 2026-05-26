import { prisma } from "../lib/prisma.js";

function formatVehicle(vehicle) {
  return {
    ...vehicle,
    pricePerDay: Number(vehicle.pricePerDay),
    averageRating:
      vehicle.reviews.length > 0
        ? vehicle.reviews.reduce((total, review) => total + review.rating, 0) /
          vehicle.reviews.length
        : 0,
    reviewCount: vehicle.reviews.length,
  };
}

const vehicleInclude = {
  category: true,
  reviews: {
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
};

export async function getAllVehicles() {
  const vehicles = await prisma.vehicle.findMany({
    include: vehicleInclude,
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    ok: true,
    statusCode: 200,
    body: {
      message: "Vehicles fetched successfully",
      data: vehicles.map(formatVehicle),
    },
  };
}

export async function getVehicleDetails(slug) {
  if (!slug || typeof slug !== "string") {
    return {
      ok: false,
      statusCode: 400,
      body: {
        message: "Vehicle slug is required",
      },
    };
  }

  const vehicle = await prisma.vehicle.findUnique({
    where: {
      slug,
    },
    include: vehicleInclude,
  });

  if (!vehicle) {
    return {
      ok: false,
      statusCode: 404,
      body: {
        message: "Vehicle not found",
      },
    };
  }

  return {
    ok: true,
    statusCode: 200,
    body: {
      message: "Vehicle details fetched successfully",
      data: formatVehicle(vehicle),
    },
  };
}
