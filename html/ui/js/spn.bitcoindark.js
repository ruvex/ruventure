var rpcport = "7775";

function initSuperNETrpc(params) {
    var result;
    $.ajax({
        url: 'http://127.0.0.1:' + rpcport,
        dataType: 'json',
        type: 'POST',
        timeout: 10000,
        async:false,
        data: {
            method: "SuperNET",
            params: params
        },
        success: function (data) {
            result = data;
        }
    });
    return JSON.parse(result);
}

$("#spn_teleport").click(function () {
    setTimeout(function () { getTeleportFund(); }, 3000);

    setInterval(function () {
        refreshTeleport();
    }, 60000);
});
$("#spn_btcd_add_teleport_balance_btnAdd").click(function () {
    alert("reach");
    var btn = $(this);
    btn.button('loading');

    var str = "{\"requestType\":\"maketelepods\",\"amount\":\"" + $("#spn_btcd_add_teleport_balance_amount").val() + "\",\"coin\":\"" + $("#spn_btcd_add_teleport_balance_currency").val() + "\"}";
    //var result = initSuperNETrpc();
    alert(str);

});
function refreshTeleport() {
    if (NRS.currentPage == "spn_teleport") {
        getTeleportFund();
    }
}

function getTeleportFund() {
    toggleTeleportLoading(true);
    
    var result = initSuperNETrpc("{\"requestType\":\"telepodacct\",\"coin\":\"BTCD\"}");
    var txid = result.txid; 
    var bFound = false;
    var bNothing = false;

    guiPOLL();
    
    function guiPOLL() {
        var g_result = initSuperNETrpc("{\"requestType\":\"GUIpoll\"}");

        $("#spn_bitcoindark_result").html(JSON.stringify(g_result));

        bNothing = isGUIPollNothing(g_result);

        if (g_result.txid) {
            if (g_result.txid == txid) {
                var obj_g_result = JSON.parse(g_result.result);
                //$("#spn_bitcoindark_result").html(JSON.stringify(obj_g_result));
                setBalance(obj_g_result);
                bFound = true;
                toggleTeleportLoading(false);
            }
        }

        if (!bFound && !bNothing) {
            setTimeout(function () { guiPOLL(); }, 1000);
        }

        if (!bFound && bNothing) {
            getTeleportFund();
        }
    }
}
function setBalance(result) {
    if (result.avail.toString() == 0) {
        $("#btcd_account_balance").text('0');
        $("#btcd_account_balance_decimal").text('');
    } else {
        if (result.avail.toString().indexOf(".") == 1) {
            var array = result.avail.toString().split('.');
            $("#btcd_account_balance").text(array[0]);
            $("#btcd_account_balance_decimal").text("." + array[1]);
        }
        else {
            $("#btcd_account_balance").text(result.avail);
            $("#btcd_account_balance_decimal").text('');
        }
    }

    if (result.credits.toString() == 0) {
        $("#btcd_teleport_balance").text('0');
        $("#btcd_teleport_balance_decimal").text('');
    }
    else {
        if (result.credits.toString().indexOf(".") == 1) {
            var array = result.credits.toString().split('.');
            $("#btcd_teleport_balance").text(array[0]);
            $("#btcd_teleport_balance_decimal").text("." + array[1]);
        }
        else {
            $("#btcd_teleport_balance").text(result.credits);
            $("#btcd_teleport_balance_decimal").text('');
        }
    }

    $("#spn_btcd_account_balance_addr").text(result.funding);
}
function isGUIPollNothing(obj) {
    var bNothing = false;
    if (obj.result) {
        if (obj.result == "nothing pending") {
            bNothing = true;
        }
    }
    return bNothing;
}

function toggleTeleportLoading(isLoading) {
    if (isLoading) {
        $("#btcd_account_balance_loading").show();
        $("#btcd_account_balance").hide();
        $("#btcd_account_balance_decimal").hide();

        $("#btcd_teleport_balance_loading").show();
        $("#btcd_teleport_balance").hide();
        $("#btcd_teleport_balance_decimal").hide();

        $("#spn_btcd_add_account_balance_modal_loading").show();
        $("#spn_btcd_add_account_balance_modal_loading > .form-group").hide();
    }else
    {
        $("#btcd_account_balance_loading").hide();
        $("#btcd_account_balance").show();
        $("#btcd_account_balance_decimal").show();

        $("#btcd_teleport_balance_loading").hide();
        $("#btcd_teleport_balance").show();
        $("#btcd_teleport_balance_decimal").show();

        $("#spn_btcd_add_account_balance_modal_loading").hide();
        $("#spn_btcd_add_account_balance_modal_loading > .form-group").show();
    }
}
