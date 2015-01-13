var app = {};
app.vars = {};
app.pages = {};

$("#spn_neodice").click(function () {
    app.showPage('gamble', { rerender: true });
    app.initNavigation();
    app.updateBalance();
});
