/**
 * Global Error Handler Middleware
 * 
 * Express recognizes a middleware as an error handler if it has exactly 4 parameters.
 * This must be registered LAST in the server, after all routes.
 * 
 * We never leak `err.stack` to the client in production because it exposes internal file paths,
 * library versions, and potentially query details that could help an attacker. It also prevents
 * normal users from seeing a scary, unformatted raw text error.
 */
export function errorHandler(err, req, res, next) {
  // 1. Log the real error on the server side so developers can debug it.
  console.error("Unhandled Error Caught:", err);

  // 2. If the error has a specific status code set by our own app code, respect it.
  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // 3. Otherwise, return a generic 500 Server Error to the client.
  return res.status(500).json({ error: "Something went wrong. Please try again." });
}
