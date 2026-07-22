const menuButton = document.querySelector(".menu-button");
const navigation = document.querySelector(".site-navigation");
const navigationLinks = document.querySelectorAll(".site-navigation a");

// Мобильное меню
if (menuButton && navigation) {
  menuButton.addEventListener("click", () => {
    const menuIsOpen = navigation.classList.toggle("is-open");

    menuButton.classList.toggle("is-open", menuIsOpen);
    menuButton.setAttribute("aria-expanded", String(menuIsOpen));
  });

  navigationLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navigation.classList.remove("is-open");
      menuButton.classList.remove("is-open");
      menuButton.setAttribute("aria-expanded", "false");
    });
  });
}

// Музыкальный каталог
const tracks = document.querySelectorAll(".track");

function closeTrack(track) {
  const audio = track.querySelector("audio");
  const playButton = track.querySelector(".track-play-button");

  track.classList.remove("is-open");

  if (audio) {
    audio.pause();
  }

  if (playButton) {
    playButton.textContent = "PLAY";
    playButton.setAttribute("aria-expanded", "false");
  }
}

function closeOtherTracks(currentTrack) {
  tracks.forEach((track) => {
    if (track !== currentTrack) {
      closeTrack(track);
    }
  });
}

tracks.forEach((track) => {
  const playButton = track.querySelector(".track-play-button");
  const audio = track.querySelector("audio");

  if (!playButton || !audio) {
    return;
  }

  playButton.addEventListener("click", async () => {
    const trackIsOpen = track.classList.contains("is-open");
    const audioIsPlaying = !audio.paused;

    if (trackIsOpen && audioIsPlaying) {
      closeTrack(track);
      return;
    }

    closeOtherTracks(track);

    track.classList.add("is-open");
    playButton.setAttribute("aria-expanded", "true");

    try {
      await audio.play();
    } catch (error) {
      closeTrack(track);
      console.error("Не удалось запустить MP3:", error);
    }
  });

  audio.addEventListener("play", () => {
    closeOtherTracks(track);

    track.classList.add("is-open");
    playButton.textContent = "PAUSE";
    playButton.setAttribute("aria-expanded", "true");
  });

  audio.addEventListener("pause", () => {
    if (track.classList.contains("is-open")) {
      closeTrack(track);
    }
  });

  audio.addEventListener("ended", () => {
    audio.currentTime = 0;
    closeTrack(track);
  });
});