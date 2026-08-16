import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { saveBase64Image } from "./lib/uploads";

export const uploadRouter = createRouter({
  uploadImage: authedQuery
    .input(z.object({ base64Data: z.string() }))
    .mutation(async ({ input }) => {
      const url = await saveBase64Image(input.base64Data);
      return { url };
    }),
});
