'use strict';

/* ALEXATOR TRACKS — single, persistent player and History API catalogue. */
(() => {
  const page = document.querySelector('.track-detail-page');
  if (!page) return;

  const tracks = [
    ['001', 'Genesis', '001-genesis', '3:35', '2BI8If9sChtcGrelztbE1i', 'genesis/6794427928'],
    ['002', 'Awakening', '002-awakening', '3:58', '3rN3rfVv23nW956YGiLzQe', 'awakening/6794427930'],
    ['003', 'Open Skies', '003-open-skies', '4:28', '3zg6n9Kn8HVI5WNReyY0iC', 'open-skies/6794427931'],
    ['004', 'Through the Fire', '004-through-the-fire', '3:53', '1uzepKiX96NkUBD4TrorXS', 'through-the-fire/6794427932'],
    ['005', 'Ever Forward', '005-ever-forward', '5:06', '4v7nr7QleQWwnCq16gn9jj', 'ever-forward/6794427933'],
    ['006', 'Towards the Dream', '006-towards-the-dream', '4:03', '08J4oxbVwDfiGdK2EbBiP0', 'towards-the-dream/6799801496'],
    ['007', 'Full Throttle', '007-full-throttle', '4:28', '12xbiUqVGKg52e8t0pISLv', 'full-throttle/6799801497'],
    ['008', 'Brighter Days', '008-brighter-days', '3:56', '5ner9TBtqV35Px99WkAb2x', 'brighter-days/6799801498'],
    ['009', 'Crossroads', '009-crossroads', '4:59', '5cx9ZteAUWRUcDxGFfpRRi', 'crossroads/6799801499'],
    ['010', 'New Horizon', '010-new-horizon', '3:39', '1Sd2WQJ2P9W5aW23JjGaig', 'new-horizon/6799801500'],
    ['011', 'Free Spirit', '011-free-spirit', '4:31', '0OxCVxRWDFEZqW6BNfVWcf', 'free-spirit/6803150795'],
    ['012', 'Last Goodbye', '012-last-goodbye', '4:39', '5tKHaiUfsd0kcenYxJRLMG', 'last-goodbye/6803150797'],
    ['013', 'Rise Again', '013-rise-again', '3:24', '4PVDsqkslOmxqePvEcDMon', 'rise-again/6803150798'],
    ['014', 'Ride the Storm', '014-ride-the-storm', '4:14', '5v9naHgPfLtCdy2b8POAMB', 'ride-the-storm/6803150799'],
    ['015', 'Break New Ground', '015-break-new-ground', '4:46', '6FZIMUtlmOreopoE7P8Bp7', 'break-new-ground/6803150800'],
    ['016', 'By Your Side', '016-by-your-side', '3:29', '1TGffkl5EEk3tpwkKjzZfY', 'by-your-side/6810512637'],
    ['017', 'All for You', '017-all-for-you', '4:11', '1UacN0D4ZGZVSO6HDIaQW1', 'all-for-you/6810512640'],
    ['018', 'Endless Sands', '018-endless-sands', '5:29', '2e0nFBhCqKFZAjjQXh69yf', 'endless-sands/6810512644'],
    ['019', 'Never Let Go', '019-never-let-go', '3:38', '0ZHAZVDGcvkzTUa1ylFmBr', 'never-let-go/6810512645'],
    ['020', 'Just Relax', '020-just-relax', '4:44', '7Ca9jWvhEuT3sJBsXzE6u8', 'just-relax/6810512646'],
  ].map(([id, title, slug, duration, spotifyId, applePath], index) => {
    const filename = `${id}-${title.replaceAll(' ', '-')}`;
    const releaseStart = Math.floor(index / 5) * 5 + 1;
    return {
      id,
      title,
      slug,
      duration,
      spotify: `https://open.spotify.com/track/${spotifyId}`,
      apple: `https://music.apple.com/ru/song/${applePath}`,
      audio: `https://media.alexator.com/music/${filename}.mp3`,
      download: `https://media.alexator.com/download/${filename}.mp3`,
      filename: `${filename}.mp3`,
      image: `/assets/images/tracks/${slug}/${slug === '018-endless-sands' ? 'artwork-v2.webp' : 'artwork.webp'}`,
      url: `https://alexator.com/tracks/${slug}/`,
      path: `/tracks/${slug}/`,
      releaseSlug: `alexator-${String(releaseStart).padStart(3, '0')}-${String(releaseStart + 4).padStart(3, '0')}`,
    };
  });

  const stage = document.querySelector('#track-stage');
  const title = document.querySelector('#track-title');
  const number = document.querySelector('#track-number');
  const heroPlay = document.querySelector('#track-hero-play');
  const heroPlayIcon = heroPlay?.querySelector('.track-hero-play-icon');
  const heroPlayCaption = heroPlay?.querySelector('.track-hero-play-caption');
  const audio = document.querySelector('#track-audio');
  const download = document.querySelector('#track-download');
  const spotify = document.querySelector('#track-spotify');
  const apple = document.querySelector('#track-apple');
  const cards = [...document.querySelectorAll('.track-card')];
  const rail = document.querySelector('#all-tracks');
  const shareButton = document.querySelector('#track-share');
  const shareMenu = document.querySelector('#track-share-menu');
  const saveButton = document.querySelector('#track-save');
  const saveDialog = document.querySelector('#track-save-dialog');
  const saveInstruction = document.querySelector('#save-instruction');
  const copyLinkButton = document.querySelector('#track-copy-link');
  const toast = document.querySelector('#track-toast');
  const canonical = document.querySelector('link[rel="canonical"]');
  const metaDescription = document.querySelector('meta[name="description"]');
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDescription = document.querySelector('meta[property="og:description"]');
  const ogUrl = document.querySelector('meta[property="og:url"]');
  const ogImage = document.querySelector('meta[property="og:image"]');
  const twitterTitle = document.querySelector('meta[name="twitter:title"]');
  const twitterDescription = document.querySelector('meta[name="twitter:description"]');
  const twitterImage = document.querySelector('meta[name="twitter:image"]');

  if (!audio || !heroPlay) return;

  const autoplayKey = 'alexatorTracksAutoplay';
  const shareText = 'Discover ALEXATOR! Original electronic music created to inspire, motivate and energize.';
  let currentIndex = Math.min(Math.max(Number(page.dataset.initialTrack) || 0, 0), tracks.length - 1);
  let startedTrackId = null;
  let toastTimer = null;
  let autoplayEnabled = false;
  try {
    autoplayEnabled = window.localStorage.getItem(autoplayKey) === 'on';
  } catch (_error) {
    // The first explicit Play still enables Auto Play when storage is unavailable.
  }

  const currentTrack = () => tracks[currentIndex];
  const analyticsData = () => ({
    track_id: currentTrack().id,
    track_title: currentTrack().title,
    release_slug: currentTrack().releaseSlug,
    track_context: 'tracks',
  });

  const sendEvent = (eventName, parameters = {}) => {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', eventName, {
      page_path: `${window.location.pathname}${window.location.search}${window.location.hash}`,
      ...parameters,
    });
  };

  const showToast = (message) => {
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2200);
  };

  const copyText = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch (_error) {
      const field = document.createElement('textarea');
      field.value = value;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.append(field);
      field.select();
      document.execCommand('copy');
      field.remove();
    }
  };

  const setPlayState = (playing) => {
    heroPlay.classList.toggle('is-playing', playing);
    heroPlayIcon.textContent = '';
    heroPlayCaption.textContent = playing ? 'Pause' : 'Play full track';
    heroPlay.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} ${currentTrack().title}`);
  };

  const updateMetadata = (track) => {
    const description = `Listen to ALEXATOR ${track.id} — ${track.title}. Stream online and download for free.`;
    document.title = `ALEXATOR ${track.id} — ${track.title} | Official Track`;
    canonical?.setAttribute('href', track.url);
    metaDescription?.setAttribute('content', description);
    ogTitle?.setAttribute('content', `ALEXATOR - ${track.title}`);
    ogDescription?.setAttribute('content', description);
    ogUrl?.setAttribute('content', track.url);
    ogImage?.setAttribute('content', `https://alexator.com${track.image}`);
    twitterTitle?.setAttribute('content', `ALEXATOR - ${track.title}`);
    twitterDescription?.setAttribute('content', description);
    twitterImage?.setAttribute('content', `https://alexator.com${track.image}`);
  };

  const updateView = (track) => {
    stage.style.setProperty('--track-art', `url('${track.image}')`);
    number.textContent = track.id;
    title.textContent = track.title;
    download.href = track.download;
    download.setAttribute('download', track.filename);
    spotify.href = track.spotify;
    apple.href = track.apple;
    cards.forEach((card, index) => {
      const active = index === currentIndex;
      card.classList.toggle('is-active', active);
      if (active) card.setAttribute('aria-current', 'page');
      else card.removeAttribute('aria-current');
    });
    const activeCard = cards[currentIndex];
    if (activeCard && rail) {
      const targetLeft = activeCard.offsetLeft - (rail.clientWidth - activeCard.clientWidth) / 2;
      rail.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
    }
    updateMetadata(track);
    setPlayState(false);
  };

  const changeTrack = async (nextIndex, { updateHistory = true, continuePlaying = false, replaceHistory = false } = {}) => {
    const normalized = (nextIndex + tracks.length) % tracks.length;
    if (normalized === currentIndex && !continuePlaying) return;
    if (!audio.paused) audio.pause();
    currentIndex = normalized;
    startedTrackId = null;
    const track = currentTrack();
    updateView(track);
    audio.src = track.audio;
    audio.load();

    /* This property already uses GA4 Enhanced Measurement for History changes,
       matching the existing Music section. Do not send a manual page_view here:
       pushState/replaceState must produce exactly one enhanced page_view. */
    if (updateHistory && window.location.protocol !== 'file:') {
      const method = replaceHistory ? 'replaceState' : 'pushState';
      window.history[method]({ track: track.slug }, '', track.path);
    }

    if (continuePlaying) {
      try {
        await audio.play();
      } catch (_error) {
        setPlayState(false);
      }
    }
  };

  const togglePlay = async () => {
    if (!audio.paused) {
      audio.pause();
      return;
    }
    autoplayEnabled = true;
    try {
      window.localStorage.setItem(autoplayKey, 'on');
    } catch (_error) {
      // Auto Play still works when storage is unavailable.
    }
    try {
      await audio.play();
    } catch (_error) {
      showToast('Playback could not start');
    }
  };

  heroPlay.addEventListener('click', togglePlay);

  cards.forEach((card) => {
    card.addEventListener('click', (event) => {
      event.preventDefault();
      const nextIndex = Number(card.dataset.trackIndex);
      const continuePlaying = !audio.paused && !audio.ended;
      changeTrack(nextIndex, { continuePlaying });
    });
  });

  audio.addEventListener('play', () => {
    setPlayState(true);
    if (startedTrackId !== currentTrack().id) {
      startedTrackId = currentTrack().id;
      sendEvent('track_play', analyticsData());
    }
  });
  audio.addEventListener('pause', () => {
    if (!audio.ended) setPlayState(false);
  });
  audio.addEventListener('ended', async () => {
    sendEvent('track_complete', analyticsData());
    startedTrackId = null;
    setPlayState(false);
    if (autoplayEnabled) await changeTrack(currentIndex + 1, { continuePlaying: true });
  });

  download?.addEventListener('click', () => {
    sendEvent('track_download', {
      ...analyticsData(),
      download_category: 'track',
      file_name: currentTrack().filename,
      file_url: currentTrack().download,
    });
  });

  const shareData = () => ({
    title: `ALEXATOR - ${currentTrack().title}`,
    text: shareText,
    url: currentTrack().url,
  });

  const closeShare = () => {
    shareMenu.hidden = true;
    shareButton.setAttribute('aria-expanded', 'false');
  };

  const positionShare = () => {
    const buttonRect = shareButton.getBoundingClientRect();
    const menuRect = shareMenu.getBoundingClientRect();
    const left = Math.min(window.innerWidth - menuRect.width - 12, Math.max(12, buttonRect.left + buttonRect.width / 2 - menuRect.width / 2));
    const top = Math.max(12, buttonRect.top - menuRect.height - 9);
    shareMenu.style.left = `${Math.round(left)}px`;
    shareMenu.style.top = `${Math.round(top)}px`;
  };

  shareButton?.addEventListener('click', async () => {
    const coarse = window.matchMedia?.('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
    if (navigator.share && coarse) {
      try { await navigator.share(shareData()); } catch (error) { if (error.name !== 'AbortError') showToast('Unable to share'); }
      return;
    }
    const willOpen = shareMenu.hidden;
    shareMenu.hidden = !willOpen;
    shareButton.setAttribute('aria-expanded', String(willOpen));
    if (willOpen) {
      positionShare();
      shareMenu.querySelector('[role="menuitem"]')?.focus();
    }
  });

  shareMenu?.addEventListener('click', async (event) => {
    const item = event.target.closest('[data-share-action]');
    if (!item) return;
    const data = shareData();
    const message = `${data.title}\n\n${data.text}`;
    const action = item.dataset.shareAction;
    if (action === 'copy') { await copyText(data.url); showToast('✓ Link copied'); }
    if (action === 'telegram') window.open(`https://t.me/share/url?url=${encodeURIComponent(data.url)}&text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    if (action === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(`${message}\n\n${data.url}`)}`, '_blank', 'noopener,noreferrer');
    if (action === 'email') window.location.href = `mailto:?subject=${encodeURIComponent(data.title)}&body=${encodeURIComponent(`${message}\n\n${data.url}`)}`;
    if (action === 'facebook') window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.url)}`, '_blank', 'noopener,noreferrer');
    if (action === 'x') window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(data.url)}&text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    if (action === 'linkedin') window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(data.url)}`, '_blank', 'noopener,noreferrer');
    closeShare();
  });

  const saveMessage = () => {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (isIOS) return 'Tap Share → Add Bookmark';
    if (/Android/i.test(ua)) return 'Open the browser menu ⋮ → Add to bookmarks';
    if (/Macintosh|Mac OS X/i.test(ua)) return 'Press ⌘ + D';
    return 'Press Ctrl + D';
  };

  const closeSave = () => {
    saveDialog.hidden = true;
    saveButton.focus();
  };

  saveButton?.addEventListener('click', () => {
    closeShare();
    saveInstruction.textContent = saveMessage();
    saveDialog.hidden = false;
    copyLinkButton.focus();
  });
  saveDialog?.querySelector('.track-dialog-close')?.addEventListener('click', closeSave);
  saveDialog?.addEventListener('click', (event) => { if (event.target === saveDialog) closeSave(); });
  copyLinkButton?.addEventListener('click', async () => {
    await copyText(currentTrack().url);
    showToast('✓ Link copied');
    closeSave();
  });

  document.addEventListener('click', (event) => {
    if (!shareMenu.hidden && !shareMenu.contains(event.target) && !shareButton.contains(event.target)) closeShare();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!shareMenu.hidden) closeShare();
    if (!saveDialog.hidden) closeSave();
  });
  window.addEventListener('resize', () => { if (!shareMenu.hidden) positionShare(); });
  window.addEventListener('popstate', () => {
    const slug = window.location.pathname.split('/').filter(Boolean).at(-1);
    const index = tracks.findIndex((track) => track.slug === slug);
    if (index >= 0) changeTrack(index, { updateHistory: false, continuePlaying: !audio.paused && !audio.ended });
  });

  updateView(currentTrack());
})();
