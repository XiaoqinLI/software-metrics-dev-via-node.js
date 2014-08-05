widget = {
    onData: function(el, data) {
        $('.content', el).empty();

        if (data.title) {
            $('h2', el).text(data.title);
        }

        if (data.quotes.length > 0) {
            data.quotes.forEach(function(quote) {
                $('.content', el).append(
                    "<blockquote>" + quote.quote + "<cite>" + quote.author + "</cite></blockquote>"
                );
            });

        } else {
            $('.content', el).append(
                "<blockquote>NO QUOTES FOUND<blockquote>"
            );
        }
    }
};