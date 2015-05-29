var app = {};
app.vars = {
    debug: false
};
app.pages = {};
app.models = {};

$("#spn_neodice").click(function () {

    var onError = console.log.bind(console, 'Remote host returned broken data');

    $.ajax({
        url: 'http://neodice.com/pull/data.json',
        type: 'get', success: function(data) {
            if (data && data.bankroll && data.bankroll.total) {
                app.config.bankroll = data.bankroll.total;
                app.showPage('gamble', { rerender: true });
                app.validateInputs();
                app.initNavigation();
                app.updateBalance();
            } else {
                onError();
            }
        }, error: onError })

});
