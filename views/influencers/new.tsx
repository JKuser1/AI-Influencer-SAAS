"use client";

import { useState, createContext, useContext, useEffect, type ReactNode } from "react";
import { AuthGuard } from "@/components/layout";
import { useCreateInfluencer, useGenerateInfluencer, useGetMe, useGetInfluencers } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, Sparkles, AlertCircle,
  Loader2, X, User, Zap, Palette, Eye, Scissors, Dumbbell, Brain,
  Star, Camera, Lock,
} from "lucide-react";
import Link from "next/link";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { canCreateInfluencer, getInfluencerLimit } from "@/lib/plan-access";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CharacterConfig {
  gender: "male" | "female" | "";
  ethnicity: string;
  artStyle: "realistic" | "anime" | "";
  age: number;
  eyeColor: string;
  hairStyle: string;
  hairColor: string;
  bodyShape: string;
  breastSize: string;
  vibe: string;
  personalityTraits: string[];
  contentTone: string;
  name: string;
  niche: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const W = "/wizard";
const F = "/images/female";
const M = "/images/male";

const GENDERS = [
  { id: "male",   label: "Male",   sub: "Masculine energy",  img: `${W}/gender-male.png` },
  { id: "female", label: "Female", sub: "Feminine energy",   img: `${W}/gender-female.png` },
];

const FA_ETH = `${F}/ethnicity-anime`;

// ── Ethnicity ── gender-specific portraits ───────────────────────────────────
const FEMALE_ETHNICITIES = [
  { id: "Asian",          label: "Asian",             img: `${F}/ethnicity/asian.png` },
  { id: "Black",          label: "Black",             img: `${F}/ethnicity/black.png` },
  { id: "White",          label: "White / Caucasian", img: `${F}/ethnicity/white.png` },
  { id: "Hispanic",       label: "Hispanic / Latino", img: `${F}/ethnicity/hispanic.png` },
  { id: "Middle Eastern", label: "Middle Eastern",    img: `${F}/ethnicity/middle-eastern.png` },
  { id: "Mixed",          label: "Mixed",             img: `${F}/ethnicity/mixed.png` },
];

const MALE_ETHNICITIES = [
  { id: "Asian",          label: "Asian",             img: `${M}/ethnicity/asian.png` },
  { id: "Black",          label: "Black",             img: `${M}/ethnicity/black.png` },
  { id: "White",          label: "White / Caucasian", img: `${M}/ethnicity/white.png` },
  { id: "Hispanic",       label: "Hispanic / Latino", img: `${M}/ethnicity/hispanic.png` },
  { id: "Middle Eastern", label: "Middle Eastern",    img: `${M}/ethnicity/middle-eastern.png` },
  { id: "Mixed",          label: "Mixed",             img: `${M}/ethnicity/mixed.png` },
];

// Expanded 12-option set for Female — Realistic style
const FR = "/images/female/ethnicity-realistic";
const FEMALE_REALISTIC_ETHNICITIES = [
  { id: "Caucasian",     label: "Caucasian",     img: `${FR}/caucasian.png` },
  { id: "Latina",        label: "Latina",        img: `${FR}/latina.png` },
  { id: "Asian",         label: "Asian",         img: `${FR}/asian.png` },
  { id: "Arabic",        label: "Arabic",        img: `${FR}/arabic.png` },
  { id: "Black",         label: "Black / Afro",  img: `${FR}/black-afro.png` },
  { id: "Indian",        label: "Indian",        img: `${FR}/indian.png` },
  { id: "Russian",       label: "Russian",       img: `${FR}/russian.png` },
  { id: "Scandinavian",  label: "Scandinavian",  img: `${FR}/scandinavian.png` },
  { id: "Mediterranean", label: "Mediterranean", img: `${FR}/mediterranean.png` },
  { id: "Korean",        label: "Korean",        img: `${FR}/korean.png` },
  { id: "Japanese",      label: "Japanese",      img: `${FR}/japanese.png` },
  { id: "Brazilian",     label: "Brazilian",     img: `${FR}/brazilian.png` },
];

const FEMALE_ANIME_ETHNICITIES = [
  { id: "Caucasian",     label: "Caucasian",     img: `${FA_ETH}/caucasian.png` },
  { id: "Latina",        label: "Latina",        img: `${FA_ETH}/latina.png` },
  { id: "Asian",         label: "Asian",         img: `${FA_ETH}/asian.png` },
  { id: "Arabic",        label: "Arabic",        img: `${FA_ETH}/arabic.png` },
  { id: "Black",         label: "Black / Afro",  img: `${FA_ETH}/black-afro.png` },
  { id: "Indian",        label: "Indian",        img: `${FA_ETH}/indian.png` },
  { id: "Russian",       label: "Russian",       img: `${FA_ETH}/russian.png` },
  { id: "Scandinavian",  label: "Scandinavian",  img: `${FA_ETH}/scandinavian.png` },
  { id: "Mediterranean", label: "Mediterranean", img: `${FA_ETH}/mediterranean.png` },
  { id: "Korean",        label: "Korean",        img: `${FA_ETH}/korean.png` },
  { id: "Japanese",      label: "Japanese",      img: `${FA_ETH}/japanese.png` },
  { id: "Brazilian",     label: "Brazilian",     img: `${FA_ETH}/brazilian.png` },
];

// Expanded 12-option sets for Male — Realistic and Anime styles
const R = "/images/male/ethnicity-realistic";
const MALE_REALISTIC_ETHNICITIES = [
  { id: "Caucasian",     label: "Caucasian",     img: `${R}/caucasian.png` },
  { id: "Latino",        label: "Latino",        img: `${R}/latino.png` },
  { id: "Asian",         label: "Asian",         img: `${R}/asian.png` },
  { id: "Arabic",        label: "Arabic",        img: `${R}/arabic.png` },
  { id: "Black",         label: "Black / Afro",  img: `${R}/black-afro.png` },
  { id: "Indian",        label: "Indian",        img: `${R}/indian.png` },
  { id: "Russian",       label: "Russian",       img: `${R}/russian.png` },
  { id: "Scandinavian",  label: "Scandinavian",  img: `${R}/scandinavian.png` },
  { id: "Mediterranean", label: "Mediterranean", img: `${R}/mediterranean.png` },
  { id: "Korean",        label: "Korean",        img: `${R}/korean.png` },
  { id: "Japanese",      label: "Japanese",      img: `${R}/japanese.png` },
  { id: "Brazilian",     label: "Brazilian",     img: `${R}/brazilian.png` },
];

const A = "/images/male/ethnicity-anime";
const MALE_ANIME_ETHNICITIES = [
  { id: "Caucasian",     label: "Caucasian",     img: `${A}/caucasian.png` },
  { id: "Latino",        label: "Latino",        img: `${A}/latino.png` },
  { id: "Asian",         label: "Asian",         img: `${A}/asian.png` },
  { id: "Arabic",        label: "Arabic",        img: `${A}/arabic.png` },
  { id: "Black",         label: "Black / Afro",  img: `${A}/black-afro.png` },
  { id: "Indian",        label: "Indian",        img: `${A}/indian.png` },
  { id: "Russian",       label: "Russian",       img: `${A}/russian.png` },
  { id: "Scandinavian",  label: "Scandinavian",  img: `${A}/scandinavian.png` },
  { id: "Mediterranean", label: "Mediterranean", img: `${A}/mediterranean.png` },
  { id: "Korean",        label: "Korean",        img: `${A}/korean.png` },
  { id: "Japanese",      label: "Japanese",      img: `${A}/japanese.png` },
  { id: "Brazilian",     label: "Brazilian",     img: `${A}/brazilian.png` },
];

// ── Art Style ── gender-specific preview images ───────────────────────────────
const FEMALE_ART_STYLES = [
  { id: "realistic", label: "Realistic", sub: "Photo-real",  img: `${W}/style-realistic-female.png` },
  { id: "anime",     label: "Anime",     sub: "Illustrated", img: `${W}/style-anime-female.png` },
];
const MALE_ART_STYLES = [
  { id: "realistic", label: "Realistic", sub: "Photo-real",  img: `${W}/style-realistic-male.mp4` },
  { id: "anime",     label: "Anime",     sub: "Illustrated", img: `${W}/style-anime-male.mp4` },
];

const EYE_COLORS = [
  { id: "Brown", label: "Brown", img: `${W}/eye-brown.png` },
  { id: "Blue",  label: "Blue",  img: `${W}/eye-blue.png` },
  { id: "Green", label: "Green", img: `${W}/eye-green.png` },
  { id: "Hazel", label: "Hazel", img: `${W}/eye-hazel.png` },
  { id: "Gray",  label: "Gray",  img: `${W}/eye-gray.png` },
  { id: "Amber", label: "Amber", img: `${W}/eye-amber.png` },
];

// ── Hair Styles ── different options per gender ───────────────────────────────
const FEMALE_HAIR_STYLES = [
  { id: "Long Straight", label: "Long Straight", sub: "Sleek & smooth",  img: `${F}/hair-style/long-straight.png` },
  { id: "Long Wavy",     label: "Long Wavy",     sub: "Beachy waves",    img: `${F}/hair-style/long-wavy.png` },
  { id: "Short Bob",     label: "Short Bob",     sub: "Classic cut",     img: `${F}/hair-style/short-bob.png` },
  { id: "Pixie Cut",     label: "Pixie Cut",     sub: "Bold & edgy",     img: `${F}/hair-style/pixie.png` },
  { id: "Curly",         label: "Curly",         sub: "Natural curls",   img: `${F}/hair-style/curly.png` },
  { id: "Braids",        label: "Braids",        sub: "Woven strands",   img: `${F}/hair-style/braids.png` },
  { id: "Updo / Bun",   label: "Updo / Bun",    sub: "Elegant style",   img: `${F}/hair-style/updo.png` },
  { id: "Ponytail",      label: "Ponytail",      sub: "Clean & sporty",  img: `${F}/hair-style/ponytail.png` },
];

const MALE_HAIR_STYLES = [
  { id: "Side Part",     label: "Side Part",     sub: "Classic & polished", img: `${M}/hair-style/side-part.png` },
  { id: "Buzz Cut",      label: "Buzz Cut",      sub: "Clean & minimal",    img: `${M}/hair-style/buzz-cut.png` },
  { id: "Crew Cut",      label: "Crew Cut",      sub: "Military clean",     img: `${M}/hair-style/crew-cut.png` },
  { id: "Undercut Fade", label: "Undercut Fade", sub: "Modern & sharp",     img: `${M}/hair-style/undercut-fade.png` },
  { id: "Curly",         label: "Curly",         sub: "Natural curls",      img: `${M}/hair-style/curly.png` },
  { id: "Wavy Medium",   label: "Wavy Medium",   sub: "Textured & casual",  img: `${M}/hair-style/wavy-medium.png` },
  { id: "Man Bun",       label: "Man Bun",       sub: "Long & tied back",   img: `${M}/hair-style/man-bun.png` },
  { id: "Textured Crop", label: "Textured Crop", sub: "Styled & fresh",     img: `${M}/hair-style/textured-crop.png` },
];

// ── Hair Colors ── same 10 options, gender-specific portraits ─────────────────
const FEMALE_HAIR_COLORS = [
  { id: "Black",      label: "Black",      img: `${F}/hair-color/black.png` },
  { id: "Dark Brown", label: "Dark Brown", img: `${F}/hair-color/dark-brown.png` },
  { id: "Brown",      label: "Brown",      img: `${F}/hair-color/brown.png` },
  { id: "Blonde",     label: "Blonde",     img: `${F}/hair-color/blonde.png` },
  { id: "Red",        label: "Red",        img: `${F}/hair-color/red.png` },
  { id: "Auburn",     label: "Auburn",     img: `${F}/hair-color/auburn.png` },
  { id: "Platinum",   label: "Platinum",   img: `${F}/hair-color/platinum.png` },
  { id: "White",      label: "White",      img: `${F}/hair-color/white.png` },
  { id: "Blue",       label: "Blue",       img: `${F}/hair-color/blue.png` },
  { id: "Pink",       label: "Pink",       img: `${F}/hair-color/pink.png` },
];

const MALE_HAIR_COLORS = [
  { id: "Black",      label: "Black",      img: `${M}/hair-color/black.png` },
  { id: "Dark Brown", label: "Dark Brown", img: `${M}/hair-color/dark-brown.png` },
  { id: "Brown",      label: "Brown",      img: `${M}/hair-color/brown.png` },
  { id: "Blonde",     label: "Blonde",     img: `${M}/hair-color/blonde.png` },
  { id: "Red",        label: "Red",        img: `${M}/hair-color/red.png` },
  { id: "Auburn",     label: "Auburn",     img: `${M}/hair-color/auburn.png` },
  { id: "Platinum",   label: "Platinum",   img: `${M}/hair-color/platinum.png` },
  { id: "White",      label: "White",      img: `${M}/hair-color/white.png` },
  { id: "Blue",       label: "Blue",       img: `${M}/hair-color/blue.png` },
  { id: "Pink",       label: "Pink",       img: `${M}/hair-color/pink.png` },
];

// ── Anime-specific male hair sets ─────────────────────────────────────────────
const HS_A = "/images/male/hair-style-anime";
const MALE_ANIME_HAIR_STYLES = [
  { id: "Bald",        label: "Bald",        img: `${HS_A}/bald.png` },
  { id: "Buzz Cut",    label: "Buzz Cut",    img: `${HS_A}/buzz-cut.png` },
  { id: "Curly",       label: "Curly",       img: `${HS_A}/curly.png` },
  { id: "Dreadlocks",  label: "Dreadlocks",  img: `${HS_A}/dreadlocks.png` },
  { id: "Long",        label: "Long",        img: `${HS_A}/long.png` },
  { id: "Short",       label: "Short",       img: `${HS_A}/short.png` },
  { id: "Slick",       label: "Slick",       img: `${HS_A}/slick.png` },
  { id: "Bun",         label: "Bun",         img: `${HS_A}/bun.png` },
];

const HC_A = "/images/male/hair-color-anime";
const MALE_ANIME_HAIR_COLORS = [
  { id: "Black",        label: "Black",        img: `${HC_A}/black.png` },
  { id: "Brown",        label: "Brown",        img: `${HC_A}/brown.png` },
  { id: "Light / Fair", label: "Light / Fair", img: `${HC_A}/light-fair.png` },
  { id: "Pink Colored", label: "Pink Colored", img: `${HC_A}/pink.png` },
  { id: "Yellow",       label: "Yellow",       img: `${HC_A}/yellow.png` },
  { id: "Gray",         label: "Gray",         img: `${HC_A}/gray.png` },
];

// ── Anime-specific female hair sets ───────────────────────────────────────────
const HS_FA = "/images/female/hair-style-anime";
const FEMALE_ANIME_HAIR_STYLES = [
  { id: "Short",      label: "Short",      img: `${HS_FA}/short.png` },
  { id: "Straight",   label: "Straight",   img: `${HS_FA}/straight.png` },
  { id: "Bangs",      label: "Bangs",      img: `${HS_FA}/bangs.png` },
  { id: "Curly",      label: "Curly",      img: `${HS_FA}/curly.png` },
  { id: "Long",       label: "Long",       img: `${HS_FA}/long.png` },
  { id: "Bun",        label: "Bun",        img: `${HS_FA}/bun.png` },
  { id: "Braids",     label: "Braids",     img: `${HS_FA}/braids.png` },
  { id: "Ponytail",   label: "Ponytail",   img: `${HS_FA}/ponytail.png` },
];

const HC_FA = "/images/female/hair-color-anime";
const FEMALE_ANIME_HAIR_COLORS = [
  { id: "Black",    label: "Black",    img: `${HC_FA}/black.png` },
  { id: "Brunette", label: "Brunette", img: `${HC_FA}/brunette.png` },
  { id: "Blonde",   label: "Blonde",   img: `${HC_FA}/blonde.png` },
  { id: "Pink",     label: "Pink",     img: `${HC_FA}/pink.png` },
  { id: "Redhead",  label: "Redhead",  img: `${HC_FA}/redhead.png` },
  { id: "Green",    label: "Green",    img: `${HC_FA}/green.png` },
];

// ── Body Shapes ── different options per gender ───────────────────────────────
const BFR = "/images/female/body-realistic";
const FEMALE_REALISTIC_BODY_SHAPES = [
  { id: "Fit",      label: "Fit",      img: `${BFR}/fit.png` },
  { id: "Skinny",   label: "Skinny",   img: `${BFR}/skinny.png` },
  { id: "Muscular", label: "Muscular", img: `${BFR}/muscular.png` },
  { id: "Chubby",   label: "Chubby",   img: `${BFR}/chubby.png` },
];

const FEMALE_BODY_SHAPES = [
  { id: "Slim",      label: "Slim",      sub: "Lean & slender",   img: `${F}/body/slim.png` },
  { id: "Athletic",  label: "Athletic",  sub: "Toned & fit",      img: `${F}/body/athletic.png` },
  { id: "Curvy",     label: "Curvy",     sub: "Full figure",      img: `${F}/body/curvy.png` },
  { id: "Petite",    label: "Petite",    sub: "Small & delicate", img: `${F}/body/petite.png` },
  { id: "Plus Size", label: "Plus Size", sub: "Bold & confident", img: `${F}/body/plus-size.png` },
];

const MALE_BODY_SHAPES = [
  { id: "Slim",     label: "Slim",     sub: "Lean & slender",   img: `${M}/body/slim.png` },
  { id: "Athletic", label: "Athletic", sub: "Toned & fit",      img: `${M}/body/athletic.png` },
  { id: "Muscular", label: "Muscular", sub: "Built & powerful", img: `${M}/body/muscular.png` },
  { id: "Average",  label: "Average",  sub: "Natural build",    img: `${M}/body/average.png` },
  { id: "Stocky",   label: "Stocky",   sub: "Broad & solid",    img: `${M}/body/stocky.png` },
];

const BA = "/images/male/body-anime";
const BA_F = "/images/female/body-anime";
const FEMALE_ANIME_BODY_SHAPES = [
  { id: "Fit",      label: "Fit",      img: `${BA_F}/fit.png` },
  { id: "Skinny",   label: "Skinny",   img: `${BA_F}/skinny.png` },
  { id: "Muscular", label: "Muscular", img: `${BA_F}/muscular.png` },
  { id: "Chubby",   label: "Chubby",   img: `${BA_F}/chubby.png` },
];

const MALE_ANIME_BODY_SHAPES = [
  { id: "Fit",      label: "Fit",      img: `${BA}/fit.png` },
  { id: "Skinny",   label: "Skinny",   img: `${BA}/skinny.png` },
  { id: "Muscular", label: "Muscular", img: `${BA}/muscular.png` },
  { id: "Wide",     label: "Wide",     img: `${BA}/wide.png` },
];

// ── Gender-aware helper ───────────────────────────────────────────────────────
function byGender<T>(gender: string, female: T, male: T): T {
  return gender === "male" ? male : female;
}

const VIBES = [
  { id: "Glamour",    label: "Glamour",       sub: "High fashion & luxury",    img: `${W}/vibe-glamour.png` },
  { id: "Clean",      label: "Clean Girl",    sub: "Minimal & effortless",     img: `${W}/vibe-clean.png` },
  { id: "Y2K",        label: "Y2K",           sub: "Bold & playful retro",     img: `${W}/vibe-y2k.png` },
  { id: "Streetwear", label: "Streetwear",    sub: "Urban & sporty",           img: `${W}/vibe-streetwear.png` },
  { id: "Soft",       label: "Soft & Dreamy", sub: "Pastel & romantic",        img: `${W}/vibe-soft.png` },
  { id: "Alt",        label: "Alt / Edgy",    sub: "Dark & alternative",       img: `${W}/vibe-alt.png` },
];

const MALE_PERSONALITY_ARCHETYPES = [
  { id: "Free Spirit",  label: "Free Spirit",  emoji: "✨", desc: "Adventurous soul who lives in the moment, bringing spontaneity and joy to every interaction" },
  { id: "Protector",   label: "Protector",    emoji: "🛡️", desc: "Reliable guardian who stands firm in defense of those they care about" },
  { id: "Sage",        label: "Sage",         emoji: "🧠", desc: "Thoughtful mentor who shares profound wisdom through life experiences" },
  { id: "Hero",        label: "Hero",         emoji: "⚔️", desc: "Courageous soul with an unwavering moral compass and protective instinct" },
  { id: "Jester",      label: "Jester",       emoji: "🎭", desc: "Playful spirit who brightens every moment with wit and charm" },
  { id: "Toy Boy",     label: "Toy Boy",      emoji: "🧸", desc: "Energetic and carefree, bringing joy and spontaneity to life" },
  { id: "Dominant",    label: "Dominant",     emoji: "👑", desc: "Natural leader who takes charge with confidence and charisma" },
  { id: "Submissive",  label: "Submissive",   emoji: "🌸", desc: "Attentive partner who finds fulfillment in making others happy" },
  { id: "Lover",       label: "Lover",        emoji: "❤️", desc: "Romantic soul who cherishes deep emotional connections" },
  { id: "Beast",       label: "Beast",        emoji: "🐺", desc: "Wild spirit driven by passion and primal desires" },
  { id: "Confidant",   label: "Confidant",    emoji: "🤝", desc: "Trusted advisor offering unwavering support and guidance" },
  { id: "Rebel",       label: "Rebel",        emoji: "⚡", desc: "Free spirit who charts their own path and challenges conventions" },
  { id: "Scholar",     label: "Scholar",      emoji: "📚", desc: "Knowledge seeker who delights in intellectual discovery" },
];

const PERSONALITY_TRAITS = [
  "Confident", "Playful", "Sophisticated", "Bold", "Witty",
  "Empathetic", "Adventurous", "Minimalist", "Creative", "Authentic",
  "Inspirational", "Sensual",
];

const CONTENT_TONES = [
  { id: "Casual",        label: "Casual & Fun",     sub: "Relatable, laid-back content" },
  { id: "Educational",   label: "Educational",       sub: "Informative, expert voice" },
  { id: "Inspirational", label: "Inspirational",     sub: "Motivational, uplifting" },
  { id: "Entertaining",  label: "Entertaining",      sub: "Humorous, high-energy" },
  { id: "Aesthetic",     label: "Aesthetic",         sub: "Visual, artistic, curated" },
];

const MALE_OCCUPATIONS = [
  "Custom", "Teacher", "Interior Designer", "Student", "Soldier", "Stewardess", "Chef",
  "Photographer", "Model", "Actor", "Librarian", "Nutritionist", "Florist", "Wedding Planner",
  "Fashion Blogger", "Yoga Instructor", "Childcare Worker", "Social Worker", "Executive Assistant",
  "Event Coordinator", "Makeup Artist", "Art Teacher", "Dance Instructor", "Boutique Owner",
  "Jewelry Maker", "Perfumer", "Voice Coach", "Pastry Chef", "Pilates Instructor",
];

const BS_F = "/images/female/breast-size";
const FEMALE_BREAST_SIZES = [
  { id: "Flat",     label: "Flat",     img: `${BS_F}/flat.png` },
  { id: "Small",    label: "Small",    img: `${BS_F}/small.png` },
  { id: "Medium",   label: "Medium",   img: `${BS_F}/medium.png` },
  { id: "Large",    label: "Large",    img: `${BS_F}/large.png` },
  { id: "XXL",      label: "XXL",      img: `${BS_F}/xxl.png` },
  { id: "Gigantic", label: "Gigantic", img: `${BS_F}/gigantic.png` },
  { id: "Silicone", label: "Silicone", img: `${BS_F}/silicone.png` },
];

const BU_F = "/images/female/butt-size";
const FEMALE_BUTT_SIZES = [
  { id: "Small",    label: "Small",    img: `${BU_F}/small.png` },
  { id: "Medium",   label: "Medium",   img: `${BU_F}/medium.png` },
  { id: "Large",    label: "Large",    img: `${BU_F}/large.png` },
  { id: "Athletic", label: "Athletic", img: `${BU_F}/athletic.png` },
];

const MALE_HOBBIES = [
  "Fitness", "Vlogging", "Traveling", "Hiking", "Gaming", "Partying", "Anime", "Cosplay",
  "Writing", "DIY Crafting", "Photography", "Volunteering", "Cars", "Art", "Watching Netflix",
  "Manga and Anime", "Martial Arts", "Baking", "Reading", "Painting", "Knitting", "Yoga",
  "Surfing", "Playing Piano", "Bird Watching", "Skateboarding", "Pottery", "Stand-Up Comedy",
  "Astrology", "Mountain Biking", "Scuba Diving", "Salsa Dancing", "Antiquing", "Calligraphy",
  "Horseback Riding", "Archery", "Chess",
];

const BREAST_SIZES = [
  { id: "Small",  label: "Small",  sub: "A – B" },
  { id: "Medium", label: "Medium", sub: "C – D" },
  { id: "Large",  label: "Large",  sub: "DD+"   },
];

const NICHES = [
  "Fashion & Lifestyle", "Fitness & Health", "Travel & Adventure",
  "Food & Cooking", "Beauty & Skincare", "Tech & Gaming",
  "Music & Arts", "Business & Finance",
];

// ─── Wizard Config ─────────────────────────────────────────────────────────

const TOTAL_STEPS = 9;
const STEP_LABELS_FEMALE = ["Gender", "Style", "Ethnicity", "Appearance", "Hair Style", "Body Shape", "Body Details", "Personality", "Review"];
const STEP_LABELS_MALE   = ["Gender", "Style", "Ethnicity", "Appearance", "Hair Style", "Body Shape", "Personality", "Review"];

const WizardCtx = createContext<{ totalSteps: number; stepLabels: string[] }>({
  totalSteps: TOTAL_STEPS,
  stepLabels: STEP_LABELS_FEMALE,
});

// ─── Shared Card Components ────────────────────────────────────────────────

function ImageCard({
  src, alt, label, sub, selected, onClick, imgClass, priority,
}: {
  src: string; alt: string; label: string; sub?: string;
  selected: boolean; onClick: () => void; imgClass?: string; priority?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);

  // Determine aspect ratio for fill layout
  const isPortrait = imgClass?.includes("3/4") || imgClass?.includes("4/3");

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative rounded-xl overflow-hidden border-2 cursor-pointer text-left w-full",
        "transition-all duration-200 ease-out hover:-translate-y-1 active:scale-[0.97]",
        selected
          ? "border-primary shadow-[0_0_28px_rgba(168,85,247,0.5)]"
          : "border-white/10 hover:border-white/40 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]",
      )}
    >
      <div className={cn("relative w-full overflow-hidden bg-zinc-900", imgClass ?? "aspect-square")}>
        {/* Skeleton shown while loading */}
        {!loaded && (
          <div className="absolute inset-0 bg-zinc-800 animate-pulse" />
        )}
        <NextImage
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 16vw"
          priority={priority}
          className={cn(
            "object-cover transition-all duration-500 ease-out group-hover:scale-110",
            loaded ? "opacity-100" : "opacity-0",
          )}
          onLoad={() => setLoaded(true)}
        />
        <div className={cn(
          "absolute inset-0 transition-opacity duration-300",
          "bg-gradient-to-t from-black/80 via-black/10 to-transparent",
          selected ? "opacity-100" : "opacity-80",
        )} />
        <div className={cn(
          "absolute inset-0 bg-primary/12 transition-opacity duration-300",
          selected ? "opacity-100" : "opacity-0",
        )} />
        {selected && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary shadow-[0_0_12px_rgba(168,85,247,0.6)] flex items-center justify-center z-10">
            <Check className="w-3.5 h-3.5 text-white" />
          </div>
        )}
      </div>
      <div className={cn(
        "py-2.5 px-3 text-center transition-colors duration-300",
        selected ? "bg-primary/20" : "bg-zinc-950/80 backdrop-blur-sm",
      )}>
        <div className={cn(
          "text-sm font-semibold leading-tight transition-colors duration-300",
          selected ? "text-primary" : "text-white",
        )}>
          {label}
        </div>
        {sub && <div className="text-[11px] text-white/50 mt-0.5 leading-tight">{sub}</div>}
      </div>
    </button>
  );
}

function SizeCard({ opt, selected, onClick }: { opt: typeof BREAST_SIZES[0]; selected: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className={cn(
        "relative w-full py-5 rounded-xl border-2 cursor-pointer transition-colors duration-200 flex flex-col items-center gap-1",
        selected
          ? "border-primary bg-primary/10 shadow-[0_0_18px_rgba(168,85,247,0.3)]"
          : "border-white/10 bg-card/40 hover:border-white/35",
      )}
    >
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
        >
          <Check className="w-3 h-3 text-white" />
        </motion.div>
      )}
      <span className={cn("text-base font-bold", selected && "text-primary")}>{opt.label}</span>
      <span className="text-xs text-muted-foreground">{opt.sub}</span>
    </motion.button>
  );
}

function TraitChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "px-4 py-2 rounded-full text-sm font-medium border-2 transition-all duration-200 cursor-pointer",
        selected
          ? "border-primary bg-primary/15 text-primary shadow-[0_0_14px_rgba(168,85,247,0.35)]"
          : "border-white/15 bg-white/5 text-white/70 hover:border-white/35 hover:bg-white/10 hover:text-white",
      )}
    >
      {selected && <Check className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
      {label}
    </motion.button>
  );
}

function ToneCard({ opt, selected, onClick }: { opt: typeof CONTENT_TONES[0]; selected: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all duration-200 cursor-pointer",
        selected
          ? "border-primary bg-primary/10 shadow-[0_0_16px_rgba(168,85,247,0.3)]"
          : "border-white/10 bg-card/30 hover:border-white/30",
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
          selected ? "border-primary bg-primary" : "border-white/30",
        )}>
          {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
        </div>
        <div>
          <div className={cn("text-sm font-semibold transition-colors", selected && "text-primary")}>{opt.label}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{opt.sub}</div>
        </div>
      </div>
    </motion.button>
  );
}

// ─── Right Panel: Live Character Preview ────────────────────────────────────

function resolveEthnicities(gender: string, artStyle: string) {
  if (gender === "female" && artStyle === "realistic") return FEMALE_REALISTIC_ETHNICITIES;
  if (gender === "female" && artStyle === "anime")     return FEMALE_ANIME_ETHNICITIES;
  if (gender === "male"   && artStyle === "realistic") return MALE_REALISTIC_ETHNICITIES;
  if (gender === "male"   && artStyle === "anime")     return MALE_ANIME_ETHNICITIES;
  return byGender(gender, FEMALE_ETHNICITIES, MALE_ETHNICITIES);
}

function CharacterPreviewPanel({ config }: { config: CharacterConfig }) {
  const ethnicities = resolveEthnicities(config.gender, config.artStyle);
  const previewImg = config.ethnicity
    ? ethnicities.find((e) => e.id === config.ethnicity)?.img
    : config.gender
      ? GENDERS.find((g) => g.id === config.gender)?.img
      : null;

  const traits: { label: string; value: string }[] = [
    config.gender       && { label: "Gender",      value: config.gender },
    config.ethnicity    && { label: "Ethnicity",   value: config.ethnicity },
    config.artStyle     && { label: "Style",       value: config.artStyle },
    config.age          && { label: "Age",         value: `${config.age} years` },
    config.eyeColor     && { label: "Eyes",        value: config.eyeColor },
    config.hairStyle    && { label: "Hair Style",  value: config.hairStyle },
    config.hairColor    && { label: "Hair Color",  value: config.hairColor },
    config.bodyShape    && { label: "Body",        value: config.bodyShape },
    config.vibe         && { label: "Body Details", value: config.vibe },
    config.contentTone  && { label: "Tone",        value: config.contentTone },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="flex flex-col h-full p-5 gap-5">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-sm font-semibold">Your Character</span>
      </div>

      {/* Face preview */}
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-white/10 bg-zinc-900">
        {previewImg ? (
          <NextImage
            key={previewImg}
            src={previewImg}
            alt="Preview"
            fill
            sizes="320px"
            priority
            className="object-cover transition-opacity duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-white/20">
            <User className="w-10 h-10" />
            <span className="text-xs">Select gender to preview</span>
          </div>
        )}
        {config.vibe && (
          <div className="absolute bottom-2 left-2 right-2 text-center">
            <span className="text-xs bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-full text-primary font-medium">
              {config.vibe} vibes
            </span>
          </div>
        )}
      </div>

      {/* Selected traits */}
      {traits.length > 0 ? (
        <div className="space-y-2 flex-1 overflow-y-auto">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Traits Selected</p>
          <div className="space-y-1.5">
            {traits.map((t) => (
              <div key={t.label} className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/8">
                <span className="text-white/50">{t.label}</span>
                <span className="font-medium text-white capitalize">{t.value}</span>
              </div>
            ))}
          </div>

          {config.personalityTraits.length > 0 && (
            <div className="pt-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-2">Personality</p>
              <div className="flex flex-wrap gap-1">
                {config.personalityTraits.map((t) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-white/20 gap-2">
          <Sparkles className="w-6 h-6" />
          <p className="text-xs leading-relaxed">Your character's DNA will<br />appear here as you build</p>
        </div>
      )}
    </div>
  );
}

// ─── Step Components ──────────────────────────────────────────────────────────

function StepHeading({ step, title, desc, autoAdvance }: { step: number; title: string; desc: string; autoAdvance?: boolean }) {
  const { totalSteps } = useContext(WizardCtx);
  return (
    <div className="text-center mb-8">
      <div className="inline-flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-primary/70 uppercase tracking-widest">Step {step} of {totalSteps}</span>
      </div>
      <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
      <p className="text-muted-foreground mt-2 text-base">{desc}</p>
      {autoAdvance && (
        <p className="text-xs text-primary/60 mt-2 flex items-center justify-center gap-1">
          <Zap className="w-3 h-3" /> Tap to select and continue
        </p>
      )}
    </div>
  );
}

function StepGender({ value, onChange }: { value: string; onChange: (v: "male" | "female") => void }) {
  return (
    <div>
      <StepHeading step={1} title="Choose Gender" desc="This shapes your entire character's look and energy." autoAdvance />
      <div className="grid grid-cols-2 gap-6 max-w-sm mx-auto">
        {GENDERS.map((g) => (
          <ImageCard
            key={g.id}
            src={g.img}
            alt={g.label}
            label={g.label}
            sub={g.sub}
            selected={value === g.id}
            onClick={() => onChange(g.id as "male" | "female")}
            imgClass="aspect-[3/4]"
            priority
          />
        ))}
      </div>
    </div>
  );
}

function StepStyle({ gender, value, onChange }: { gender: string; value: string; onChange: (v: "realistic" | "anime") => void }) {
  const artStyles = byGender(gender, FEMALE_ART_STYLES, MALE_ART_STYLES);
  return (
    <div>
      <StepHeading step={2} title="Choose your influencer's style" desc="Pick the visual aesthetic that defines how your influencer looks." autoAdvance />
      <div className="grid grid-cols-2 gap-5 max-w-2xl mx-auto mt-2">
        {artStyles.map((s) => (
          <motion.button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id as "realistic" | "anime")}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={cn(
              "group relative rounded-2xl overflow-hidden border-2 cursor-pointer text-left w-full aspect-[3/4]",
              "transition-all duration-300 ease-out",
              value === s.id
                ? "border-primary shadow-[0_0_32px_rgba(168,85,247,0.55)]"
                : "border-white/10 hover:border-white/40 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]",
            )}
          >
            {s.img.endsWith(".mp4") ? (
              <video
                src={s.img}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
            ) : (
              <NextImage
                src={s.img}
                alt={s.label}
                fill
                sizes="(max-width: 640px) 45vw, 35vw"
                priority
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            {value === s.id && (
              <div className="absolute inset-0 bg-primary/10" />
            )}
            {/* Checkmark badge */}
            <AnimatePresence>
              {value === s.id && (
                <motion.div
                  key="check"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 22 }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-primary shadow-[0_0_16px_rgba(168,85,247,0.7)] flex items-center justify-center z-10"
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </AnimatePresence>
            {/* Label pill */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <span className={cn(
                "px-5 py-1.5 rounded-full text-sm font-semibold backdrop-blur-sm transition-colors duration-300",
                value === s.id
                  ? "bg-primary text-white"
                  : "bg-white/90 text-zinc-900",
              )}>
                {s.label}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function StepEthnicity({ gender, artStyle, value, onChange }: {
  gender: string; artStyle: string; value: string; onChange: (v: string) => void;
}) {
  const isExpanded = (gender === "male" && (artStyle === "realistic" || artStyle === "anime"))
                  || (gender === "female" && (artStyle === "realistic" || artStyle === "anime"));
  const ethnicities = resolveEthnicities(gender, artStyle);

  return (
    <div>
      {isExpanded ? (
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Choose Ethnicity</h2>
          <p className="text-muted-foreground text-sm">Select the heritage that best fits your influencer's look</p>
        </div>
      ) : (
        <StepHeading step={3} title="Ethnicity" desc="Sets the skin tone and facial features for AI generation." autoAdvance />
      )}
      <div className={cn(
        "grid gap-3",
        isExpanded
          ? "grid-cols-3 sm:grid-cols-6 max-w-5xl mx-auto"
          : "grid-cols-3 gap-4 max-w-2xl mx-auto",
      )}>
        {ethnicities.map((eth) => (
          <ImageCard
            key={eth.id}
            src={eth.img}
            alt={eth.label}
            label={eth.label}
            selected={value === eth.id}
            onClick={() => onChange(eth.id)}
            imgClass="aspect-[3/4]"
          />
        ))}
      </div>
    </div>
  );
}

function StepAppearance({
  age, eyeColor,
  onAgeChange, onEyeChange,
}: {
  age: number; eyeColor: string;
  onAgeChange: (v: number) => void;
  onEyeChange: (v: string) => void;
}) {
  return (
    <div className="space-y-9 max-w-2xl mx-auto">
      <StepHeading step={4} title="Appearance" desc="Set your influencer's age and eye color." />

      {/* Age */}
      <div className="bg-card/40 rounded-xl border border-white/10 p-6 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Age</p>
          <div className="text-right">
            <span className="text-3xl font-bold text-primary tabular-nums">{age}</span>
            <span className="text-muted-foreground text-sm ml-1">yrs</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/40 w-5">18</span>
          <input
            type="range" min={18} max={40} value={age}
            onChange={(e) => onAgeChange(Number(e.target.value))}
            className="flex-1 h-2 rounded-full appearance-none bg-white/10 accent-primary cursor-pointer"
          />
          <span className="text-xs text-white/40 w-5">40</span>
        </div>
      </div>

      {/* Eye Color */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Eye Color</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {EYE_COLORS.map((ec) => (
            <ImageCard
              key={ec.id}
              src={ec.img}
              alt={ec.label}
              label={ec.label}
              selected={eyeColor === ec.id}
              onClick={() => onEyeChange(ec.id)}
              imgClass="aspect-square"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StepHair({
  gender, artStyle, hairStyle, hairColor, onStyleChange, onColorChange,
}: {
  gender: string; artStyle: string; hairStyle: string; hairColor: string;
  onStyleChange: (v: string) => void; onColorChange: (v: string) => void;
}) {
  const isMaleAnime   = gender === "male"   && artStyle === "anime";
  const isFemaleAnime = gender === "female" && artStyle === "anime";
  const isAnimeLayout = isMaleAnime || isFemaleAnime;

  const hairStyles = isMaleAnime   ? MALE_ANIME_HAIR_STYLES
    : isFemaleAnime ? FEMALE_ANIME_HAIR_STYLES
    : byGender(gender, FEMALE_HAIR_STYLES, MALE_HAIR_STYLES);
  const hairColors = isMaleAnime   ? MALE_ANIME_HAIR_COLORS
    : isFemaleAnime ? FEMALE_ANIME_HAIR_COLORS
    : byGender(gender, FEMALE_HAIR_COLORS, MALE_HAIR_COLORS);

  if (isAnimeLayout) {
    return (
      <div className="space-y-10">
        {/* Hair Style section */}
        <div>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-1">Hair Style</h2>
            <p className="text-muted-foreground text-sm">Choose the perfect crown for your influencer</p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 max-w-4xl mx-auto">
            {hairStyles.map((hs) => (
              <ImageCard
                key={hs.id}
                src={hs.img}
                alt={hs.label}
                label={hs.label}
                selected={hairStyle === hs.id}
                onClick={() => onStyleChange(hs.id)}
                imgClass="aspect-[3/4]"
              />
            ))}
          </div>
        </div>

        {/* Hair Color section */}
        <div>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-1">Hair Color</h2>
            <p className="text-muted-foreground text-sm">Express their personality through color</p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 max-w-4xl mx-auto">
            {hairColors.map((hc) => (
              <ImageCard
                key={hc.id}
                src={hc.img}
                alt={hc.label}
                label={hc.label}
                selected={hairColor === hc.id}
                onClick={() => onColorChange(hc.id)}
                imgClass="aspect-[3/4]"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <StepHeading step={5} title="Hair Style" desc="Pick the style and color that defines your character." />

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Style</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {hairStyles.map((hs) => (
            <ImageCard
              key={hs.id}
              src={hs.img}
              alt={hs.label}
              label={hs.label}
              sub={"sub" in hs ? (hs as { sub: string }).sub : undefined}
              selected={hairStyle === hs.id}
              onClick={() => onStyleChange(hs.id)}
              imgClass="aspect-square"
            />
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Color</p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
          {hairColors.map((hc) => (
            <ImageCard
              key={hc.id}
              src={hc.img}
              alt={hc.label}
              label={hc.label}
              selected={hairColor === hc.id}
              onClick={() => onColorChange(hc.id)}
              imgClass="aspect-square"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StepBody({
  gender, artStyle, bodyShape, breastSize, onShapeChange, onBreastChange,
}: {
  gender: string; artStyle: string; bodyShape: string; breastSize: string;
  onShapeChange: (v: string) => void; onBreastChange: (v: string) => void;
}) {
  const isMaleAnime       = gender === "male"   && artStyle === "anime";
  const isFemaleAnime     = gender === "female" && artStyle === "anime";
  const isFemaleRealistic = gender === "female" && artStyle === "realistic";
  const isExpandedLayout  = isMaleAnime || isFemaleAnime || isFemaleRealistic;

  const bodyShapes = isMaleAnime       ? MALE_ANIME_BODY_SHAPES
    : isFemaleAnime     ? FEMALE_ANIME_BODY_SHAPES
    : isFemaleRealistic ? FEMALE_REALISTIC_BODY_SHAPES
    : byGender(gender, FEMALE_BODY_SHAPES, MALE_BODY_SHAPES);

  if (isExpandedLayout) {
    return (
      <div>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-1">Body Shape</h2>
          <p className="text-muted-foreground text-sm">Choose the silhouette that defines them</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {bodyShapes.map((bs) => (
            <ImageCard
              key={bs.id}
              src={bs.img}
              alt={bs.label}
              label={bs.label}
              selected={bodyShape === bs.id}
              onClick={() => onShapeChange(bs.id)}
              imgClass="aspect-[3/4]"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <StepHeading step={6} title="Body Shape" desc="Select the physique and proportions." />

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Body Type</p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {bodyShapes.map((bs) => (
            <ImageCard
              key={bs.id}
              src={bs.img}
              alt={bs.label}
              label={bs.label}
              sub={(bs as any).sub}
              selected={bodyShape === bs.id}
              onClick={() => onShapeChange(bs.id)}
              imgClass="aspect-[3/4]"
            />
          ))}
        </div>
      </div>

      {gender === "female" && (
        <div className="max-w-xs">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Bust Size</p>
          <div className="grid grid-cols-3 gap-3">
            {BREAST_SIZES.map((bs) => (
              <SizeCard key={bs.id} opt={bs} selected={breastSize === bs.id} onClick={() => onBreastChange(bs.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StepVibe({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <StepHeading step={7} title="Vibe & Aesthetic" desc="What's your influencer's signature energy and style?" autoAdvance />
      <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
        {VIBES.map((v) => (
          <ImageCard
            key={v.id}
            src={v.img}
            alt={v.label}
            label={v.label}
            sub={v.sub}
            selected={value === v.id}
            onClick={() => onChange(v.id)}
            imgClass="aspect-[3/4]"
          />
        ))}
      </div>
    </div>
  );
}

function StepFemaleRealisticPhysique({
  breastSize, buttSize, onBreastChange, onButtChange,
}: {
  breastSize: string; buttSize: string;
  onBreastChange: (v: string) => void; onButtChange: (v: string) => void;
}) {
  return (
    <div className="space-y-12 max-w-3xl mx-auto">
      {/* Breast Size */}
      <div>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-1">Breast Size</h2>
          <p className="text-muted-foreground text-sm">Fine-tune their physical proportions</p>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {FEMALE_BREAST_SIZES.map((bs) => (
            <ImageCard
              key={bs.id}
              src={bs.img}
              alt={bs.label}
              label={bs.label}
              selected={breastSize === bs.id}
              onClick={() => onBreastChange(bs.id)}
              imgClass="aspect-[4/3]"
            />
          ))}
        </div>
      </div>

      {/* Butt Size */}
      <div>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-1">Butt Size</h2>
          <p className="text-muted-foreground text-sm">The final touch to their character design</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {FEMALE_BUTT_SIZES.map((bu) => (
            <ImageCard
              key={bu.id}
              src={bu.img}
              alt={bu.label}
              label={bu.label}
              selected={buttSize === bu.id}
              onClick={() => onButtChange(bu.id)}
              imgClass="aspect-[4/3]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StepMalePersonality({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white text-center mb-8">Choose Personality</h2>
      <div className="grid grid-cols-3 gap-3">
        {MALE_PERSONALITY_ARCHETYPES.map((a) => {
          const selected = value === a.id;
          return (
            <button
              key={a.id}
              onClick={() => onChange(a.id)}
              className={cn(
                "relative text-left rounded-xl border p-4 transition-all duration-200",
                selected
                  ? "border-primary bg-primary/10 shadow-[0_0_14px_rgba(168,85,247,0.25)]"
                  : "border-white/10 bg-white/4 hover:border-white/25 hover:bg-white/8",
              )}
            >
              {selected && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-2xl leading-none">{a.emoji}</span>
                <span className="font-semibold text-white text-sm">{a.label}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{a.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepMaleOccupationHobbies({
  occupation, hobbies, onOccupationChange, onHobbiesChange,
}: {
  occupation: string; hobbies: string[];
  onOccupationChange: (v: string) => void; onHobbiesChange: (v: string[]) => void;
}) {
  function toggleHobby(h: string) {
    if (hobbies.includes(h)) {
      onHobbiesChange(hobbies.filter((x) => x !== h));
    } else if (hobbies.length < 3) {
      onHobbiesChange([...hobbies, h]);
    }
  }

  return (
    <div className="space-y-10 max-w-3xl mx-auto">
      {/* Occupation */}
      <div>
        <div className="text-center mb-5">
          <h2 className="text-2xl font-bold text-white mb-1">Choose Occupation</h2>
          <p className="text-muted-foreground text-sm">What does your influencer do for a living?</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {MALE_OCCUPATIONS.map((occ) => {
            const isCustom   = occ === "Custom";
            const isSelected = occupation === occ;
            return (
              <button
                key={occ}
                onClick={() => onOccupationChange(occ)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150",
                  isSelected
                    ? "bg-primary border-primary text-white"
                    : isCustom
                      ? "border-primary text-primary bg-transparent hover:bg-primary/10"
                      : "border-white/15 text-white bg-white/5 hover:border-white/35 hover:bg-white/10",
                )}
              >
                {isCustom && <Sparkles className="w-3.5 h-3.5" />}
                {occ}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hobbies */}
      <div>
        <div className="text-center mb-5">
          <h2 className="text-2xl font-bold text-white mb-1">Choose Hobbies</h2>
          <p className="text-muted-foreground text-sm">What does your influencer do for fun? You can choose up to 3 hobbies</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {MALE_HOBBIES.map((h) => {
            const isSelected = hobbies.includes(h);
            const maxed      = !isSelected && hobbies.length >= 3;
            return (
              <button
                key={h}
                disabled={maxed}
                onClick={() => toggleHobby(h)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150",
                  isSelected
                    ? "bg-primary border-primary text-white"
                    : maxed
                      ? "border-white/8 text-white/25 bg-white/3 cursor-not-allowed"
                      : "border-white/15 text-white bg-white/5 hover:border-white/35 hover:bg-white/10",
                )}
              >
                {h}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const FEMALE_ARCHETYPES = [
  { id: "Free Spirit",  emoji: "✨", desc: "Adventurous soul who lives in the moment, bringing spontaneity and joy to every interaction" },
  { id: "Nurturer",    emoji: "🌷", desc: "Radiates warmth and maternal energy, creating a safe space for deep emotional connections" },
  { id: "Mystic",      emoji: "🔮", desc: "Ethereal and enigmatic, offering profound insights wrapped in mystical wisdom" },
  { id: "Dreamer",     emoji: "⭐", desc: "Pure-hearted optimist who sees magic in everyday moments" },
  { id: "Trickster",   emoji: "🎭", desc: "Playful spirit who turns ordinary moments into extraordinary adventures" },
  { id: "Enchantress", emoji: "🪄", desc: "Mesmerizing presence that draws others into her magical world" },
  { id: "Guardian",    emoji: "🛡️", desc: "Strong-willed protector with a natural instinct to lead and shield" },
  { id: "Devotee",     emoji: "🌸", desc: "Gentle soul finding joy in serving and uplifting others" },
  { id: "Romantic",    emoji: "❤️", desc: "Hopeless romantic who sees life through rose-tinted glasses" },
  { id: "Wildflower",  emoji: "🌺", desc: "Free-spirited and untamed, embracing life with passionate intensity" },
  { id: "Rebel",       emoji: "⚡", desc: "Sharp-witted challenger who questions norms with a hint of sass" },
  { id: "Empath",      emoji: "🫶", desc: "Intuitive soul with an uncanny ability to understand unspoken feelings" },
];

function StepPersonality({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white text-center mb-8">Choose Personality</h2>
      <div className="grid grid-cols-3 gap-3">
        {FEMALE_ARCHETYPES.map((a) => {
          const selected = value === a.id;
          return (
            <button
              key={a.id}
              onClick={() => onChange(a.id)}
              className={cn(
                "text-left p-4 rounded-xl border transition-all duration-150",
                selected
                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                  : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/8",
              )}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-2xl leading-none">{a.emoji}</span>
                <span className="font-semibold text-white text-sm">{a.id}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{a.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ReviewCard({
  icon, label, value, sub,
}: { icon: ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl border border-white/8 bg-white/3 hover:bg-white/5 transition-colors">
      <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-white capitalize truncate">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function StepReviewGenerate({
  config, onNameChange, onNicheChange, isLoading, loadingMessage, error, onSubmit, onBack,
}: {
  config: CharacterConfig;
  onNameChange: (v: string) => void;
  onNicheChange: (v: string) => void;
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
  onSubmit: () => void;
  onBack: () => void;
}) {
  const { totalSteps } = useContext(WizardCtx);
  const ethnicities = resolveEthnicities(config.gender, config.artStyle);
  const previewImg = config.ethnicity
    ? ethnicities.find((e) => e.id === config.ethnicity)?.img
    : GENDERS.find((g) => g.id === config.gender)?.img;

  const isFemale = config.gender === "female";
  const canGenerate = !!config.name.trim() && !!config.niche.trim();

  const selectionCards = [
    { icon: <User className="w-4 h-4" />, label: "Gender", value: config.gender, sub: config.artStyle ? `${config.artStyle} style` : undefined },
    { icon: <Camera className="w-4 h-4" />, label: "Ethnicity", value: config.ethnicity },
    { icon: <Eye className="w-4 h-4" />, label: "Appearance", value: `${config.eyeColor} eyes`, sub: `Age ${config.age}` },
    { icon: <Scissors className="w-4 h-4" />, label: "Hair", value: `${config.hairStyle}`, sub: `${config.hairColor} color` },
    { icon: <Dumbbell className="w-4 h-4" />, label: "Body Shape", value: config.bodyShape },
    ...(isFemale ? [
      { icon: <Star className="w-4 h-4" />, label: "Physique", value: config.breastSize ? `Bust: ${config.breastSize}` : "—", sub: config.vibe ? `Butt: ${config.vibe}` : undefined },
      { icon: <Brain className="w-4 h-4" />, label: "Personality", value: config.contentTone || "—" },
    ] : [
      { icon: <Brain className="w-4 h-4" />, label: "Personality", value: config.vibe || "—" },
    ]),
  ].filter((c) => c.value && c.value !== "—" && c.value.trim());

  return (
    <div className="max-w-3xl mx-auto">
      <StepHeading
        step={totalSteps}
        title="Review & Generate"
        desc="Confirm your character details then generate your AI influencer avatar."
      />

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-[280px_1fr] gap-6 mb-8">
        {/* Left: portrait preview */}
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-[3/4] bg-zinc-900">
            {previewImg ? (
              <NextImage src={previewImg} alt="Character preview" fill sizes="280px" className="object-cover" priority />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-16 h-16 text-white/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              {config.name ? (
                <p className="text-lg font-bold leading-tight">{config.name}</p>
              ) : (
                <p className="text-sm text-white/40 italic">Name below →</p>
              )}
              {config.niche && (
                <p className="text-xs text-primary mt-1 font-medium">{config.niche}</p>
              )}
              <div className="flex flex-wrap gap-1 mt-2">
                {[config.artStyle, config.ethnicity, config.gender].filter(Boolean).map((t) => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/15 text-white/80 capitalize backdrop-blur-sm">{t}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Credit cost indicator */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">1 Credit</p>
              <p className="text-[11px] text-muted-foreground">will be deducted on generation</p>
            </div>
          </div>
        </div>

        {/* Right: all selection summary + name/niche inputs */}
        <div className="space-y-5">
          {/* Selection summary grid */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Character Summary</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {selectionCards.map((card) => (
                <ReviewCard key={card.label} icon={card.icon} label={card.label} value={card.value} sub={card.sub} />
              ))}
            </div>
          </div>

          {/* Name + Niche inputs */}
          <div className="rounded-xl border border-white/10 bg-card/30 p-4 space-y-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Influencer Identity</p>
            <div className="space-y-2">
              <Label htmlFor="inf-name" className="text-sm font-semibold">Name <span className="text-primary">*</span></Label>
              <Input
                id="inf-name"
                placeholder="e.g. Aria Nova, Kai Storm"
                value={config.name}
                onChange={(e) => onNameChange(e.target.value)}
                className="bg-background/50 h-11"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inf-niche" className="text-sm font-semibold">Niche <span className="text-primary">*</span></Label>
              <Input
                id="inf-niche"
                placeholder="e.g. Fashion & Lifestyle"
                value={config.niche}
                onChange={(e) => onNicheChange(e.target.value)}
                className="bg-background/50 h-11"
                disabled={isLoading}
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {NICHES.map((n) => (
                  <button
                    key={n} type="button"
                    onClick={() => !isLoading && onNicheChange(n)}
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer",
                      config.niche === n
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-white/15 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white hover:border-white/30",
                      isLoading && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="border-t border-white/8 pt-6 space-y-4">
        {isLoading ? (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
              <Loader2 className="w-7 h-7 text-primary animate-spin" />
            </div>
            <div>
              <p className="font-semibold text-white">{loadingMessage || "Working on it…"}</p>
              <p className="text-sm text-muted-foreground mt-1">This may take up to 30 seconds</p>
            </div>
            <div className="flex justify-center gap-1.5">
              {["Saving profile", "Building prompt", "Generating avatar"].map((s, i) => (
                <span
                  key={s}
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full border transition-all duration-500",
                    loadingMessage.toLowerCase().includes(s.split(" ")[0].toLowerCase())
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-white/10 text-white/30",
                  )}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onBack}
              className="gap-2 border-white/15 bg-white/5 hover:bg-white/10 min-w-[110px]"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button
              onClick={onSubmit}
              disabled={!canGenerate}
              className="flex-1 h-13 text-base font-semibold bg-primary hover:bg-primary/90 shadow-[0_0_30px_rgba(168,85,247,0.5)] disabled:opacity-50 gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Generate Model
              <span className="text-xs opacity-70 ml-1">· 1 credit</span>
            </Button>
          </div>
        )}
        {!canGenerate && !isLoading && (
          <p className="text-center text-xs text-muted-foreground">Enter a name and niche to unlock generation</p>
        )}
      </div>
    </div>
  );
}

// ─── Top Progress Bar ─────────────────────────────────────────────────────────

function WizardProgress({ step }: { step: number }) {
  const { stepLabels } = useContext(WizardCtx);
  return (
    <div className="px-6 pt-4 pb-3">
      {/* Segmented bar */}
      <div className="flex gap-1 mb-4">
        {stepLabels.map((_, i) => {
          const n = i + 1;
          const done   = step > n;
          const active = step === n;
          return (
            <motion.div
              key={n}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-500",
                done   ? "bg-primary"
                : active ? "bg-primary/70"
                : "bg-white/10",
              )}
              animate={{ opacity: active ? [0.7, 1, 0.7] : 1 }}
              transition={active ? { duration: 2, repeat: Infinity } : {}}
            />
          );
        })}
      </div>

      {/* Step circles + labels */}
      <div className="flex items-start justify-between">
        {stepLabels.map((label, i) => {
          const n      = i + 1;
          const done   = step > n;
          const active = step === n;
          return (
            <div key={n} className="flex flex-col items-center gap-1 flex-1">
              <div className={cn(
                "w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all duration-300",
                active && "bg-primary text-white shadow-[0_0_14px_rgba(168,85,247,0.6)] scale-110",
                done   && "bg-primary/25 text-primary",
                !active && !done && "bg-white/8 text-white/30",
              )}>
                {done ? <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : n}
              </div>
              <span className={cn(
                "hidden lg:block text-center text-[10px] font-medium leading-tight transition-colors duration-300",
                active ? "text-white" : "text-white/30",
              )}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Image Prefetch Hook ──────────────────────────────────────────────────────
// Eagerly loads images for the next wizard step so they appear instantly.
function usePrefetchStepImages(urls: string[]) {
  useEffect(() => {
    urls.forEach((src) => {
      if (!src) return;
      const img = new window.Image();
      img.src = src;
    });
  }, [urls.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: CharacterConfig = {
  gender: "", ethnicity: "", artStyle: "", age: 25, eyeColor: "",
  hairStyle: "", hairColor: "", bodyShape: "", breastSize: "",
  vibe: "", personalityTraits: [], contentTone: "",
  name: "", niche: "",
};

const stepVariants = {
  enter:  (dir: number) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
  center: { opacity: 1, x: 0 },
  exit:   (dir: number) => ({ opacity: 0, x: dir > 0 ? -60 : 60 }),
};

export default function NewInfluencer() {
  const router = useRouter();
  const { toast }          = useToast();
  const createMutation     = useCreateInfluencer();
  const generateMutation   = useGenerateInfluencer();
  const { data: meData }   = useGetMe();
  const { data: influencers } = useGetInfluencers();

  const userPlan       = meData?.plan ?? "basic";
  const influencerCount = influencers?.length ?? 0;
  const limit          = getInfluencerLimit(userPlan);
  const canCreate      = canCreateInfluencer(userPlan, influencerCount);

  const [step, setStep]               = useState(1);
  const [direction, setDirection]     = useState(1);
  const [config, setConfig]           = useState<CharacterConfig>(DEFAULT_CONFIG);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("");

  // Prefetch images for the next step to eliminate loading delays when navigating
  const nextStepImages = (() => {
    const g = config.gender;
    const a = config.artStyle;
    switch (step) {
      case 1: // next = style step
        return [...FEMALE_ART_STYLES, ...MALE_ART_STYLES].map((s) => s.img).filter((s) => !s.endsWith(".mp4"));
      case 2: // next = ethnicity
        return resolveEthnicities(g, a).map((e) => e.img);
      case 3: // next = eye colors
        return EYE_COLORS.map((e) => e.img);
      case 4: // next = hair
        const hairStyles = (g === "male" && a === "anime") ? MALE_ANIME_HAIR_STYLES
          : (g === "female" && a === "anime") ? FEMALE_ANIME_HAIR_STYLES
          : byGender(g, FEMALE_HAIR_STYLES, MALE_HAIR_STYLES);
        const hairColors = (g === "male" && a === "anime") ? MALE_ANIME_HAIR_COLORS
          : (g === "female" && a === "anime") ? FEMALE_ANIME_HAIR_COLORS
          : byGender(g, FEMALE_HAIR_COLORS, MALE_HAIR_COLORS);
        return [...hairStyles.map((h) => h.img), ...hairColors.map((h) => h.img)];
      case 5: // next = body
        const bodyShapes = (g === "male" && a === "anime") ? MALE_ANIME_BODY_SHAPES
          : (g === "female" && a === "anime") ? FEMALE_ANIME_BODY_SHAPES
          : (g === "female" && a === "realistic") ? FEMALE_REALISTIC_BODY_SHAPES
          : byGender(g, FEMALE_BODY_SHAPES, MALE_BODY_SHAPES);
        return bodyShapes.map((b) => b.img);
      case 6: // next = physique (female) or personality (male)
        if (g === "female") return [...FEMALE_BREAST_SIZES.map((b) => b.img), ...FEMALE_BUTT_SIZES.map((b) => b.img)];
        return []; // male personality step has no images
      default:
        return [];
    }
  })();
  usePrefetchStepImages(nextStepImages);

  const set = <K extends keyof CharacterConfig>(key: K, value: CharacterConfig[K]) =>
    setConfig((prev) => ({ ...prev, [key]: value }));

  const totalSteps  = config.gender === "male" ? 8 : 9;
  const stepLabels  = config.gender === "male" ? STEP_LABELS_MALE : STEP_LABELS_FEMALE;

  const setAndAdvance = <K extends keyof CharacterConfig>(key: K, value: CharacterConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setTimeout(() => { setDirection(1); setStep((s) => Math.min(s + 1, totalSteps)); }, 350);
  };

  // Gender change resets selections that are gender-specific (hair style & body type
  // have different options for male vs female; hair color and ethnicity IDs are shared).
  const changeGender = (v: "male" | "female") => {
    setConfig((prev) => ({
      ...prev,
      gender: v,
      // Only reset if current selection isn't in the new gender's options
      hairStyle: byGender(v, FEMALE_HAIR_STYLES, MALE_HAIR_STYLES).some((s) => s.id === prev.hairStyle)
        ? prev.hairStyle : "",
      bodyShape: byGender(v, FEMALE_BODY_SHAPES, MALE_BODY_SHAPES).some((s) => s.id === prev.bodyShape)
        ? prev.bodyShape : "",
      breastSize: v === "female" ? prev.breastSize : "",
    }));
    setTimeout(() => { setDirection(1); setStep((s) => Math.min(s + 1, totalSteps)); }, 350);
  };

  function isStepValid(s: number): boolean {
    switch (s) {
      case 1: return !!config.gender;
      case 2: return !!config.artStyle;
      case 3: return !!config.ethnicity;
      case 4: return !!config.eyeColor;
      case 5: return !!config.hairStyle && !!config.hairColor;
      case 6: return !!config.bodyShape;
      case 7: return config.gender === "female"
        ? !!config.breastSize && !!config.vibe
        : !!config.vibe;
      case 8: return config.gender === "male"
        ? !!config.name.trim() && !!config.niche.trim()   // males: step 8 = review
        : !!config.contentTone;                            // females: step 8 = personality
      case 9: return !!config.name.trim() && !!config.niche.trim();
      default: return true;
    }
  }

  function goNext() {
    if (!isStepValid(step)) {
      toast({ title: "Complete all selections before continuing", variant: "destructive" });
      return;
    }
    setDirection(1);
    setStep((s) => Math.min(s + 1, totalSteps));
  }

  function goBack() {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  }

  const isGenerating = createMutation.isPending || generateMutation.isPending;

  function handleSubmit() {
    setSubmitError(null);

    const bodyDesc = [
      config.bodyShape && `${config.bodyShape} build`,
      config.hairStyle && `${config.hairStyle} ${config.hairColor.toLowerCase()} hair`,
      config.eyeColor  && `${config.eyeColor} eyes`,
      config.gender === "female" && config.breastSize && `${config.breastSize} bust`,
    ].filter(Boolean).join(", ");

    const characteristics = [
      config.gender, config.artStyle, config.ethnicity,
      config.hairStyle, `${config.hairColor} hair`, `${config.eyeColor} eyes`,
      config.vibe && `${config.vibe} vibe`,
      config.contentTone && `${config.contentTone} tone`,
      ...config.personalityTraits,
    ].filter(Boolean);

    setLoadingMessage("Saving your influencer profile…");

    createMutation.mutate({
      data: {
        name: config.name.trim(), niche: config.niche.trim(),
        bodyShape: bodyDesc, characteristics, style: config.artStyle,
        ethnicity: config.ethnicity, age: config.age,
      },
    }, {
      onSuccess: (data) => {
        setLoadingMessage("Building your AI prompt…");
        setTimeout(() => {
          setLoadingMessage("Generating your avatar…");
          generateMutation.mutate({ id: data.id }, {
            onSuccess: (generated) => {
              toast({ title: `${generated.name} is ready!`, description: "Your AI influencer has been generated." });
              router.push(`/influencers/${generated.id}`);
            },
            onError: (err: any) => {
              const msg = err?.response?.data?.error ?? err?.message ?? "Image generation failed.";
              setSubmitError(msg);
              setLoadingMessage("");
              // Still redirect to influencer page so user can retry
              router.push(`/influencers/${data.id}`);
            },
          });
        }, 600);
      },
      onError: (error: any) => {
        const msg = error?.response?.data?.error ?? error?.message ?? "Failed to create influencer.";
        setSubmitError(msg);
        setLoadingMessage("");
      },
    });
  }

  // Steps 1-3 auto-advance; review step has its own embedded Back+Generate buttons.
  const isAutoStep    = [1, 2, 3].includes(step);
  const isReviewStep  = step === totalSteps;
  const showNavBottom = !isAutoStep && !isReviewStep;

  if (!canCreate) {
    return (
      <AuthGuard>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 24, padding: 32, background: "#0A0A12" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(124,92,252,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Lock size={32} style={{ color: "#7C5CFC" }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Persona Limit Reached</h2>
            <p style={{ fontSize: 15, color: "#9090B0", maxWidth: 380, lineHeight: 1.6 }}>
              You've used {influencerCount}/{limit} persona{limit === 1 ? "" : "s"} on the {userPlan} plan.
              Upgrade to create more AI influencers.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Link href="/plans">
              <a style={{ display: "inline-block", padding: "12px 28px", borderRadius: 12, background: "#7C5CFC", color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none", boxShadow: "0 0 24px rgba(124,92,252,0.4)" }}>
                View Plans
              </a>
            </Link>
            <Link href="/influencers">
              <a style={{ display: "inline-block", padding: "12px 28px", borderRadius: 12, background: "rgba(255,255,255,0.06)", color: "#fff", fontWeight: 600, fontSize: 14, textDecoration: "none", border: "1px solid rgba(255,255,255,0.12)" }}>
                Back to Personas
              </a>
            </Link>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <WizardCtx.Provider value={{ totalSteps, stepLabels }}>
    <AuthGuard>
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        {/* ── Top bar ── */}
        <header className="border-b border-white/8 bg-zinc-950/95 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center justify-between px-5 py-3">
            <Link href="/influencers">
              <a className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Studio</span>
              </a>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm">Character Builder</span>
            </div>
            <Link href="/influencers">
              <a className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/8 transition-colors">
                <X className="w-4 h-4" />
              </a>
            </Link>
          </div>

          {/* Progress bar */}
          <WizardProgress step={step} />
        </header>

        {/* ── Main content + side panel ── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Step content */}
          <main className="flex-1 overflow-y-auto">
            <div className="px-4 sm:px-8 py-10 pb-32 max-w-4xl mx-auto">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  {step === 1 && (
                    <StepGender
                      value={config.gender}
                      onChange={changeGender}
                    />
                  )}
                  {step === 2 && (
                    <StepStyle
                      gender={config.gender}
                      value={config.artStyle}
                      onChange={(v) => setAndAdvance("artStyle", v)}
                    />
                  )}
                  {step === 3 && (
                    <StepEthnicity
                      gender={config.gender}
                      artStyle={config.artStyle}
                      value={config.ethnicity}
                      onChange={(v) => setAndAdvance("ethnicity", v)}
                    />
                  )}
                  {step === 4 && (
                    <StepAppearance
                      age={config.age}
                      eyeColor={config.eyeColor}
                      onAgeChange={(v) => set("age", v)}
                      onEyeChange={(v) => set("eyeColor", v)}
                    />
                  )}
                  {step === 5 && (
                    <StepHair
                      gender={config.gender}
                      artStyle={config.artStyle}
                      hairStyle={config.hairStyle}
                      hairColor={config.hairColor}
                      onStyleChange={(v) => set("hairStyle", v)}
                      onColorChange={(v) => set("hairColor", v)}
                    />
                  )}
                  {step === 6 && (
                    <StepBody
                      gender={config.gender}
                      artStyle={config.artStyle}
                      bodyShape={config.bodyShape}
                      breastSize={config.breastSize}
                      onShapeChange={(v) => set("bodyShape", v)}
                      onBreastChange={(v) => set("breastSize", v)}
                    />
                  )}
                  {step === 7 && config.gender === "female" && config.artStyle === "realistic" && (
                    <StepFemaleRealisticPhysique
                      breastSize={config.breastSize}
                      buttSize={config.vibe}
                      onBreastChange={(v) => set("breastSize", v)}
                      onButtChange={(v) => set("vibe", v)}
                    />
                  )}
                  {step === 7 && config.gender === "female" && config.artStyle !== "realistic" && (
                    <StepFemaleRealisticPhysique
                      breastSize={config.breastSize}
                      buttSize={config.vibe}
                      onBreastChange={(v) => set("breastSize", v)}
                      onButtChange={(v) => set("vibe", v)}
                    />
                  )}
                  {step === 7 && config.gender === "male" && (
                    <StepMalePersonality
                      value={config.vibe}
                      onChange={(v) => set("vibe", v)}
                    />
                  )}
                  {step === 8 && config.gender === "female" && (
                    <StepPersonality
                      value={config.contentTone}
                      onChange={(v) => set("contentTone", v)}
                    />
                  )}
                  {isReviewStep && (
                    <StepReviewGenerate
                      config={config}
                      onNameChange={(v) => set("name", v)}
                      onNicheChange={(v) => set("niche", v)}
                      isLoading={isGenerating}
                      loadingMessage={loadingMessage}
                      error={submitError}
                      onSubmit={handleSubmit}
                      onBack={goBack}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          {/* Live character preview panel */}
          <aside className="hidden xl:flex w-72 2xl:w-80 border-l border-white/8 bg-zinc-900/30 flex-col sticky top-0 h-screen overflow-y-auto">
            <CharacterPreviewPanel config={config} />
          </aside>
        </div>

        {/* ── Bottom navigation ── */}
        {showNavBottom && (
          <div className="fixed bottom-0 left-0 right-0 border-t border-white/8 bg-zinc-950/95 backdrop-blur-sm px-6 py-4 z-20 xl:pr-[calc(18rem+1.5rem)]">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
              <Button
                variant="outline"
                onClick={goBack}
                disabled={step === 1}
                className="gap-2 border-white/15 bg-white/5 hover:bg-white/10 min-w-[110px]"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>

              <div className="text-xs text-muted-foreground hidden sm:block">
                {stepLabels[step - 1]}
              </div>

              <Button
                onClick={goNext}
                className="gap-2 bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(168,85,247,0.4)] min-w-[110px]"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Back button for auto-advance steps (so user can go back) */}
        {isAutoStep && (
          <div className="fixed bottom-0 left-0 right-0 border-t border-white/8 bg-zinc-950/95 backdrop-blur-sm px-6 py-4 z-20">
            <div className="max-w-4xl mx-auto flex items-center justify-start">
              <Button
                variant="ghost"
                onClick={goBack}
                disabled={step === 1}
                className="gap-2 text-muted-foreground hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
    </WizardCtx.Provider>
  );
}
