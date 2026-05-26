import { generateAuthTokens } from "../utils/token.js";

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

export function registerUser(payload) {
  const { name, email, password } = payload;
  const validation = validateRegisterPayload({ name, email, password });

  if (!validation.ok) {
    return validation;
  }

  console.log("Register payload:", {
    name,
    email,
    password,
  });

  const tokens = generateAuthTokens({
    email,
    name,
  });

  return {
    ok: true,
    statusCode: 200,
    body: {
      message: "Register data received",
      tokens,
    },
  };
}

export function loginUser(payload) {
  const { email, password } = payload;
  const validation = validateLoginPayload({ email, password });

  if (!validation.ok) {
    return validation;
  }

  console.log("Login payload:", {
    email,
    password,
  });

  const tokens = generateAuthTokens({
    email,
  });

  return {
    ok: true,
    statusCode: 200,
    body: {
      message: "Login data received",
      tokens,
    },
  };
}
