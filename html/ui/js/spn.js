var SPN = (function (SPN, $, undefined) {
    SPN.version = "1.2.8.1";

    SPN.init = function () {
        verifyVersion();
    }

    function verifyVersion() {
        if (!NRS.isOutdated) {
            $('#spn_multigateway').removeClass('disabled');
            $('#spn_dividends').removeClass('disabled');
            $('#spn_incorrect_version_message').hide();
        }
        else {
            $('#spn_multigateway').addClass('disabled');
            $('#spn_dividends').addClass('disabled');
            $('#spn_incorrect_version_message').show();
        }
    }
    return SPN;
}(SPN || {}, jQuery));