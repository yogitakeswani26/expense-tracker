import { Request, Response, NextFunction } from 'express';

/**
 * NoSQL injection prevention ("SQL injection" equivalent for MongoDB).
 *
 * PROBLEM: MongoDB query operators are just object keys (`$gt`, `$ne`,
 * `$where`, `$regex`, ...). If a client sends
 *   { "email": { "$ne": null }, "password": { "$ne": null } }
 * as JSON body and that object is ever passed into a Mongoose query
 * unfiltered, the attacker can bypass filters/auth checks entirely.
 * Dotted keys (`"$where": "this.a == this.b"`, or `"profile.role": "admin"`)
 * are the same class of attack for nested-field targeting.
 *
 * SOLUTION: strip any object key that starts with `$` or contains a `.`
 * from the request body, query, and params before they reach route
 * handlers/services. This runs in addition to (not instead of) Zod schema
 * validation and Mongoose's own schema typing - defense in depth.
 */
function stripMongoOperators(value: any): any {
  if (Array.isArray(value)) {
    return value.map(stripMongoOperators);
  }
  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    const clean: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      if (key.startsWith('$') || key.includes('.')) {
        continue; // drop the key entirely rather than trying to "fix" it
      }
      clean[key] = stripMongoOperators(val);
    }
    return clean;
  }
  return value;
}

export const mongoSanitizer = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    req.body = stripMongoOperators(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    const sanitizedQuery = stripMongoOperators(req.query);
    for (const key of Object.keys(req.query)) {
      if (!(key in sanitizedQuery)) delete (req.query as any)[key];
    }
    Object.assign(req.query, sanitizedQuery);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = stripMongoOperators(req.params);
  }
  next();
};
