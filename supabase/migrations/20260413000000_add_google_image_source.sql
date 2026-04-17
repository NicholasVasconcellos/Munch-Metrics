-- Add 'google' to image_source enum for Google Custom Search fallback images
ALTER TYPE "public"."image_source" ADD VALUE IF NOT EXISTS 'google';
