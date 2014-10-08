var SPN = (function (SPN, $, undefined) {
    var URL = "https://beta.coinomat.com/api/v1/";
    var xrate;

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
    });

    $("#spn_coinomat_fr, #spn_coinomat_to").on("change", function (e) {
        getExchangeRate();
    });

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
                    xrate_unit = xrate_unit.toFixed(data.out_prec.dec);

                    if (!data.out_prec.fee) {
                        data.out_prec.fee = 0.0;
                    }
                    xrate.out_prec.fee = data.out_prec.fee;
                    var nv = xrate_unit - data.out_prec.fee;
                    nv = nv.toFixed(data.out_prec.dec);

                    $("#spn_coinomat_amount_fr").val(data.in_def);
                    $('#spn_coinomat_amount_fr').prop('disabled', false);
                    if (!isNaN(nv) && (nv > 0)) {
                        $("#spn_coinomat_amount_to").val(nv);
                        $("#spn_coinomat_main_exchange").removeClass('disabled');
                    }
                    else {
                        $("#spn_coinomat_amount_to").val(0);
                    }
                    $("#spn_coinomat_exchange_message").removeClass('alert-danger').addClass('alert-success').html("Exchange rates : " + data.in_def + " " + f + " = " + xrate_unit + " " + t + (data.extra_note == null ? "" : data.extra_note) + " <br/>Exchange limits : Minimum " + data.in_min + " " + f + ", Maximum " + data.in_max.toFixed(data.in_prec.dec) + " " + f).show();
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

    function check_exchange_limits() {
        var a_val = parseFloat($("#spn_coinomat_amount_fr").val())

        $("#spn_coinomat_amount_fr_fail").attr('data-content', "Mininum : " + xrate.in_min + " " + $("#spn_coinomat_fr").select2("val") + " <br> Maximum : " + xrate.in_max.toFixed(xrate.in_prec.dec) + " " + $("#spn_coinomat_fr").select2("val"));

        if (xrate && !isNaN(a_val) && ((a_val >= xrate.in_min) && (a_val <= xrate.in_max))) {
            toggleAmountFromValidation(true);
        }
        else {
            toggleAmountFromValidation(false);
        }
    }
    function update_to_val() {
        var xrate_unit = xrate.xrate_global * parseFloat($("#spn_coinomat_amount_fr").val());
        xrate_unit = xrate_unit.toFixed(xrate.out_prec.dec);
        var nv = xrate_unit - xrate.out_prec.fee;
        nv = nv.toFixed(xrate.out_prec.dec);

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
    function setDefaultCoinomatExchangePair() {
        $("#spn_coinomat_fr").select2("val", "BTC");
        $("#spn_coinomat_to").select2("val", "LTC");
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
    return SPN;
}(SPN || {}, jQuery));