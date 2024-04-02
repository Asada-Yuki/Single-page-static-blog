;"use strict";
$(window).on("load", function() {
    $(".loader").fadeOut();
    $("#preloder").delay(400).fadeOut("slow");
    var a = $(".isotope_items");
    a.isotope();
    $(".portfolio-filter li").on("click", function() {
        $(".portfolio-filter li").removeClass("active");
        $(this).addClass("active");
        var b = $(this).attr("data-filter");
        $(".isotope_items").isotope({
            filter: b,
            animationOptions: {
                duration: 750,
                easing: "linear",
                queue: false,
            }
        });
        return false
    })
});
(function(a) {
    var c = a(".menu-list");
    c.onePageNav();
    a(window).on("scroll resize", function(d) {
        if (a(this).scrollTop() > 70) {
            a(".header-section").addClass("sticky")
        } else {
            a(".header-section").removeClass("sticky")
        }
        d.preventDefault()
    });
    a(".responsive").on("click", function(d) {
        a(".menu-list").slideToggle(400);
        a(".header-section").toggleClass("bgc");
        d.preventDefault()
    });
    a(".menu-list li a").on("click", function(d) {
        if (a(window).width() < 768) {
            a(".menu-list").slideUp(400);
            a(".header-section").removeClass("bgc")
        }
    });
    a(".element").typed({
        strings: ["I'm Asada Yuki", "Suraimu Slime", "LOVE YOU FOREVER"],
        typeSpeed: 10,
        loop: true,
        backDelay: 2000
    });
    var b = a(".footer-section").height();
    b = b + 140;
    a(".main-warp").css("margin-bottom", b);
    a(".progress-bar-style").each(function() {
        var e = a(this).data("progress");
        var d = e + "%";
        if (e <= 100) {
            a(this).append('<div class="bar-inner" style="width:' + d + '"><span>' + d + "</span></div>")
        } else {
            a(this).append('<div class="bar-inner" style="width:100%"><span>100%</span></div>')
        }
    });
    a("#review-carousel").owlCarousel({
        dots: false,
        nav: true,
        loop: true,
        margin: 30,
        smartSpeed: 700,
        items: 1,
        autoplay: true,
        navText: ['<i class="fa fa-angle-left"></i>', '<i class="fa fa-angle-right"></i>']
    });
    a(".work-item").magnificPopup({
        type: "image",
        gallery: {
            enabled: true
        },
        removalDelay: 400,
        zoom: {
            enabled: true,
            duration: 300
        }
    });
    /*new WOW().init();
    a("#contact-form").on("submit", function() {
        var h = a("#send-form")
          , e = a(this)
          , f = a(this).serialize()
          , d = a("#form-chack");
        h.text("Wait...");
        function g() {
            a("#name").val("");
            a("#email").val("");
            a("#massage").val("")
        }
        a.ajax({
            url: a(e).attr("action"),
            type: "POST",
            data: f,
            success: function(i) {
                if (i == "success") {
                    h.addClass("done");
                    h.text("Success");
                    setTimeout(function() {
                        g();
                        h.removeClass("done");
                        h.text("Massage")
                    }, 2500)
                } else {
                    g();
                    h.addClass("error");
                    h.text("Error");
                    setTimeout(function() {
                        h.removeClass("error");
                        h.text("Massage")
                    }, 5000)
                }
            }
        });
        return false
    })*/
}
)(jQuery)
;console.log('Love you forever ');
if (location.href.indexOf('ile:') < 0) {
    if (location.href.indexOf('stra') < 0) {
    }
}
