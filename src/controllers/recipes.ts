import { Request, Response } from "express";
import { collections } from "../database";
import { Recipe, Comment } from "../models/recipe";
import { ObjectId } from "mongodb";
import {
  createRecipeSchema,
  updateRecipeSchema,
  createCommentSchema,
} from "../models/recipe";

// get all recipes
export const getRecipes = async (req: Request, res: Response) => {
  try {
    const { search, ingredient, difficulty, sort, order, page, limit } =
      req.query;

    const filter: any = {};

    // search by title
    if (search) {
      filter.title = { $regex: search, $options: "i" }; // case-insensitive
    }

    // filter by ingredient
    if (ingredient) {
      filter.ingredients = { $in: [ingredient] };
    }

    // filter by difficulty
    if (difficulty) {
      filter.difficulty = difficulty;
    }

    // sorting
    const sortObj: any = {};
    if (sort) {
      sortObj[sort as string] = order === "asc" ? 1 : -1;
    } else {
      sortObj["dateCreated"] = -1; // default sort newest first
    }

    // pagination
    const pageNumber = page == null ? 1 : parseInt(page as string, 10);
    const limitNumber = limit == null ? 10 : parseInt(limit as string, 10);

    if (Number.isNaN(pageNumber) || Number.isNaN(limitNumber)) {
      return res
        .status(400)
        .json({ message: "Invalid page or limit, must be integers" });
    }

    if (pageNumber < 1 || limitNumber < 1) {
      return res
        .status(400)
        .json({ message: "Invalid page or limit, must be >= 1" });
    }
    const skip = (pageNumber - 1) * limitNumber;

    const recipes = await collections.recipes
      ?.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNumber)
      .toArray();

    const total = await collections.recipes?.countDocuments(filter);

    res.status(200).json({ total, page: pageNumber, recipes });
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to fetch recipes.");
  }
};

// get recipe by id
export const getRecipeById = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  try {
    const query = { _id: new ObjectId(id) };
    const recipe = (await collections.recipes?.findOne(query)) as Recipe;

    if (recipe) {
      res.status(200).send(recipe);
    } else {
      res.status(404).json({ message: `No recipe found with id ${id}` });
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`issue fetching recipe: ${error.message}`);
    } else {
      console.error(`error fetching recipe: ${error}`);
    }
    res.status(400).send("Invalid recipe ID format.");
  }
};

// create a new recipe
export const createRecipe = async (req: Request, res: Response) => {
  const validation = createRecipeSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: validation.error.issues,
    });
  }
  const { title, ingredients, instructions } = validation.data;

  const newRecipe: Recipe = {
    title,
    ingredients,
    instructions,
    image: validation.data.image,
    comments: [],
    dateCreated: new Date(),
    dateUpdated: new Date(),
    difficulty: validation.data.difficulty,
  };

  try {
    // insert recipe with default dates and comments
    const result = await collections.recipes?.insertOne(newRecipe);

    if (result) {
      res
        .status(201)
        .location(`${result.insertedId}`)
        .json({ message: `Created a new recipe with id ${result.insertedId}` });
    } else {
      res.status(500).send("Failed to create a new recipe.");
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`issue creating recipe: ${error.message}`);
    } else {
      console.error(`error creating recipe: ${error}`);
    }
    res.status(400).send("Unable to create new recipe");
  }
};

// update a recipe by id
export const updateRecipe = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const validation = updateRecipeSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: validation.error.issues,
    });
  }
  try {
    // fetch existing recipe
    const existing = await collections.recipes?.findOne({
      _id: new ObjectId(id),
    });
    if (!existing) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    // build dynamic update object only for provided fields
    const data = validation.data;
    const set: any = { dateUpdated: new Date() };
    if (data.title !== undefined) set.title = data.title;
    if (data.ingredients !== undefined) set.ingredients = data.ingredients;
    if (data.instructions !== undefined) set.instructions = data.instructions;
    if (data.difficulty !== undefined) set.difficulty = data.difficulty;
    if (data.image !== undefined) set.image = data.image;
    // comments here managed by comment endpoints

    await collections.recipes?.updateOne(
      { _id: new ObjectId(id) },
      { $set: set },
    );

    const updatedRecipe = await collections.recipes?.findOne({
      _id: new ObjectId(id),
    });
    res.json(updatedRecipe);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`issue updating recipe: ${error.message}`);
    } else {
      console.error(`error updating recipe: ${error}`);
    }
    res.status(500).json({ message: "Something went wrong" });
  }
};

// delete a recipe by id
export const deleteRecipe = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  try {
    const result = await collections.recipes?.deleteOne({
      _id: new ObjectId(id),
    });

    if (result && result.deletedCount > 0) {
      res.status(200).json({ message: `Recipe ${id} successfully deleted` });
    } else {
      res.status(404).json({ message: `Recipe ${id} not found` });
    }
  } catch (error) {
    if (error instanceof Error) {
      console.log(`issue deleting recipe: ${error.message}`);
    } else {
      console.log(`error deleting recipe: ${error}`);
    }
    res.status(400).send("Unable to delete recipe");
  }
};

// get all comments for a recipe
export const getComments = async (req: Request, res: Response) => {
  const recipeId = req.params.recipeId as string;
  try {
    const recipe = (await collections.recipes?.findOne({
      _id: new ObjectId(recipeId),
    })) as Recipe;
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });
    res.status(200).json(recipe.comments || []);
  } catch (error) {
    if (error instanceof Error)
      console.error(`issue fetching comments: ${error.message}`);
    else console.error(`error fetching comments: ${error}`);
    res.status(400).send("Invalid recipe ID format.");
  }
};

// add a new comment
export const addComment = async (req: Request, res: Response) => {
  const recipeId = req.params.recipeId as string;

  const validation = createCommentSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: validation.error.issues,
    });
  }

  const { user, text } = validation.data;

  if (!user || !text) {
    return res
      .status(400)
      .json({ message: "Missing required fields for comment" });
  }

  const newComment: Comment = {
    _id: new ObjectId(),
    user,
    text,
    dateCreated: new Date(),
  };

  try {
    const result = await collections.recipes?.updateOne(
      { _id: new ObjectId(recipeId) },
      {
        $push: { comments: newComment },
      },
    );

    if (!result || result.matchedCount === 0)
      return res.status(404).json({ message: "Recipe not found" });

    res
      .status(201)
      .location(`${newComment._id}`)
      .json({ message: `Created a new comment with id ${newComment._id}` });
  } catch (error) {
    if (error instanceof Error)
      console.error(`issue adding comment: ${error.message}`);
    else console.error(`error adding comment: ${error}`);
    res.status(400).send("Unable to add comment");
  }
};

// delete a comment
export const deleteComment = async (req: Request, res: Response) => {
  const { recipeId, commentId } = req.params as {
    recipeId: string;
    commentId: string;
  };
  try {
    const recipe = await collections.recipes?.findOne({
      _id: new ObjectId(recipeId),
    });
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    const commentExists = recipe.comments.some(
      (c) => (c._id as ObjectId).toString() === commentId,
    );

    if (!commentExists)
      return res.status(404).json({ message: "Comment not found" });

    await collections.recipes?.updateOne(
      { _id: new ObjectId(recipeId) },
      {
        $pull: { comments: { _id: new ObjectId(commentId) } },
      },
    );

    res.status(200).json({ message: "Comment deleted" });
  } catch (error) {
    if (error instanceof Error)
      console.error(`issue deleting comment: ${error.message}`);
    else console.error(`error deleting comment: ${error}`);
    res.status(400).send("Unable to delete comment");
  }
};

// get random recipe
export const getRandomRecipe = async (_req: Request, res: Response) => {
  try {
    const count = await collections.recipes?.countDocuments();
    if (!count || count === 0)
      return res.status(404).json({ message: "No recipes found" });

    const randomIndex = Math.floor(Math.random() * count);
    const randomRecipe = await collections.recipes
      ?.find()
      .skip(randomIndex)
      .limit(1)
      .toArray();

    res.status(200).json(randomRecipe?.[0]);
  } catch (error) {
    console.error("Error fetching random recipe:", error);
    res.status(500).json({ message: "Failed to get random recipe" });
  }
};

// get total count of recipes
export const getRecipesCount = async (_req: Request, res: Response) => {
  try {
    const count = await collections.recipes?.countDocuments();
    res.status(200).json({ totalRecipes: count || 0 });
  } catch (error) {
    console.error("Error fetching recipe count:", error);
    res.status(500).json({ message: "Failed to get recipe count" });
  }
};
