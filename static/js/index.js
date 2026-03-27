window.HELP_IMPROVE_VIDEOJS = false;

var SCENE_COMPARE_METRICS = {
  bicycle: {
    ours: { gaussianCount: 483900, fps: 963.7357, trainTimeSec: 165.7 },
    gaussian_splatting: { gaussianCount: 4903061, fps: 74.3678, trainTimeSec: 3971.25 },
    speedy_splat: { gaussianCount: 616841, fps: 642.6031, trainTimeSec: 1117.17 }
  },
  garden: {
    ours: { gaussianCount: 664843, fps: 772.5542, trainTimeSec: 212.79 },
    gaussian_splatting: { gaussianCount: 4143344, fps: 39.5113, trainTimeSec: 2144.98 },
    speedy_splat: { gaussianCount: 534842, fps: 636.6691, trainTimeSec: 1482.55 }
  },
  stump: {
    ours: { gaussianCount: 348135, fps: 1035.4792, trainTimeSec: 144.78 },
    gaussian_splatting: { gaussianCount: 4298695, fps: 119.3522, trainTimeSec: 1725.29 },
    speedy_splat: { gaussianCount: 505340, fps: 718.6418, trainTimeSec: 980.6 }
  },
  kitchen: {
    ours: { gaussianCount: 391535, fps: 674.1119, trainTimeSec: 237.26 },
    gaussian_splatting: { gaussianCount: 1595375, fps: 117.5555, trainTimeSec: 2645.71 },
    speedy_splat: { gaussianCount: 115365, fps: 939.8578, trainTimeSec: 1366.44 }
  },
  bonsai: {
    ours: { gaussianCount: 277980, fps: 867.4829, trainTimeSec: 185.21 },
    gaussian_splatting: { gaussianCount: 1077226, fps: 197.4941, trainTimeSec: 1320.51 },
    speedy_splat: { gaussianCount: 130199, fps: 1012.9427, trainTimeSec: 1248.17 }
  },
  truck: {
    ours: { gaussianCount: 254054, fps: 1057.3866, trainTimeSec: 148.08 },
    gaussian_splatting: { gaussianCount: 2061701, fps: 164.0207, trainTimeSec: 1125.27 },
    speedy_splat: { gaussianCount: 255834, fps: 987.6264, trainTimeSec: 762.95 }
  }
};

function formatCompareGaussianMetric(count) {
  return {
    value: (count / 1000000).toFixed(2) + 'M',
    label: 'Gaussians'
  };
}

function formatCompareFpsMetric(fps) {
  return {
    value: Math.round(fps).toLocaleString('en-US'),
    label: 'FPS'
  };
}

function formatCompareTrainTimeMetric(seconds) {
  return {
    value: (seconds / 60).toFixed(1) + ' min',
    label: 'Train'
  };
}

function getCompareMetrics(sceneKey, methodKey) {
  var sceneMetrics = SCENE_COMPARE_METRICS[sceneKey];
  if (!sceneMetrics) {
    return null;
  }

  return sceneMetrics[methodKey] || null;
}

function observeOnceNearViewport(target, callback, rootMargin) {
  if (!target || typeof callback !== 'function') {
    return null;
  }

  if (!('IntersectionObserver' in window)) {
    callback();
    return null;
  }

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) {
        return;
      }

      observer.disconnect();
      callback();
    });
  }, {
    rootMargin: rootMargin || '0px',
    threshold: 0.01
  });

  observer.observe(target);
  return observer;
}

function runWhenBrowserIsIdle(callback, fallbackDelay) {
  var delay = typeof fallbackDelay === 'number' ? fallbackDelay : 1200;

  if (typeof callback !== 'function') {
    return null;
  }

  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, { timeout: Math.max(delay, 1500) });
  }

  return window.setTimeout(callback, delay);
}

function setCompareMetricLine(element, formattedMetric) {
  if (!element) {
    return;
  }

  if (!formattedMetric) {
    element.innerHTML = '';
    return;
  }

  element.innerHTML =
    '<span class="scene-compare-metrics__value">' + formattedMetric.value + '</span>' +
    '<span class="scene-compare-metrics__label">' + formattedMetric.label + '</span>';
}

function attachCompareInteraction(wrapper, overlay, divider) {
  var compareRatio = 0.5;
  var isDragging = false;

  if (!wrapper || !overlay || !divider) {
    return null;
  }

  function setComparePosition(ratio) {
    compareRatio = Math.max(0, Math.min(1, ratio));

    var percentage = compareRatio * 100;
    var hiddenRight = (1 - compareRatio) * 100;

    overlay.style.clipPath = 'inset(0 ' + hiddenRight + '% 0 0)';
    divider.style.left = percentage + '%';
    divider.setAttribute('aria-valuenow', Math.round(percentage));
  }

  function updateCompareFromClientX(clientX) {
    var rect = wrapper.getBoundingClientRect();
    if (!rect.width) {
      return;
    }

    setComparePosition((clientX - rect.left) / rect.width);
  }

  function shouldFollowPointer(event) {
    return !event.pointerType || event.pointerType === 'mouse';
  }

  wrapper.addEventListener('pointerenter', function(event) {
    if (!shouldFollowPointer(event)) {
      return;
    }
    updateCompareFromClientX(event.clientX);
  });

  wrapper.addEventListener('pointermove', function(event) {
    if (!shouldFollowPointer(event)) {
      return;
    }
    updateCompareFromClientX(event.clientX);
  });

  divider.addEventListener('pointerdown', function(event) {
    isDragging = true;
    divider.classList.add('is-dragging');
    divider.setPointerCapture(event.pointerId);
    updateCompareFromClientX(event.clientX);
  });

  divider.addEventListener('pointermove', function(event) {
    if (!isDragging) {
      return;
    }
    updateCompareFromClientX(event.clientX);
  });

  divider.addEventListener('pointerup', function(event) {
    isDragging = false;
    divider.classList.remove('is-dragging');
    if (divider.hasPointerCapture(event.pointerId)) {
      divider.releasePointerCapture(event.pointerId);
    }
  });

  divider.addEventListener('pointercancel', function(event) {
    isDragging = false;
    divider.classList.remove('is-dragging');
    if (divider.hasPointerCapture(event.pointerId)) {
      divider.releasePointerCapture(event.pointerId);
    }
  });

  divider.addEventListener('keydown', function(event) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setComparePosition(compareRatio - 0.05);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      setComparePosition(compareRatio + 0.05);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setComparePosition(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setComparePosition(1);
    }
  });

  setComparePosition(0.5);

  return {
    setComparePosition: setComparePosition
  };
}

function initSceneShowcase() {
  var showcase = document.querySelector('[data-scene-showcase]');
  if (!showcase) {
    return;
  }

  var buttons = showcase.querySelectorAll('.scene-selector__item');
  var caption = document.getElementById('scene-showcase-caption');
  var activeButton;
  var preloadedVideoElements = Object.create(null);
  var showcaseViewportActive = true;
  var showcasePageVisible = !document.hidden;

  if (!buttons.length) {
    return;
  }

  function playVideo(videoElement) {
    var playPromise = videoElement.play();
    if (playPromise !== undefined) {
      playPromise.catch(function() {});
    }
  }

  function shouldPlayShowcaseMedia() {
    return showcaseViewportActive && showcasePageVisible;
  }

  function collectSceneVideoPaths(button) {
    var seen = Object.create(null);
    var uniquePaths = [];
    var paths = [
      button.getAttribute('data-left-video-1'),
      button.getAttribute('data-right-video-1'),
      button.getAttribute('data-left-video-2') || button.getAttribute('data-left-video-1'),
      button.getAttribute('data-right-video-2') || button.getAttribute('data-right-video-1')
    ];

    paths.forEach(function(path) {
      if (!path || seen[path]) {
        return;
      }

      seen[path] = true;
      uniquePaths.push(path);
    });

    return uniquePaths;
  }

  function preloadVideoPath(videoPath) {
    var preloader = preloadedVideoElements[videoPath];

    if (!videoPath) {
      return;
    }

    if (preloader) {
      return;
    }

    preloader = document.createElement('video');
    preloader.muted = true;
    preloader.playsInline = true;
    preloader.preload = 'metadata';
    preloader.src = videoPath;
    preloader.load();

    preloadedVideoElements[videoPath] = preloader;
  }

  function preloadSceneVideos(button, eager) {
    if (!button) {
      return;
    }

    collectSceneVideoPaths(button).forEach(function(videoPath) {
      preloadVideoPath(videoPath);
    });
  }

  function freezePreviewVideo(videoElement) {
    function applyStaticFrame() {
      var targetTime = 0.12;
      try {
        if (videoElement.duration && videoElement.duration < targetTime) {
          targetTime = Math.max(0, videoElement.duration / 3);
        }
        videoElement.currentTime = targetTime;
      } catch (error) {}
      videoElement.pause();
    }

    videoElement.pause();
    videoElement.removeAttribute('autoplay');
    videoElement.removeAttribute('loop');

    if (videoElement.readyState >= 2) {
      applyStaticFrame();
    } else {
      videoElement.addEventListener('loadeddata', applyStaticFrame, { once: true });
    }
  }

  function createCompareCard(card) {
    var frame = card.querySelector('.scene-compare-frame');
    var wrapper = card.querySelector('.scene-compare-wrapper');
    var controls = card.querySelector('[data-compare-controls]');
    var overlay = card.querySelector('[data-compare-overlay]');
    var divider = card.querySelector('[data-compare-handle]');
    var loadingOverlay = card.querySelector('[data-compare-loading]');
    var leftVideo = card.querySelector('.scene-compare-video--left');
    var rightVideo = card.querySelector('.scene-compare-video--right');
    var leftSource = card.querySelector('.scene-compare-source--left');
    var rightSource = card.querySelector('.scene-compare-source--right');
    var leftLabel = card.querySelector('[data-compare-left-label]');
    var rightLabel = card.querySelector('[data-compare-right-label]');
    var leftGaussianMetric = card.querySelector('[data-compare-left-metric-gaussians]');
    var leftFpsMetric = card.querySelector('[data-compare-left-metric-fps]');
    var leftTrainMetric = card.querySelector('[data-compare-left-metric-train]');
    var rightGaussianMetric = card.querySelector('[data-compare-right-metric-gaussians]');
    var rightFpsMetric = card.querySelector('[data-compare-right-metric-fps]');
    var rightTrainMetric = card.querySelector('[data-compare-right-metric-train]');
    var compareCaption = card.querySelector('[data-compare-caption]');
    var playToggle = card.querySelector('[data-compare-play-toggle]');
    var playToggleText = card.querySelector('[data-compare-play-text]');
    var progressInput = card.querySelector('[data-compare-progress]');
    var fullscreenToggle = card.querySelector('[data-compare-fullscreen-toggle]');
    var fullscreenToggleText = card.querySelector('[data-compare-fullscreen-text]');
    var compareInteraction;
    var layoutFrame = null;
    var initialAspectRatio = parseFloat(wrapper.style.getPropertyValue('--scene-compare-aspect-ratio')) || 0;
    var lastKnownRatio = initialAspectRatio > 0 ? initialAspectRatio : 16 / 9;
    var loadingVisibleSince = 0;
    var loadingShowTimer = null;
    var loadingHideTimer = null;
    var LOADING_SHOW_DELAY = 140;
    var LOADING_MIN_VISIBLE = 220;
    var SYNC_RESET_THRESHOLD = 0.012;
    var SYNC_SOFT_THRESHOLD = 0.04;
    var SYNC_HARD_THRESHOLD = 0.22;
    var SYNC_MAX_RATE_OFFSET = 0.08;
    var SYNC_HARD_RESYNC_COOLDOWN = 220;
    var userPaused = false;
    var isScrubbing = false;
    var resumeAfterScrub = false;
    var lastHardSyncAt = 0;

    if (!frame || !wrapper || !controls || !overlay || !divider || !leftVideo || !rightVideo || !leftSource || !rightSource || !leftLabel || !rightLabel || !leftGaussianMetric || !leftFpsMetric || !leftTrainMetric || !rightGaussianMetric || !rightFpsMetric || !rightTrainMetric || !playToggle || !progressInput || !fullscreenToggle) {
      return null;
    }
    compareInteraction = attachCompareInteraction(wrapper, overlay, divider);
    if (!compareInteraction) {
      return null;
    }

    function isVideoReady(videoElement) {
      return !!videoElement && !!videoElement.currentSrc && videoElement.readyState >= 1;
    }

    function isFrameFullscreen() {
      return document.fullscreenElement === frame || document.webkitFullscreenElement === frame;
    }

    function isPlaybackPaused() {
      return userPaused || leftVideo.paused || rightVideo.paused;
    }

    function getActiveDuration() {
      return leftVideo.duration || rightVideo.duration || 0;
    }

    function getActiveCurrentTime() {
      return leftVideo.currentTime || rightVideo.currentTime || 0;
    }

    function getFrameReservedHeight() {
      var reserved = 0;

      Array.prototype.forEach.call(frame.children, function(child) {
        var childStyle;

        if (child === wrapper) {
          return;
        }

        childStyle = window.getComputedStyle(child);
        reserved += child.offsetHeight;
        reserved += (parseFloat(childStyle.marginTop) || 0) + (parseFloat(childStyle.marginBottom) || 0);
      });

      return reserved;
    }

    function updatePlayToggleState() {
      var paused = isPlaybackPaused();
      var label = paused ? 'Play comparison videos' : 'Pause comparison videos';

      playToggle.classList.toggle('is-paused', paused);
      playToggle.setAttribute('aria-label', label);
      playToggle.setAttribute('aria-pressed', paused ? 'true' : 'false');
      if (playToggleText) {
        playToggleText.textContent = label;
      }
    }

    function updateFullscreenToggleState() {
      var fullscreenActive = isFrameFullscreen();
      var label = fullscreenActive ? 'Exit fullscreen' : 'Enter fullscreen';

      frame.classList.toggle('is-card-fullscreen', fullscreenActive);
      fullscreenToggle.classList.toggle('is-fullscreen', fullscreenActive);
      fullscreenToggle.setAttribute('aria-label', label);
      if (fullscreenToggleText) {
        fullscreenToggleText.textContent = label;
      }
    }

    function updateProgressState() {
      var duration = getActiveDuration();
      var currentTime = Math.min(getActiveCurrentTime(), duration || 0);
      var value = duration > 0 ? Math.round((currentTime / duration) * 1000) : 0;
      var percentage = duration > 0 ? ((currentTime / duration) * 100).toFixed(3) + '%' : '0%';

      progressInput.value = String(value);
      progressInput.style.setProperty('--compare-progress-percent', percentage);
      progressInput.disabled = duration <= 0;
    }

    function syncControlState() {
      updatePlayToggleState();
      updateFullscreenToggleState();
      if (!isScrubbing) {
        updateProgressState();
      }
    }

    function getBasePlaybackRate() {
      return leftVideo.playbackRate || 1;
    }

    function setPlaybackRate(videoElement, nextRate) {
      var safeRate = Math.max(0.85, Math.min(1.15, nextRate || 1));

      if (Math.abs((videoElement.playbackRate || 1) - safeRate) < 0.001) {
        return;
      }

      videoElement.playbackRate = safeRate;
    }

    function resetRightPlaybackRate() {
      setPlaybackRate(rightVideo, getBasePlaybackRate());
    }

    function hardSyncRightVideo() {
      lastHardSyncAt = Date.now();

      try {
        rightVideo.currentTime = leftVideo.currentTime;
      } catch (error) {}

      resetRightPlaybackRate();
    }

    function syncVideos() {
      var drift;
      var absoluteDrift;
      var baseRate;
      var rateOffset;

      if (isScrubbing || leftVideo.seeking || rightVideo.seeking) {
        return;
      }

      if (leftVideo.paused || rightVideo.paused) {
        resetRightPlaybackRate();
        return;
      }

      if (leftVideo.readyState < 2 || rightVideo.readyState < 2) {
        return;
      }

      drift = leftVideo.currentTime - rightVideo.currentTime;
      absoluteDrift = Math.abs(drift);
      baseRate = getBasePlaybackRate();

      if (absoluteDrift >= SYNC_HARD_THRESHOLD) {
        if (Date.now() - lastHardSyncAt > SYNC_HARD_RESYNC_COOLDOWN) {
          hardSyncRightVideo();
        }
        return;
      }

      if (absoluteDrift <= SYNC_RESET_THRESHOLD) {
        resetRightPlaybackRate();
        return;
      }

      if (absoluteDrift >= SYNC_SOFT_THRESHOLD) {
        rateOffset = Math.max(-SYNC_MAX_RATE_OFFSET, Math.min(SYNC_MAX_RATE_OFFSET, drift * 0.45));
        setPlaybackRate(rightVideo, baseRate + rateOffset);
        return;
      }

      rateOffset = drift > 0 ? 0.015 : -0.015;
      setPlaybackRate(rightVideo, baseRate + rateOffset);
    }

    function pauseBothVideos() {
      leftVideo.pause();
      rightVideo.pause();
      resetRightPlaybackRate();
      syncControlState();
    }

    function playBothVideos() {
      resetRightPlaybackRate();
      playVideo(leftVideo);
      playVideo(rightVideo);
      syncControlState();
    }

    function applyPlaybackState() {
      if (userPaused || !shouldPlayShowcaseMedia()) {
        pauseBothVideos();
        return;
      }

      playBothVideos();
    }

    function seekToProgress(progressValue) {
      var duration = getActiveDuration();
      var clampedValue;
      var nextTime;

      if (!(duration > 0)) {
        updateProgressState();
        return;
      }

      clampedValue = Math.max(0, Math.min(1000, progressValue));
      nextTime = (clampedValue / 1000) * duration;

      try {
        leftVideo.currentTime = nextTime;
      } catch (error) {}

      try {
        rightVideo.currentTime = nextTime;
      } catch (error) {}

      resetRightPlaybackRate();

      progressInput.value = String(Math.round(clampedValue));
      progressInput.style.setProperty('--compare-progress-percent', ((clampedValue / 1000) * 100).toFixed(3) + '%');
    }

    function beginScrub() {
      if (isScrubbing) {
        return;
      }

      isScrubbing = true;
      resumeAfterScrub = !userPaused && !leftVideo.paused && !rightVideo.paused;
      if (resumeAfterScrub) {
        leftVideo.pause();
        rightVideo.pause();
      }
      syncControlState();
    }

    function endScrub() {
      if (!isScrubbing) {
        return;
      }

      isScrubbing = false;

      if (resumeAfterScrub && !userPaused && shouldPlayShowcaseMedia()) {
        playBothVideos();
      }

      resumeAfterScrub = false;
      syncControlState();
    }

    function requestCardFullscreen() {
      if (frame.requestFullscreen) {
        return frame.requestFullscreen();
      }

      if (frame.webkitRequestFullscreen) {
        return frame.webkitRequestFullscreen();
      }

      return null;
    }

    function exitCardFullscreen() {
      if (document.fullscreenElement && document.exitFullscreen) {
        return document.exitFullscreen();
      }

      if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
        return document.webkitExitFullscreen();
      }

      return null;
    }

    function clearLoadingTimers() {
      if (loadingShowTimer) {
        window.clearTimeout(loadingShowTimer);
        loadingShowTimer = null;
      }

      if (loadingHideTimer) {
        window.clearTimeout(loadingHideTimer);
        loadingHideTimer = null;
      }
    }

    function revealLoadingOverlay() {
      if (wrapper.classList.contains('is-video-loading-visible')) {
        return;
      }

      loadingVisibleSince = Date.now();
      wrapper.classList.add('is-video-loading-visible');
      if (loadingOverlay) {
        loadingOverlay.setAttribute('aria-hidden', 'false');
      }
    }

    function setLoadingState(isLoading) {
      clearLoadingTimers();

      if (isLoading) {
        wrapper.classList.add('is-video-loading');

        if (!wrapper.classList.contains('is-video-loading-visible')) {
          loadingShowTimer = window.setTimeout(function() {
            loadingShowTimer = null;
            if (wrapper.classList.contains('is-video-loading')) {
              revealLoadingOverlay();
            }
          }, LOADING_SHOW_DELAY);
        }

        return;
      }

      wrapper.classList.remove('is-video-loading');

      if (!wrapper.classList.contains('is-video-loading-visible')) {
        if (loadingOverlay) {
          loadingOverlay.setAttribute('aria-hidden', 'true');
        }
        return;
      }

      loadingHideTimer = window.setTimeout(function() {
        loadingHideTimer = null;
        wrapper.classList.remove('is-video-loading-visible');
        if (loadingOverlay) {
          loadingOverlay.setAttribute('aria-hidden', 'true');
        }
      }, Math.max(0, LOADING_MIN_VISIBLE - (Date.now() - loadingVisibleSince)));
    }

    function syncLoadingState() {
      setLoadingState(!(isVideoReady(leftVideo) && isVideoReady(rightVideo)));
    }

    function getPosterPath(videoPath) {
      if (!videoPath) {
        return '';
      }

      return videoPath
        .replace(/_pingpong\.mp4$/i, '.jpg')
        .replace(/\.mp4$/i, '.jpg');
    }

    function getVideoRatio() {
      if (leftVideo.videoWidth && leftVideo.videoHeight) {
        return leftVideo.videoWidth / leftVideo.videoHeight;
      }

      if (rightVideo.videoWidth && rightVideo.videoHeight) {
        return rightVideo.videoWidth / rightVideo.videoHeight;
      }

      return lastKnownRatio;
    }

    function getContentWidth(element) {
      var style;
      var paddingLeft;
      var paddingRight;

      if (!element) {
        return 0;
      }

      style = window.getComputedStyle(element);
      paddingLeft = parseFloat(style.paddingLeft) || 0;
      paddingRight = parseFloat(style.paddingRight) || 0;

      return Math.max(0, element.clientWidth - paddingLeft - paddingRight);
    }

    function updateWrapperSize() {
      var frame = wrapper.parentElement;
      var frameStyle = window.getComputedStyle(frame);
      var availableWidth = getContentWidth(frame) || card.clientWidth;
      var isMobile = window.innerWidth <= 768;
      var fullscreenActive = isFrameFullscreen();
      var minWidth = Math.min(availableWidth, isMobile ? 265 : 360);
      var minHeight = isMobile ? 180 : 250;
      var maxHeight = isMobile ? 290 : 450;
      var paddingTop = parseFloat(frameStyle.paddingTop) || 0;
      var paddingBottom = parseFloat(frameStyle.paddingBottom) || 0;
      var availableHeight = 0;
      var ratio = getVideoRatio();
      var width;
      var height;

      if (!availableWidth) {
        return;
      }

      lastKnownRatio = ratio;
      if (fullscreenActive) {
        availableHeight = Math.max(220, window.innerHeight - getFrameReservedHeight() - paddingTop - paddingBottom - 24);
        maxHeight = availableHeight;
        minHeight = Math.min(maxHeight, isMobile ? 210 : 300);
      }

      width = availableWidth;
      height = width / ratio;

      if (height > maxHeight) {
        height = maxHeight;
        width = height * ratio;
      }

      if (width < minWidth) {
        width = minWidth;
        height = width / ratio;
      }

      if (height < minHeight) {
        height = minHeight;
        width = height * ratio;
      }

      if (width > availableWidth) {
        width = availableWidth;
        height = width / ratio;
      }

      wrapper.style.width = width.toFixed(2) + 'px';
      wrapper.style.height = height.toFixed(2) + 'px';
      controls.style.width = width.toFixed(2) + 'px';
    }

    function scheduleWrapperSize() {
      if (layoutFrame) {
        window.cancelAnimationFrame(layoutFrame);
      }

      layoutFrame = window.requestAnimationFrame(function() {
        layoutFrame = null;
        updateWrapperSize();
      });
    }

    function ensureVideoSource(videoElement, sourceElement, nextVideoPath) {
      var currentSource;

      if (!nextVideoPath) {
        return;
      }

      currentSource = sourceElement.getAttribute('src');
      if (currentSource === nextVideoPath) {
        if (videoElement.readyState < 1 && videoElement.networkState === 0) {
          videoElement.load();
        }
        return videoElement.readyState < 1;
      }

      videoElement.setAttribute('preload', 'metadata');
      sourceElement.setAttribute('src', nextVideoPath);
      sourceElement.setAttribute('data-src', nextVideoPath);
      videoElement.load();
      return true;
    }

    function setMetricBlock(sceneKey, methodKey, labelElement, gaussianElement, fpsElement, trainElement, fallbackLabel) {
      var metrics = getCompareMetrics(sceneKey, methodKey);

      if (!metrics) {
        setCompareMetricLine(gaussianElement, null);
        setCompareMetricLine(fpsElement, null);
        setCompareMetricLine(trainElement, null);
        return;
      }

      setCompareMetricLine(gaussianElement, formatCompareGaussianMetric(metrics.gaussianCount));
      setCompareMetricLine(fpsElement, formatCompareFpsMetric(metrics.fps));
      setCompareMetricLine(trainElement, formatCompareTrainTimeMetric(metrics.trainTimeSec));
    }

    function setContent(content) {
      var sceneKey = content.sceneKey || '';
      var nextLeftVideo = content.leftVideo || '';
      var nextRightVideo = content.rightVideo || nextLeftVideo;
      var resolvedLeftLabel = content.leftLabel || 'Ours';
      var resolvedRightLabel = content.rightLabel || 'Method B';
      var leftMetricMethod = content.leftMetricMethod || 'ours';
      var rightMetricMethod = content.rightMetricMethod || 'gaussian_splatting';
      var nextAspectRatio = content.aspectRatio;

      if (nextAspectRatio > 0) {
        lastKnownRatio = nextAspectRatio;
        wrapper.style.setProperty('--scene-compare-aspect-ratio', String(nextAspectRatio));
      }

      leftLabel.textContent = resolvedLeftLabel;
      rightLabel.textContent = resolvedRightLabel;
      setMetricBlock(sceneKey, leftMetricMethod, leftLabel, leftGaussianMetric, leftFpsMetric, leftTrainMetric, resolvedLeftLabel);
      setMetricBlock(sceneKey, rightMetricMethod, rightLabel, rightGaussianMetric, rightFpsMetric, rightTrainMetric, resolvedRightLabel);
      if (compareCaption) {
        compareCaption.textContent = resolvedLeftLabel + ' vs. ' + resolvedRightLabel;
      }

      setLoadingState(true);
      leftVideo.setAttribute('poster', getPosterPath(nextLeftVideo));
      rightVideo.setAttribute('poster', getPosterPath(nextRightVideo));

      compareInteraction.setComparePosition(0.5);

      ensureVideoSource(leftVideo, leftSource, nextLeftVideo);
      ensureVideoSource(rightVideo, rightSource, nextRightVideo);

      try {
        leftVideo.currentTime = 0;
        rightVideo.currentTime = 0;
      } catch (error) {}

      resetRightPlaybackRate();
      updateProgressState();
      applyPlaybackState();
      scheduleWrapperSize();
      syncLoadingState();
      syncControlState();
    }

    leftVideo.addEventListener('play', function() {
      hardSyncRightVideo();
      playVideo(rightVideo);
    });

    leftVideo.addEventListener('pause', function() {
      resetRightPlaybackRate();
      rightVideo.pause();
    });

    leftVideo.addEventListener('seeking', function() {
      hardSyncRightVideo();
    });

    leftVideo.addEventListener('timeupdate', syncVideos);
    leftVideo.addEventListener('ratechange', function() {
      resetRightPlaybackRate();
    });
    leftVideo.addEventListener('seeked', syncVideos);
    rightVideo.addEventListener('seeked', syncVideos);
    rightVideo.addEventListener('timeupdate', syncVideos);
    rightVideo.addEventListener('waiting', syncVideos);
    rightVideo.addEventListener('stalled', syncVideos);
    rightVideo.addEventListener('canplay', syncVideos);
    leftVideo.addEventListener('play', syncControlState);
    rightVideo.addEventListener('play', syncControlState);
    leftVideo.addEventListener('pause', syncControlState);
    rightVideo.addEventListener('pause', syncControlState);
    leftVideo.addEventListener('timeupdate', function() {
      if (!isScrubbing) {
        updateProgressState();
      }
    });
    leftVideo.addEventListener('durationchange', updateProgressState);
    rightVideo.addEventListener('durationchange', updateProgressState);
    progressInput.addEventListener('pointerdown', beginScrub);
    progressInput.addEventListener('pointerup', endScrub);
    progressInput.addEventListener('pointercancel', endScrub);
    progressInput.addEventListener('change', endScrub);
    progressInput.addEventListener('blur', endScrub);
    progressInput.addEventListener('input', function() {
      if (!isScrubbing) {
        beginScrub();
      }
      seekToProgress(parseFloat(progressInput.value) || 0);
    });
    playToggle.addEventListener('click', function() {
      if (isPlaybackPaused()) {
        userPaused = false;
        applyPlaybackState();
      } else {
        userPaused = true;
        pauseBothVideos();
      }
    });
    fullscreenToggle.addEventListener('click', function() {
      if (isFrameFullscreen()) {
        exitCardFullscreen();
      } else {
        requestCardFullscreen();
      }
    });
    document.addEventListener('fullscreenchange', function() {
      syncControlState();
      scheduleWrapperSize();
    });
    document.addEventListener('webkitfullscreenchange', function() {
      syncControlState();
      scheduleWrapperSize();
    });

    [leftVideo, rightVideo].forEach(function(videoElement) {
      videoElement.addEventListener('loadstart', function() {
        setLoadingState(true);
      });
      videoElement.addEventListener('emptied', function() {
        setLoadingState(true);
      });
      videoElement.addEventListener('loadedmetadata', syncLoadingState);
      videoElement.addEventListener('loadeddata', syncLoadingState);
      videoElement.addEventListener('canplay', syncLoadingState);
      videoElement.addEventListener('playing', syncLoadingState);
      videoElement.addEventListener('error', function() {
        setLoadingState(false);
      });
    });

    leftVideo.addEventListener('loadedmetadata', scheduleWrapperSize);
    rightVideo.addEventListener('loadedmetadata', scheduleWrapperSize);
    window.addEventListener('resize', scheduleWrapperSize);
    syncLoadingState();
    scheduleWrapperSize();
    syncControlState();

    return {
      setContent: setContent,
      play: function(forceUser) {
        if (forceUser) {
          userPaused = false;
        }
        applyPlaybackState();
      },
      pause: function(forceUser) {
        if (forceUser) {
          userPaused = true;
        }
        pauseBothVideos();
      }
    };
  }

  var compareCards = Array.prototype.map.call(
    showcase.querySelectorAll('[data-compare-card]'),
    createCompareCard
  ).filter(function(item) {
    return !!item;
  });

  if (!compareCards.length) {
    return;
  }

  Array.prototype.forEach.call(
    showcase.querySelectorAll('.scene-selector__preview video'),
    freezePreviewVideo
  );

  function syncShowcasePlayback() {
    compareCards.forEach(function(compareCard) {
      if (shouldPlayShowcaseMedia()) {
        compareCard.play();
      } else {
        compareCard.pause();
      }
    });
  }

  function activateScene(button, force) {
    if (!button || (!force && button === activeButton)) {
      return;
    }

    var sceneKey = button.getAttribute('data-scene-key') || '';
    var nextLabel = button.getAttribute('data-label');
    var nextAspectRatio = parseFloat(button.getAttribute('data-aspect-ratio')) || 0;
    var compareConfigs = [
      {
        sceneKey: sceneKey,
        aspectRatio: nextAspectRatio,
        leftVideo: button.getAttribute('data-left-video-1'),
        rightVideo: button.getAttribute('data-right-video-1'),
        leftLabel: button.getAttribute('data-left-label-1'),
        rightLabel: button.getAttribute('data-right-label-1'),
        leftMetricMethod: 'ours',
        rightMetricMethod: 'gaussian_splatting'
      },
      {
        sceneKey: sceneKey,
        aspectRatio: nextAspectRatio,
        leftVideo: button.getAttribute('data-left-video-2') || button.getAttribute('data-left-video-1'),
        rightVideo: button.getAttribute('data-right-video-2') || button.getAttribute('data-right-video-1') || button.getAttribute('data-left-video-2') || button.getAttribute('data-left-video-1'),
        leftLabel: button.getAttribute('data-left-label-2') || button.getAttribute('data-left-label-1'),
        rightLabel: button.getAttribute('data-right-label-2') || button.getAttribute('data-right-label-1'),
        leftMetricMethod: 'ours',
        rightMetricMethod: 'speedy_splat'
      }
    ];

    activeButton = button;

    Array.prototype.forEach.call(buttons, function(item) {
      var isActive = item === button;
      item.classList.toggle('is-active', isActive);
      item.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    if (caption) {
      caption.textContent = nextLabel;
    }

    preloadSceneVideos(button, true);
    compareCards.forEach(function(compareCard, index) {
      compareCard.setContent(compareConfigs[index] || compareConfigs[0]);
    });
  }

  function moveFocus(currentButton, direction) {
    var buttonList = Array.prototype.slice.call(buttons);
    var currentIndex = buttonList.indexOf(currentButton);
    var nextIndex = (currentIndex + direction + buttonList.length) % buttonList.length;
    buttonList[nextIndex].focus();
    activateScene(buttonList[nextIndex]);
  }

  Array.prototype.forEach.call(buttons, function(button, index) {
    button.addEventListener('click', function() {
      activateScene(button);
    });

    button.addEventListener('pointerenter', function() {
      preloadSceneVideos(button, true);
    });

    button.addEventListener('focusin', function() {
      preloadSceneVideos(button, true);
    });

    button.addEventListener('keydown', function(event) {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        moveFocus(button, 1);
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        moveFocus(button, -1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        buttons[0].focus();
        activateScene(buttons[0]);
      } else if (event.key === 'End') {
        event.preventDefault();
        buttons[buttons.length - 1].focus();
        activateScene(buttons[buttons.length - 1]);
      } else if ((event.key === 'Enter' || event.key === ' ') && buttons[index]) {
        event.preventDefault();
        activateScene(button);
      }
    });
  });

  activeButton = showcase.querySelector('.scene-selector__item.is-active') || buttons[0];
  preloadSceneVideos(activeButton, true);
  activateScene(activeButton, true);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        showcaseViewportActive = entry.isIntersecting && entry.intersectionRatio > 0.14;
        syncShowcasePlayback();
      });
    }, {
      threshold: [0, 0.14, 0.35]
    }).observe(showcase);
  }

  document.addEventListener('visibilitychange', function() {
    showcasePageVisible = !document.hidden;
    syncShowcasePlayback();
  });
}

function initImageComparisons() {
  var section = document.querySelector('[data-visual-comparisons]');
  if (!section) {
    return;
  }

  var activeButton;
  var preloadedImages = Object.create(null);
  var backgroundImagePreloadStarted = false;

  function createImageCompareCard(card) {
    var headerInner = card.querySelector('.visual-compare-header__inner');
    var wrapper = card.querySelector('.scene-compare-wrapper');
    var overlay = card.querySelector('[data-compare-overlay]');
    var divider = card.querySelector('[data-compare-handle]');
    var leftImage = card.querySelector('[data-compare-image-left]');
    var rightImage = card.querySelector('[data-compare-image-right]');
    var leftLabel = card.querySelector('[data-compare-left-label]');
    var rightLabel = card.querySelector('[data-compare-right-label]');
    var baselineChip = card.querySelector('[data-compare-baseline-chip]');
    var selectorValue = card.querySelector('[data-compare-method-value]');
    var prevMethodButton = card.querySelector('[data-compare-method-prev]');
    var nextMethodButton = card.querySelector('[data-compare-method-next]');
    var compareInteraction;
    var layoutFrame = null;
    var lastKnownRatio = 16 / 9;
    var activeMethodIndex = 0;
    var latestContent = null;
    var switchTextTimer = null;

    if (!wrapper || !overlay || !divider || !leftImage || !rightImage || !leftLabel || !rightLabel) {
      return null;
    }

    compareInteraction = attachCompareInteraction(wrapper, overlay, divider);
    if (!compareInteraction) {
      return null;
    }

    function getImageRatio() {
      if (leftImage.naturalWidth && leftImage.naturalHeight) {
        return leftImage.naturalWidth / leftImage.naturalHeight;
      }

      if (rightImage.naturalWidth && rightImage.naturalHeight) {
        return rightImage.naturalWidth / rightImage.naturalHeight;
      }

      return lastKnownRatio;
    }

    function updateWrapperSize() {
      var availableWidth = card.clientWidth;
      var ratio = getImageRatio();
      var height;
      var isMobile = window.innerWidth <= 768;
      var minWidth = Math.min(availableWidth, isMobile ? 265 : 360);
      var minHeight = isMobile ? 180 : 250;
      var maxHeight = isMobile ? 290 : 450;
      var width;

      if (!availableWidth || !ratio) {
        return;
      }

      lastKnownRatio = ratio;
      width = availableWidth;
      height = width / ratio;

      if (height > maxHeight) {
        height = maxHeight;
        width = height * ratio;
      }

      if (width < minWidth) {
        width = minWidth;
        height = width / ratio;
      }

      if (height < minHeight) {
        height = minHeight;
        width = height * ratio;
      }

      if (width > availableWidth) {
        width = availableWidth;
        height = width / ratio;
      }

      if (headerInner) {
        headerInner.style.width = Math.round(width) + 'px';
      }

      wrapper.style.width = Math.round(width) + 'px';
      wrapper.style.height = Math.round(height) + 'px';
    }

    function scheduleWrapperSize() {
      if (layoutFrame) {
        window.cancelAnimationFrame(layoutFrame);
      }

      layoutFrame = window.requestAnimationFrame(function() {
        layoutFrame = null;
        updateWrapperSize();
      });
    }

    function getEnabledMethodIndexes(methodOptions) {
      return methodOptions.reduce(function(enabledIndexes, option, index) {
        if (option && !option.disabled) {
          enabledIndexes.push(index);
        }

        return enabledIndexes;
      }, []);
    }

    function resolveActiveMethodIndex(methodOptions) {
      var enabledMethodIndexes = getEnabledMethodIndexes(methodOptions);
      var firstEnabledIndex;

      if (!enabledMethodIndexes.length) {
        return 0;
      }

      if (enabledMethodIndexes.indexOf(activeMethodIndex) !== -1) {
        return activeMethodIndex;
      }

      firstEnabledIndex = enabledMethodIndexes[0];
      return firstEnabledIndex;
    }

    function animateMethodText(nextLabel) {
      var animatedNodes = [baselineChip, selectorValue].filter(function(node) {
        return !!node;
      });

      if (!animatedNodes.length) {
        return;
      }

      if (switchTextTimer) {
        window.clearTimeout(switchTextTimer);
        switchTextTimer = null;
      }

      if (animatedNodes.every(function(node) {
        return node.innerHTML === nextLabel;
      })) {
        return;
      }

      card.classList.add('is-method-switching');
      animatedNodes.forEach(function(node) {
        node.classList.add('is-updating');
      });

      switchTextTimer = window.setTimeout(function() {
        animatedNodes.forEach(function(node) {
          node.innerHTML = nextLabel;
        });

        window.requestAnimationFrame(function() {
          card.classList.remove('is-method-switching');
          animatedNodes.forEach(function(node) {
            node.classList.remove('is-updating');
          });
        });
      }, 120);
    }

    function setMethodSwitcher(methodOptions) {
      var enabledMethodIndexes = getEnabledMethodIndexes(methodOptions);
      var currentOption = methodOptions[activeMethodIndex];
      var currentLabel = currentOption ? currentOption.rightLabel || 'Method' : 'Method';
      var displayLabel = 'Ours <span class=\"visual-compare-selector__vs\">vs</span> ' + currentLabel;
      var hasMultipleOptions = enabledMethodIndexes.length > 1;

      animateMethodText(displayLabel);

      if (prevMethodButton) {
        prevMethodButton.disabled = !hasMultipleOptions;
      }

      if (nextMethodButton) {
        nextMethodButton.disabled = !hasMultipleOptions;
      }
    }

    function cycleMethod(methodOptions, direction) {
      var enabledMethodIndexes = getEnabledMethodIndexes(methodOptions);
      var currentEnabledIndex;
      var nextEnabledIndex;

      if (enabledMethodIndexes.length <= 1) {
        return;
      }

      currentEnabledIndex = enabledMethodIndexes.indexOf(activeMethodIndex);
      if (currentEnabledIndex === -1) {
        currentEnabledIndex = 0;
      }

      nextEnabledIndex = (currentEnabledIndex + direction + enabledMethodIndexes.length) % enabledMethodIndexes.length;
      activeMethodIndex = enabledMethodIndexes[nextEnabledIndex];
      setMethodSwitcher(methodOptions);
      applyResolvedContent(methodOptions[activeMethodIndex]);
    }

    function applyResolvedContent(content) {
      var nextLeftImage = content.leftImage || '';
      var nextRightImage = content.rightImage || nextLeftImage;
      var resolvedLeftLabel = content.leftLabel || 'Ours';
      var resolvedRightLabel = content.rightLabel || 'Method B';

      leftLabel.textContent = resolvedLeftLabel;
      rightLabel.textContent = resolvedRightLabel;

      if (nextLeftImage) {
        leftImage.setAttribute('src', nextLeftImage);
      }

      if (nextRightImage) {
        rightImage.setAttribute('src', nextRightImage);
      }

      leftImage.setAttribute('alt', resolvedLeftLabel + ' qualitative comparison image.');
      rightImage.setAttribute('alt', resolvedRightLabel + ' qualitative comparison image.');

      compareInteraction.setComparePosition(0.5);
      scheduleWrapperSize();
    }

    function setContent(content) {
      var methodOptions = content.methodOptions || [];
      var resolvedContent = content;

      latestContent = content;

      if (methodOptions.length && (baselineChip || selectorValue || prevMethodButton || nextMethodButton)) {
        activeMethodIndex = resolveActiveMethodIndex(methodOptions);
        setMethodSwitcher(methodOptions);
        resolvedContent = methodOptions[activeMethodIndex];
      }

      applyResolvedContent(resolvedContent);
    }

    leftImage.addEventListener('load', scheduleWrapperSize);
    rightImage.addEventListener('load', scheduleWrapperSize);
    window.addEventListener('resize', scheduleWrapperSize);
    scheduleWrapperSize();

    if (prevMethodButton) {
      prevMethodButton.addEventListener('click', function() {
        if (!latestContent || !latestContent.methodOptions) {
          return;
        }

        cycleMethod(latestContent.methodOptions, -1);
      });
    }

    if (nextMethodButton) {
      nextMethodButton.addEventListener('click', function() {
        if (!latestContent || !latestContent.methodOptions) {
          return;
        }

        cycleMethod(latestContent.methodOptions, 1);
      });
    }

    return {
      setContent: setContent
    };
  }

  var imageCards = Array.prototype.map.call(
    section.querySelectorAll('[data-image-compare-card]'),
    createImageCompareCard
  ).filter(function(item) {
    return !!item;
  });
  var buttons = section.querySelectorAll('.scene-selector__item');
  var sceneSelector = section.querySelector('.visual-scene-selector');
  var sceneSelectorShell = section.querySelector('.visual-scene-selector-shell');
  var prevScenePageButton = section.querySelector('[data-visual-scenes-prev]');
  var nextScenePageButton = section.querySelector('[data-visual-scenes-next]');
  var sceneSelectorLayoutFrame = null;
  var currentScenePage = 0;
  var maxScenePage = 0;

  if (!imageCards.length) {
    return;
  }

  if (!buttons.length) {
    return;
  }

  function getSceneSelectorPageSize() {
    return window.innerWidth <= 768 ? 3 : 6;
  }

  function updateSceneSelectorButtons() {
    var isSinglePage = maxScenePage === 0;

    if (sceneSelectorShell) {
      sceneSelectorShell.classList.toggle('is-single-page', isSinglePage);
    }

    if (prevScenePageButton) {
      prevScenePageButton.disabled = isSinglePage || currentScenePage <= 0;
    }

    if (nextScenePageButton) {
      nextScenePageButton.disabled = isSinglePage || currentScenePage >= maxScenePage;
    }
  }

  function applySceneSelectorPage() {
    var pageSize;
    var firstButtonOnPage;
    var targetOffset;

    if (!sceneSelector) {
      return;
    }

    pageSize = getSceneSelectorPageSize();
    firstButtonOnPage = buttons[currentScenePage * pageSize];
    targetOffset = firstButtonOnPage ? firstButtonOnPage.offsetLeft : 0;
    sceneSelector.style.transform = 'translate3d(' + (-targetOffset) + 'px, 0, 0)';
    updateSceneSelectorButtons();
  }

  function syncSceneSelectorPageToButton(button) {
    var buttonList = Array.prototype.slice.call(buttons);
    var buttonIndex = buttonList.indexOf(button);
    var pageSize = getSceneSelectorPageSize();

    if (buttonIndex === -1) {
      return;
    }

    currentScenePage = Math.floor(buttonIndex / pageSize);
    applySceneSelectorPage();
  }

  function scheduleSceneSelectorLayout(syncToActiveButton) {
    if (!sceneSelector) {
      return;
    }

    if (sceneSelectorLayoutFrame) {
      window.cancelAnimationFrame(sceneSelectorLayoutFrame);
    }

    sceneSelectorLayoutFrame = window.requestAnimationFrame(function() {
      var pageSize = getSceneSelectorPageSize();

      sceneSelectorLayoutFrame = null;
      maxScenePage = Math.max(0, Math.ceil(buttons.length / pageSize) - 1);
      currentScenePage = Math.min(currentScenePage, maxScenePage);

      if (syncToActiveButton && activeButton) {
        syncSceneSelectorPageToButton(activeButton);
        return;
      }

      applySceneSelectorPage();
    });
  }

  function collectSceneImagePaths(button) {
    var seen = Object.create(null);
    var uniquePaths = [];

    [1, 2, 3, 4, 5].forEach(function(slot) {
      [
        button.getAttribute('data-left-image-' + slot),
        button.getAttribute('data-right-image-' + slot)
      ].forEach(function(path) {
        if (!path || seen[path]) {
          return;
        }

        seen[path] = true;
        uniquePaths.push(path);
      });
    });

    return uniquePaths;
  }

  function preloadImagePath(imagePath) {
    var image;

    if (!imagePath || preloadedImages[imagePath]) {
      return;
    }

    image = new Image();
    image.decoding = 'async';
    image.src = imagePath;
    preloadedImages[imagePath] = image;
  }

  function preloadSceneImages(button) {
    if (!button) {
      return;
    }

    collectSceneImagePaths(button).forEach(preloadImagePath);
  }

  function preloadRemainingImages() {
    var remainingButtons;

    if (backgroundImagePreloadStarted) {
      return;
    }

    backgroundImagePreloadStarted = true;
    remainingButtons = Array.prototype.filter.call(buttons, function(button) {
      return button !== activeButton;
    });

    remainingButtons.forEach(function(button, index) {
      window.setTimeout(function() {
        preloadSceneImages(button);
      }, 420 + (index * 360));
    });
  }

  function activateScene(button, force) {
    if (!button || (!force && button === activeButton)) {
      return;
    }

    function buildSelectableMethodOption(slot, fallbackLabel) {
      var leftImage = button.getAttribute('data-left-image-' + slot) ||
        button.getAttribute('data-left-image-2') ||
        button.getAttribute('data-left-image-1');
      var rightImage = button.getAttribute('data-right-image-' + slot) ||
        button.getAttribute('data-right-image-2') ||
        button.getAttribute('data-right-image-1');
      var leftLabel = button.getAttribute('data-left-label-' + slot) ||
        button.getAttribute('data-left-label-2') ||
        button.getAttribute('data-left-label-1');
      var rightLabel = button.getAttribute('data-right-label-' + slot) || fallbackLabel;

      return {
        leftImage: leftImage,
        rightImage: rightImage,
        leftLabel: leftLabel,
        rightLabel: rightLabel
      };
    }

    var compareConfigs = [
      {
        leftImage: button.getAttribute('data-left-image-1'),
        rightImage: button.getAttribute('data-right-image-1'),
        leftLabel: button.getAttribute('data-left-label-1'),
        rightLabel: button.getAttribute('data-right-label-1')
      },
      {
        methodOptions: [
          buildSelectableMethodOption(2, button.getAttribute('data-right-label-2') || button.getAttribute('data-right-label-1') || 'SpeedySplat'),
          buildSelectableMethodOption(3, 'Compact-3DGS'),
          buildSelectableMethodOption(4, 'LightGaussian'),
          buildSelectableMethodOption(5, 'Scaffold-GS')
        ]
      }
    ];

    activeButton = button;

    Array.prototype.forEach.call(buttons, function(item) {
      var isActive = item === button;
      item.classList.toggle('is-active', isActive);
      item.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    syncSceneSelectorPageToButton(button);
    preloadSceneImages(button);
    imageCards.forEach(function(compareCard, index) {
      compareCard.setContent(compareConfigs[index] || compareConfigs[0]);
    });
  }

  function moveFocus(currentButton, direction) {
    var buttonList = Array.prototype.slice.call(buttons);
    var currentIndex = buttonList.indexOf(currentButton);
    var nextIndex = (currentIndex + direction + buttonList.length) % buttonList.length;
    buttonList[nextIndex].focus();
    activateScene(buttonList[nextIndex]);
  }

  Array.prototype.forEach.call(buttons, function(button, index) {
    button.addEventListener('click', function() {
      activateScene(button);
    });

    button.addEventListener('pointerenter', function() {
      preloadSceneImages(button);
    });

    button.addEventListener('focusin', function() {
      preloadSceneImages(button);
    });

    button.addEventListener('keydown', function(event) {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        moveFocus(button, 1);
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        moveFocus(button, -1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        buttons[0].focus();
        activateScene(buttons[0]);
      } else if (event.key === 'End') {
        event.preventDefault();
        buttons[buttons.length - 1].focus();
        activateScene(buttons[buttons.length - 1]);
      } else if ((event.key === 'Enter' || event.key === ' ') && buttons[index]) {
        event.preventDefault();
        activateScene(button);
      }
    });
  });

  if (prevScenePageButton) {
    prevScenePageButton.addEventListener('click', function() {
      currentScenePage = Math.max(0, currentScenePage - 1);
      applySceneSelectorPage();
    });
  }

  if (nextScenePageButton) {
    nextScenePageButton.addEventListener('click', function() {
      currentScenePage = Math.min(maxScenePage, currentScenePage + 1);
      applySceneSelectorPage();
    });
  }

  window.addEventListener('resize', function() {
    scheduleSceneSelectorLayout(true);
  });

  activeButton = section.querySelector('.scene-selector__item.is-active') || buttons[0];
  preloadSceneImages(activeButton);
  activateScene(activeButton, true);
  scheduleSceneSelectorLayout(true);
  observeOnceNearViewport(section, function() {
    runWhenBrowserIsIdle(preloadRemainingImages, 700);
  }, '220px 0px');
}

function initViewportManagedInlineVideos() {
  var videos = document.querySelectorAll('.publication-video video');

  Array.prototype.forEach.call(videos, function(video) {
    var videoIsVisible = true;
    var shouldResumeWhenVisible = false;

    function shouldPauseVideo() {
      return document.hidden || !videoIsVisible;
    }

    function syncVideoPlayback() {
      if (shouldPauseVideo()) {
        if (!video.paused && !video.ended) {
          shouldResumeWhenVisible = true;
          video.pause();
        }
        return;
      }

      if (!shouldResumeWhenVisible) {
        return;
      }

      shouldResumeWhenVisible = false;
      video.play().catch(function() {
        shouldResumeWhenVisible = true;
      });
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          videoIsVisible = entry.isIntersecting && entry.intersectionRatio > 0.14;
          syncVideoPlayback();
        });
      }, {
        threshold: [0, 0.14, 0.35]
      }).observe(video);
    }

    document.addEventListener('visibilitychange', syncVideoPlayback);
    video.addEventListener('pause', function() {
      if (!shouldPauseVideo()) {
        shouldResumeWhenVisible = false;
      }
    });
  });
}

function initResultsGallery() {
  var gallery = document.querySelector('[data-results-gallery]');
  if (!gallery) {
    return;
  }

  var items = Array.prototype.slice.call(gallery.querySelectorAll('[data-results-item]'));
  var prevButton = gallery.querySelector('[data-results-prev]');
  var nextButton = gallery.querySelector('[data-results-next]');
  var viewport = gallery.querySelector('.results-selector__viewport');
  var displayRoot = gallery.querySelector('[data-results-display]');
  var displayViewport = gallery.querySelector('.results-display__viewport');
  var selectedIndex = 0;
  var visibleCount = 0;
  var hasRendered = false;
  var pendingDisplayDirection = 0;
  var displayLayoutFrame = 0;

  if (!items.length || !displayRoot || !displayViewport || !viewport) {
    return;
  }

  function getVisibleCount() {
    return Math.min(window.innerWidth <= 768 ? 3 : 5, items.length);
  }

  function clampSelectedIndex(index) {
    return Math.max(0, Math.min(items.length - 1, index));
  }

  function centerOnIndex(index, displayDirection) {
    selectedIndex = clampSelectedIndex(index);
    pendingDisplayDirection = displayDirection || 0;
    renderWindow();
  }

  function getWindowCenterIndex(frontRadius) {
    var minCenterIndex = Math.min(frontRadius, items.length - 1);
    var maxCenterIndex = Math.max(minCenterIndex, items.length - frontRadius - 1);

    return Math.max(minCenterIndex, Math.min(maxCenterIndex, selectedIndex));
  }

  function updateArrowState() {
    if (prevButton) {
      prevButton.disabled = selectedIndex <= 0;
      prevButton.setAttribute('aria-disabled', prevButton.disabled ? 'true' : 'false');
    }

    if (nextButton) {
      nextButton.disabled = selectedIndex >= items.length - 1;
      nextButton.setAttribute('aria-disabled', nextButton.disabled ? 'true' : 'false');
    }
  }

  function ensureTableFitWrapper(body) {
    var viewport = body.querySelector('.results-display__table-scroll');
    var fit = viewport ? viewport.querySelector('.results-display__table-fit') : null;
    var table;

    if (!viewport) {
      return null;
    }

    if (!fit) {
      table = viewport.querySelector('.results-table');
      if (!table) {
        return null;
      }

      fit = document.createElement('div');
      fit.className = 'results-display__table-fit';
      viewport.insertBefore(fit, table);
      fit.appendChild(table);
    }

    return fit;
  }

  function fitDisplayStage(stage) {
    Array.prototype.slice.call(stage ? stage.querySelectorAll('.results-display__body--table') : []).forEach(function(body) {
      var viewport = body.querySelector('.results-display__table-scroll');
      var fit = ensureTableFitWrapper(body);
      var naturalWidth;
      var naturalHeight;
      var availableWidth;
      var availableHeight;
      var scale;
      var safeGutter = 8;

      if (!viewport || !fit) {
        return;
      }

      fit.style.setProperty('--results-table-scale', '1');
      naturalWidth = fit.offsetWidth;
      naturalHeight = fit.offsetHeight;
      availableWidth = Math.max(0, viewport.clientWidth - safeGutter);
      availableHeight = Math.max(0, viewport.clientHeight - safeGutter);

      if (!naturalWidth || !naturalHeight || !availableWidth || !availableHeight) {
        return;
      }

      scale = Math.min(availableWidth / naturalWidth, availableHeight / naturalHeight, 1);
      fit.style.setProperty('--results-table-scale', scale.toFixed(4));
    });
  }

  function scheduleDisplayLayout() {
    if (displayLayoutFrame) {
      window.cancelAnimationFrame(displayLayoutFrame);
    }

    displayLayoutFrame = window.requestAnimationFrame(function() {
      displayLayoutFrame = 0;
      fitDisplayStage(getCurrentDisplayStage());
      window.requestAnimationFrame(function() {
        fitDisplayStage(getCurrentDisplayStage());
      });
    });
  }

  function applyItemVisualState(item, relativeIndex, frontRadius, viewportWidth, cardWidth) {
    var absIndex;
    var isFront;
    var visibleSlots;
    var slotSpacing;
    var x;
    var y;
    var scale;
    var opacity;
    var rotate;
    var tilt;
    var saturate;
    var blur;
    var layer;

    absIndex = Math.abs(relativeIndex);
    isFront = absIndex <= frontRadius;

    if (!isFront) {
      item.hidden = true;
      item.classList.remove('is-edge', 'is-peek', 'is-front');
      item.style.setProperty('--results-x', '0px');
      item.style.setProperty('--results-y', '0px');
      item.style.setProperty('--results-scale', '0.001');
      item.style.setProperty('--results-opacity', '0');
      item.style.setProperty('--results-rotate', '0deg');
      item.style.setProperty('--results-tilt', '0deg');
      item.style.setProperty('--results-z', '0px');
      item.style.setProperty('--results-saturate', '0.8');
      item.style.setProperty('--results-blur', '0px');
      item.style.setProperty('--results-layer', '1');
      return;
    }

    visibleSlots = (frontRadius * 2) + 1;
    slotSpacing = Math.max(0, (viewportWidth - cardWidth) / Math.max(1, visibleSlots - 1));
    x = relativeIndex * slotSpacing;
    y = 0;
    scale = absIndex === 0 ? 1 : (absIndex === 1 ? 0.92 : 0.84);
    opacity = absIndex === 0 ? 1 : (absIndex === 1 ? 0.8 : 0.58);
    rotate = 0;
    tilt = 0;
    item.style.setProperty('--results-z', '0px');
    saturate = absIndex === 0 ? 1 : (absIndex === 1 ? 0.94 : 0.88);
    blur = 0;
    layer = absIndex === 0 ? 180 : (absIndex === 1 ? 140 : 100);

    item.hidden = false;
    item.classList.toggle('is-edge', absIndex === frontRadius);
    item.classList.remove('is-peek');
    item.classList.toggle('is-front', isFront);
    item.style.setProperty('--results-x', x.toFixed(1) + 'px');
    item.style.setProperty('--results-y', y.toFixed(1) + 'px');
    item.style.setProperty('--results-scale', scale.toFixed(3));
    item.style.setProperty('--results-opacity', opacity.toFixed(3));
    item.style.setProperty('--results-rotate', rotate.toFixed(1) + 'deg');
    item.style.setProperty('--results-tilt', tilt.toFixed(1) + 'deg');
    item.style.setProperty('--results-saturate', saturate.toFixed(3));
    item.style.setProperty('--results-blur', blur.toFixed(2) + 'px');
    item.style.setProperty('--results-layer', String(layer));
  }

  function getDisplayDefinition(item) {
    var type = item.getAttribute('data-display-type') || 'image';
    var src = item.getAttribute('data-full-src') || '';
    var caption = item.getAttribute('data-caption') || '';
    var alt = item.querySelector('img') ? item.querySelector('img').getAttribute('alt') : caption;
    var title = item.getAttribute('data-display-title') ||
      (item.querySelector('.is-sr-only') ? item.querySelector('.is-sr-only').textContent.trim() : caption);
    var templateId = item.getAttribute('data-template-id') || '';

    return {
      type: type,
      src: src,
      caption: caption,
      alt: alt,
      title: title,
      templateId: templateId,
      key: type === 'template' ? ('template:' + templateId) : ('image:' + src)
    };
  }

  function createDisplayStage(definition, extraClassName) {
    var stage = document.createElement('div');
    var header = document.createElement('div');
    var heading = document.createElement('h3');
    var divider = document.createElement('div');
    var description = document.createElement('p');
    var body = document.createElement('div');
    var image;
    var template;

    stage.className = 'results-display__stage';
    if (extraClassName) {
      stage.classList.add(extraClassName);
    }
    stage.setAttribute('data-results-key', definition.key);

    header.className = 'results-display__header';

    heading.className = 'results-display__title';
    heading.textContent = definition.title;

    divider.className = 'results-display__section-divider';
    divider.setAttribute('aria-hidden', 'true');

    description.className = 'results-display__description';
    description.textContent = definition.caption;

    body.className = 'results-display__body';

    if (definition.type === 'template' && definition.templateId) {
      body.classList.add('results-display__body--table');
      template = document.getElementById(definition.templateId);

      if (template && 'content' in template) {
        body.appendChild(document.importNode(template.content, true));
      } else if (template) {
        body.innerHTML = template.innerHTML;
      }
    } else {
      body.classList.add('results-display__body--image');
      image = document.createElement('img');
      image.className = 'results-display__image';
      image.setAttribute('src', definition.src);
      image.setAttribute('alt', definition.alt || '');
      body.appendChild(image);
    }

    header.appendChild(heading);
    header.appendChild(divider);

    stage.appendChild(header);
    stage.appendChild(body);
    stage.appendChild(description);

    return stage;
  }

  function getCurrentDisplayStage() {
    return displayViewport.querySelector('.results-display__stage.is-current') ||
      displayViewport.querySelector('.results-display__stage:last-child');
  }

  function cleanupDisplayStages(currentStage) {
    Array.prototype.slice.call(displayViewport.querySelectorAll('.results-display__stage')).forEach(function(stage) {
      if (stage !== currentStage) {
        stage.remove();
      }
    });
  }

  function setDisplay(index, direction, instant) {
    var item = items[index];
    var nextDisplay;
    var currentStage;
    var nextStage;

    if (!item) {
      return;
    }

    nextDisplay = getDisplayDefinition(item);

    items.forEach(function(entry, entryIndex) {
      var isActive = entryIndex === index;
      entry.classList.toggle('is-active', isActive);
      entry.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    currentStage = getCurrentDisplayStage();
    nextStage = createDisplayStage(nextDisplay, 'is-current');

    if (
      currentStage &&
      currentStage.getAttribute('data-results-key') === nextDisplay.key
    ) {
      return;
    }

    displayViewport.innerHTML = '';
    displayViewport.appendChild(nextStage);
    displayViewport.style.height = '';
  }

  function renderWindow() {
    var frontRadius;
    var viewportWidth;
    var cardWidth;
    var measurementItem;
    var windowCenterIndex;

    visibleCount = getVisibleCount();
    gallery.style.setProperty('--results-visible-count', visibleCount);
    frontRadius = Math.floor((visibleCount - 1) / 2);
    windowCenterIndex = getWindowCenterIndex(frontRadius);
    viewportWidth = viewport.getBoundingClientRect().width;
    measurementItem = items.find(function(item) {
      return !item.hidden;
    }) || items[0];
    cardWidth = measurementItem.offsetWidth || measurementItem.clientWidth || 64;

    items.forEach(function(item, index) {
      var relativeIndex = index - windowCenterIndex;
      var isFront = Math.abs(relativeIndex) <= frontRadius;

      applyItemVisualState(item, relativeIndex, frontRadius, viewportWidth, cardWidth);
      item.setAttribute('tabindex', isFront ? '0' : '-1');
      item.setAttribute('aria-hidden', isFront ? 'false' : 'true');
    });

    updateArrowState();

    setDisplay(selectedIndex, pendingDisplayDirection, !hasRendered);
    hasRendered = true;
    pendingDisplayDirection = 0;
    scheduleDisplayLayout();
  }

  function shiftWindow(direction) {
    centerOnIndex(selectedIndex + direction, direction);
  }

  items.forEach(function(item, index) {
    item.addEventListener('click', function(event) {
      var relativeIndex;
      var displayDirection;
      var frontRadius = Math.floor((visibleCount - 1) / 2);
      var windowCenterIndex = getWindowCenterIndex(frontRadius);

      event.preventDefault();
      event.stopPropagation();

      if (item.getAttribute('aria-hidden') === 'true') {
        return;
      }

      relativeIndex = index - windowCenterIndex;
      displayDirection = relativeIndex > 0 ? -1 : (relativeIndex < 0 ? 1 : 0);
      centerOnIndex(index, displayDirection);
    });

    item.addEventListener('keydown', function(event) {
      if (event.key === 'Enter' || event.key === ' ') {
        var frontRadius = Math.floor((visibleCount - 1) / 2);
        var windowCenterIndex = getWindowCenterIndex(frontRadius);
        var relativeIndex = index - windowCenterIndex;
        var displayDirection = relativeIndex > 0 ? -1 : (relativeIndex < 0 ? 1 : 0);
        event.preventDefault();
        centerOnIndex(index, displayDirection);
      }
    });
  });

  if (prevButton) {
    prevButton.addEventListener('click', function() {
      shiftWindow(-1);
    });
  }

  if (nextButton) {
    nextButton.addEventListener('click', function() {
      shiftWindow(1);
    });
  }

  visibleCount = getVisibleCount();
  selectedIndex = items.findIndex(function(item) {
    return item.hasAttribute('data-results-default');
  });
  if (selectedIndex < 0) {
    selectedIndex = 0;
  }
  renderWindow();

  window.addEventListener('resize', function() {
    renderWindow();
  });
}

function initPlaceholderLinks() {
  Array.prototype.forEach.call(document.querySelectorAll('[data-placeholder-link]'), function(link) {
    link.addEventListener('click', function(event) {
      event.preventDefault();
    });
  });
}


$(document).ready(function() {
    // Check for click events on the navbar burger icon
    $(".navbar-burger").click(function() {
      // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
      $(".navbar-burger").toggleClass("is-active");
      $(".navbar-menu").toggleClass("is-active");

    });

    var options = {
			slidesToScroll: 1,
			slidesToShow: 3,
			loop: true,
			infinite: true,
			autoplay: false,
			autoplaySpeed: 3000,
    }

		// Initialize all div with carousel class
    var carousels = bulmaCarousel.attach('.carousel', options);

    // Loop on each carousel initialized
    for(var i = 0; i < carousels.length; i++) {
    	// Add listener to  event
    	carousels[i].on('before:show', state => {
    		console.log(state);
    	});
    }

    // Access to bulmaCarousel instance of an element
    var element = document.querySelector('#my-element');
    if (element && element.bulmaCarousel) {
    	// bulmaCarousel instance is available as element.bulmaCarousel
    	element.bulmaCarousel.on('before-show', function(state) {
    		console.log(state);
    	});
    }

    if (window.bulmaSlider && typeof window.bulmaSlider.attach === 'function') {
        window.bulmaSlider.attach();
    }
    initSceneShowcase();
    initImageComparisons();
    initViewportManagedInlineVideos();
    initResultsGallery();
    initPlaceholderLinks();

})
