import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = 8080;

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
        res.send({ url: `${data.watchAvailability[0].directUrls[0]}` });
      })
      .catch((error) => {
        res.status(418).send({ message: error.message });
      });
  }
});

app.post('/tshirt/:id', (req, res) => {

  const { id } = req.params;
  const { logo } = req.body;

  res.status(200).send({
    tshirt: 'test',
    size: 'large'
  })
});

app.listen(
  PORT,
  () => console.log(`it's alive on http://localhost:${PORT}`)
)