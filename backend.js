import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import mysql from 'mysql2';


const app = express();
const PORT = 8080;

let connection = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: 'testpw123!',
  database: 'Streamlist'
});

app.use(cors());

app.get('/movie/:title', (req, res) => {

  // connection.connect(function (err) {
  //   if (err) {
  //     return console.error('error: ' + err.message);
  //   }

  //   let sql = 'SHOW TABLES';

  //   connection.query(sql, function (err, results, fields) {
  //     if (err) {
  //       console.log(err.message);
  //     }
  //     console.log(results)
  //   });

  //   connection.end(function (err) {
  //     if (err) {
  //       return console.log('error:' + err.message);
  //     }
  //     console.log('Close the database connection.');
  //   });
  // });

  const { title } = req.params;

  fetch(`http://www.omdbapi.com/?t=${title}&apikey=53dcb6b7`, {
    method: 'GET',
    headers: {
      accept: 'application/json',
    },
  })
    .then(response => response.json())
    .then((titleData) => {
      var id = titleData.imdbID;
      while (id.charAt(0) === 't') {
        id = id.substring(1);
      }
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
    })
    .catch((error) => {
      res.status(418).send({ message: error.message });
    });
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