'use strict';

/* ALEXATOR shared navigation */
(() => {
  const menuButton = document.querySelector('.menu-button');
  const navigation = document.querySelector('.site-navigation');
  if (!menuButton || !navigation) return;

  const closeMenu = (restoreFocus = false) => {
    navigation.classList.remove('is-open');
    menuButton.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation menu');
    if (restoreFocus) menuButton.focus();
  };

  menuButton.addEventListener('click', () => {
    const isOpen = navigation.classList.toggle('is-open');
    menuButton.classList.toggle('is-open', isOpen);
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
  });

  navigation.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => closeMenu(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navigation.classList.contains('is-open')) {
      closeMenu(true);
    }
  });

  document.addEventListener('click', (event) => {
    if (!navigation.classList.contains('is-open')) return;
    if (navigation.contains(event.target) || menuButton.contains(event.target)) return;
    closeMenu(false);
  });
})();

/* ALEXATOR Music — Releases / All Tracks */
(() => {
  const page = document.querySelector('.music-catalogue-page');
  if (!page) return;

  const tabList = document.querySelector('.music-tabs');
  const tabButtons = [...document.querySelectorAll('.music-tab')];
  const releasesTab = document.querySelector('#music-tab-releases');
  const allTracksTab = document.querySelector('#music-tab-all');
  const releasesPanel = document.querySelector('#music-panel-releases');
  const allTracksPanel = document.querySelector('#music-panel-all');
  const activeReleaseSlot = document.querySelector('#music-active-release');
  const otherReleaseList = document.querySelector('#music-other-releases');
  const releaseDividerLabel = document.querySelector('#music-release-divider-label');
  const releaseArticles = [...document.querySelectorAll('.music-release')];
  const trackArticles = [...document.querySelectorAll('.music-track')];
  const shareMenu = document.querySelector('#music-share-menu');
  const shareToast = document.querySelector('#music-share-toast');
  const defaultReleaseSlug = page.dataset.defaultRelease || 'alexator-011-015';
  const releaseSlugs = new Set(releaseArticles.map((release) => release.dataset.releaseSlug));
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const shareText = 'Discover ALEXATOR! Original electronic music created to inspire, motivate and energize.';

  let activeTrack = null;
  let autoplayEnabled = false;
  let currentShareButton = null;
  let currentShareRelease = null;
  let toastTimer = null;
  let isHandlingPopState = false;

  const audioFor = (track) => track?.querySelector('audio') ?? null;
  const playerFor = (track) => track?.querySelector('.music-track-player') ?? null;
  const actionFor = (track) => track?.querySelector('.music-track-action') ?? null;

  const setTrackButtonState = (track, { isOpen = false, isPlaying = false } = {}) => {
    const button = actionFor(track);
    if (!button) return;
    const icon = button.querySelector('.music-track-action-icon');
    const label = button.querySelector('.music-track-action-label');
    const actionLabel = isPlaying ? 'Pause' : 'Play';
    button.setAttribute('aria-expanded', String(isOpen));
    button.setAttribute('aria-label', `${actionLabel} ALEXATOR ${track.dataset.trackNumber} — ${track.querySelector('.music-track-title')?.textContent?.trim() || 'track'}`);
    if (icon) icon.textContent = isPlaying ? 'Ⅱ' : '▶';
    if (label) label.textContent = isPlaying ? 'PAUSE' : 'PLAY';
  };

  const setAutoplay = (enabled) => {
    autoplayEnabled = Boolean(enabled);
    document.querySelectorAll('.autoplay-toggle').forEach((toggle) => {
      toggle.checked = autoplayEnabled;
    });
  };

  const collapseTrack = (track, { pause = true, reset = false } = {}) => {
    if (!track) return;
    const audio = audioFor(track);
    const player = playerFor(track);
    if (audio && pause && !audio.paused) audio.pause();
    if (audio && reset) {
      try {
        audio.currentTime = 0;
      } catch (_error) {
        // Some browsers prevent seeking before metadata is available.
      }
    }
    track.classList.remove('is-open');
    if (player) player.hidden = true;
    setTrackButtonState(track, { isOpen: false, isPlaying: false });
    if (activeTrack === track) activeTrack = null;
  };

  const stopPlayback = ({ reset = true, disableAutoplay = true } = {}) => {
    trackArticles.forEach((track) => collapseTrack(track, { pause: true, reset }));
    activeTrack = null;
    if (disableAutoplay) setAutoplay(false);
  };

  const openTrack = (track) => {
    if (!track) return;
    trackArticles.forEach((otherTrack) => {
      if (otherTrack !== track) collapseTrack(otherTrack, { pause: true, reset: true });
    });
    const player = playerFor(track);
    track.classList.add('is-open');
    if (player) player.hidden = false;
    setTrackButtonState(track, { isOpen: true, isPlaying: !(audioFor(track)?.paused ?? true) });
    activeTrack = track;
  };

  const playTrack = async (track) => {
    const audio = audioFor(track);
    if (!track || !audio) return false;
    openTrack(track);
    try {
      await audio.play();
      return true;
    } catch (_error) {
      collapseTrack(track, { pause: false, reset: false });
      return false;
    }
  };

  const getSequence = (track) => {
    if (!track) return [];
    let candidates = [];
    if (track.dataset.context === 'release') {
      const release = track.closest('.music-release');
      if (release) candidates = [...release.querySelectorAll('.music-track[data-context="release"]')];
      return candidates.sort((a, b) => Number(a.dataset.trackNumber) - Number(b.dataset.trackNumber));
    }

    candidates = [...(allTracksPanel?.querySelectorAll('.music-track[data-context="all"]') ?? [])];
    return candidates.sort((a, b) => Number(a.dataset.trackNumber) - Number(b.dataset.trackNumber));
  };

  const playNextTrack = async (track) => {
    const sequence = getSequence(track);
    if (!sequence.length) return;
    const currentIndex = sequence.indexOf(track);
    const nextTrack = sequence[(currentIndex + 1 + sequence.length) % sequence.length];
    await playTrack(nextTrack);
  };

  trackArticles.forEach((track) => {
    const button = actionFor(track);
    const audio = audioFor(track);
    const autoplayToggle = track.querySelector('.autoplay-toggle');
    if (!button || !audio) return;

    button.addEventListener('click', async () => {
      if (track.classList.contains('is-open') && !audio.paused) {
        audio.pause();
        collapseTrack(track, { pause: false, reset: false });
        return;
      }
      await playTrack(track);
    });

    autoplayToggle?.addEventListener('change', () => {
      setAutoplay(autoplayToggle.checked);
    });

    audio.addEventListener('play', () => {
      openTrack(track);
      setTrackButtonState(track, { isOpen: true, isPlaying: true });
    });

    // Native media controls must remain usable in Chromium-based browsers.
    // Pausing or seeking inside the <audio> element changes playback state only;
    // the external PAUSE button is the control that deliberately collapses it.
    audio.addEventListener('pause', () => {
      if (audio.ended) return;
      setTrackButtonState(track, {
        isOpen: track.classList.contains('is-open'),
        isPlaying: false,
      });
    });

    audio.addEventListener('seeking', () => {
      if (!track.classList.contains('is-open')) return;
      setTrackButtonState(track, { isOpen: true, isPlaying: !audio.paused });
    });

    audio.addEventListener('seeked', () => {
      if (!track.classList.contains('is-open')) return;
      setTrackButtonState(track, { isOpen: true, isPlaying: !audio.paused });
    });

    audio.addEventListener('ended', async () => {
      collapseTrack(track, { pause: false, reset: true });
      if (autoplayEnabled) await playNextTrack(track);
    });
  });

  const selectedTabId = () => tabButtons.find((button) => button.getAttribute('aria-selected') === 'true')?.id;

  const activateTab = (tabId, { updateHistory = false, focus = false } = {}) => {
    const selectedButton = tabButtons.find((button) => button.id === tabId) || releasesTab;
    if (!selectedButton) return;
    const isReleases = selectedButton === releasesTab;
    if (selectedTabId() !== selectedButton.id) stopPlayback({ reset: true, disableAutoplay: true });

    tabButtons.forEach((button) => {
      const selected = button === selectedButton;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    if (releasesPanel) releasesPanel.hidden = !isReleases;
    if (allTracksPanel) allTracksPanel.hidden = isReleases;
    if (focus) selectedButton.focus();

    if (updateHistory && !isHandlingPopState && window.location.protocol !== 'file:') {
      if (isReleases) {
        const activeRelease = activeReleaseSlot?.querySelector('.music-release');
        const slug = activeRelease?.dataset.releaseSlug || defaultReleaseSlug;
        history.pushState({ release: slug }, '', `/music/${slug}/`);
      } else {
        history.pushState({ tab: 'all-tracks' }, '', '/music.html#all-tracks');
      }
    }
  };

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => activateTab(button.id, { updateHistory: true }));
  });

  tabList?.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const currentIndex = Math.max(0, tabButtons.indexOf(document.activeElement));
    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabButtons.length;
    if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabButtons.length) % tabButtons.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabButtons.length - 1;
    activateTab(tabButtons[nextIndex].id, { updateHistory: true, focus: true });
  });

  const sortOtherReleases = () => {
    if (!otherReleaseList) return;
    [...otherReleaseList.querySelectorAll('.music-release')]
      .sort((a, b) => Number(b.dataset.releaseOrder) - Number(a.dataset.releaseOrder))
      .forEach((release) => otherReleaseList.append(release));
  };

  const setReleaseView = (release, expanded) => {
    const expandedPanel = release.querySelector('.music-release-expanded');
    const compactPanel = release.querySelector('.music-release-compact');
    const expandButton = release.querySelector('.music-release-expand');
    release.classList.toggle('is-expanded', expanded);
    if (expandedPanel) expandedPanel.hidden = !expanded;
    if (compactPanel) compactPanel.hidden = expanded;
    if (expandButton) expandButton.setAttribute('aria-expanded', String(expanded));
  };

  const releasePath = (slug) => `/music/${slug}/`;

  const expandRelease = (slug, {
    updateHistory = true,
    scroll = true,
    focusTitle = true,
    stopAudio = true,
  } = {}) => {
    const selectedRelease = releaseArticles.find((release) => release.dataset.releaseSlug === slug)
      || releaseArticles.find((release) => release.dataset.releaseSlug === defaultReleaseSlug)
      || releaseArticles[0];
    if (!selectedRelease || !activeReleaseSlot || !otherReleaseList) return null;

    const currentRelease = activeReleaseSlot.querySelector('.music-release');
    const isDifferentRelease = currentRelease !== selectedRelease;
    if (stopAudio && isDifferentRelease) stopPlayback({ reset: true, disableAutoplay: true });

    releaseArticles.forEach((release) => setReleaseView(release, release === selectedRelease));
    if (currentRelease && currentRelease !== selectedRelease) otherReleaseList.append(currentRelease);
    activeReleaseSlot.append(selectedRelease);
    sortOtherReleases();

    const selectedOrder = Number(selectedRelease.dataset.releaseOrder);
    const newestOrder = Math.max(...releaseArticles.map((release) => Number(release.dataset.releaseOrder)));
    if (releaseDividerLabel) {
      releaseDividerLabel.textContent = selectedOrder === newestOrder ? 'EARLIER RELEASES' : 'OTHER RELEASES';
    }

    if (updateHistory && !isHandlingPopState && window.location.protocol !== 'file:') {
      history.pushState({ release: selectedRelease.dataset.releaseSlug }, '', releasePath(selectedRelease.dataset.releaseSlug));
    }

    if (scroll) {
      window.requestAnimationFrame(() => {
        selectedRelease.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
        if (focusTitle) {
          window.setTimeout(() => selectedRelease.querySelector('.music-release-title')?.focus({ preventScroll: true }), reducedMotion ? 0 : 240);
        }
      });
    }
    return selectedRelease;
  };

  document.querySelectorAll('.music-release-expand').forEach((button) => {
    button.addEventListener('click', () => {
      const release = button.closest('.music-release');
      if (!release) return;
      activateTab(releasesTab?.id || 'music-tab-releases', { updateHistory: false });
      expandRelease(release.dataset.releaseSlug, { updateHistory: true, scroll: true, focusTitle: true, stopAudio: true });
    });
  });

  document.querySelectorAll('.music-release-play').forEach((button) => {
    button.addEventListener('click', async () => {
      const release = button.closest('.music-release');
      if (!release) return;
      activateTab(releasesTab?.id || 'music-tab-releases', { updateHistory: false });
      const expanded = expandRelease(release.dataset.releaseSlug, {
        updateHistory: true,
        scroll: false,
        focusTitle: false,
        stopAudio: true,
      });
      if (!expanded) return;
      setAutoplay(true);
      const firstTrack = [...expanded.querySelectorAll('.music-track[data-context="release"]')]
        .sort((a, b) => Number(a.dataset.trackNumber) - Number(b.dataset.trackNumber))[0];
      await playTrack(firstTrack);
    });
  });

  const showToast = (message) => {
    if (!shareToast) return;
    window.clearTimeout(toastTimer);
    shareToast.textContent = message;
    shareToast.classList.add('is-visible');
    toastTimer = window.setTimeout(() => {
      shareToast.classList.remove('is-visible');
      shareToast.textContent = '';
    }, 2000);
  };

  const copyText = async (text) => {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch (_error) {
        // Fall back for browsers or policies that expose Clipboard API but deny writes.
      }
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.append(textArea);
    textArea.select();
    const copied = document.execCommand('copy');
    textArea.remove();
    if (!copied) throw new Error('Copy failed');
  };

  const closeShareMenu = ({ restoreFocus = true } = {}) => {
    if (!shareMenu || shareMenu.hidden) return;
    shareMenu.hidden = true;
    shareMenu.style.removeProperty('left');
    shareMenu.style.removeProperty('top');
    shareMenu.style.removeProperty('visibility');
    currentShareButton?.setAttribute('aria-expanded', 'false');
    const buttonToFocus = currentShareButton;
    currentShareButton = null;
    currentShareRelease = null;
    if (restoreFocus) buttonToFocus?.focus();
  };

  const positionShareMenu = () => {
    if (!shareMenu || !currentShareButton || shareMenu.hidden) return;
    shareMenu.style.visibility = 'hidden';
    const buttonRect = currentShareButton.getBoundingClientRect();
    const menuRect = shareMenu.getBoundingClientRect();
    const viewportPadding = 12;
    let left = buttonRect.right - menuRect.width;
    left = Math.max(viewportPadding, Math.min(left, window.innerWidth - menuRect.width - viewportPadding));
    let top = buttonRect.bottom + 10;
    if (top + menuRect.height > window.innerHeight - viewportPadding) {
      top = Math.max(viewportPadding, buttonRect.top - menuRect.height - 10);
    }
    shareMenu.style.left = `${Math.round(left)}px`;
    shareMenu.style.top = `${Math.round(top)}px`;
    shareMenu.style.visibility = 'visible';
  };

  const openShareMenu = (button, release) => {
    if (!shareMenu) return;
    if (!shareMenu.hidden && currentShareButton === button) {
      closeShareMenu({ restoreFocus: true });
      return;
    }
    closeShareMenu({ restoreFocus: false });
    currentShareButton = button;
    currentShareRelease = release;
    button.setAttribute('aria-expanded', 'true');
    shareMenu.hidden = false;
    positionShareMenu();
    shareMenu.querySelector('[role="menuitem"]')?.focus();
  };

  const releaseShareData = (release) => ({
    title: release.dataset.releaseTitle || 'ALEXATOR',
    text: shareText,
    url: release.dataset.releaseUrl || window.location.href,
  });

  const isMobileShareContext = () => {
    const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    return Boolean(navigator.share) && (coarsePointer || navigator.maxTouchPoints > 0) && window.innerWidth <= 1100;
  };

  document.querySelectorAll('.music-release-share').forEach((button) => {
    button.addEventListener('click', async () => {
      const release = button.closest('.music-release');
      if (!release) return;
      const data = releaseShareData(release);
      if (isMobileShareContext()) {
        try {
          await navigator.share(data);
          return;
        } catch (error) {
          if (error?.name === 'AbortError') return;
        }
      }
      openShareMenu(button, release);
    });
  });

  const openExternalShare = (url) => {
    const popup = window.open(url, '_blank', 'noopener,noreferrer');
    if (popup) popup.opener = null;
  };

  shareMenu?.addEventListener('click', async (event) => {
    const item = event.target.closest('[data-share-action]');
    if (!item || !currentShareRelease) return;
    const action = item.dataset.shareAction;
    const data = releaseShareData(currentShareRelease);
    const message = `${data.title}\n\n${data.text}`;
    const fullMessage = `${message}\n\n${data.url}`;

    try {
      if (action === 'copy') {
        await copyText(data.url);
        showToast('LINK COPIED');
      } else if (action === 'telegram') {
        openExternalShare(`https://t.me/share/url?url=${encodeURIComponent(data.url)}&text=${encodeURIComponent(message)}`);
      } else if (action === 'whatsapp') {
        openExternalShare(`https://wa.me/?text=${encodeURIComponent(fullMessage)}`);
      } else if (action === 'email') {
        window.location.href = `mailto:?subject=${encodeURIComponent(data.title)}&body=${encodeURIComponent(`${data.text}\n\n${data.url}`)}`;
      } else if (action === 'facebook') {
        openExternalShare(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.url)}`);
      } else if (action === 'x') {
        openExternalShare(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(data.url)}`);
      } else if (action === 'linkedin') {
        openExternalShare(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(data.url)}`);
      }
    } catch (_error) {
      showToast('COPY FAILED');
    }
    closeShareMenu({ restoreFocus: true });
  });

  shareMenu?.addEventListener('keydown', (event) => {
    const items = [...shareMenu.querySelectorAll('[role="menuitem"]')];
    if (!items.length) return;
    const currentIndex = Math.max(0, items.indexOf(document.activeElement));
    let nextIndex = currentIndex;
    if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % items.length;
    else if (event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + items.length) % items.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = items.length - 1;
    else if (event.key === 'Escape') {
      event.preventDefault();
      closeShareMenu({ restoreFocus: true });
      return;
    } else {
      return;
    }
    event.preventDefault();
    items[nextIndex].focus();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !shareMenu || shareMenu.hidden) return;
    event.preventDefault();
    closeShareMenu({ restoreFocus: true });
  });

  document.addEventListener('pointerdown', (event) => {
    if (!shareMenu || shareMenu.hidden) return;
    if (shareMenu.contains(event.target) || currentShareButton?.contains(event.target)) return;
    closeShareMenu({ restoreFocus: false });
  });

  window.addEventListener('resize', () => {
    if (shareMenu && !shareMenu.hidden) positionShareMenu();
  });

  const slugFromLocation = () => {
    const pathMatch = window.location.pathname.match(/\/music\/(alexator-\d{3}-\d{3})\/?$/i);
    if (pathMatch && releaseSlugs.has(pathMatch[1].toLowerCase())) return pathMatch[1].toLowerCase();
    const querySlug = new URLSearchParams(window.location.search).get('release')?.toLowerCase();
    if (querySlug && releaseSlugs.has(querySlug)) return querySlug;
    const hashSlug = window.location.hash.slice(1).toLowerCase();
    if (releaseSlugs.has(hashSlug)) return hashSlug;
    const bodySlug = page.dataset.initialRelease?.toLowerCase();
    if (bodySlug && releaseSlugs.has(bodySlug)) return bodySlug;
    return defaultReleaseSlug;
  };

  const locationHasExplicitRelease = () => {
    return /\/music\/alexator-\d{3}-\d{3}\/?$/i.test(window.location.pathname)
      || new URLSearchParams(window.location.search).has('release')
      || releaseSlugs.has(window.location.hash.slice(1).toLowerCase());
  };

  const applyLocationState = ({ initial = false } = {}) => {
    isHandlingPopState = true;
    closeShareMenu({ restoreFocus: false });
    if (window.location.hash === '#all-tracks') {
      activateTab(allTracksTab?.id || 'music-tab-all', { updateHistory: false, focus: false });
    } else {
      activateTab(releasesTab?.id || 'music-tab-releases', { updateHistory: false, focus: false });
      const slug = slugFromLocation();
      expandRelease(slug, {
        updateHistory: false,
        scroll: false,
        focusTitle: false,
        stopAudio: !initial,
      });
      if (initial && locationHasExplicitRelease()) {
        window.setTimeout(() => {
          activeReleaseSlot?.querySelector('.music-release')?.scrollIntoView({
            behavior: reducedMotion ? 'auto' : 'smooth',
            block: 'start',
          });
        }, reducedMotion ? 0 : 120);
      }
    }
    isHandlingPopState = false;
  };

  window.addEventListener('popstate', () => applyLocationState({ initial: false }));
  applyLocationState({ initial: true });
})();

/* Press release selector */
(() => {
  const releaseThumbs = [...document.querySelectorAll('.release-thumb')];
  if (!releaseThumbs.length) return;
  const releaseMainImage = document.querySelector('#release-main-image');
  const releaseTitle = document.querySelector('#release-title');
  const releaseStatus = document.querySelector('#release-status');
  const releasePanels = [...document.querySelectorAll('.release-content-panel')];
  const releaseDevelopmentMessage = document.querySelector('#release-development-message');

  releaseThumbs.forEach((button) => {
    button.addEventListener('click', () => {
      releaseThumbs.forEach((item) => {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      if (releaseMainImage) {
        releaseMainImage.src = button.dataset.image || '';
        releaseMainImage.alt = `${button.dataset.title || 'ALEXATOR release'} release artwork`;
      }
      if (releaseTitle) releaseTitle.textContent = button.dataset.title || '';
      if (releaseStatus) releaseStatus.textContent = button.dataset.status || '';
      const target = button.dataset.content || '';
      releasePanels.forEach((panel) => {
        panel.hidden = panel.id !== target;
      });
      if (releaseDevelopmentMessage) releaseDevelopmentMessage.hidden = Boolean(target);
    });
  });
})();

/* Press media modals and copy buttons */
(() => {
  const modalTriggers = [...document.querySelectorAll('[data-modal]')];
  const modalCloseControls = [...document.querySelectorAll('[data-close-modal]')];
  let activeModalTrigger = null;

  const closeMediaModal = (modal, restoreFocus = true) => {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (restoreFocus) activeModalTrigger?.focus();
    activeModalTrigger = null;
  };

  modalTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const modal = document.getElementById(trigger.dataset.modal);
      if (!modal) return;
      activeModalTrigger = trigger;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      modal.querySelector('.modal-close')?.focus();
    });
  });

  modalCloseControls.forEach((control) => {
    control.addEventListener('click', () => closeMediaModal(control.closest('.media-modal')));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const openModal = document.querySelector('.media-modal.is-open');
    if (openModal) closeMediaModal(openModal);
  });

  document.querySelectorAll('[data-copy-target]').forEach((button) => {
    button.addEventListener('click', async () => {
      const target = document.getElementById(button.dataset.copyTarget);
      if (!target) return;
      const originalText = button.textContent;
      try {
        if (navigator.clipboard?.writeText && window.isSecureContext) {
          await navigator.clipboard.writeText(target.innerText.trim());
        } else {
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(target);
          selection.removeAllRanges();
          selection.addRange(range);
          document.execCommand('copy');
          selection.removeAllRanges();
        }
        button.textContent = 'Copied';
      } catch (_error) {
        button.textContent = 'Select text manually';
      }
      window.setTimeout(() => {
        button.textContent = originalText;
      }, 1800);
    });
  });
})();

/* ALEXATOR Music Videos catalogue */
(() => {
  const player = document.querySelector('#featured-video');
  const buttons = [...document.querySelectorAll('.video-select')];
  if (!player || !buttons.length) return;

  const number = document.querySelector('#featured-video-number');
  const title = document.querySelector('#featured-video-title');
  const description = document.querySelector('#featured-video-description');
  const youtubeLink = document.querySelector('#featured-youtube-link');
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  const selectVideo = (button, { updateHash = true, scrollToPlayer = false } = {}) => {
    const item = button.closest('.video-catalogue-item');
    const videoNumber = button.dataset.number || '';
    const videoTitle = button.dataset.title || '';
    const videoDescription = button.dataset.description || '';
    const source = button.dataset.src || '';
    const poster = button.dataset.poster || '';
    const youtube = button.dataset.youtube || 'https://www.youtube.com/@alexatorcom';
    const currentSource = player.querySelector('source')?.getAttribute('src') || player.getAttribute('src') || '';

    buttons.forEach((candidate) => {
      const selected = candidate === button;
      candidate.setAttribute('aria-pressed', String(selected));
      candidate.closest('.video-catalogue-item')?.classList.toggle('is-active', selected);
    });

    if (number) number.textContent = videoNumber;
    if (title) title.textContent = videoTitle;
    if (description) description.textContent = videoDescription;
    if (youtubeLink) youtubeLink.href = youtube;
    player.setAttribute('aria-label', `ALEXATOR ${videoNumber} — ${videoTitle} official music video`);

    if (source && currentSource !== source) {
      player.pause();
      player.poster = poster;
      const sourceElement = player.querySelector('source');
      if (sourceElement) sourceElement.src = source;
      else player.src = source;
      player.load();
    } else if (poster) {
      player.poster = poster;
    }

    if (item?.id && updateHash) history.replaceState(null, '', `#${item.id}`);
    if (scrollToPlayer) {
      document.querySelector('.featured-video-frame')?.scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'center',
      });
    }
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => selectVideo(button, { scrollToPlayer: true }));
  });

  const hashId = window.location.hash.slice(1);
  if (hashId) {
    const escapedId = window.CSS?.escape ? CSS.escape(hashId) : hashId.replace(/[^a-zA-Z0-9_-]/g, '');
    const hashButton = document.querySelector(`#${escapedId} .video-select`);
    if (hashButton) selectVideo(hashButton, { updateHash: false, scrollToPlayer: false });
  } else {
    const activeButton = document.querySelector('.video-catalogue-item.is-active .video-select') || buttons[0];
    selectVideo(activeButton, { updateHash: false, scrollToPlayer: false });
  }
})();
