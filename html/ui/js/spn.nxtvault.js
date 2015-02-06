var SPN = (function(SPN, $){
    var webURL = "http://localhost:3002";
    var URL = webURL + "/api/device";
    var secret;

    var isDebug = true;

    $("#spn_nxtvault").click(function(){
        var pubKey = NRS.publicKey;

        $.ajax({
            url: URL + "/" + pubKey,
            dataType: 'json',
            contentType: 'application/json; charset=UTF-8',
            type: 'GET',
            timeout: 30000,
            crossDomain: true,
            success: function (data) {
                $("#spn_nxtvault_link, #spn_nxtvault_fund_amount").removeAttr('disabled', 'disabled');

                if (data === "Fail" || isDebug){

                }
                else{
                    $("#linkedMessage").text("Account is locked and protected by: " + data);
                    $("#linkedMessage").show();
                    $("#spn_nxtvault_link, #spn_nxtvault_fund_amount").attr('disabled', 'disabled');
                    $("#spn_nxtvault_loading").hide();
                }
            },
            error: function(data){
                $("#linkedMessage").text("There was an error. Please check your verification code and try again").show();
                $("#linkedMessage").show();
                $("#spn_nxtvault_loading").hide();
            }
        });
    });


    $("#spn_nxtvault_link, #spn_nxtvault_fund_amount").on("input", function(){
        if ($("#spn_nxtvault_link").val() != "" && $("#spn_nxtvault_fund_amount") != ""){
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
        $.ajax({
            url: URL,
            dataType: 'json',
            contentType: 'application/json; charset=UTF-8',
            type: 'POST',
            timeout: 30000,
            crossDomain: true,
            data: JSON.stringify({cmd: "verify", code: linkCode, accountId: nxtAccountId}),
            success: function (data) {
                if (data.result === "Success"){

                    //Send the required initial funding money to the master account
                    NRS.sendRequest("sendMoney", {"secretPhrase":secret,feeNQT:"100000000",deadline:"1440","recipient":nxtAccountId,"amountNXT":fundAmount}, function(response, input) {
                        if (!response.errorCode == 1){
                            $("#linkedMessage").show();
                        }
                        else{
                            $("#linkedMessage").text(response.errorDescription);
                            $("#linkedMessage").show();
                        }

                        $("#spn_nxtvault_loading").hide();
                    },false);
                }
                else{
                    showError();
                }
            },
            error: function(data){
                showError();
            }
        });

        function showError(){
            $("#linkedMessage").text("There was an error. Please check your verification code and try again").show();
            $("#linkedMessage").show();
            $("#spn_nxtvault_loading").hide();
        }
    });

    return SPN;
}(SPN || {}, jQuery));