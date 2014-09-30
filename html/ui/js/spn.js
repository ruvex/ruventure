var SPN = (function (SPN, $, undefined) {
    SPN.version = "1.2.8.1";

    $("#spn_landing").click(function () {
        verifyBlockchainStatus();
    });

    SPN.init = function () {
        verifyVersion();
        verifyBlockchainStatus();
    }

    function verifyBlockchainStatus() {
        if (NRS.downloadingBlockchain) {
            $("#spn_message").addClass("alert-success").removeClass("alert-danger").html($.t("status_blockchain_downloading")).show();
            return;
        } else if (NRS.state.isScanning) {
            $("#spn_message").addClass("alert-success").removeClass("alert-danger").html($.t("error_form_blockchain_rescanning")).show();
            return;
        }
    }

    function verifyVersion() {
        if (NRS.isOutdated) {
            $('#spn_multigateway').addClass('disabled');
            $('#spn_dividends').addClass('disabled');
            $('#spn_message').addClass("alert-danger").removeClass("alert-success").html("A new SuperNET release is available. Please update from your dashboard to continue using SuperNET features.").show();
        }
        else {
            $('#spn_multigateway').removeClass('disabled');
            $('#spn_dividends').removeClass('disabled');
            $('#spn_message').hide();
        }
    }
    return SPN;
}(SPN || {}, jQuery));