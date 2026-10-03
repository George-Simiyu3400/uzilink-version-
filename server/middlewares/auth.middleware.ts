import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/crypto.js";
import { db, UserRole } from "../db.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    name: string;
  };
}

/**
 * Access-control authentication gate middleware
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ message: "Invalid or expired session token" });
    }

    // Double check user exists in Database
    const users = db.getUsers();
    const user = users.find(u => u.id === decoded.id);
    if (!user) {
      return res.status(401).json({ message: "User account no longer exists" });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ message: "Authentication process failed" });
  }
}

/**
 * Optional authentication middleware for public endpoints that can be enhanced with user context
 */
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = verifyToken(token);
      if (decoded) {
        const users = db.getUsers();
        const user = users.find((u) => u.id === decoded.id);
        if (user) {
          req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name
          };
        }
      }
    }
  } catch (error) {
    // Graceful fallback for optional auth
  }
  next();
}

/**
 * Role authorization builder
 */
export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Forbidden: This action requires role of: ${allowedRoles.join(" or ")}` 
      });
    }

    next();
  };
}
