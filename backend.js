import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import mysql from 'mysql2';
import config from './config.js';

const app = express();
const PORT = 8080;

app.use(cors());

function endConnection(connection) {
  connection.end(function (err) {
    if (err) {
      return console.log('error:' + err.message);
    }
    console.log('Closed the database connection.');
  });
}

app.get('/movie/:title', (req, res) => {

  const { title } = req.params;

  let url = "";

  // Check if we have this URL cached
  let connection = mysql.createConnection(config);

  connection.connect(function (err) {
    if (err) {
      return console.error('error: ' + err.message);
    }
  });

  let cacheCheckSql = `SELECT url, metadataId FROM ContentMetaData WHERE contentName=?`;

  connection.query(cacheCheckSql, [title], function (err, results, fields) {
    if (err) {
      console.log(err.message);
    }
    if (results != null && results.length > 0) {
      res.json({
        url: `${results[0].url.toString()}`,
        metadataId: `${results[0].metadataId.toString()}`,
      });

      endConnection(connection);
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
          let id = titleData.imdbID;
          while (id.charAt(0) === 't') {
            id = id.substring(1);
          }
          if (!id) {
            res.status(418).send({ url: 'Movie not found, please check spelling.' });
            endConnection(connection);
          } else {
            fetch(`https://api.flixed.io/v1/movies/${id}?idType=imdb&apiKey=JvZosSdhe61qyfqx9cWtDmdng57IQHQJ`, {
              method: 'GET',
              headers: {
                accept: 'application/json',
              },
            })
              .then(res => res.json())
              .then((data) => {
                if (data.watchAvailability[0].directUrls[0] != null) {
                  // cache the URL and associated metadata
                  let insertSql = `INSERT INTO ContentMetaData(url, contentName, streamingService, contentType) VALUES(?,?,'Netflix','MOVIE')`;

                  connection.query(insertSql, [data.watchAvailability[0].directUrls[0], title], function (err, results, fields) {
                    if (err) {
                      console.log(err.message);
                    }
                  });

                  // get metadataId for the movie we just inserted                  
                  let selectSql = `SELECT metadataId FROM ContentMetaData WHERE contentName=?`;
                  connection.query(selectSql, [title], function (err, results, fields) {
                    if (err) {
                      console.log(err.message);
                    }

                    endConnection(connection);
                    if (results != null && results.length > 0) {
                      // send the data back
                      res.json({
                        url: `${data.watchAvailability[0].directUrls[0]}`,
                        metadataId: `${results[0].metadataId}`,
                      });
                    }
                  });
                } else {
                  endConnection(connection);

                  // send back response
                  res.json({
                    url: `no url found in API`,
                    metadataId: -1,
                  });
                }
              })
              .catch((error) => {
                res.status(418).send({ message: error.message });

                connection.ping((err) => {
                  if (!err) {
                    endConnection(connection);
                  }
                })
              });
          }
        })
        .catch((error) => {
          res.status(418).send({ message: error.message });

          connection.ping((err) => {
            if (!err) {
              endConnection(connection);
            }
          })
        });
    }
  });
});

app.get('/tvshow/:title', (req, res) => {

  const { title } = req.params;

  if (!title) {
    res.status(418).send({ url: 'title needed' });
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
        let id = titleData.imdbID;
        while (id.charAt(0) === 't') {
          id = id.substring(1);
        }
        if (!id) {
          res.status(418).send({ url: 'Show not found, please check spelling.' });
        } else {
          fetch(`https://api.flixed.io/v1/shows/${id}?idType=imdb&apiKey=JvZosSdhe61qyfqx9cWtDmdng57IQHQJ`, {
            method: 'GET',
            headers: {
              accept: 'application/json',
            },
          })
            .then(res => res.json())
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

  let title = req.query.title;
  title = title.toUpperCase();
  let seasonNum = req.query.seasonNum;
  let episodeNum = req.query.episodeNum;
  let episodeID = req.query.episodeID;

  let url = "";

  // Check if we have this URL cached
  let connection = mysql.createConnection(config);

  connection.connect(function (err) {
    if (err) {
      return console.error('error: ' + err.message);
    }
  });

  let cacheCheckSql = `SELECT url, metadataId FROM ContentMetaData WHERE contentName=? AND seasonNum=? AND episodeNum=?`;

  connection.query(cacheCheckSql, [title, seasonNum, episodeNum], function (err, results, fields) {
    if (err) {
      console.log(err.message);
    }
    if (results != null && results.length > 0) {

      res.json({
        url: `${results[0].url.toString()}`,
        metadataId: `${results[0].metadataId.toString()}`,
      });

      endConnection(connection);
    } else {
      // Get and cache the URL
      fetch(`https://api.flixed.io/v1/episodes/${episodeID}?idType=flixed&apiKey=JvZosSdhe61qyfqx9cWtDmdng57IQHQJ`, {
        method: 'GET',
        headers: {
          accept: 'application/json',
        },
      })
        .then(res => res.json())
        .then((data) => {
          if (data.watchAvailability[0].contentId != null) {
            // cache the URL and associated metadata
            let episodeUrl = `https://www.netflix.com/watch/${data.watchAvailability[0].contentId}`;
            let insertSql = `INSERT INTO ContentMetaData(url, contentName, streamingService, contentType, seasonNum, episodeNum) VALUES(?,?,'Netflix','EPISODE', ?, ?)`;

            connection.query(insertSql, [episodeUrl, title, seasonNum, episodeNum], function (err, results, fields) {
              if (err) {
                console.log(err.message);
              }
            });

            // get metadataId for the movie we just inserted
            let selectSql = `SELECT metadataId FROM ContentMetaData WHERE contentName=? AND seasonNum=? AND episodeNum=?`;
            connection.query(selectSql, [title, seasonNum, episodeNum], function (err, results, fields) {
              if (err) {
                console.log(err.message);
              }
              endConnection(connection);

              if (results != null && results.length > 0) {
                // send the data back
                res.json({
                  url: `${episodeUrl}`,
                  metadataId: `${results[0].metadataId}`,
                });
              }
            });
          } else {
            endConnection(connection);

            // send back response
            res.json({
              url: `no url found in API`,
              metadataId: -1,
            });
          }
        })
        .catch((error) => {
          res.status(418).send({ message: error.message });

          connection.ping((err) => {
            if (!err) {
              endConnection(connection);
            }
          })
        });
    }
  });
});

app.get('/createPlaylist/', (req, res) => {
  let name = req.query.name;
  let email = req.query.email;
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
      endConnection(connection);

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

      endConnection(connection);

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
      endConnection(connection);

      res.json({
        playlistInfo: results,
        code: 1,
      });
    } else {
      endConnection(connection);

      res.json({ code: 0, });
    }
  });
});

app.get('/addToPlaylist/', (req, res) => {
  let playlistId = req.query.playlistId;
  let metadataId = req.query.metadataId;

  let connection = mysql.createConnection(config);

  connection.connect(function (err) {
    if (err) {
      return console.error('error: ' + err.message);
    }
  });

  let insertSql = `SELECT * FROM PlaylistContents WHERE playlistId=? AND metadataId=?`;

  connection.query(insertSql, [playlistId, metadataId], function (err, results, fields) {
    if (err) {
      console.log(err.message);
    }
    if (results != null && results.length > 0) {
      endConnection(connection);

      res.json({ message: `Item already in selected playlist`, });
    } else {
      // Add to playlist
      let insertSql = `INSERT INTO PlaylistContents(playlistId, metadataId) VALUES(?,?)`;
      let successful = true;

      connection.query(insertSql, [playlistId, metadataId], function (err, results, fields) {
        if (err) {
          console.log(err.message);
          successful = false;
        }
      });

      endConnection(connection);

      // send the confirmation
      if (successful) {
        res.json({ message: `Successfully added to playlist`, });
      } else {
        res.json({ message: `Failed to add to playlist`, });
      }
    }
  });
});

app.listen(
  PORT,
  () => console.log(`it's alive on http://localhost:${PORT}`)
)