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

function validateReschedulePayload({ pickupAt, dropoffAt }) {
  const errors = {};

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

async function findUserBooking(bookingId, userId, client = prisma) {
  if (!bookingId || typeof bookingId !== "string") {
    return null;
  }

  return client.booking.findFirst({
    where: {
      id: bookingId,
      userId,
    },
    include: bookingInclude,
  });
}

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

  // Prisma commits this transaction when the callback resolves and rolls back if it throws.
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
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

    const vehicle = await tx.vehicle.findUnique({
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
      tx.location.findUnique({
        where: {
          id: pickupLocationId,
        },
      }),
      tx.location.findUnique({
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

    const booking = await tx.booking.create({
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
  });
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

export async function rescheduleAppointment(userId, bookingId, payload) {
  const validation = validateReschedulePayload(payload);

  if (!validation.ok) {
    return validation;
  }

  // Prisma commits this transaction when the callback resolves and rolls back if it throws.
  return prisma.$transaction(async (tx) => {
    const booking = await findUserBooking(bookingId, userId, tx);

    if (!booking) {
      return {
        ok: false,
        statusCode: 404,
        body: {
          message: "Appointment not found",
        },
      };
    }

    if (["CANCELLED", "COMPLETED"].includes(booking.status)) {
      return {
        ok: false,
        statusCode: 409,
        body: {
          message: "This appointment cannot be rescheduled",
        },
      };
    }

    const pickupDate = new Date(payload.pickupAt);
    const dropoffDate = new Date(payload.dropoffAt);
    const totalAmount = calculateTotalAmount(
      booking.vehicle.pricePerDay,
      pickupDate,
      dropoffDate,
    );

    const updatedBooking = await tx.booking.update({
      where: {
        id: booking.id,
      },
      data: {
        pickupAt: pickupDate,
        dropoffAt: dropoffDate,
        totalAmount,
        status: "PENDING",
      },
      include: bookingInclude,
    });

    return {
      ok: true,
      statusCode: 200,
      body: {
        message: "Appointment rescheduled successfully",
        data: formatBooking(updatedBooking),
      },
    };
  });
}

export async function cancelAppointment(userId, bookingId) {
  // Prisma commits this transaction when the callback resolves and rolls back if it throws.
  return prisma.$transaction(async (tx) => {
    const booking = await findUserBooking(bookingId, userId, tx);

    if (!booking) {
      return {
        ok: false,
        statusCode: 404,
        body: {
          message: "Appointment not found",
        },
      };
    }

    if (booking.status === "CANCELLED") {
      return {
        ok: false,
        statusCode: 409,
        body: {
          message: "Appointment is already cancelled",
        },
      };
    }

    if (booking.status === "COMPLETED") {
      return {
        ok: false,
        statusCode: 409,
        body: {
          message: "Completed appointments cannot be cancelled",
        },
      };
    }

    const updatedBooking = await tx.booking.update({
      where: {
        id: booking.id,
      },
      data: {
        status: "CANCELLED",
      },
      include: bookingInclude,
    });

    return {
      ok: true,
      statusCode: 200,
      body: {
        message: "Appointment cancelled successfully",
        data: formatBooking(updatedBooking),
      },
    };
  });
}
