USE Streamlist;

SHOW TABLES;

SELECT * FROM Playlists WHERE userDefinedName='testName' AND email='testEmail';

DELETE FROM ContentMetaData where contentName;

SELECT metadataId FROM ContentMetaData WHERE contentName='THE GOOD PLACE' AND seasonNum=4 AND episodeNum=8 AND streamingService='netflix';

ALTER TABLE ContentMetaData MODIFY COLUMN streamingService ENUM('netflix', 'hulu', 'prime', 'peacock', 'hbo');
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
streamingService ENUM('netflix', 'hulu', 'prime', 'peacock', 'hbo') NOT NULL,
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