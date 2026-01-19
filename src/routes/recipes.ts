import express, { Router } from "express";
import {
  getRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getComments,
  addComment,
  deleteComment,
  getRandomRecipe,
  getRecipesCount,
} from "../controllers/recipes";
import { validate } from "../middleware/validate.middleware";
import {
  createRecipeSchema,
  updateRecipeSchema,
  createCommentSchema,
} from "../models/recipe";
import { requireRole } from "../middleware/auth.middleware";

const router: Router = express.Router();

// recipe endpoints
router.get("/random", getRandomRecipe);
router.get("/count", getRecipesCount);
router.get("/", getRecipes);
router.get("/:id", getRecipeById);
router.post(
  "/",
  validate(createRecipeSchema),
  requireRole(["editor", "admin"]),
  createRecipe
);
router.put(
  "/:id",
  validate(updateRecipeSchema),
  requireRole(["editor", "admin"]),
  updateRecipe
);
router.delete("/:id", requireRole(["admin"]), deleteRecipe);

// comment endpoints
router.get("/:recipeId/comments", getComments);
router.post(
  "/:recipeId/comments",
  validate(createCommentSchema),
  requireRole(["editor", "admin"]),
  addComment
);
router.delete(
  "/:recipeId/comments/:commentId",
  requireRole(["admin"]),
  deleteComment
);
export default router;
