var app = {};
app.vars = {
    debug: false
};
app.pages = {};
app.models = {};

$("#spn_neodice").click(function () {
    app.showPage('gamble', { rerender: true });
    app.initNavigation();
    app.updateBalance();
});
