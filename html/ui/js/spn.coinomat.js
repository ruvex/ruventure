var SPN = (function (SPN, $, undefined) {
    var URL = "https://beta.coinomat.com/api/v1/";
    var xrate;
    var hasPublicKey = false;

    $(document).ready(function () {
        $("#spn_coinomat_fr").select2({
            formatResult: format,
            formatSelection: format,
            escapeMarkup: function (m) { return m; }
        });

        $("#spn_coinomat_to").select2({
            formatResult: format,
            formatSelection: format,
            escapeMarkup: function (m) { return m; }
        });
    });

    $("#spn_coinomat").click(function () {
        setDefaultCoinomatExchangePair();
        getExchangeRate();
        create_tunnel();

        setInterval(function () {
            refreshCoinomat()
        }, 60000);
    });

    $("#spn_coinomat_fr, #spn_coinomat_to").on("change", function (e) {
        getExchangeRate();
        create_tunnel();
    });

    function refreshCoinomat(){
        if (NRS.currentPage == "spn_coinomat") {
            getExchangeRate();
            create_tunnel();
        }
    }
    function getExchangeRate() {
        toggleLoadingMessage(true)
        var f = $("#spn_coinomat_fr").select2("val");
        var t = $("#spn_coinomat_to").select2("val");
        
        $.ajax({
            url: URL + 'get_xrate.php?f=' + f + '&t=' + t,
            dataType: 'jsonp',
            type: 'GET',
            timeout: 30000,
            crossDomain: true,
            success: function (data) {
                if (data.xrate) {
                    xrate = data;
                    xrate.xrate_global = data.xrate * data.out_prec.correction / data.in_prec.correction;
                    var xrate_unit = xrate.xrate_global * parseFloat(data.in_def);
                    xrate_unit = utoFixed(xrate_unit,(data.out_prec.dec));

                    if (!data.out_prec.fee) {
                        data.out_prec.fee = 0.0;
                    }
                    xrate.out_prec.fee = data.out_prec.fee;
                    var nv = xrate_unit - data.out_prec.fee;
                    nv = utoFixed(nv,data.out_prec.dec);

                    $("#spn_coinomat_amount_fr").val(data.in_def);
                    $('#spn_coinomat_amount_fr').prop('disabled', false);
                    if (!isNaN(nv) && (nv > 0)) {
                        $("#spn_coinomat_amount_to").val(nv);
                        $("#spn_coinomat_main_exchange").removeClass('disabled');
                    }
                    else {
                        $("#spn_coinomat_amount_to").val(0);
                    }
                    $("#spn_coinomat_exchange_message").removeClass('alert-danger').addClass('alert-success').html("Exchange rates : " + data.in_def + " " + f + " = " + xrate_unit + " " + t + (data.extra_note == null ? "" : data.extra_note) + " <br/>Exchange limits : Minimum " + data.in_min + " " + f + ", Maximum " + utoFixed(data.in_max,data.in_prec.dec) + " " + f).show();
                    check_exchange_limits();
                }
                else {
                    if (data.error) {
                        $("#spn_coinomat_amount_fr").val(0);
                        $("#spn_coinomat_amount_to").val(0);
                        $("#spn_coinomat_main_exchange").addClass('disabled');
                        $('#spn_coinomat_amount_fr').prop('disabled', true);
                        $("#div_spn_coinomat_amount_fr").removeClass("has-success has-feedback").removeClass("has-error");
                        $("#spn_coinomat_amount_fr_fail").hide();
                        $("#spn_coinomat_amount_fr_success").hide();
                        $("#spn_coinomat_exchange_message").removeClass('alert-success').addClass('alert-danger').html("Error : " + data.error);
                        
                    }
                }

                toggleLoadingMessage(false);
            }
        });
    }
    $("#spn_coinomat_amount_fr").keydown(function (e) {
        var charCode = !e.charCode ? e.which : e.charCode;

        if (isControlKey(charCode) || e.ctrlKey || e.metaKey) {
            return;
        }

        var maxFractionLength = xrate.in_prec.dec;

        if (maxFractionLength) {
            //allow 1 single period character
            if (charCode == 110 || charCode == 190) {
                if ($(this).val().indexOf(".") != -1) {
                    e.preventDefault();
                    return false;
                } else {
                    return;
                }
            }
        } else {
            //do not allow period
            if (charCode == 110 || charCode == 190 || charCode == 188) {
                $.growl("Fractions are not allowed.", {
                    "type": "danger"
                });
                e.preventDefault();
                return false;
            }
        }

        var input = $(this).val() + String.fromCharCode(charCode);
        var afterComma = input.match(/\.(\d*)$/);

        //only allow as many as there are decimals allowed..
        if (afterComma && afterComma[1].length > maxFractionLength) {
            var errorMessage = "Only " + maxFractionLength + " digits after the decimal mark are allowed.";
            $.growl(errorMessage, {
                "type": "danger"
            });

            e.preventDefault();
            return false;
        }

        //numeric characters, left/right key, backspace, delete, home, end
        if (charCode == 8 || charCode == 37 || charCode == 39 || charCode == 46 || charCode == 36 || charCode == 35 || (charCode >= 48 && charCode <= 57 && !isNaN(String.fromCharCode(charCode))) || (charCode >= 96 && charCode <= 105)) {
        } else {
            //comma
            if (charCode == 188) {
                $.growl("Comma is not allowed, use a dot instead.", {
                    "type": "danger"
                });
            }
            e.preventDefault();
            return false;
        }
    });
    $("#spn_coinomat_amount_fr").keyup(function (e) {
        update_to_val();
    });
    $('#spn_coinomat_exchanger_modal').on('show.bs.modal', function () {
        create_tunnel();
        activateNXT();
    })
    $('#spn_coinomat_exchanger_modal').on('hidden.bs.modal', function () {
        setTimeout(function () {
            create_tunnel();
        }, 10000);
    })

    function activateNXT() {
        var activateURL = "NXT_activate.php?NXT_account=" + NRS.accountRS + "&nxt_public_key=" + NRS.publicKey;
        
        NRS.sendRequest("getAccountPublicKey", {
            "account": NRS.accountRS
        }, function (response) {
            if (!response.publicKey)
            {
                $.ajax({
                    url: URL + activateURL,
                    dataType: 'jsonp',
                    type: 'GET',
                    timeout: 30000,
                    crossDomain: true,
                    success: function (data) {
                        $("#spn_coinomat_exchanger_pubkey_message").addClass('alert-success').removeClass('alert-danger').html("Your public key is automatically registered with Coinomat.");
                    },
                    error: function (data) {
                        $("#spn_coinomat_exchanger_pubkey_message").addClass('alert-danger').removeClass('alert-success').html("There is error registered your public key with Coinomat.");
                    }
                });
            }
            else {
                hasPublicKey = true;
                $("#spn_coinomat_exchanger_pubkey_message").hide();
            }
        });
    }
    function create_tunnel() {
        toggleCoinomatExchangerLoading(true);
        toggleTransactionHistoryLoading(true);
        var f = $("#spn_coinomat_fr").select2("val");
        var t = $("#spn_coinomat_to").select2("val");
        var tunnelURL = "create_tunnel.php?currency_from=" + f + "&currency_to=" + t;

        //TODO
        switch (f) {
            case "BTC": {
                switch (t) {
                    case "NXT": {
                        tunnelURL += "&wallet_to=" + NRS.accountRS;
                    }
                }
            }
        }

        $.ajax({
            url: URL + tunnelURL,
            dataType: 'jsonp',
            type: 'GET',
            timeout: 30000,
            crossDomain: true,
            success: function (data) {
                if (data.ok && data.tunnel_id && data.k1 && data.k2) {
                    get_tunnel(data.tunnel_id, data.k1, data.k2)
                }
            }
        });
    }
    function get_tunnel(id, k1, k2) {
        var getTunnelURL = "get_tunnel.php?xt_id=" + id + "&k1=" + k1 + "&k2=" + k2 + "&history=1";
        
        $.ajax({
            url: URL + getTunnelURL,
            dataType: 'jsonp',
            type: 'GET',
            timeout: 30000,
            crossDomain: true,
            success: function (data) {
                if (data.tunnel) {
                    var rate = data.tunnel.xrate_fixed * data.tunnel.out_prec.correction / data.tunnel.in_prec.correction;
                    var amountReceived = parseFloat(rate) - parseFloat(data.tunnel.out_prec.fee);
                    amountReceived = utoFixed(parseFloat(amountReceived), (data.tunnel.out_prec.dec));
                    $("#spn_coinomat_in_address_label").text("Please send " + data.tunnel.currency_from + " to this address: ");
                    $("#spn_coinomat_in_address").text(data.tunnel.wallet_from);
                    $("#spn_coinomat_exchanger_message").html("Exchange rates : " + data.tunnel.in_def + " " + data.tunnel.currency_from + " = " + amountReceived + " " + data.tunnel.currency_to + " <br/>Exchange limits : Minimum " + data.tunnel.in_min + " " + data.tunnel.currency_from + ", Maximum " + data.tunnel.in_max + " " + data.tunnel.currency_from + "<br/><br/>This rate is valid for 30 minutes from now ").show();
                    toggleCoinomatExchangerLoading(false);
                    showTransactionHistory(data, data.tunnel.currency_to);
                }
            }
        });
    }
    function showTransactionHistory(data, currency_to) {
        var rows = "";

        if (data.history.length > 0) {
            $("#spn_coinomat_history_in").html("In, " + data.history[0].currency_in);
            $("#spn_coinomat_history_out").html("Out, " + currency_to);

            $.each(data.history, function (i, v) {
                var ex_rate, out, status;
                (parseFloat(v.xrate_fixed) == 0 ? ex_rate = utoFixed(data.tunnel.xrate_fixed,data.tunnel.out_prec.dec) : ex_rate = v.xrate_fixed);
                (v.amount_out == "" ? out = "" : out = v.amount_out);
                (v.state_in_text == "unconfirmed" ? status = "waiting for confirmation" : status = "");
                if (status == "") status = v.state_out_text;
                rows += "<tr><td>" + v.added + "</td><td>" + v.amount_in + "</td><td>" + ex_rate + "</td><td>" + out + "</td><td>" + status + "</td></tr>";

            });
            $("#spn_coinomat_history").removeClass('data-empty');
            $("#spn_coinomat_history table tbody").empty().append(rows);
        }
        else {
            $("#spn_coinomat_history").addClass('data-empty');
        }

        toggleTransactionHistoryLoading(false);
    }
    function check_exchange_limits() {
        var a_val = parseFloat($("#spn_coinomat_amount_fr").val())

        $("#spn_coinomat_amount_fr_fail").attr('data-content', "Mininum : " + xrate.in_min + " " + $("#spn_coinomat_fr").select2("val") + " <br> Maximum : " + utoFixed(xrate.in_max,xrate.in_prec.dec) + " " + $("#spn_coinomat_fr").select2("val"));

        if (xrate && !isNaN(a_val) && ((a_val >= xrate.in_min) && (a_val <= xrate.in_max))) {
            toggleAmountFromValidation(true);
        }
        else {
            toggleAmountFromValidation(false);
        }
    }
    function update_to_val() {
        var xrate_unit = xrate.xrate_global * parseFloat($("#spn_coinomat_amount_fr").val());
        xrate_unit = utoFixed(xrate_unit,xrate.out_prec.dec);
        var nv = xrate_unit - xrate.out_prec.fee;
        nv = utoFixed(nv,xrate.out_prec.dec);

        if (!isNaN(nv) && (nv > 0))
        {
            $("#spn_coinomat_amount_to").val(nv);
            check_exchange_limits();
        }
        else {
            $("#spn_coinomat_amount_to").val(0);
            toggleAmountFromValidation(false);
        }
    }
    function toggleAmountFromValidation(isTrue) {
        if (isTrue) {
            $("#div_spn_coinomat_amount_fr").addClass("has-success has-feedback").removeClass("has-error");
            $("#spn_coinomat_main_exchange").removeClass('disabled');
            $("#spn_coinomat_amount_fr_fail").hide();
            $("#spn_coinomat_amount_fr_success").show();
        }
        else
        {
            $("#div_spn_coinomat_amount_fr").addClass("has-error has-feedback").removeClass("has-success");
            $("#spn_coinomat_main_exchange").addClass('disabled');
            $("#spn_coinomat_amount_fr_fail").show();
            $("#spn_coinomat_amount_fr_success").hide();
        }
    }
    function toggleLoadingMessage(isLoading) {
        if (isLoading) {
            $("#spn_coinomat_exchange_message").hide();
            $("#spn_coinomat_loading").show();
            
        }else
        {
            $("#spn_coinomat_exchange_message").show();
            $("#spn_coinomat_loading").hide();
        }
    }
    function toggleCoinomatExchangerLoading(isLoading) {
        if (isLoading) {
            $("#spn_coinomat_exchanger_loading").show();
            $("#spn_coinomat_exchanger_content > div").hide();
        } else {
            $("#spn_coinomat_exchanger_loading").hide();
            $("#spn_coinomat_exchanger_content > div").show();
            (hasPublicKey ? $("#spn_coinomat_exchanger_pubkey_message").hide() : $("#spn_coinomat_exchanger_pubkey_message").show());
        }
    }
    function toggleTransactionHistoryLoading(isLoading) {
        if (isLoading) {
            $("#spn_coinomat_history").addClass('data-loading');
        }
        else {
            $("#spn_coinomat_history").removeClass('data-loading');
        }
    }
    function setDefaultCoinomatExchangePair() {
        $("#spn_coinomat_fr").select2("val", "BTC");
        $("#spn_coinomat_to").select2("val", "NXT");
    }
    function format(currency) {
        if (!currency.id) return currency.text;
        return "<img src='img/coinomat/" + currency.id + ".png'/> " + currency.text;
    }
    function isControlKey(charCode) {
        if (charCode >= 32)
            return false;
        if (charCode == 10)
            return false;
        if (charCode == 13)
            return false;

        return true;
    }
    function utoFixed(num, fixed) {
        fixed = fixed || 0;
        fixed = Math.pow(10, fixed);
        return Math.round(num * fixed) / fixed;
    }
    return SPN;
}(SPN || {}, jQuery));