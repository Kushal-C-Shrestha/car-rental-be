import { prisma } from "../lib/prisma.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { generateAuthTokens, verifyRefreshToken } from "../utils/token.js";

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

function validateRegisterPayload({ name, email, password }) {
  const errors = {};

  if (!name) {
    errors.name = "Name is required";
  } else if (typeof name !== "string") {
    errors.name = "Name must be a string";
  } else if (name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters";
  }

  if (!email) {
    errors.email = "Email is required";
  } else if (typeof email !== "string") {
    errors.email = "Email must be a string";
  } else if (!email.includes("@")) {
    errors.email = "Email must be valid";
  }

  if (!password) {
    errors.password = "Password is required";
  } else if (typeof password !== "string") {
    errors.password = "Password must be a string";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  }

  return validationError(errors);
}

function validateLoginPayload({ email, password }) {
  const errors = {};

  if (!email) {
    errors.email = "Email is required";
  } else if (typeof email !== "string") {
    errors.email = "Email must be a string";
  } else if (!email.includes("@")) {
    errors.email = "Email must be valid";
  }

  if (!password) {
    errors.password = "Password is required";
  } else if (typeof password !== "string") {
    errors.password = "Password must be a string";
  }

  return validationError(errors);
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
  };
}

async function createRefreshToken(userId, refreshToken, expiresAt) {
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt,
    },
  });
}

function authResponse(message, statusCode, user, tokens) {
  return {
    ok: true,
    statusCode,
    refreshToken: tokens.refreshToken,
    refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
    body: {
      message,
      data: {
        user: sanitizeUser(user),
        tokens: {
          accessToken: tokens.accessToken,
        },
      },
    },
  };
}

export async function registerUser(payload) {
  const { name, email, password } = payload;
  const validation = validateRegisterPayload({ name, email, password });

  if (!validation.ok) {
    return validation;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (existingUser) {
    return {
      ok: false,
      statusCode: 409,
      body: {
        message: "User with this email already exists",
      },
    };
  }

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      password: hashPassword(password),
    },
  });

  const tokens = generateAuthTokens({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  await createRefreshToken(
    user.id,
    tokens.refreshToken,
    tokens.refreshTokenExpiresAt,
  );

  return authResponse("Registered successfully", 201, user, tokens);
}

export async function loginUser(payload) {
  const { email, password } = payload;
  const validation = validateLoginPayload({ email, password });

  if (!validation.ok) {
    return validation;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (!user || !verifyPassword(password, user.password)) {
    return {
      ok: false,
      statusCode: 401,
      body: {
        message: "Invalid email or password",
      },
    };
  }

  const tokens = generateAuthTokens({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  await createRefreshToken(
    user.id,
    tokens.refreshToken,
    tokens.refreshTokenExpiresAt,
  );

  return authResponse("Logged in successfully", 200, user, tokens);
}

export async function refreshAuthToken(refreshToken) {
  if (!refreshToken) {
    return {
      ok: false,
      statusCode: 401,
      body: {
        message: "Refresh token is required",
      },
    };
  }

  try {
    verifyRefreshToken(refreshToken);
  } catch (_error) {
    return {
      ok: false,
      statusCode: 401,
      body: {
        message: "Invalid or expired refresh token",
      },
    };
  }

  return prisma.$transaction(async (tx) => {
    const storedToken = await tx.refreshToken.findUnique({
      where: {
        token: refreshToken,
      },
      include: {
        user: true,
      },
    });

    if (!storedToken || storedToken.expiresAt <= new Date()) {
      return {
        ok: false,
        statusCode: 401,
        body: {
          message: "Refresh token is invalid",
        },
      };
    }

    const tokens = generateAuthTokens({
      userId: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
    });

    await tx.refreshToken.delete({
      where: {
        id: storedToken.id,
      },
    });

    await tx.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: storedToken.user.id,
        expiresAt: tokens.refreshTokenExpiresAt,
      },
    });

    return authResponse(
      "Token refreshed successfully",
      200,
      storedToken.user,
      tokens,
    );
  });
}
