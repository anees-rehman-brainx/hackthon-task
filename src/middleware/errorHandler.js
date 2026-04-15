export function errorHandler(err, req, res, _next) {
  const status =
    err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const code = err.code || (status === 500 ? "INTERNAL_ERROR" : "ERROR");
  const path = req.originalUrl ?? req.url ?? "";

  console.error("[api] request error", {
    method: req.method,
    path,
    status,
    code,
    message: err.message,
  });

  if (status === 500 && process.env.NODE_ENV !== "development") {
    return res
      .status(500)
      .json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
  }

  return res.status(status).json({
    error: err.message || "Error",
    code,
    ...(process.env.NODE_ENV === "development" && err.stack
      ? { stack: err.stack }
      : {}),
  });
}
