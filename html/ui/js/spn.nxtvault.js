var SPN = (function(SPN, $){
    var webURL = "http://localhost:3002";
    var URL = webURL + "/api/device";
    var secret;

    var isDebug = true;

    var accountLinked = null;

    var masterPubKey, nrsRecipient;
    var fundAmount;
    var linkCode;
    var nxtAccountId;

    var accountFunded;

    $("#spn_nxtvault").click(function(){
        $(".disconnected").show();
        $(".connected").hide();
        $("#connectingMessage").text("Connecting...");
        $('#fund_message').hide();
        $(".account_link_code").show();
        $("#spn_nxtvault_activate").text("Activate").addClass("disabled");


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
                    if (data.errorCode == 0 && data.data.masterPublicKey != null){
                        masterPubKey = data.data.masterPublicKey;
                        var accountId = NRS.getAccountIdFromPublicKey(masterPubKey);
                        nrsRecipient = NRS.convertNumericToRSAccountFormat(accountId);

                        setModalFields();
                    }
                    else{
                        $("#spn_nxtvault_loading").hide();

                        $("#nxtvault_modal_error_message").text("Invalid code entered.").show();
                        $("#btnActivate").attr('disabled', 'disabled');
                    }
                },

                error: function(err){
                    $("#spn_nxtvault_loading").hide();
                    $("#nxtvault_modal_error_message").text("Error connecting to NxtVault servers. Please try again later.").show();
                    $("#btnActivate").attr('disabled', 'disabled');
                }
            });
        }
        else{
            nrsRecipient = accountLinked;
            setModalFields();
        }

        function setModalFields(){
            $("#nxtvault_nxt_recipient").val(nrsRecipient);
            $("#nxtvault_nxt_amount").val(fundAmount);

            $("#spn_nxtvault_loading").hide();
            $("#nxtvault_activate_form").show();

            if (isNaN(fundAmount)){
                $("#nxtvault_modal_error_message").text("Invalid funding amount.").show();
                $("#btnActivate").attr('disabled', 'disabled');
            }
        }


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

    NRS.forms.nxtVaultLinkAccount = function($modal){
        var $btn = $modal.find("button.btn-primary:not([data-dismiss=modal])");



        if (!accountLinked){
            var result = {
                "requestType": "linkAccount",
                "data": NRS.getFormData($modal.find("form:first"))
            };

            $.ajax({
                url: URL,
                dataType: 'json',
                contentType: 'application/json; charset=UTF-8',
                type: 'POST',
                timeout: 30000,
                crossDomain: true,
                data: JSON.stringify({cmd: "verify", code: linkCode, accountId: NRS.accountRS, verify: true, pubKey: NRS.publicKey}),
                success: function (data) {
                    if (data.errorCode === 0){
                        //Send the required initial funding money to the master account
                        NRS.sendRequest("sendMoney", {"secretPhrase": $("#nxtvault_passphrase").val(), feeNQT: "100000000", deadline: "1440", recipient: nrsRecipient, recipientPublicKey: data.data.masterPubKey, amountNXT: fundAmount}, function (response, input) {

                            if (!response.errorCode || response.errorCode == 0) {
                                $.growl("Your account has been successfully linked with your device!");
                                onAccountFunded();
                            }
                            else{
                                $.growl(response.errorText);
                            }

                            resetModal($modal, $btn);
                        }, false);
                    }
                    else{
                        $("#nxtvault_modal_error_message").text(data.errorText).show();
                        resetModal($modal, $btn);
                    }
                },
                error: function(data){
                    $.growl("Error contacting the NxtVault servers. Please try again later.");
                    resetModal($modal, $btn);
                }
            });
        }
        else{
            //Send the required initial funding money to the master account
            NRS.sendRequest("sendMoney", {"secretPhrase": $("#nxtvault_passphrase").val(), feeNQT: "100000000", deadline: "1440", recipient: nrsRecipient, amountNXT: fundAmount}, function (response, input) {
                if (!response.errorCode || response.errorCode == 0) {
                    $.growl("Account funded successfully!");
                    onAccountFunded();
                }
                else{
                    $.growl(response.errorText);
                }

                $("#spn_nxtvault_fund_amount").text("");

                resetModal($modal, $btn);
            });
        }

        function onAccountFunded() {
            $("#spn_nxtvault_link").text("");
            accountFunded += parseInt(fundAmount);
            setAccountFundedMessage();
            $("#spn_nxtvault_fund_amount").text("");
            $("#spn_nxtvault_activate").addClass("disabled");
        }
    }

    function resetModal($modal, $btn){
        NRS.unlockForm($modal, $btn, true);
        $btn.button('reset');
        $("#buttonActivate").button('reset');
        $("#spn_nxtvault_loading").hide();
        $("#nxtvault_nxt_recipient_msg").text("");
        $("#nxtvault_passphrase").text("");
        $("#nxtvault_nxt_amount").text("");
    }

    function setAccountFundedMessage() {
        $("#linkedMessage").text("Account is locked down and protected by: " + accountLinked + ". The account has " + accountFunded + " Nxt remaining.").show();
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
                    $(".connected").show();
                    $(".disconnected").hide();

                    if (data.data.masterPubKey){
                        accountLinked = NRS.convertNumericToRSAccountFormat(NRS.getAccountIdFromPublicKey(data.data.masterPubKey));

                        $.ajax({
                            url: "/nxt?requestType=getAccount&account=" + accountLinked,
                            dataType: 'json',
                            contentType: 'application/json; charset=UTF-8',
                            type: 'POST',
                            timeout: 30000,
                            crossDomain: true,
                            success: function(data){
                                accountFunded = parseInt(NRS.convertToNXT(data.balanceNQT));
                                setAccountFundedMessage();

                                $(".account_link_code").hide();
                                $("#activate_message").hide();
                                $("#spn_nxtvault_activate").text("Fund");
                            },
                            fail: function(err){

                            }
                        });


                    }
                }
            },
            error: function(data){
                accountLinked = null;

                $("#connectingMessage")
                    .text("There was an error connecting to NxtVault servers. Please try again later.")
                    .show();
            }
        });
    }

    return SPN;
}(SPN || {}, jQuery));