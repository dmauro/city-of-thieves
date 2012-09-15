$(function() {
    $('#cr-stage').click(function() {
        $('.controls')
            .css({'backgroundColor': '#5bb75b'})
            .animate({'backgroundColor': '#fff'}, 3000);
        $(this).empty().unbind();
        setTimeout(game.init, 0);
    }).click();
});
