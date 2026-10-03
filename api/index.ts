import app from "../server/app.js";

// Vercel Serverless Function entry point
export default function handler(req: any, res: any) {
  return app(req, res);
}

export { app };
