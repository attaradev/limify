import { Context, Next } from "koa";
import { Error as mongooseError } from "mongoose";
import AppError from "../../utils/lib/appError";

const handleCastErrorDB = (err: mongooseError.CastError) => {
  const message = `Invalid ${err.path}: ${JSON.stringify(err.value)}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err: mongooseError.ValidationError) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err: AppError, ctx: Context) => {
  console.error("ERROR 💥", err);
  ctx.status = err.statusCode;
  ctx.body = {
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  };
  ctx.respond = true;
  return;
};

const sendErrorProd = (err: AppError, ctx: Context) => {
  //  Log error
  console.error("ERROR 💥", err);
  // A) Operational, trusted error: send message to client
  if (err.isOperational) {
    ctx.status = err.statusCode;
    ctx.body = {
      status: err.status,
      message: err.message,
    };
    ctx.respond = true;
    return;
  }
  // B) Programming or other unknown error: don't leak error details

  // Send generic message
  ctx.status = err.statusCode;
  ctx.body = {
    status: err.status,
    message: err.message,
  };
  ctx.respond = true;
  return;
};

export const globaErrorHandler = async (ctx: Context, next: Next) => {
  // console.log(err.stack);
  try {
    await next();
  } catch (err) {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";

    if (process.env.NODE_ENV === "development") {
      sendErrorDev(err, ctx);
    } else if (process.env.NODE_ENV === "production") {
      let error = { ...err };
      error.message = err.message;

      if (err instanceof mongooseError.CastError)
        error = handleCastErrorDB(error);
      if (error.code === 11000 && err instanceof mongooseError)
        error = handleDuplicateFieldsDB(error);
      if (err instanceof mongooseError.ValidationError)
        error = handleValidationErrorDB(error);

      sendErrorProd(error, ctx);
    }
  }
};
