var SPN = (function(SPN, $){
    var webURL = "http://localhost:3002";
    var URL = webURL + "/api/device";
    var secret;

    var isDebug = true;

    var accountLinked = null;

    $("#spn_nxtvault").click(function(){
        var pubKey = NRS.publicKey;

        $("#linkedMessage").hide();
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
        var linkCode = $("#spn_nxtvault_link").val();
        var fundAmount = $("#spn_nxtvault_fund_amount").val();
        var nxtAccountId = NRS.accountRS;

        if (!NRS.rememberPassword) {
            secret = document.getElementById("nsv_div_send_password").value;
            secret = $.trim(secret);
            if (secret === "") {
                err_message = "Secret Phrase not specified";
            } else {
                var accountId = NRS.getAccountId(secret);
                //var accountId = NRS.generateAccountId(secret);
                if (accountId != NRS.account) {
                    err_message = "Secret Phrase doesn't match";
                }
            }
        } else {
            secret = NRS._password;
        }

        $("#spn_nxtvault_loading").show();


        //Make the request to link the account.
        if (!accountLinked){
            $.ajax({
                url: URL,
                dataType: 'json',
                contentType: 'application/json; charset=UTF-8',
                type: 'POST',
                timeout: 30000,
                crossDomain: true,
                data: JSON.stringify({cmd: "verify", code: linkCode, accountId: nxtAccountId}),
                success: function (data) {
                    if (data.errorCode === 0){
                        //Send the required initial funding money to the master account
                        NRS.sendRequest("sendMoney", {"secretPhrase": secret, feeNQT: "100000000", deadline: "1440", recipient: data.data.masterRs, recipientPublicKey: data.data.masterPubKey, amountNXT: fundAmount}, function (response, input) {
                            if (!response.errorCode || response.errorCode == 0) {
                                $("#linkedMessage").show();
                                $("#fund_message").text("Fund Successful!");
                                $('#fund_message').show();
                                checkLinkedAccount();
                            }
                            else {
                                $('#fund_message').show();
                                $("#fund_message").text(response.errorDescription);
                            }

                            $("#spn_nxtvault_loading").hide();
                        }, false);
                    }
                    else{
                        showError(data.errorText);
                    }
                },
                error: function(data){
                    showError();
                }
            });
        }
        else{
            //fund an already initialized account
            NRS.sendRequest("sendMoney", {"secretPhrase": secret, feeNQT: "100000000", deadline: "1440", recipient: accountLinked, amountNXT: fundAmount}, function (response, input) {
                if (!response.errorCode || response.errorCode == 0) {
                    $("#linkedMessage").show();
                    $("#fund_message").text("Fund Successful!");
                    $('#fund_message').show();
                    checkLinkedAccount();
                }
                else {
                    $('#fund_message').show();
                    $("#fund_message").text(response.errorDescription);
                }

                $("#spn_nxtvault_loading").hide();
            }, false);
        }


        function showError(text){
            if (!text){
                $("#linkedMessage").text("There was an error. Please check your verification code and try again").show();
            }
            else{
                $("#linkedMessage").text(text).show();
            }

            $("#linkedMessage").show();
            $("#spn_nxtvault_loading").hide();
        }
    });

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