var SPN = (function(SPN, $){
    var webURL = "http://localhost:3002";
    var URL = webURL + "/api/device";
    var secret;

    var isDebug = true;

    var accountLinked = null;

    var masterPubKey, nrs;
    var fundAmount;
    var linkCode;
    var nxtAccountId;

    $("#spn_nxtvault").click(function(){
        $("#linkedMessage").hide();
        $('#fund_message').hide();
        $("#linkedMessage").hide();
        $(".account_link_code").show();
        $("#spn_nxtvault_activate").text("Activate");
        $("#spn_nxtvault_activate").addClass("disabled");

        checkLinkedAccount();
    });

    $("#spn_nxtvault_link, #spn_nxtvault_fund_amount").on("input", function(){
        if ((accountLinked || $("#spn_nxtvault_link").val() != "") && $("#spn_nxtvault_fund_amount") != ""){
            $("#spn_nxtvault_activate").removeClass("disabled");
        }
        else{
            $("#spn_nxtvault_activate").addClass("disabled");
        }
    });

    $("#spn_nxtvault_activate").click(function(){
        $('#nxtvault_modal').modal('show');

        linkCode = $("#spn_nxtvault_link").val();
        fundAmount = $("#spn_nxtvault_fund_amount").val();
        nxtAccountId = NRS.accountRS;

        if (NRS.rememberPassword){
            $("#nxtvault_model .secret_phrase").hide();
        }

        $("#spn_nxtvault_loading").show();
        $("#nxtvault_activate_form").hide();
        $("#nxtvault_modal_error_message").hide();
        $("#btnActivate").removeAttr('disabled', 'disabled');

        $.ajax({
            url: URL,
            dataType: 'json',
            contentType: 'application/json; charset=UTF-8',
            type: 'POST',
            timeout: 30000,
            crossDomain: true,
            data: JSON.stringify({cmd: "verify", code: linkCode, accountId: nxtAccountId}),
            success: function (data) {
                if (data.errorCode == 0){
                    masterPubKey = data.data.masterPublicKey;
                    var accountId = NRS.getAccountIdFromPublicKey(masterPubKey);
                    nrs = NRS.convertNumericToRSAccountFormat(accountId);

                    $("#nxtvault_nxt_recipient").val(nrs);
                    $("#nxtvault_nxt_amount").val(fundAmount);

                    $("#spn_nxtvault_loading").hide();
                    $("#nxtvault_activate_form").show();

                    if (isNaN(fundAmount)){
                        $("#nxtvault_modal_error_message").text("Invalid funding amount.").show();
                        $("#btnActivate").attr('disabled', 'disabled');
                    }
                }
                else{
                    $("#spn_nxtvault_loading").hide();

                    $("#nxtvault_modal_error_message").text("Invalid code entered.").show();
                    $("#btnActivate").attr('disabled', 'disabled');
                }
            },

            error: function(err){

            }
        });

//        function showError(text){
//            if (!text){
//                $("#linkedMessage").text("There was an error. Please check your verification code and try again").show();
//            }
//            else{
//                $("#linkedMessage").text(text).show();
//            }
//
//            $("#linkedMessage").show();
//            $("#spn_nxtvault_loading").hide();
//        }
    });

    SPN.linkNxtVaultAccount = function(){
        $.ajax({
            url: URL,
            dataType: 'json',
            contentType: 'application/json; charset=UTF-8',
            type: 'POST',
            timeout: 30000,
            crossDomain: true,
            data: JSON.stringify({cmd: "verify", code: linkCode, accountId: NRS.accountRS, verify: true}),
            success: function (data) {
                if (data.errorCode === 0){
                    //Send the required initial funding money to the master account
                    NRS.sendRequest("sendMoney", {"secretPhrase": $("#nxtvault_passphrase").val(), feeNQT: "100000000", deadline: "1440", recipient: nrs, recipientPublicKey: data.data.masterPubKey, amountNXT: fundAmount}, function (response, input) {
                        if (!response.errorCode || response.errorCode == 0) {
                            $('#nxtvault_modal').modal('hide');
                        }
                        else{
                            $("#nxtvault_modal_error_message").text(response.errorText).show();
//                            $("#linkedMessage").show();
//                            $("#fund_message").text("Fund Successful!");
//                            $('#fund_message').show();
//                            $("#spn_nxtvault_fund_amount").val("");
//                            checkLinkedAccount();
//                        }
//                        else {
//                            $('#fund_message').show();
//                            $("#fund_message").text(response.errorDescription);
                        }

                        $("#spn_nxtvault_loading").hide();
                    }, false);
                }
                else{
                    $("#spn_nxtvault_loading").hide();
                    $("#nxtvault_modal_error_message").text(response.errorText).show();
                }
            },
            error: function(data){
                showError();
            }
        });
    }

    function checkLinkedAccount(){
        $.ajax({
            url: URL,
            dataType: 'json',
            contentType: 'application/json; charset=UTF-8',
            type: 'POST',
            timeout: 30000,
            crossDomain: true,
            data: JSON.stringify({cmd: "getAccountByLinkedPubKey", pubKey: NRS.publicKey}),
            success: function (data) {
                $("#spn_nxtvault_link, #spn_nxtvault_fund_amount").removeAttr('disabled', 'disabled');

                if (data.errorCode == 0){
                    accountLinked = NRS.convertNumericToRSAccountFormat(NRS.getAccountIdFromPublicKey(data.data.masterPubKey));

                    $("#linkedMessage").text("Account is locked and protected by: " + accountLinked);
                    $("#linkedMessage").show();
                    $("#spn_nxtvault_link").attr('disabled', 'disabled');
                    $("#spn_nxtvault_loading").hide();
                    $("#activate_message").hide();
                    $("#spn_nxtvault_activate").text("Fund");
                    $(".account_link_code").hide();
                }
            },
            error: function(data){
                accountLinked = null;

                $("#linkedMessage").text("There was an error. Please check your verification code and try again").show();
                $("#linkedMessage").show();
                $("#spn_nxtvault_link, #spn_nxtvault_fund_amount").attr('disabled', 'disabled');
                $("#spn_nxtvault_loading").hide();
            }
        });
    }

    return SPN;
}(SPN || {}, jQuery));