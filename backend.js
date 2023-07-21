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
    if (results != null && results.length > 0) {

      res.json({ url: `${results[0].url.toString()}`, });

      connection.end(function (err) {
        if (err) {
          return console.log('error:' + err.message);
        }
        console.log('Closed the database connection.');
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
            res.status(418).send({ message: 'Movie not found, please check spelling.' });
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

                  let insertSql = `INSERT INTO ContentMetaData(url, contentName, streamingService, contentType) VALUES(?,?,'Netflix','MOVIE')`;

                  connection.query(insertSql, [data.watchAvailability[0].directUrls[0], title], function (err, results, fields) {
                    if (err) {
                      console.log(err.message);
                    }
                  });

                  connection.end(function (err) {
                    if (err) {
                      return console.log('error:' + err.message);
                    }
                    console.log('Closed the database connection.');
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
                      console.log('Closed the database connection.');
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
                console.log('Closed the database connection.');
              });
            }
          })
        });
    }
  });
});

app.get('/tvshow/:title', (req, res) => {

  const { title } = req.params;

  if (!title) {
    res.status(418).send({ message: 'title needed' });
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
          res.status(418).send({ message: 'Show not found, please check spelling.' });
        } else {
          fetch(`https://api.flixed.io/v1/shows/${id}?idType=imdb&apiKey=JvZosSdhe61qyfqx9cWtDmdng57IQHQJ`, {
            method: 'GET',
            headers: {
              accept: 'application/json',
            },
          })
            .then(flixedRes => flixedRes.json())
            .then((data) => {
              // send the data back
              res.json(data.seasons);
            })
            .catch((error) => {
              res.status(418).send({ message: error.message });
            });
        }
      })
      .catch((error) => {
        res.status(418).send({ message: error.message });
      });
  }
});

app.get('/episode', (req, res) => {

  var title = req.query.title;
  title = title.toUpperCase();
  var seasonNum = req.query.seasonNum;
  var episodeNum = req.query.episodeNum;
  var episodeID = req.query.episodeID;

  var url = "";

  // Check if we have this URL cached
  let connection = mysql.createConnection(config);

  connection.connect(function (err) {
    if (err) {
      return console.error('error: ' + err.message);
    }
  });

  let cacheCheckSql = `SELECT url FROM ContentMetaData WHERE contentName=? AND seasonNum=? AND episodeNum=?`;

  connection.query(cacheCheckSql, [title, seasonNum, episodeNum], function (err, results, fields) {
    if (err) {
      console.log(err.message);
    }
    if (results != null && results.length > 0) {

      res.json({ url: `${results[0].url.toString()}`, });

      connection.end(function (err) {
        if (err) {
          return console.log('error:' + err.message);
        }
        console.log('Closed the database connection.');
      });
    } else {
      // Get and cache the URL
      fetch(`https://api.flixed.io/v1/episodes/${episodeID}?idType=flixed&apiKey=JvZosSdhe61qyfqx9cWtDmdng57IQHQJ`, {
        method: 'GET',
        headers: {
          accept: 'application/json',
        },
      })
        .then(flixedRes => flixedRes.json())
        .then((data) => {
          if (data.watchAvailability[0].contentId != null) {
            // cache the URL and associated metadata
            var episodeUrl = `https://www.netflix.com/watch/${data.watchAvailability[0].contentId}`;
            let insertSql = `INSERT INTO ContentMetaData(url, contentName, streamingService, contentType, seasonNum, episodeNum) VALUES(?,?,'Netflix','EPISODE', ?, ?)`;

            connection.query(insertSql, [episodeUrl, title, seasonNum, episodeNum], function (err, results, fields) {
              if (err) {
                console.log(err.message);
              }
            });

            connection.end(function (err) {
              if (err) {
                return console.log('error:' + err.message);
              }
              console.log('Closed the database connection.');
            });
          }

          // send the data back
          res.json({ url: `${episodeUrl}`, });
        })
        .catch((error) => {
          res.status(418).send({ message: error.message });

          connection.ping((err) => {
            if (!err) {
              connection.end(function (error) {
                if (error) {
                  return console.log('error:' + err.message);
                }
                console.log('Closed the database connection.');
              });
            }
          })
        });
    }
  });
});

app.get('/createPlaylist/', (req, res) => {

  var name = req.query.name;
  var email = req.query.email;
  email = email.toUpperCase();

  let connection = mysql.createConnection(config);

  connection.connect(function (err) {
    if (err) {
      return console.error('error: ' + err.message);
    }
  });

  let cacheCheckSql = `SELECT * FROM Playlists WHERE userDefinedName=? AND email=?`;

  connection.query(cacheCheckSql, [name, email], function (err, results, fields) {
    if (err) {
      console.log(err.message);
    }
    if (results != null && results.length > 0) {
      connection.end(function (err) {
        if (err) {
          return console.log('error:' + err.message);
        }
        console.log('Closed the database connection.');
      });

      res.json({ result: `Playlist already exists`, });

    } else {
      // Create new playlist
      let insertSql = `INSERT INTO Playlists(userDefinedName, email) VALUES(?,?)`;
      let successful = true;

      connection.query(insertSql, [name, email], function (err, results, fields) {
        if (err) {
          console.log(err.message);
          successful = false;
        }
      });

      connection.end(function (err) {
        if (err) {
          return console.log('error:' + err.message);
        }
        console.log('Closed the database connection.');
      });

      // send the confirmation
      if (successful) {
        res.json({ result: `Playlist created`, });
      } else {
        res.json({ result: `Failed to create`, });
      }
    }
  });
});

app.get('/getPlaylists/', (req, res) => {
  let connection = mysql.createConnection(config);

  connection.connect(function (err) {
    if (err) {
      return console.error('error: ' + err.message);
    }
  });

  let fetchSql = `SELECT userDefinedName, playlistId FROM Playlists`;

  connection.query(fetchSql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
    }

    if (results != null && results.length > 0) {
      connection.end(function (err) {
        if (err) {
          return console.log('error:' + err.message);
        }
        console.log('Closed the database connection.');
      });

      res.json({
        playlistInfo: results,
        code: 1,
      });
    } else {
      connection.end(function (err) {
        if (err) {
          return console.log('error:' + err.message);
        }
        console.log('Closed the database connection.');
      });

      res.json({ code: 0, });
    }
  });
});

app.listen(
  PORT,
  () => console.log(`it's alive on http://localhost:${PORT}`)
)