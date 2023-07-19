USE Streamlist;

SHOW TABLES

/*
Table Creation and Schema

CREATE TABLE Playlists(
playlistId INT NOT NULL AUTO_INCREMENT,
userDefinedName VARCHAR(255) NOT NULL,
email VARCHAR(255) NOT NULL,
PRIMARY KEY (playlistId)
);

CREATE TABLE ContentMetaData(
metadataId INT NOT NULL AUTO_INCREMENT,
url BLOB NOT NULL,
contentName VARCHAR(255) NOT NULL,
streamingService ENUM('NETFLIX', 'HULU') NOT NULL,
contentType ENUM('MOVIE', 'SHOW') NOT NULL,
seasonNum INT,
episodeNum INT,
PRIMARY KEY (metadataId)
);

CREATE TABLE PlaylistContents(
id INT NOT NULL AUTO_INCREMENT,
playlistId INT NOT NULL,
metadataId INT NOT NULL,
PRIMARY KEY (id),
FOREIGN KEY (playlistId) REFERENCES Playlists(playlistId),
FOREIGN KEY (metadataId) REFERENCES ContentMetaData(metadataId)
);