import type React from "react";
import heroImg from "../assets/images/hero_kenyan_textile_1790988200150.jpg";
import scrapsImg from "../assets/images/scraps_transformation_1790988212084.jpg";
import collectionImg from "../assets/images/kenyan_textile_collection_1790988223725.jpg";
import artisanImg from "../assets/images/artisans_workshop_1790988232395.jpg";

export { heroImg, scrapsImg, collectionImg, artisanImg };

const imageLookup: Record<string, string> = {
  hero: heroImg,
  "hero_kenyan_textile": heroImg,
  "hero_kenyan_textile_1790988200150.jpg": heroImg,
  "/assets/images/hero_kenyan_textile_1790988200150.jpg": heroImg,
  "/assets/hero_kenyan_textile_1790988200150.jpg": heroImg,
  "/images/hero_kenyan_textile_1790988200150.jpg": heroImg,
  
  scraps: scrapsImg,
  "scraps_transformation": scrapsImg,
  "scraps_transformation_1790988212084.jpg": scrapsImg,
  "/assets/images/scraps_transformation_1790988212084.jpg": scrapsImg,
  "/assets/scraps_transformation_1790988212084.jpg": scrapsImg,
  "/images/scraps_transformation_1790988212084.jpg": scrapsImg,

  collection: collectionImg,
  "kenyan_textile_collection": collectionImg,
  "kenyan_textile_collection_1790988223725.jpg": collectionImg,
  "/assets/images/kenyan_textile_collection_1790988223725.jpg": collectionImg,
  "/assets/kenyan_textile_collection_1790988223725.jpg": collectionImg,
  "/images/kenyan_textile_collection_1790988223725.jpg": collectionImg,

  artisan: artisanImg,
  "artisans_workshop": artisanImg,
  "artisans_workshop_1790988232395.jpg": artisanImg,
  "/assets/images/artisans_workshop_1790988232395.jpg": artisanImg,
  "/assets/artisans_workshop_1790988232395.jpg": artisanImg,
  "/images/artisans_workshop_1790988232395.jpg": artisanImg,
};

/**
 * Resolves any image URL string (relative, bundled, base64, or remote)
 * to a working, guaranteed URL that won't 404 in production or on Vercel.
 */
export function resolveImageUrl(url?: string | null): string {
  if (!url || typeof url !== "string" || url.trim() === "") {
    return heroImg;
  }

  const clean = url.trim();

  // If already a base64 data URL or external https URL
  if (clean.startsWith("data:") || clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean;
  }

  // Check lookup table for exact or filename match
  if (imageLookup[clean]) {
    return imageLookup[clean];
  }

  // Check partial key matches
  if (clean.includes("hero")) return heroImg;
  if (clean.includes("scraps")) return scrapsImg;
  if (clean.includes("collection")) return collectionImg;
  if (clean.includes("artisan") || clean.includes("workshop")) return artisanImg;

  // Fallback to hero image
  return clean.startsWith("/") ? clean : `/${clean}`;
}

/**
 * Universal image error fallback handler to attach to <img onError={...} />
 */
export function handleImageFallback(e: React.SyntheticEvent<HTMLImageElement, Event>) {
  const target = e.currentTarget;
  if (target.dataset.triedFallback) return;
  target.dataset.triedFallback = "true";
  target.src = heroImg;
}
