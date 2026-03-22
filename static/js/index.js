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
  var showcaseMediaReady = false;

  if (!buttons.length) {
    return;
  }

  function playVideo(videoElement) {
    var playPromise = videoElement.play();
    if (playPromise !== undefined) {
      playPromise.catch(function() {});
    }
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
    var wrapper = card.querySelector('.scene-compare-wrapper');
    var overlay = card.querySelector('[data-compare-overlay]');
    var divider = card.querySelector('[data-compare-handle]');
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
    var compareInteraction;
    var layoutFrame = null;
    var lastKnownRatio = 16 / 9;

    if (!wrapper || !overlay || !divider || !leftVideo || !rightVideo || !leftSource || !rightSource || !leftLabel || !rightLabel || !leftGaussianMetric || !leftFpsMetric || !leftTrainMetric || !rightGaussianMetric || !rightFpsMetric || !rightTrainMetric) {
      return null;
    }
    compareInteraction = attachCompareInteraction(wrapper, overlay, divider);
    if (!compareInteraction) {
      return null;
    }

    function syncVideos() {
      if (Math.abs(leftVideo.currentTime - rightVideo.currentTime) > 0.08) {
        try {
          rightVideo.currentTime = leftVideo.currentTime;
        } catch (error) {}
      }
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

    function updateWrapperSize() {
      var availableWidth = card.clientWidth;
      var isMobile = window.innerWidth <= 768;
      var minWidth = Math.min(availableWidth, isMobile ? 265 : 360);
      var minHeight = isMobile ? 180 : 250;
      var maxHeight = isMobile ? 290 : 450;
      var ratio = getVideoRatio();
      var width;
      var height;

      if (!availableWidth) {
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

    function ensureVideoSource(videoElement, sourceElement, nextVideoPath) {
      if (!nextVideoPath) {
        return;
      }

      if (sourceElement.getAttribute('src') === nextVideoPath) {
        return;
      }

      sourceElement.setAttribute('src', nextVideoPath);
      sourceElement.setAttribute('data-src', nextVideoPath);
      videoElement.load();
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

    function setContent(content, shouldLoadMedia) {
      var sceneKey = content.sceneKey || '';
      var nextLeftVideo = content.leftVideo || '';
      var nextRightVideo = content.rightVideo || nextLeftVideo;
      var resolvedLeftLabel = content.leftLabel || 'Ours';
      var resolvedRightLabel = content.rightLabel || 'Method B';
      var leftMetricMethod = content.leftMetricMethod || 'ours';
      var rightMetricMethod = content.rightMetricMethod || 'gaussian_splatting';

      leftLabel.textContent = resolvedLeftLabel;
      rightLabel.textContent = resolvedRightLabel;
      setMetricBlock(sceneKey, leftMetricMethod, leftLabel, leftGaussianMetric, leftFpsMetric, leftTrainMetric, resolvedLeftLabel);
      setMetricBlock(sceneKey, rightMetricMethod, rightLabel, rightGaussianMetric, rightFpsMetric, rightTrainMetric, resolvedRightLabel);
      if (compareCaption) {
        compareCaption.textContent = resolvedLeftLabel + ' vs. ' + resolvedRightLabel;
      }

      leftVideo.setAttribute('poster', getPosterPath(nextLeftVideo));
      rightVideo.setAttribute('poster', getPosterPath(nextRightVideo));

      compareInteraction.setComparePosition(0.5);

      if (!shouldLoadMedia) {
        leftVideo.pause();
        rightVideo.pause();
        scheduleWrapperSize();
        return;
      }

      ensureVideoSource(leftVideo, leftSource, nextLeftVideo);
      ensureVideoSource(rightVideo, rightSource, nextRightVideo);

      try {
        leftVideo.currentTime = 0;
        rightVideo.currentTime = 0;
      } catch (error) {}

      playVideo(leftVideo);
      playVideo(rightVideo);
      scheduleWrapperSize();
    }

    leftVideo.addEventListener('play', function() {
      try {
        rightVideo.currentTime = leftVideo.currentTime;
      } catch (error) {}
      playVideo(rightVideo);
    });

    leftVideo.addEventListener('pause', function() {
      rightVideo.pause();
    });

    leftVideo.addEventListener('seeking', function() {
      try {
        rightVideo.currentTime = leftVideo.currentTime;
      } catch (error) {}
    });

    leftVideo.addEventListener('timeupdate', syncVideos);
    leftVideo.addEventListener('ratechange', function() {
      rightVideo.playbackRate = leftVideo.playbackRate;
    });

    leftVideo.addEventListener('loadedmetadata', scheduleWrapperSize);
    rightVideo.addEventListener('loadedmetadata', scheduleWrapperSize);
    window.addEventListener('resize', scheduleWrapperSize);
    scheduleWrapperSize();

    return {
      setContent: setContent,
      play: function() {
        playVideo(leftVideo);
        playVideo(rightVideo);
      },
      pause: function() {
        leftVideo.pause();
        rightVideo.pause();
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

  function enableShowcaseMedia() {
    if (showcaseMediaReady) {
      return;
    }

    showcaseMediaReady = true;
    activateScene(activeButton);
  }

  function activateScene(button) {
    var sceneKey = button.getAttribute('data-scene-key') || '';
    var nextLabel = button.getAttribute('data-label');
    var compareConfigs = [
      {
        sceneKey: sceneKey,
        leftVideo: button.getAttribute('data-left-video-1'),
        rightVideo: button.getAttribute('data-right-video-1'),
        leftLabel: button.getAttribute('data-left-label-1'),
        rightLabel: button.getAttribute('data-right-label-1'),
        leftMetricMethod: 'ours',
        rightMetricMethod: 'gaussian_splatting'
      },
      {
        sceneKey: sceneKey,
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
    compareCards.forEach(function(compareCard, index) {
      compareCard.setContent(compareConfigs[index] || compareConfigs[0], showcaseMediaReady);
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
      if (!showcaseMediaReady) {
        enableShowcaseMedia();
      }
      activateScene(button);
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
  activateScene(activeButton);

  showcase.addEventListener('pointerenter', enableShowcaseMedia, { once: true });
  showcase.addEventListener('pointerdown', enableShowcaseMedia, { once: true });
  showcase.addEventListener('focusin', enableShowcaseMedia, { once: true });

  if (document.readyState === 'complete') {
    runWhenBrowserIsIdle(enableShowcaseMedia, 1400);
  } else {
    window.addEventListener('load', function() {
      runWhenBrowserIsIdle(enableShowcaseMedia, 1400);
    }, { once: true });
  }
}

function initImageComparisons() {
  var section = document.querySelector('[data-visual-comparisons]');
  if (!section) {
    return;
  }

  var imageMediaReady = false;
  var activeButton;

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
    var latestShouldLoadMedia = false;
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
        return node.textContent === nextLabel;
      })) {
        return;
      }

      card.classList.add('is-method-switching');
      animatedNodes.forEach(function(node) {
        node.classList.add('is-updating');
      });

      switchTextTimer = window.setTimeout(function() {
        animatedNodes.forEach(function(node) {
          node.textContent = nextLabel;
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
      var hasMultipleOptions = enabledMethodIndexes.length > 1;

      animateMethodText(currentLabel);

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
      applyResolvedContent(methodOptions[activeMethodIndex], latestShouldLoadMedia);
    }

    function applyResolvedContent(content, shouldLoadMedia) {
      var nextLeftImage = content.leftImage || '';
      var nextRightImage = content.rightImage || nextLeftImage;
      var resolvedLeftLabel = content.leftLabel || 'Ours';
      var resolvedRightLabel = content.rightLabel || 'Method B';

      leftLabel.textContent = resolvedLeftLabel;
      rightLabel.textContent = resolvedRightLabel;

      if (shouldLoadMedia && nextLeftImage) {
        leftImage.setAttribute('src', nextLeftImage);
      }

      if (shouldLoadMedia && nextRightImage) {
        rightImage.setAttribute('src', nextRightImage);
      }

      leftImage.setAttribute('alt', resolvedLeftLabel + ' qualitative comparison image.');
      rightImage.setAttribute('alt', resolvedRightLabel + ' qualitative comparison image.');

      compareInteraction.setComparePosition(0.5);
      scheduleWrapperSize();
    }

    function setContent(content, shouldLoadMedia) {
      var methodOptions = content.methodOptions || [];
      var resolvedContent = content;

      latestContent = content;
      latestShouldLoadMedia = shouldLoadMedia;

      if (methodOptions.length && (baselineChip || selectorValue || prevMethodButton || nextMethodButton)) {
        activeMethodIndex = resolveActiveMethodIndex(methodOptions);
        setMethodSwitcher(methodOptions);
        resolvedContent = methodOptions[activeMethodIndex];
      }

      applyResolvedContent(resolvedContent, shouldLoadMedia);
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

  if (!imageCards.length) {
    return;
  }

  if (!buttons.length) {
    return;
  }

  function activateScene(button) {
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

    imageCards.forEach(function(compareCard, index) {
      compareCard.setContent(compareConfigs[index] || compareConfigs[0], imageMediaReady);
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

  activeButton = section.querySelector('.scene-selector__item.is-active') || buttons[0];
  activateScene(activeButton);
  observeOnceNearViewport(section, function() {
    imageMediaReady = true;
    activateScene(activeButton);
  }, '180px 0px');
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
  var displayAnimationTimer = null;

  if (!items.length || !displayRoot || !displayViewport || !viewport) {
    return;
  }

  function getVisibleCount() {
    return Math.min(window.innerWidth <= 768 ? 3 : 5, items.length);
  }

  function getCircularOffset(index, centerIndex, total) {
    var diff = index - centerIndex;

    if (diff > total / 2) {
      diff -= total;
    } else if (diff < -total / 2) {
      diff += total;
    }

    return diff;
  }

  function centerOnIndex(index, displayDirection) {
    selectedIndex = (index + items.length) % items.length;
    pendingDisplayDirection = displayDirection || 0;
    renderWindow();
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

  function createDisplayStage(src, alt, caption, extraClassName) {
    var stage = document.createElement('div');
    var image = document.createElement('img');
    var text = document.createElement('p');

    stage.className = 'results-display__stage';
    if (extraClassName) {
      stage.classList.add(extraClassName);
    }

    image.className = 'results-display__image';
    image.setAttribute('src', src);
    image.setAttribute('alt', alt || '');

    text.className = 'results-display__caption';
    text.textContent = caption;

    stage.appendChild(image);
    stage.appendChild(text);

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
    var nextSrc;
    var nextCaption;
    var nextAlt;
    var currentStage;
    var currentImage;
    var currentCaption;
    var leavingClassName;
    var enteringClassName;
    var enteringStage;

    if (!item) {
      return;
    }

    nextSrc = item.getAttribute('data-full-src');
    nextCaption = item.getAttribute('data-caption') || '';
    nextAlt = item.querySelector('img') ? item.querySelector('img').getAttribute('alt') : nextCaption;

    items.forEach(function(entry, entryIndex) {
      var isActive = entryIndex === index;
      entry.classList.toggle('is-active', isActive);
      entry.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    if (displayAnimationTimer) {
      window.clearTimeout(displayAnimationTimer);
      displayAnimationTimer = null;
    }

    currentStage = getCurrentDisplayStage();
    if (!currentStage) {
      currentStage = createDisplayStage(nextSrc, nextAlt, nextCaption, 'is-current');
      displayViewport.innerHTML = '';
      displayViewport.appendChild(currentStage);
      return;
    }

    cleanupDisplayStages(currentStage);
    currentImage = currentStage.querySelector('.results-display__image');
    currentCaption = currentStage.querySelector('.results-display__caption');

    if (
      instant ||
      !direction ||
      (
        currentImage &&
        currentImage.getAttribute('src') === nextSrc &&
        currentCaption &&
        currentCaption.textContent === nextCaption
      )
    ) {
      currentImage.setAttribute('src', nextSrc);
      currentImage.setAttribute('alt', nextAlt || '');
      currentCaption.textContent = nextCaption;
      currentStage.className = 'results-display__stage is-current';
      displayViewport.style.height = '';
      return;
    }

    leavingClassName = direction < 0 ? 'is-leaving-to-left' : 'is-leaving-to-right';
    enteringClassName = direction < 0 ? 'is-entering-from-right' : 'is-entering-from-left';
    enteringStage = createDisplayStage(nextSrc, nextAlt, nextCaption, enteringClassName);
    enteringStage.classList.add('is-current');

    displayViewport.style.height = currentStage.getBoundingClientRect().height + 'px';
    currentStage.className = 'results-display__stage ' + leavingClassName;
    displayViewport.appendChild(enteringStage);

    displayAnimationTimer = window.setTimeout(function() {
      cleanupDisplayStages(enteringStage);
      enteringStage.className = 'results-display__stage is-current';
      displayViewport.style.height = '';
      displayAnimationTimer = null;
    }, 470);
  }

  function renderWindow() {
    var frontRadius;
    var viewportWidth;
    var cardWidth;
    var measurementItem;

    visibleCount = getVisibleCount();
    gallery.style.setProperty('--results-visible-count', visibleCount);
    frontRadius = Math.floor((visibleCount - 1) / 2);
    viewportWidth = viewport.getBoundingClientRect().width;
    measurementItem = items.find(function(item) {
      return !item.hidden;
    }) || items[0];
    cardWidth = measurementItem.offsetWidth || measurementItem.clientWidth || 64;

    items.forEach(function(item, index) {
      var relativeIndex = getCircularOffset(index, selectedIndex, items.length);
      var isFront = Math.abs(relativeIndex) <= frontRadius;

      applyItemVisualState(item, relativeIndex, frontRadius, viewportWidth, cardWidth);
      item.setAttribute('tabindex', isFront ? '0' : '-1');
      item.setAttribute('aria-hidden', isFront ? 'false' : 'true');
    });

    setDisplay(selectedIndex, pendingDisplayDirection, !hasRendered);
    hasRendered = true;
    pendingDisplayDirection = 0;
  }

  function shiftWindow(direction) {
    centerOnIndex(selectedIndex + direction, direction);
  }

  items.forEach(function(item, index) {
    item.addEventListener('click', function(event) {
      var relativeIndex;
      var displayDirection;

      event.preventDefault();
      event.stopPropagation();

      if (item.getAttribute('aria-hidden') === 'true') {
        return;
      }

      relativeIndex = getCircularOffset(index, selectedIndex, items.length);
      displayDirection = relativeIndex > 0 ? -1 : (relativeIndex < 0 ? 1 : 0);
      centerOnIndex(index, displayDirection);
    });

    item.addEventListener('keydown', function(event) {
      if (event.key === 'Enter' || event.key === ' ') {
        var relativeIndex = getCircularOffset(index, selectedIndex, items.length);
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
  selectedIndex = Math.floor(Math.min(items.length, visibleCount) / 2);
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

    bulmaSlider.attach();
    initSceneShowcase();
    initImageComparisons();
    initResultsGallery();
    initPlaceholderLinks();

})
