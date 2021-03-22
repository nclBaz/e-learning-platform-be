const express = require("express");
const fetch = require("node-fetch");

const apiRouter = express.Router();

apiRouter.get("/:genre", async (req, res, next) => {
  try {
    const response = await fetch(
      `https://deezerdevs-deezer.p.rapidapi.com/genre/` +
        req.params.genre +
        `/artists`,
      {
        headers: {
          "x-rapidapi-key":
            "7058b459femsh8bbc3e5e09ff45bp16ae10jsnaa8151340a4c",
          "x-rapidapi-host": "deezerdevs-deezer.p.rapidapi.com",
        },
      }
    );
    const genre = await response.json();
    res.send(genre.data);
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/artist/:id", async (req, res, next) => {
  try {
    console.log(req.params.id);
    const response = await fetch(
      "https://deezerdevs-deezer.p.rapidapi.com/artist/" + req.params.id,
      {
        headers: {
          "x-rapidapi-key":
            "7058b459femsh8bbc3e5e09ff45bp16ae10jsnaa8151340a4c",
          "x-rapidapi-host": "deezerdevs-deezer.p.rapidapi.com",
        },
      }
    );
    const artist = await response.json();
    res.send(artist);
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/album/:id", async (req, res, next) => {
  try {
    const response = await fetch(
      "https://deezerdevs-deezer.p.rapidapi.com/album/" + req.params.id,
      {
        headers: {
          "x-rapidapi-key":
            "7058b459femsh8bbc3e5e09ff45bp16ae10jsnaa8151340a4c",
          "x-rapidapi-host": "deezerdevs-deezer.p.rapidapi.com",
        },
      }
    );
    const album = await response.json();
    res.send(album);
  } catch (error) {
    next(error);
  }
});

module.exports = apiRouter;