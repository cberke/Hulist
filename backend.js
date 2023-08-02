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

app.get('/movie/', (req, res) => {
  let title = req.query.title;
  let service = req.query.service;

  // Check if we have this URL cached
  let connection = mysql.createConnection(config);

  connection.connect(function (err) {
    if (err) {
      return console.error('error: ' + err.message);
    }
  });

  let cacheCheckSql = `SELECT url, metadataId FROM ContentMetaData WHERE contentName=? AND streamingService=? AND contentType='MOVIE'`;

  connection.query(cacheCheckSql, [title, service], function (err, results) {
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
          if (!id) {
            res.status(418).send({ message: 'Movie not found on selected streaming platform, please check spelling.' });
            endConnection(connection);
          } else {
            fetch(`https://streaming-availability.p.rapidapi.com/v2/get/basic?country=us&imdb_id=${id}&output_language=en`, {
              method: 'GET',
              headers: {
                accept: 'application/json',
                'X-RapidAPI-Key': '5da6d8e7ccmshe3949e3d00dd52fp1a9d03jsn8999dd4dba35',
                'X-RapidAPI-Host': 'streaming-availability.p.rapidapi.com'
              },
            })
              .then(res => res.json())
              .then((data) => {
                if (data.result.streamingInfo.us[service]
                  && data.result.streamingInfo.us[service][0].watchLink
                  && data.result.type === 'movie') {
                  let watchLink = data.result.streamingInfo.us[service][0].watchLink

                  // cache the URL and associated metadata
                  let insertSql = `INSERT INTO ContentMetaData(url, contentName, streamingService, contentType) VALUES(?,?,?,'MOVIE')`;

                  connection.query(insertSql, [watchLink, data.result.title, service], function (err, results) {
                    if (err) {
                      console.log(err.message);
                    }
                  });

                  // get metadataId for the movie we just inserted                  
                  let selectSql = `SELECT metadataId FROM ContentMetaData WHERE contentName=?`;
                  connection.query(selectSql, [title], function (err, results) {
                    if (err) {
                      console.log(err.message);
                    }

                    endConnection(connection);
                    if (results != null && results.length > 0) {
                      // send the data back
                      res.json({
                        url: `${watchLink}`,
                        metadataId: `${results[0].metadataId}`,
                      });
                    }
                  });
                } else {
                  endConnection(connection);

                  // send back response
                  res.json({
                    message: `Movie not found on selected streaming platform, please check spelling`,
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

app.get('/tvshow/', (req, res) => {
  let title = req.query.title;
  let service = req.query.service;

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
        if (!id) {
          res.status(418).send({ message: 'Show not found on selected streaming platform, please check spelling.' });
        } else {
          fetch(`https://streaming-availability.p.rapidapi.com/v2/get/basic?country=us&imdb_id=${id}&output_language=en`, {
            method: 'GET',
            headers: {
              accept: 'application/json',
              'X-RapidAPI-Key': '5da6d8e7ccmshe3949e3d00dd52fp1a9d03jsn8999dd4dba35',
              'X-RapidAPI-Host': 'streaming-availability.p.rapidapi.com'
            },
          })
            .then(res => res.json())
            .then((data) => {
              // send the data back
              if (data.result.type && data.result.type === 'series' && data.result.streamingInfo.us[service]) {
                res.json(data.result);
              } else {
                res.json({ message: 'TV show not found on selected streaming platform, please check spelling' })
              }
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
  title = title;
  let seasonNum = req.query.seasonNum;
  let episodeNum = req.query.episodeNum;
  let episodeUrl = req.query.episodeURL;
  let service = req.query.service;
  let episodeName = req.query.episodeName;

  // Check if we have this URL cached
  let connection = mysql.createConnection(config);

  connection.connect(function (err) {
    if (err) {
      return console.error('error: ' + err.message);
    }
  });

  let cacheCheckSql = `SELECT url, metadataId FROM ContentMetaData WHERE contentName=? AND seasonNum=? AND episodeNum=? AND streamingService=?`;

  connection.query(cacheCheckSql, [title, seasonNum, episodeNum, service], function (err, results) {
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
      // Cache the URL and associated metadata
      let insertSql = `INSERT INTO ContentMetaData(url, contentName, streamingService, contentType, seasonNum, episodeNum, episodeName) VALUES(?,?,?,'EPISODE',?,?,?)`;
      connection.query(insertSql, [episodeUrl, title, service, seasonNum, episodeNum, episodeName], function (err, results) {
        if (err) {
          console.log(err.message);
        }
      });

      // get metadataId for the movie we just inserted
      let selectSql = `SELECT metadataId FROM ContentMetaData WHERE contentName=? AND seasonNum=? AND episodeNum=?`;
      connection.query(selectSql, [title, seasonNum, episodeNum], function (err, results) {
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

  connection.query(cacheCheckSql, [name, email], function (err, results) {
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

      connection.query(insertSql, [name, email], function (err, results) {
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

  connection.query(fetchSql, function (err, results) {
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

  let selectSql = `SELECT * FROM PlaylistContents WHERE playlistId=? AND metadataId=?`;

  connection.query(selectSql, [playlistId, metadataId], function (err, results) {
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

      connection.query(insertSql, [playlistId, metadataId], function (err, results) {
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

app.get('/deletePlaylist/', (req, res) => {
  let playlistId = req.query.playlistId;

  let connection = mysql.createConnection(config);

  connection.connect(function (err) {
    if (err) {
      return console.error('error: ' + err.message);
    }
  });

  let selectSql = `SELECT * FROM Playlists WHERE playlistId=?`;

  connection.query(selectSql, [playlistId], function (err, results) {
    if (err) {
      console.log(err.message);
    }
    if (results != null && results.length > 0) {
      // Delete playlist contents
      let deleteContentsSql = `DELETE FROM PlaylistContents WHERE playlistId=?`;
      let successful = true;

      connection.query(deleteContentsSql, [playlistId], function (err, results) {
        if (err) {
          console.log(err.message);
          successful = false;
        }
      });

      let deletePlaylistSql = `DELETE FROM Playlists WHERE playlistId=?`;

      connection.query(deletePlaylistSql, [playlistId], function (err, results) {
        if (err) {
          console.log(err.message);
          successful = false;
        }
      });

      endConnection(connection);

      // send the confirmation
      if (successful) {
        res.json({ message: `Successfully deleted playlist`, });
      } else {
        res.json({ message: `Failed to delete playlist`, });
      }
    } else {
      endConnection(connection);

      res.json({ message: `Playlist not found`, });
    }
  });
});

app.get('/getPlaylistContents/', (req, res) => {
  let playlistId = req.query.playlistId;

  let connection = mysql.createConnection(config);

  connection.connect(function (err) {
    if (err) {
      return console.error('error: ' + err.message);
    }
  });

  let selectSql = `SELECT * FROM ContentMetaData INNER JOIN PlaylistContents on ContentMetaData.metadataId = PlaylistContents.metadataId WHERE playlistId=? ORDER BY id ASC`;


  connection.query(selectSql, [playlistId], function (err, results) {
    if (err) {
      console.log(err.message);
    }
    if (results != null && results.length > 0) {
      // Convert metadata into JSON
      for (let i = 0; i < results.length; i++) {
        results[i].url = results[i].url.toString();
      }
      endConnection(connection);
      res.json(results);
    } else {
      endConnection(connection);

      res.json({ message: `Playlist is empty`, });
    }
  });
});

app.get('/removeFromPlaylist/', (req, res) => {
  let playlistId = req.query.playlistId;
  let metadataId = req.query.metadataId;

  let connection = mysql.createConnection(config);

  connection.connect(function (err) {
    if (err) {
      return console.error('error: ' + err.message);
    }
  });

  let deleteContentsSql = `DELETE FROM PlaylistContents WHERE playlistId=? AND metadataId=?`;

  connection.query(deleteContentsSql, [playlistId, metadataId], function (err, results) {
    let successful = true;
    if (err) {
      console.log(err.message);
      successful = false;
    }

    endConnection(connection);

    // send the confirmation
    if (successful) {
      res.json({
        message: `Successfully deleted playlist`,
        code: 1,
      });
    } else {
      res.json({
        message: `Failed to delete playlist`,
        code: 0,
      });
    }
  });
});

app.listen(
  PORT,
  () => console.log(`it's alive on http://localhost:${PORT}`)
)