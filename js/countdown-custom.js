jQuery(document).ready(function () {
  var cd = typeof ARTIST_CONFIG !== "undefined" && ARTIST_CONFIG.countdown
    ? ARTIST_CONFIG.countdown
    : { year: 2026, month: 8, day: 15, hour: 21 };

  $("#defaultCountdown").countdown({
    until: new Date(cd.year, cd.month - 1, cd.day, cd.hour),
  });
});
