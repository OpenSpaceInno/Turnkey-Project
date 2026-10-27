import "express";

declare module "express" {
  interface Request {
    session: {
      userId?: number;
      loggedOut?: boolean;
    } | null;
  }
}
