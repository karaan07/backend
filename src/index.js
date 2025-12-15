import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config();   // ✅ simplest & safest

connectDB();










/*import express from "express";
const app = express()(async () => {
  try {
    await mongoose.connect(`${process.env.MONODB_URI}/${DB_NAME}`);
    app.on("error", (err) => {
      console.log("ERR", err);
      throw err;
    });

    app.listen(process.env.PORT , ()=>{
        console.log(`App is listening on port ${process.env.PORT}`);
        
    })
  } catch (error) {
    console.error("Error: ", error);
  }
})();*/
