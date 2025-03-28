import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "./config/passport.js";
import userRouter from "./routes/user.routes.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded());

app.use(cookieParser());

app.use(session({ secret: "1234", resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.use("/users", userRouter);


export { app };
