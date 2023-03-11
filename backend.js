import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import mysql from 'mysql2';
import config from './config.js';

const app = express();
const PORT = 8080;

app.use(cors());

app.get('/movie/:title', (req, res) => {

  const { title } = req.params;

  var url = "";

  // Check if we have this URL cached
  let connection = mysql.createConnection(config);

  connection.connect(function (err) {
    if (err) {
      return console.error('error: ' + err.message);
    }
  });

  let cacheCheckSql = `SELECT url FROM ContentMetaData WHERE contentName=?`;

  connection.query(cacheCheckSql, [title], function (err, results, fields) {
    if (err) {
      console.log(err.message);
    }
    if (results != null) {

      res.json({ url: `${results[0].url.toString()}`, });

      connection.end(function (err) {
        if (err) {
          return console.log('error:' + err.message);
        }
        console.log('Close the database connection.');
      });
    } else {
      // Get and cache the URL
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
                if (data.watchAvailability[0].directUrls[0] != null) {
                  // cache the URL and associated metadata

                  let insertSql = `INSERT INTO ContentMetaData(url, contentName, imdbID, streamingService, contentType) VALUES(?,?,?,'Netflix','MOVIE')`;

                  connection.query(insertSql, [data.watchAvailability[0].directUrls[0], title, id], function (err, results, fields) {
                    if (err) {
                      console.log(err.message);
                    }
                  });

                  connection.end(function (err) {
                    if (err) {
                      return console.log('error:' + err.message);
                    }
                    console.log('Close the database connection.');
                  });
                }

                // send the data back
                res.json({ url: `${data.watchAvailability[0].directUrls[0]}`, });
              })
              .catch((error) => {
                res.status(418).send({ message: error.message });

                connection.ping((err) => {
                  if (!err) {
                    connection.end(function (error) {
                      if (error) {
                        return console.log('error:' + err.message);
                      }
                      console.log('Close the database connection.');
                    });
                  }
                })
              });
          }
        })
        .catch((error) => {
          res.status(418).send({ message: error.message });

          connection.ping((err) => {
            if (!err) {
              connection.end(function (error) {
                if (error) {
                  return console.log('error:' + err.message);
                }
                console.log('Close the database connection.');
              });
            }
          })
        });
    }
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