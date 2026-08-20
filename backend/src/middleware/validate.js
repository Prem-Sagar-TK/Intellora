/**
 * Generic Zod validation middleware factory.
 *
 * Usage:
 *   const { z } = require('zod');
 *   const schema = z.object({ email: z.string().email(), ... });
 *   router.post('/login', validate(schema), loginUser);
 *
 * On failure returns 422 with an array of { field, message } objects.
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.issues.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(422).json({ message: 'Validation failed', errors });
  }
  req.body = result.data; // replace with parsed/coerced data
  next();
};

module.exports = validate;
