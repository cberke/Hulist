function searchMovie() {
  titleElement = document.getElementById("title");
  title = titleElement.value;
  serviceElement = document.getElementById("streamingServiceSelect");
  service = serviceElement.value;
  fetch(`http://localhost:8080/movie?title=${title}&service=${service}`, {
    method: 'GET',
  })
    .then(res => res.json())
    .then((data) => {
      results = document.getElementById("resultsText");
      if (!data.url) {
        results.innerText = "No URL found";
      } else {
        results.innerText = data.url;
      }
      results.style.display = "block";

      updatePlaylists("playlistSelect");
      document.getElementById("playlistFeatures").removeAttribute("hidden");
      sessionStorage.metadataId = data.metadataId;
    })
    .catch((error) => {
      results = document.getElementById("resultsText");
      results.innerText = error.message;
      results.style.display = "block";
    });
}

function searchTvShow() {
  titleElement = document.getElementById("title");
  title = titleElement.value;
  fetch(`http://localhost:8080/tvshow?title=${title}`, {
    method: 'GET',
  })
    .then(res => res.json())
    .then((data) => {
      seasons = document.getElementById("seasonNum");
      while (seasons.options.length > 1) {
        seasons.remove(1);
      }

      for (let i = 0; i < data.length; i++) {
        var option = document.createElement("option");
        option.text = `${i + 1}`;
        option.value = `${i + 1}`;
        seasons.add(option);
      }
      sessionStorage.currShow = JSON.stringify(data);
      document.getElementById("episodeNum").style.display = "none";
      seasons.style.display = "block";
    })
    .catch((error) => {
      results = document.getElementById("resultsText");
      results.innerText = error.message;
      results.style.display = "block";
    });
}

function updateEpisodes() {
  seasonNum = document.getElementById("seasonNum").value;
  if (seasonNum === "-") {
    return;
  }

  serviceElement = document.getElementById("streamingServiceSelect");
  service = serviceElement.value;

  data = JSON.parse(sessionStorage.currShow);
  episodes = document.getElementById("episodeNum");
  while (episodes.options.length > 1) {
    episodes.remove(1);
  }

  let anyLinkFound = false;
  for (let i = 0; i < data[seasonNum - 1].episodes.length; i++) {
    let url = data[seasonNum - 1].episodes[i].streamingInfo.us[service][0].watchLink;
    if (url) {
      let option = document.createElement("option");
      option.value = `${url}`;
      option.text = `${i + 1}`;
      episodes.add(option);
      anyLinkFound = true;
    }
  }

  if (anyLinkFound) {
    episodes.style.display = "block";
  } else {
    results = document.getElementById("resultsText");
    results.innerText = "No URL found";
    results.style.display = "block";
  }
}

function searchEpisode() {
  seasonNum = document.getElementById("seasonNum").value;
  selectedIndex = document.getElementById("episodeNum").selectedIndex;
  episodeNum = document.getElementById("episodeNum").options[selectedIndex].text;
  episodeUrl = document.getElementById("episodeNum").value;
  data = JSON.parse(sessionStorage.currShow);

  titleElement = document.getElementById("title");
  title = titleElement.value;
  serviceElement = document.getElementById("streamingServiceSelect");
  service = serviceElement.value;

  fetch(`http://localhost:8080/episode?title=${title}&seasonNum=${seasonNum}&episodeNum=${episodeNum}&episodeURL=${episodeUrl}&service=${service}`, {
    method: 'GET',
  })
    .then(res => res.json())
    .then((data) => {
      results = document.getElementById("resultsText");
      results.innerText = data.url;
      results.style.display = "block";

      updatePlaylists("playlistSelect");
      document.getElementById("playlistFeatures").removeAttribute("hidden");
      sessionStorage.metadataId = data.metadataId;
    })
    .catch((error) => {
      results = document.getElementById("resultsText");
      results.innerText = error.message;
      results.style.display = "block";
    });
}

function enterSearch(event) {
  if (event.keyCode === 13) {
    if (document.getElementById("tvOrMovie").value === "Movie") {
      searchMovie();
    } else {
      searchTvShow();
    }
  }
}

function toggle() {
  switchValue = document.getElementById("tvOrMovie").value;
  document.getElementById("searchButton").innerText = `Search ${switchValue}`;

  if (switchValue === "TV Show") {
    document.getElementById('searchButton').setAttribute('onclick', 'searchTvShow()')
  } else {
    document.getElementById("seasonNum").style.display = "none";
    document.getElementById("episodeNum").style.display = "none";
    document.getElementById('searchButton').setAttribute('onclick', 'searchMovie()')
  }
  document.getElementById('title').value = "";
  document.getElementById("playlistFeatures").setAttribute("hidden", "hidden");
}

function resetPlaylistManagement() {
  document.getElementById("togglePLCreate").innerText = "Open Playlist Management Section";
  document.getElementById("playlistManagementSection").setAttribute("hidden", "hidden");
}

function togglePLCreate() {
  if (document.getElementById("togglePLCreate").innerText.includes("Open")) {
    document.getElementById("playlistManagementSection").removeAttribute("hidden");
    document.getElementById("togglePLCreate").innerText = "Close Playlist Management Section";
    document.getElementById("email").value = '';
    document.getElementById("playlistName").value = '';
    updatePlaylists("playlistDeleteSelect");
  } else {
    resetPlaylistManagement();
  }
}

function createPlaylist() {
  email = document.getElementById("email").value;
  name = document.getElementById("playlistName").value;
  if (email === "") {
    alert("Email field cannot be blank");
  } else if (name === "") {
    alert("Name field cannot be blank");
  } else {
    resetPlaylistManagement();
    email = document.getElementById("email").value;
    playlistName = document.getElementById("playlistName").value;

    fetch(`http://localhost:8080/createPlaylist?email=${email}&name=${playlistName}`, {
      method: 'GET',
    })
      .then(res => res.json())
      .then((data) => {
        results = document.getElementById("playlistActionResults");
        results.innerText = data.result;
        results.style.display = "block";

        if (!document.getElementById("playlistFeatures").hasAttribute("hidden")) {
          updatePlaylists("playlistSelect");
        }

        if (!document.getElementById("playlistDeleteSelect").hasAttribute("hidden")) {
          updatePlaylists("playlistDeleteSelect");
        }
      })
      .catch((error) => {
        results = document.getElementById("playlistActionResults");
        results.innerText = error.message;
        results.style.display = "block";
      });
  }
}

function updatePlaylists(dropdownToPopulate) {
  fetch(`http://localhost:8080/getPlaylists/`, {
    method: 'GET',
  })
    .then(res => res.json())
    .then((data) => {
      playlists = document.getElementById(dropdownToPopulate);
      while (playlists.options.length > 1) {
        playlists.remove(1);
      }

      if (data.code === 1) {
        for (let i = 0; i < data.playlistInfo.length; i++) {
          var option = document.createElement("option");
          option.text = `${data.playlistInfo[i].userDefinedName}`;
          option.value = `${data.playlistInfo[i].playlistId}`;
          playlists.add(option);
        }
      } else {
        results = document.getElementById("playlistActionResults");
        results.innerText = "unable to populate playlists dropdown";
        results.style.display = "block";
      }
    })
    .catch((error) => {
      results = document.getElementById("playlistActionResults");
      results.innerText = error.message;
      results.style.display = "block";
    });
}

function addToPlaylist() {
  playlistId = document.getElementById("playlistSelect").value;
  if (playlistId === "-") {
    alert("Please select a playlist");
    return;
  }

  fetch(`http://localhost:8080/addToPlaylist?playlistId=${playlistId}&metadataId=${sessionStorage.metadataId}`, {
    method: 'GET',
  })
    .then(res => res.json())
    .then((data) => {
      results = document.getElementById("playlistActionResults");
      results.innerText = data.message;
      results.style.display = "block";
    })
    .catch((error) => {
      results = document.getElementById("playlistActionResults");
      results.innerText = error.message;
      results.style.display = "block";
    });
}

function deletePlaylist() {
  playlistId = document.getElementById("playlistDeleteSelect").value;
  if (playlistId === "-") {
    alert("Please select a playlist");
    return;
  }

  let selectedIndex = document.getElementById("playlistDeleteSelect").selectedIndex;
  let playlistName = document.getElementById("playlistDeleteSelect").options[selectedIndex].text;
  if (confirm(`Please confirm you want to delete the playlist: ${playlistName}`) === true) {
    resetPlaylistManagement();

    fetch(`http://localhost:8080/deletePlaylist?playlistId=${playlistId}`, {
      method: 'GET',
    })
      .then(res => res.json())
      .then((data) => {
        results = document.getElementById("playlistActionResults");
        results.innerText = data.message;
        results.style.display = "block";
      })
      .catch((error) => {
        results = document.getElementById("playlistActionResults");
        results.innerText = error.message;
        results.style.display = "block";
      });
  }
}

function removeFromPlaylist(metadataId, playlistId, elementsToRemove) {
  fetch(`http://localhost:8080/removeFromPlaylist?playlistId=${playlistId}&metadataId=${metadataId}`, {
    method: 'GET',
  })
    .then(res => res.json())
    .then((data) => {
      results = document.getElementById("resultsText");
      results.innerText = data.message;
      results.style.display = "block";

      if (data.code === 1) {
        for (let i = 0; i < elementsToRemove.length; i++) {
          elementsToRemove[i].remove();
        }
      }
    })
    .catch((error) => {
      results = document.getElementById("resultsText");
      results.innerText = error.message;
      results.style.display = "block";
    });
}

function removeAllPlaylistContentElements() {
  const playlistContentsSection = document.getElementById("playlistContentsSection");
  while (playlistContentsSection.firstChild) {
    playlistContentsSection.removeChild(playlistContentsSection.lastChild);
  }
}

function displayPlaylist() {
  playlistElement = document.getElementById("playlistSelect");
  playlistId = playlistElement.value;
  fetch(`http://localhost:8080/getPlaylistContents?playlistId=${playlistId}`, {
    method: 'GET',
  })
    .then(res => res.json())
    .then((data) => {
      removeAllPlaylistContentElements();
      if (data.message) {
        results = document.getElementById("resultsText");
        results.innerText = data.message;
        results.style.display = "block";
        return;
      }

      for (let i = 0; i < data.length; i++) {
        const contentInfo = document.createElement("label");
        if (data[i].contentType === "MOVIE") {
          contentInfo.innerText = `${data[i].contentName}: ${data[i].url}`;
        } else {
          contentInfo.innerText = `${data[i].contentName} Season ${data[i].seasonNum} Episode ${data[i].episodeNum}: ${data[i].url}`;
        }
        contentInfo.style.padding = '10px';
        contentInfo.style.lineHeight = '3';

        // TODO: add code for play button here, make sure to add it to the call to removeFromPlaylist

        const lineBreak = document.createElement("br");

        const removeButton = document.createElement("button");
        removeButton.innerText = "Remove from Playlist";
        removeButton.onclick = function () { removeFromPlaylist(data[i].metadataId, playlistId, [contentInfo, removeButton, lineBreak]); };

        const playlistContentsSection = document.getElementById("playlistContentsSection");
        playlistContentsSection.appendChild(contentInfo);
        playlistContentsSection.appendChild(removeButton);
        playlistContentsSection.appendChild(lineBreak);
      }

      document.getElementById("playlistContentsSection").style.display = "block"
    })
    .catch((error) => {
      removeAllPlaylistContentElements();
      results = document.getElementById("resultsText");
      results.innerText = error.message;
      results.style.display = "block";
    });
}