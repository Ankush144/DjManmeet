/**
 * DJ Portfolio — interactions & config binding
 */
(function ($) {
  "use strict";

  function applyArtistConfig() {
    if (typeof ARTIST_CONFIG === "undefined") return;
    var c = ARTIST_CONFIG;

    document.title = c.meta.title;
    $('meta[name="description"]').attr("content", c.meta.description);
    $('meta[name="keywords"]').attr("content", c.meta.keywords);
    $('meta[name="author"]').attr("content", c.meta.author);

    $("[data-artist-name]").text(c.name);
    $("[data-artist-tagline]").text(c.tagline);
    $("[data-hero-subtitle]").text(c.heroSubtitle);

    $("[data-link-book]").attr("href", c.links.book);
    $("[data-link-spotify]").attr("href", c.links.spotify);
    $("[data-link-youtube]").attr("href", c.links.youtube);
    $("[data-link-soundcloud]").attr("href", c.links.soundcloud);
    $("[data-link-whatsapp]").attr("href", c.links.whatsapp);
    $("[data-link-email]").attr("href", c.links.email);
    $("[data-link-instagram]").attr("href", c.links.instagram);
    $("[data-link-facebook]").attr("href", c.links.facebook);

    $("[data-contact-address]").text(c.contact.address);
    $("[data-contact-phone]").text(c.contact.phone);
    $('[data-contact-email]').attr("href", "mailto:" + c.contact.email).text(c.contact.email);

    if (c.stats) {
      $("[data-count-years]").attr("data-to", c.stats.years);
      $("[data-count-events]").attr("data-to", c.stats.events);
      $("[data-count-countries]").attr("data-to", c.stats.countries);
      $("[data-count-releases]").attr("data-to", c.stats.releases);
    }
  }

  function initCounters() {
    if (!$.fn.countTo) return;
    var $counters = $(".dj-counter");
    if (!$counters.length) return;

    function runCount() {
      $counters.each(function () {
        var $el = $(this);
        if ($el.data("counted")) return;
        var top = $el.offset().top;
        var scroll = $(window).scrollTop() + $(window).height() * 0.88;
        if (scroll > top) {
          $el.data("counted", true);
          $el.countTo({
            from: 0,
            to: parseInt($el.data("to"), 10) || 0,
            speed: 2200,
            refreshInterval: 40,
          });
        }
      });
    }

    $(window).on("scroll", runCount);
    runCount();
  }

  function initBrandsCarousel() {
    if (!$.fn.owlCarousel || !$("#brands-carousel").length) return;
    $("#brands-carousel").owlCarousel({
      center: false,
      items: 5,
      loop: true,
      margin: 30,
      nav: false,
      dots: false,
      autoplay: true,
      autoplayTimeout: 2800,
      autoplayHoverPause: true,
      responsive: {
        1200: { items: 5 },
        992: { items: 4 },
        768: { items: 3 },
        0: { items: 2 },
      },
    });
  }

  function initTestimonialCarousel() {
    if (!$.fn.owlCarousel || !$("#testimonial-carousel").length) return;
    $("#testimonial-carousel").owlCarousel({
      items: 1,
      loop: true,
      margin: 20,
      nav: true,
      dots: true,
      autoplay: true,
      autoplayTimeout: 6000,
    });
  }

  function initGalleryIsotope() {
    if (!$.fn.isotope || !$("#gallery").length) return;
    var $grid = $("#gallery");
    $grid.isotope({
      itemSelector: ".item",
      layoutMode: "masonry",
    });
    $(window).on("load", function () {
      $grid.isotope("layout");
    });
  }

  $(document).ready(function () {
    applyArtistConfig();
    initCounters();
    initBrandsCarousel();
    initTestimonialCarousel();
    initGalleryIsotope();
  });
})(jQuery);
