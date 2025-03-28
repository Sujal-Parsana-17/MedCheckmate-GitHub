import dotenv from "dotenv";
import { app } from "./app.js";
import connectDB from "./config/db.js";

dotenv.config({
  path: "./.env",
});

const port = process.env.PORT || 4000;

connectDB()
  .then(() => {
    app.on("error", (err) => {
      console.log(`Error : ${err}`);
      throw err;
    });

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.log(`MongoDB connection failed ${err}`);
  });
