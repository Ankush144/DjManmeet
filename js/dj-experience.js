/**
 * Ultra-Premium DJ Experience — motion, particles, cursor, parallax
 */
(function ($) {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  function applyLuxuryConfig() {
    if (typeof ARTIST_CONFIG === "undefined") return;
    var c = ARTIST_CONFIG;

    $(".dj-preloader-logo").text(c.name);
    $("[data-count-streams]").attr("data-to", c.stats.streams);
    $("[data-count-listeners]").attr("data-to", c.stats.listeners);
    $("[data-count-soldout]").attr("data-to", c.stats.soldOut);
    $("[data-count-fans]").attr("data-to", c.stats.fans);

    if (c.floatingPlayer) {
      $("[data-fp-track]").text(c.floatingPlayer.track);
      $("#dj-float-player iframe").attr("src", c.floatingPlayer.spotifyEmbed);
    }

    if (c.links.tiktok) {
      $("[data-link-tiktok]").attr("href", c.links.tiktok);
    }
  }

  function initPreloader() {
    var $preloader = $("#preloader");
    if (!$preloader.length) return;

    $preloader.addClass("dj-preloader");
    if (!$preloader.find(".dj-preloader-inner").length) {
      $preloader.html(
        [
          '<div class="dj-preloader-inner">',
          '<div class="dj-preloader-logo">DJ</div>',
          '<div class="dj-preloader-eq"><span></span><span></span><span></span><span></span><span></span></div>',
          '<div class="dj-preloader-bar"><span></span></div>',
          "</div>",
        ].join("")
      );
    }

    $(window).on("load", function () {
      setTimeout(function () {
        $preloader.fadeOut(800, function () {
          $(this).remove();
          $("body").addClass("is-loaded");
        });
      }, prefersReducedMotion ? 400 : 2200);
    });
  }

  function initParticles() {
    if (prefersReducedMotion) return;
    var canvas = document.getElementById("dj-particles");
    if (!canvas) return;

    var ctx = canvas.getContext("2d");
    var particles = [];
    var count = isTouch ? 35 : 70;
    var w, h;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }

    function create() {
      particles = [];
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.8 + 0.4,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          a: Math.random() * 0.5 + 0.15,
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 245, 255, " + p.a + ")";
        ctx.fill();
      }
      for (var j = 0; j < particles.length; j++) {
        for (var k = j + 1; k < particles.length; k++) {
          var dx = particles[j].x - particles[k].x;
          var dy = particles[j].y - particles[k].y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.strokeStyle = "rgba(0, 245, 255, " + 0.08 * (1 - dist / 100) + ")";
            ctx.beginPath();
            ctx.moveTo(particles[j].x, particles[j].y);
            ctx.lineTo(particles[k].x, particles[k].y);
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    }

    resize();
    create();
    draw();
    $(window).on("resize", function () {
      resize();
      create();
    });
  }

  function initCursor() {
    if (isTouch || prefersReducedMotion) return;
    var $glow = $("#cursor-glow");
    var $ring = $("#cursor-ring");
    if (!$glow.length) return;

    var mx = 0,
      my = 0,
      rx = 0,
      ry = 0;

    $(document).on("mousemove", function (e) {
      mx = e.clientX;
      my = e.clientY;
    });

    function loop() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      $glow.css({ left: mx, top: my });
      $ring.css({ left: rx, top: ry });
      requestAnimationFrame(loop);
    }
    loop();

    $("a, button, .btn-main, .btn-luxury-primary, input, select, textarea, .glass-card").on(
      "mouseenter",
      function () {
        $glow.add($ring).addClass("is-hover");
      }
    );
    $("a, button, .btn-main, .btn-luxury-primary, input, select, textarea, .glass-card").on(
      "mouseleave",
      function () {
        $glow.add($ring).removeClass("is-hover");
      }
    );
  }

  function initScrollProgress() {
    var $bar = $(".scroll-progress-bar");
    if (!$bar.length) return;
    var circumference = 126;

    $(window).on("scroll", function () {
      var scrollTop = $(window).scrollTop();
      var docHeight = $(document).height() - $(window).height();
      var progress = docHeight > 0 ? scrollTop / docHeight : 0;
      $bar.css("stroke-dashoffset", circumference - progress * circumference);
      $(".scroll-progress-wrap").toggleClass("is-visible", scrollTop > 400);
    });
  }

  function initHeaderGlass() {
    var $header = $("header");
    $(window).on("scroll", function () {
      if ($(window).scrollTop() > 60) {
        $header.addClass("glass-nav smaller");
      } else {
        $header.removeClass("glass-nav smaller");
      }
    });
  }

  function initReveals() {
    var $els = $(".reveal");
    if (!$els.length) return;

    function check() {
      var viewBottom = $(window).scrollTop() + $(window).height() * 0.88;
      $els.each(function () {
        var $el = $(this);
        if ($el.hasClass("is-visible")) return;
        if ($el.offset().top < viewBottom) {
          $el.addClass("is-visible");
        }
      });
    }

    $(window).on("scroll resize", check);
    check();
  }

  function initParallax() {
    if (prefersReducedMotion) return;

    $("[data-parallax]").each(function () {
      var $el = $(this);
      $el.data("parallax-speed", parseFloat($el.data("parallax")) || 0.12);
    });

    $(window).on("scroll", function () {
      var scroll = $(window).scrollTop();
      $("[data-parallax]").each(function () {
        var $el = $(this);
        var y = (scroll - $el.offset().top) * $el.data("parallax-speed");
        $el.css("transform", "translate3d(0, " + y + "px, 0)");
      });
    });
  }

  function initFloatingPlayer() {
    var $player = $("#dj-float-player");
    if (!$player.length) return;

    setTimeout(function () {
      $player.addClass("is-visible");
    }, 3500);

    $player.find(".dj-fp-header").on("click", function (e) {
      if (!$(e.target).hasClass("dj-fp-toggle")) {
        $player.toggleClass("is-minimized");
      }
    });

    $player.find(".dj-fp-toggle").on("click", function (e) {
      e.stopPropagation();
      $player.removeClass("is-visible");
    });
  }

  function initVideoHover() {
    $(".dj-video-cinematic[data-video-src]").each(function () {
      var $wrap = $(this);
      var src = $wrap.data("video-src");
      if (!src) return;
      var $video = $("<video muted loop playsinline></video>").attr("src", src);
      $wrap.append($video);

      $wrap.on("mouseenter", function () {
        var v = $video[0];
        if (v) {
          v.play();
          $wrap.addClass("is-playing");
        }
      });
      $wrap.on("mouseleave", function () {
        var v = $video[0];
        if (v) {
          v.pause();
          v.currentTime = 0;
          $wrap.removeClass("is-playing");
        }
      });
    });
  }

  function initBrandsMarquee() {
    if (!$("#brands-marquee").length || !$.fn.owlCarousel) return;
    $("#brands-marquee").owlCarousel({
      items: 5,
      loop: true,
      margin: 40,
      nav: false,
      dots: false,
      autoplay: true,
      autoplayTimeout: 3000,
      autoplayHoverPause: true,
      responsive: {
        1200: { items: 6 },
        768: { items: 4 },
        0: { items: 2 },
      },
    });
  }

  function initEqReactive() {
    if (prefersReducedMotion) return;
    $(".dj-eq-reactive").each(function () {
      var bars = $(this).find("span");
      setInterval(function () {
        bars.each(function () {
          $(this).css("height", 8 + Math.random() * 40 + "px");
        });
      }, 120);
    });
  }

  $(document).ready(function () {
    $("html").addClass("dj-luxury-scroll");
    applyLuxuryConfig();
    initPreloader();
    initParticles();
    initCursor();
    initScrollProgress();
    initHeaderGlass();
    initReveals();
    initParallax();
    initFloatingPlayer();
    initVideoHover();
    initBrandsMarquee();
    initEqReactive();
  });
})(jQuery);
