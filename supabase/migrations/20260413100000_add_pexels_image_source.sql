-- Add 'pexels' to image_source enum for Pexels API fallback images
ALTER TYPE "public"."image_source" ADD VALUE IF NOT EXISTS 'pexels';
