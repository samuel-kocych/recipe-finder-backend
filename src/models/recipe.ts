import { ObjectId } from "mongodb";
import { z } from "zod";

export interface Recipe {
  _id?: ObjectId;
  title: string;
  ingredients: string[];
  instructions: string;
  comments: Comment[];
  dateCreated: Date;
  dateUpdated?: Date;
  difficulty?: "easy" | "medium" | "hard";
}

export interface Comment {
  _id?: ObjectId;
  user: string;
  text: string;
  dateCreated: Date;
}

// validation schemas using zod
// recipe schemas
export const createRecipeSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  ingredients: z
    .array(z.string())
    .min(1, "At least one ingredient is required")
    .max(50, "Too many ingredients"),
  instructions: z
    .string()
    .min(1, "Instructions are required")
    .max(5000, "Instructions too long"),
  difficulty: z.enum(["easy", "medium", "hard"]).optional().default("medium"),
});

export const updateRecipeSchema = z.object({
  title: z
    .string()
    .min(1, "Title cannot be empty")
    .max(200, "Title too long")
    .optional(),
  ingredients: z
    .array(z.string())
    .min(1, "Ingredients cannot be empty")
    .max(50, "Too many ingredients")
    .optional(),
  instructions: z
    .string()
    .min(1, "Instructions cannot be empty")
    .max(5000, "Instructions too long")
    .optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
});

// comment schemas
export const createCommentSchema = z.object({
  user: z
    .string()
    .min(1, "User name is required")
    .max(100, "User name too long"),
  text: z
    .string()
    .min(1, "Comment text is required")
    .max(500, "Comment text too long"),
});

export const updateCommentSchema = z.object({
  user: z.string().min(1).max(100).optional(),
  text: z.string().min(1).max(500).optional(),
});
