import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "kiri-ai-learning-local-dev-jwt-secret-key-32-chars-long";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    displayName: string;
    userType: string;
    isActive: boolean;
  };
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized", message: "Missing or malformed Authorization header." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      userType: string;
    };

    // Fetch user from DB to ensure they exist and are active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        userType: true,
        isActive: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Unauthorized", message: "User not found." });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Forbidden", message: "User account is deactivated." });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(401).json({ error: "Unauthorized", message: "Invalid or expired session token." });
  }
}

export async function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: string;
        email: string;
        userType: string;
      };

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          displayName: true,
          userType: true,
          isActive: true,
        },
      });

      if (user && user.isActive) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // Ignore invalid tokens for optional endpoints
    next();
  }
}


export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized", message: "Authentication required." });
    }

    if (!allowedRoles.includes(req.user.userType)) {
      return res.status(403).json({ error: "Forbidden", message: "Insufficient privileges to access this resource." });
    }

    next();
  };
}
