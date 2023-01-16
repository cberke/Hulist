import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
const PORT = 8080;

app.use(cors());

app.get('/movie/:id', (req, res) => {

  const { id } = req.params;

  if (!id) {
    res.status(418).send({ message: 'id needed' });
  } else {
    fetch(`https://api.flixed.io/v1/movies/${id}?idType=imdb&apiKey=JvZosSdhe61qyfqx9cWtDmdng57IQHQJ`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
      },
    })
      .then(flixedRes => flixedRes.json())
      .then((data) => {
        res.json({ url: `${data.watchAvailability[0].directUrls[0]}`, });
      })
      .catch((error) => {
        res.status(418).send({ message: error.message });
      });
  }
});

app.get('/tvshow/:id', (req, res) => {

  const { id } = req.params;

  if (!id) {
    res.status(418).send({ message: 'id needed' });
  } else {
    fetch(`https://api.flixed.io/v1/shows/${id}?idType=imdb&apiKey=JvZosSdhe61qyfqx9cWtDmdng57IQHQJ`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
      },
    })
      .then(flixedRes => flixedRes.json())
      .then((data) => {
        res.json({ url: `${data.watchAvailability[0].directUrls[0]}`, });
      })
      .catch((error) => {
        res.status(418).send({ message: error.message });
      });
  }
});

app.listen(
  PORT,
  () => console.log(`it's alive on http://localhost:${PORT}`)
)