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

function validateBookingPayload(payload) {
  const errors = {};
  const {
    vehicleId,
    vehicleSlug,
    pickupLocationId,
    dropoffLocationId,
    pickupAt,
    dropoffAt,
  } = payload;

  if (!vehicleId && !vehicleSlug) {
    errors.vehicle = "Vehicle id or vehicle slug is required";
  }

  if (vehicleId && typeof vehicleId !== "string") {
    errors.vehicleId = "Vehicle id must be a string";
  }

  if (vehicleSlug && typeof vehicleSlug !== "string") {
    errors.vehicleSlug = "Vehicle slug must be a string";
  }

  if (!pickupLocationId) {
    errors.pickupLocationId = "Pickup location id is required";
  } else if (typeof pickupLocationId !== "string") {
    errors.pickupLocationId = "Pickup location id must be a string";
  }

  if (!dropoffLocationId) {
    errors.dropoffLocationId = "Dropoff location id is required";
  } else if (typeof dropoffLocationId !== "string") {
    errors.dropoffLocationId = "Dropoff location id must be a string";
  }

  if (!pickupAt) {
    errors.pickupAt = "Pickup date is required";
  } else if (Number.isNaN(Date.parse(pickupAt))) {
    errors.pickupAt = "Pickup date must be valid";
  }

  if (!dropoffAt) {
    errors.dropoffAt = "Dropoff date is required";
  } else if (Number.isNaN(Date.parse(dropoffAt))) {
    errors.dropoffAt = "Dropoff date must be valid";
  }

  if (pickupAt && dropoffAt && !errors.pickupAt && !errors.dropoffAt) {
    const pickupDate = new Date(pickupAt);
    const dropoffDate = new Date(dropoffAt);

    if (dropoffDate <= pickupDate) {
      errors.dropoffAt = "Dropoff date must be after pickup date";
    }
  }

  return validationError(errors);
}

function formatBooking(booking) {
  return {
    ...booking,
    totalAmount: Number(booking.totalAmount),
    vehicle: {
      ...booking.vehicle,
      pricePerDay: Number(booking.vehicle.pricePerDay),
    },
  };
}

function calculateTotalAmount(pricePerDay, pickupAt, dropoffAt) {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const days = Math.max(
    1,
    Math.ceil((dropoffAt.getTime() - pickupAt.getTime()) / millisecondsPerDay),
  );

  return Number(pricePerDay) * days;
}

const bookingInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  },
  vehicle: true,
  pickupLocation: true,
  dropoffLocation: true,
};

export async function createBookingAppointment(userId, payload) {
  const validation = validateBookingPayload(payload);

  if (!validation.ok) {
    return validation;
  }

  const {
    vehicleId,
    vehicleSlug,
    pickupLocationId,
    dropoffLocationId,
    pickupAt,
    dropoffAt,
    note,
  } = payload;

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

  const vehicle = await prisma.vehicle.findUnique({
    where: vehicleId ? { id: vehicleId } : { slug: vehicleSlug },
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

  if (vehicle.status !== "AVAILABLE") {
    return {
      ok: false,
      statusCode: 409,
      body: {
        message: "Vehicle is not available for booking",
      },
    };
  }

  const [pickupLocation, dropoffLocation] = await Promise.all([
    prisma.location.findUnique({
      where: {
        id: pickupLocationId,
      },
    }),
    prisma.location.findUnique({
      where: {
        id: dropoffLocationId,
      },
    }),
  ]);

  const locationErrors = {};

  if (!pickupLocation) {
    locationErrors.pickupLocationId = "Pickup location not found";
  }

  if (!dropoffLocation) {
    locationErrors.dropoffLocationId = "Dropoff location not found";
  }

  const locationValidation = validationError(locationErrors);

  if (!locationValidation.ok) {
    return locationValidation;
  }

  const pickupDate = new Date(pickupAt);
  const dropoffDate = new Date(dropoffAt);
  const totalAmount = calculateTotalAmount(
    vehicle.pricePerDay,
    pickupDate,
    dropoffDate,
  );

  const booking = await prisma.booking.create({
    data: {
      userId,
      vehicleId: vehicle.id,
      pickupLocationId,
      dropoffLocationId,
      pickupAt: pickupDate,
      dropoffAt: dropoffDate,
      totalAmount,
      note: typeof note === "string" ? note.trim() : null,
    },
    include: bookingInclude,
  });

  return {
    ok: true,
    statusCode: 201,
    body: {
      message: "Booking appointment created successfully",
      data: formatBooking(booking),
    },
  };
}

export async function getUserAppointments(userId) {
  const bookings = await prisma.booking.findMany({
    where: {
      userId,
    },
    include: bookingInclude,
    orderBy: {
      pickupAt: "desc",
    },
  });

  return {
    ok: true,
    statusCode: 200,
    body: {
      message: "Appointments fetched successfully",
      data: bookings.map(formatBooking),
    },
  };
}
