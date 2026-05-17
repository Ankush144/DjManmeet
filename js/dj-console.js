/**
 * DDJ-FLX4 virtual console — Spotify decks + Web Audio FX
 */
(function ($) {
  "use strict";

  var controllers = { 1: null, 2: null };
  var deckState = {
    1: makeDeckState(),
    2: makeDeckState(),
  };
  var selectedTrack = null;
  var spotifyApiReady = false;
  var audioCtx = null;
  var beatFxOn = false;
  var beatFxType = "filter";
  var activeJogDeck = null;
  var $toast = null;

  function makeDeckState() {
    return {
      uri: null,
      title: "",
      artist: "",
      playing: false,
      padMode: "hotcue",
      shift: false,
      bpm: 128,
      synced: false,
      hotCues: {},
      loopIn: null,
      loopOut: null,
      loopTimer: null,
      channelCue: false,
      position: 0,
      duration: 0,
    };
  }

  function getTracks() {
    if (typeof ARTIST_CONFIG !== "undefined" && ARTIST_CONFIG.djConsole && ARTIST_CONFIG.djConsole.tracks) {
      return ARTIST_CONFIG.djConsole.tracks;
    }
    return [
      { uri: "spotify:track:4cOdK2wGLETKBW3PvgPWqT", title: "Time", artist: "Hans Zimmer", genre: "Track" },
      { uri: "spotify:track:0VjIjW4GlUZAMYd2vXMi3b", title: "Blinding Lights", artist: "The Weeknd", genre: "Pop" },
    ];
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getDeckEl(deck) {
    return $('.dj-deck[data-deck="' + deck + '"]');
  }

  function beatMs(deck) {
    return 60000 / (deckState[deck].bpm || 128);
  }

  function showToast(msg) {
    if (!$toast || !$toast.length) {
      $toast = $('<div class="dj-console-toast" aria-live="polite"></div>');
      $("body").append($toast);
    }
    $toast.text(msg).addClass("is-visible");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      $toast.removeClass("is-visible");
    }, 1800);
  }

  function ensureAudio() {
    if (!audioCtx) {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playTone(freq, duration, type) {
    var ctx = ensureAudio();
    if (!ctx) return;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  function playPadFx(kind) {
    var freqs = { kick: 80, snare: 200, hat: 8000, stab: 440 };
    playTone(freqs[kind] || 300, 0.08, kind === "hat" ? "square" : "triangle");
  }

  function playBeatFxSound() {
    var ctx = ensureAudio();
    if (!ctx) return;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    var filter = ctx.createBiquadFilter();
    osc.type = "sawtooth";
    osc.frequency.value = beatFxType === "echo" ? 220 : 110;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(200, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(4000, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  }

  function pressButton($btn) {
    $btn.addClass("is-pressed");
    setTimeout(function () {
      $btn.removeClass("is-pressed");
    }, 120);
  }

  function buildTrackList() {
    var $list = $("#dj-track-list");
    if (!$list.length) return;
    $list.empty();
    getTracks().forEach(function (track, i) {
      $list.append(
        '<li class="dj-track-item" data-uri="' +
          escapeHtml(track.uri) +
          '" data-title="' +
          escapeHtml(track.title) +
          '" data-artist="' +
          escapeHtml(track.artist) +
          '">' +
          '<span class="dj-track-item__num">' +
          String(i + 1).padStart(2, "0") +
          "</span>" +
          '<div class="dj-track-item__meta"><strong>' +
          escapeHtml(track.title) +
          "</strong><span>" +
          escapeHtml(track.artist) +
          "</span></div>" +
          '<span class="dj-track-item__badge">' +
          escapeHtml(track.genre || "Track") +
          "</span>" +
          '<div class="dj-track-item__actions">' +
          '<button type="button" class="dj-track-load" data-deck="1">LOAD 1</button>' +
          '<button type="button" class="dj-track-load" data-deck="2">LOAD 2</button>' +
          "</div></li>"
      );
    });
  }

  function initDeckWaveforms() {
    $(".dj-deck").each(function () {
      var deck = $(this).data("deck");
      var $display = $(this).find(".dj-deck__display");
      if ($display.find(".dj-deck__waveform").length) return;
      var bars = "";
      for (var i = 0; i < 24; i++) {
        bars += '<span style="height:' + (20 + Math.random() * 60) + '%"></span>';
      }
      $display.prepend('<div class="dj-deck__waveform" data-wave-deck="' + deck + '">' + bars + "</div>");
    });
  }

  function animateWaveform(deck, active) {
    var $w = $('[data-wave-deck="' + deck + '"]');
    $w.toggleClass("is-live", active);
    if (!active) return;
    $w.find("span").each(function () {
      $(this).css("height", 15 + Math.random() * 85 + "%");
    });
  }

  function formatTime(ms) {
    if (!ms || ms < 0) ms = 0;
    var s = Math.floor(ms / 1000);
    var m = Math.floor(s / 60);
    s = s % 60;
    return m + ":" + String(s).padStart(2, "0");
  }

  function updateDeckTime(deck) {
    var s = deckState[deck];
    getDeckEl(deck)
      .find("[data-deck-time]")
      .text(formatTime(s.position) + " / " + (s.duration ? formatTime(s.duration) : "--:--"));
  }

  function updatePadCueLights(deck) {
    getDeckEl(deck)
      .find(".dj-pad")
      .each(function (i) {
        $(this).toggleClass("has-cue", !!deckState[deck].hotCues[i]);
      });
  }

  function createDeckController(deckNum, IFrameAPI) {
    var el = document.getElementById("deck-" + deckNum + "-spotify");
    if (!el) return;

    var tracks = getTracks();
    var defaultUri = tracks[0] ? tracks[0].uri : "spotify:track:4cOdK2wGLETKBW3PvgPWqT";

    IFrameAPI.createController(el, { uri: defaultUri, width: "100%", height: 52 }, function (controller) {
      controllers[deckNum] = controller;
      deckState[deckNum].uri = defaultUri;
      if (tracks[0]) {
        deckState[deckNum].title = tracks[0].title;
        deckState[deckNum].artist = tracks[0].artist;
      }
      updateDeckLabel(deckNum);

      controller.addListener("playback_update", function (e) {
        var d = e.data;
        deckState[deckNum].playing = !d.isPaused;
        deckState[deckNum].position = d.position || 0;
        deckState[deckNum].duration = d.duration || 0;
        getDeckEl(deckNum).find(".dj-btn-play").toggleClass("is-playing", deckState[deckNum].playing);
        $('[data-vu-deck="' + deckNum + '"]').toggleClass("is-active", deckState[deckNum].playing);
        animateWaveform(deckNum, deckState[deckNum].playing);
        updateDeckTime(deckNum);
        checkLoop(deckNum);
      });
    });
  }

  function checkLoop(deck) {
    var s = deckState[deck];
    if (s.loopIn == null || s.loopOut == null || !controllers[deck]) return;
    if (s.position >= s.loopOut) {
      controllers[deck].seek(s.loopIn);
    }
  }

  window.onSpotifyIframeApiReady = function (IFrameAPI) {
    spotifyApiReady = true;
    createDeckController(1, IFrameAPI);
    createDeckController(2, IFrameAPI);
    showToast("Console ready — load a track and hit PLAY");
  };

  function loadTrackToDeck(deckNum, uri, title, artist) {
    deckState[deckNum].uri = uri;
    deckState[deckNum].title = title || "";
    deckState[deckNum].artist = artist || "";
    deckState[deckNum].loopIn = null;
    deckState[deckNum].loopOut = null;
    updateDeckLabel(deckNum);

    if (controllers[deckNum]) {
      controllers[deckNum].loadUri(uri);
    }

    $(".dj-track-item").removeClass("is-loaded-1 is-loaded-2");
    $('.dj-track-item[data-uri="' + uri + '"]').addClass("is-loaded-" + deckNum);
    showToast("Deck " + deckNum + ": " + (title || "Track loaded"));
  }

  function updateDeckLabel(deckNum) {
    var s = deckState[deckNum];
    getDeckEl(deckNum)
      .find("[data-deck-label]")
      .text(s.title ? s.title + " — " + s.artist : "No track loaded");
  }

  function getPosition(deck) {
    if (!controllers[deck]) return Promise.resolve(0);
    return controllers[deck].getCurrentState().then(function (st) {
      return st && st.position != null ? st.position : deckState[deck].position;
    });
  }

  function seekDeck(deck, ms) {
    if (!controllers[deck]) return;
    controllers[deck].seek(Math.max(0, ms));
    deckState[deck].position = ms;
    updateDeckTime(deck);
  }

  function togglePlay(deckNum) {
    if (!controllers[deckNum]) {
      showToast("Waiting for Spotify…");
      return;
    }
    var $btn = getDeckEl(deckNum).find(".dj-btn-play");
    pressButton($btn);
    ensureAudio();

    if (deckState[deckNum].playing) {
      controllers[deckNum].pause();
    } else {
      controllers[deckNum]
        .play()
        .catch(function () {
          controllers[deckNum].togglePlay && controllers[deckNum].togglePlay();
        });
      var other = deckNum === 1 ? 2 : 1;
      applyCrossfaderBias(other, deckNum);
    }
  }

  function cueDeck(deckNum) {
    if (!controllers[deckNum]) return;
    pressButton(getDeckEl(deckNum).find(".dj-btn-cue"));
    ensureAudio();
    controllers[deckNum].seek(0);
    controllers[deckNum].pause();
    playTone(440, 0.05, "square");
    showToast("Deck " + deckNum + " — CUE");
  }

  function applyCrossfaderBias(pauseDeck, playDeck) {
    var val = parseInt($("#dj-crossfader").val(), 10) || 50;
    if (val < 25 && pauseDeck === 2 && controllers[2] && deckState[2].playing) {
      controllers[2].pause();
    } else if (val > 75 && pauseDeck === 1 && controllers[1] && deckState[1].playing) {
      controllers[1].pause();
    }
  }

  function applyCrossfader() {
    var val = parseInt($("#dj-crossfader").val(), 10) || 50;
    if (!spotifyApiReady) return;
    if (val <= 10 && controllers[2] && deckState[2].playing) controllers[2].pause();
    if (val >= 90 && controllers[1] && deckState[1].playing) controllers[1].pause();
  }

  function handlePad(deck, padIndex, $pad) {
    ensureAudio();
    pressButton($pad);
    $pad.addClass("is-hit");
    setTimeout(function () {
      $pad.removeClass("is-hit");
    }, 100);

    var s = deckState[deck];
    var mode = s.padMode;
    var shift = s.shift;

    if (mode === "hotcue") {
      if (shift || !s.hotCues[padIndex]) {
        getPosition(deck).then(function (pos) {
          s.hotCues[padIndex] = pos;
          updatePadCueLights(deck);
          playTone(520 + padIndex * 40, 0.06, "sine");
          showToast("Hot cue " + (padIndex + 1) + " set");
        });
      } else {
        seekDeck(deck, s.hotCues[padIndex]);
        if (!deckState[deck].playing && controllers[deck]) {
          controllers[deck].play().catch(function () {});
        }
        playTone(680 + padIndex * 30, 0.05, "sine");
      }
      return;
    }

    if (mode === "fx") {
      var kinds = ["kick", "snare", "hat", "stab", "kick", "snare", "hat", "stab"];
      playPadFx(kinds[padIndex]);
      getDeckEl(deck).find(".dj-deck__display").addClass("is-fx-active");
      setTimeout(function () {
        getDeckEl(deck).find(".dj-deck__display").removeClass("is-fx-active");
      }, 200);
      return;
    }

    if (mode === "beat") {
      var jumps = [-16, -8, -4, -1, 1, 4, 8, 16];
      var beats = jumps[padIndex] || 4;
      getPosition(deck).then(function (pos) {
        seekDeck(deck, pos + beats * beatMs(deck));
        playTone(300, 0.04, "triangle");
        showToast((beats > 0 ? "+" : "") + beats + " beats");
      });
      return;
    }

    if (mode === "sample") {
      var notes = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25];
      playTone(notes[padIndex], 0.25, "square");
    }
  }

  function handleLoopIn(deck) {
    getPosition(deck).then(function (pos) {
      deckState[deck].loopIn = pos;
      deckState[deck].loopOut = null;
      showToast("Loop IN at " + formatTime(pos));
      playTone(330, 0.05, "sine");
    });
  }

  function handleLoopOut(deck) {
    getPosition(deck).then(function (pos) {
      deckState[deck].loopOut = pos;
      if (deckState[deck].loopIn != null && pos > deckState[deck].loopIn) {
        showToast("Loop active");
        playTone(440, 0.08, "sine");
      }
    });
  }

  function handleBeat4(deck) {
    getPosition(deck).then(function (pos) {
      var len = 4 * beatMs(deck);
      deckState[deck].loopIn = pos;
      deckState[deck].loopOut = pos + len;
      showToast("4-beat loop");
      playTone(392, 0.06, "sine");
    });
  }

  function toggleSync(deck) {
    var s = deckState[deck];
    s.synced = !s.synced;
    getDeckEl(deck).find(".dj-btn-sync").toggleClass("is-active", s.synced);
    if (s.synced) {
      var other = deck === 1 ? 2 : 1;
      deckState[other].bpm = s.bpm;
      getDeckEl(other).find("[data-bpm-deck]").text(s.bpm);
      showToast("Deck " + deck + " SYNC");
      playTone(600, 0.05, "sine");
    }
  }

  function toggleChannelCue(deck) {
    deckState[deck].channelCue = !deckState[deck].channelCue;
    $('.dj-btn-cue-ch[data-channel="' + deck + '"]').toggleClass("is-active", deckState[deck].channelCue);
    showToast(deckState[deck].channelCue ? "Cue deck " + deck + " in headphones" : "Cue off");
    playTone(500, 0.04, "sine");
  }

  function initJogWheel(deckNum) {
    var $jog = $('[data-jog-deck="' + deckNum + '"]');
    var $vinyl = $jog.find(".dj-jog__vinyl");
    var $indicator = $jog.find(".dj-jog__indicator");
    var rotation = 0;
    var dragging = false;
    var lastAngle = 0;

    function angleFromEvent(e) {
      var rect = $jog[0].getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      var x = (e.clientX != null ? e.clientX : e.touches[0].clientX) - cx;
      var y = (e.clientY != null ? e.clientY : e.touches[0].clientY) - cy;
      return (Math.atan2(y, x) * 180) / Math.PI;
    }

    $jog.on("mousedown touchstart", function (e) {
      if ($(e.target).closest(".dj-jog__center").length) return;
      dragging = true;
      activeJogDeck = deckNum;
      lastAngle = angleFromEvent(e.type === "touchstart" ? e.originalEvent.touches[0] : e);
      $jog.addClass("is-scratching");
      ensureAudio();
      e.preventDefault();
    });

    $(document).on("mousemove touchmove", function (e) {
      if (!dragging || activeJogDeck !== deckNum) return;
      var ev = e.type === "touchmove" ? e.originalEvent.touches[0] : e;
      var angle = angleFromEvent(ev);
      var delta = angle - lastAngle;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      lastAngle = angle;
      rotation += delta;
      $indicator.css("transform", "rotate(" + rotation + "deg)");
      $vinyl.css("transform", "rotate(" + rotation + "deg)");

      if (controllers[deckNum] && Math.abs(delta) > 0.5) {
        getPosition(deckNum).then(function (pos) {
          seekDeck(deckNum, pos + delta * 35);
        });
      }
    });

    $(document).on("mouseup touchend", function () {
      if (activeJogDeck === deckNum) {
        dragging = false;
        activeJogDeck = null;
        $jog.removeClass("is-scratching");
      }
    });
  }

  function initKnobs() {
    $(".dj-knob").each(function () {
      var $k = $(this);
      if ($k.find(".dj-knob__pointer").length === 0) {
        $k.append('<span class="dj-knob__pointer"></span>');
      }
      var rot = parseFloat($k.data("rotation")) || 0;

      function setRot(r) {
        rot = Math.max(-140, Math.min(140, r));
        $k.data("rotation", rot);
        $k.find(".dj-knob__pointer").css("transform", "rotate(" + rot + "deg)");
      }

      var dragging = false;
      var startY = 0;
      var startRot = 0;

      $k.on("mousedown touchstart", function (e) {
        dragging = true;
        startY = e.type === "touchstart" ? e.originalEvent.touches[0].clientY : e.clientY;
        startRot = rot;
        e.preventDefault();
      });

      $(document).on("mousemove touchmove", function (e) {
        if (!dragging) return;
        var y = e.type === "touchmove" ? e.originalEvent.touches[0].clientY : e.clientY;
        setRot(startRot + (startY - y) * 1.2);
      });

      $(document).on("mouseup touchend", function () {
        dragging = false;
      });
    });
  }

  function initVuMeters() {
    setInterval(function () {
      $(".dj-vu.is-active").each(function () {
        var $vu = $(this);
        var fader = parseInt(
          $vu.closest(".dj-channel").find('.dj-fader-wrap input[type="range"]').val() || 80,
          10
        );
        $vu.find("span").each(function (i) {
          var h = (fader / 100) * (20 + Math.random() * 80);
          $(this).css("height", h + "%");
        });
      });
    }, 80);
  }

  function initWaveformIdle() {
    setInterval(function () {
      $(".dj-deck__waveform.is-live").each(function () {
        $(this)
          .find("span")
          .each(function () {
            $(this).css("height", 15 + Math.random() * 85 + "%");
          });
      });
    }, 120);
  }

  function enhanceDeckMarkup() {
    $(".dj-deck").each(function (idx) {
      var deck = $(this).data("deck") || idx + 1;
      $(this).attr("data-deck", deck);

      var $jog = $(this).find(".dj-jog");
      if ($jog.length && !$jog.find(".dj-jog__vinyl").length) {
        $jog.find(".dj-jog__ring").before('<div class="dj-jog__vinyl"></div>');
      }

      var $display = $(this).find(".dj-deck__display");
      if (!$display.find("[data-deck-time]").length) {
        $display.append('<div class="dj-deck__time" data-deck-time>0:00 / --:--</div>');
      }

      if (!$(this).find(".dj-pad-modes").length) {
        var modes =
          '<div class="dj-pad-modes">' +
          '<button type="button" class="dj-pad-mode is-active" data-pad-mode="hotcue" data-deck="' +
          deck +
          '">HOT CUE</button>' +
          '<button type="button" class="dj-pad-mode" data-pad-mode="fx" data-deck="' +
          deck +
          '">PAD FX</button>' +
          '<button type="button" class="dj-pad-mode" data-pad-mode="beat" data-deck="' +
          deck +
          '">BEAT</button>' +
          '<button type="button" class="dj-pad-mode" data-pad-mode="sample" data-deck="' +
          deck +
          '">SAMPLER</button></div>';
        $(this).find(".dj-pad-labels").replaceWith(modes);
      }

      $(this)
        .find(".dj-pad")
        .each(function (pi) {
          $(this).attr({ "data-deck": deck, "data-pad": pi });
        });

      $(this).find(".dj-btn-sm").each(function () {
        var t = $(this).text().trim();
        if (t === "4") $(this).addClass("dj-btn-beat4");
        if (t === "IN") $(this).addClass("dj-btn-loop-in");
        if (t === "OUT") $(this).addClass("dj-btn-loop-out");
      });

      $(this).find(".dj-btn-shift").attr("data-deck", deck);

      var $tempo = $(this).find(".dj-tempo");
      if ($tempo.length && !$tempo.find(".dj-fader-vertical").length) {
        var $range = $tempo.find('input[type="range"]');
        $range.wrap('<div class="dj-fader-vertical"></div>');
      }

      $(this).find('.dj-btn-cue-ch[data-channel]').length ||
        $(this)
          .closest(".dj-console__layout")
          .find('.dj-channel .dj-btn-cue-ch')
          .eq(deck - 1)
          .attr("data-channel", deck);
    });

    $(".dj-mixer__strips .dj-channel").each(function (i) {
      $(this)
        .find(".dj-btn-cue-ch")
        .attr("data-channel", i + 1);
      $(this)
        .find(".dj-fader-wrap input")
        .attr("data-channel-fader", i + 1);
    });

    if (!$(".dj-beatfx__types").length) {
      $(".dj-beatfx").prepend(
        '<div class="dj-beatfx__types">' +
          '<button type="button" class="dj-beatfx__type is-active" data-fx="filter">FLT</button>' +
          '<button type="button" class="dj-beatfx__type" data-fx="echo">ECHO</button>' +
          "</div>"
      );
    }

    var $xf = $("#dj-crossfader");
    if ($xf.length && !$xf.parent().hasClass("dj-crossfader-track")) {
      $xf.wrap('<div class="dj-crossfader-track"></div>');
    }
  }

  function bindEvents() {
    $(document).on("click", ".dj-track-item", function (e) {
      if ($(e.target).closest(".dj-track-load").length) return;
      $(".dj-track-item").removeClass("is-selected");
      $(this).addClass("is-selected");
      selectedTrack = {
        uri: $(this).data("uri"),
        title: $(this).data("title"),
        artist: $(this).data("artist"),
      };
    });

    $(document).on("click", ".dj-track-load", function (e) {
      e.stopPropagation();
      var deck = parseInt($(this).data("deck"), 10);
      var $item = $(this).closest(".dj-track-item");
      loadTrackToDeck(deck, $item.data("uri"), $item.data("title"), $item.data("artist"));
    });

    $(".dj-btn-load-deck").on("click", function () {
      var deck = parseInt($(this).data("load-deck"), 10);
      if (!selectedTrack) {
        var $f = $(".dj-track-item").first();
        selectedTrack = { uri: $f.data("uri"), title: $f.data("title"), artist: $f.data("artist") };
      }
      if (selectedTrack) loadTrackToDeck(deck, selectedTrack.uri, selectedTrack.title, selectedTrack.artist);
    });

    $(document).on("click", ".dj-btn-play", function () {
      togglePlay(parseInt($(this).data("deck"), 10));
    });

    $(document).on("click", ".dj-btn-cue", function () {
      cueDeck(parseInt($(this).data("deck"), 10));
    });

    $(document).on("click", ".dj-pad", function () {
      handlePad(parseInt($(this).data("deck"), 10), parseInt($(this).data("pad"), 10), $(this));
    });

    $(document).on("click", ".dj-pad-mode", function () {
      var deck = parseInt($(this).data("deck"), 10);
      var mode = $(this).data("pad-mode");
      deckState[deck].padMode = mode;
      getDeckEl(deck).find(".dj-pad-mode").removeClass("is-active");
      $(this).addClass("is-active");
      var labels = { hotcue: "Hot Cue", fx: "Pad FX", beat: "Beat Jump", sample: "Sampler" };
      showToast("Deck " + deck + " — " + labels[mode]);
    });

    $(document).on("click", ".dj-btn-shift", function () {
      var deck = parseInt($(this).data("deck"), 10);
      deckState[deck].shift = !deckState[deck].shift;
      $(this).toggleClass("is-active", deckState[deck].shift);
    });

    $(document).on("click", ".dj-btn-sync", function () {
      var deck = parseInt($(this).closest(".dj-deck").data("deck"), 10);
      toggleSync(deck);
    });

    $(document).on("click", ".dj-btn-loop-in", function () {
      handleLoopIn(parseInt($(this).closest(".dj-deck").data("deck"), 10));
    });

    $(document).on("click", ".dj-btn-loop-out", function () {
      handleLoopOut(parseInt($(this).closest(".dj-deck").data("deck"), 10));
    });

    $(document).on("click", ".dj-btn-beat4", function () {
      handleBeat4(parseInt($(this).closest(".dj-deck").data("deck"), 10));
    });

    $(document).on("click", '.dj-btn-cue-ch[data-channel]', function () {
      toggleChannelCue(parseInt($(this).data("channel"), 10));
    });

    $("#dj-crossfader").on("input", applyCrossfader);

    $(document).on("click", ".dj-beatfx__on", function () {
      beatFxOn = !beatFxOn;
      $(this).toggleClass("is-on", beatFxOn);
      if (beatFxOn) {
        playBeatFxSound();
        $(".dj-deck__display").addClass("is-fx-active");
        showToast("Beat FX: " + beatFxType.toUpperCase());
        setTimeout(function () {
          $(".dj-deck__display").removeClass("is-fx-active");
        }, 400);
      } else {
        showToast("Beat FX off");
      }
    });

    $(document).on("click", ".dj-beatfx__type", function () {
      $(".dj-beatfx__type").removeClass("is-active");
      $(this).addClass("is-active");
      beatFxType = $(this).data("fx");
    });

    $("[data-tempo-deck]").on("input", function () {
      var deck = $(this).data("tempo-deck");
      var val = parseInt($(this).val(), 10);
      var bpm = Math.round(128 + (val - 50) * 0.8);
      deckState[deck].bpm = bpm;
      $('[data-bpm-deck="' + deck + '"]').text(bpm);
    });

    $(document).one("click touchstart", function () {
      ensureAudio();
    });
  }

  function injectSpotifyScript() {
    if ($('script[src*="spotify.com/embed/iframe-api"]').length) return;
    var s = document.createElement("script");
    s.src = "https://open.spotify.com/embed/iframe-api/v1";
    s.async = true;
    document.body.appendChild(s);
  }

  $(document).ready(function () {
    if (!$("#dj-console").length) return;

    $(".dj-deck").each(function (i) {
      if (!$(this).data("deck")) $(this).attr("data-deck", i + 1);
    });

    enhanceDeckMarkup();
    buildTrackList();
    initDeckWaveforms();
    bindEvents();
    initJogWheel(1);
    initJogWheel(2);
    initKnobs();
    initVuMeters();
    initWaveformIdle();
    injectSpotifyScript();

    if (typeof ARTIST_CONFIG !== "undefined" && ARTIST_CONFIG.djConsole && ARTIST_CONFIG.djConsole.playlistEmbed) {
      $("#dj-spotify-playlist-embed").attr("src", ARTIST_CONFIG.djConsole.playlistEmbed);
    }
  });
})(jQuery);
