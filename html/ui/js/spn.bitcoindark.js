var rpcport = "7775";

function initSuperNETrpc(params) {
    var result;
    $.ajax({
        url: 'http://127.0.0.1:' + rpcport,
        dataType: 'json',
        type: 'POST',
        timeout: 5000,
        async:false,
        data: {
            method: "SuperNET",
            params: params
        },
        success: function (data) {
            result = data;
        },
        error: function(x, t, m) {
            alert(t);
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
$("#spn_telepathy").click(function () {
    telepathyOnLoad();
});

function telepathyOnLoad() {
    getTelepathyContacts();
    getTelepathyPeers();
}

function getTelepathyContacts() {
    var rows;
    $("#spn_telepathy_contacts_loading").show();
    $("#spn_telepathy_contacts_total").hide();

    var result = initSuperNETrpc("{\"requestType\":\"dispcontact\",\"contact\":\"*\"}");

    $.each(result, function (i, v) {
        rows += "<tr><td>" + v.handle + "</td><td>" + v.acct + "</td></tr>";
    });

    $("#spn_telepathy_info_modal_contacts_table tbody").empty().append(rows);

    $("#spn_telepathy_result").html(JSON.stringify(result));
    $("#spn_telepathy_contacts_total").text(result.length);

    $("#spn_telepathy_contacts_loading").hide();
    $("#spn_telepathy_contacts_total").show();
}
function getTelepathyPeers() {
    var rows;
    $("#spn_telepathy_peers_loading").show();
    $("#spn_telepathy_peers_total").hide();

    var result = initSuperNETrpc("{\"requestType\":\"getpeers\"}");

    $.each(result.peers, function (i, v) {
        if (v.srvipaddr) {
            rows += "<tr><td>" + v.srvipaddr + "</td></tr>";
        }
    });

    $("#spn_telepathy_info_modal_peers_table tbody").empty().append(rows);

    $("#spn_telepathy_result").html(JSON.stringify(result));
    $("#spn_telepathy_peers_total").text(result.num);

    $("#spn_telepathy_peers_loading").hide();
    $("#spn_telepathy_peers_total").show();
}

$('#spn_telepathy_info_modal').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget);
    var type = button.data('info');

    if (type == "contacts") {
        $("#spn_telepathy_info_contacts").click();
    } else {
        $("#spn_telepathy_info_peers").click();
    }
});
$("#spn_telepathy_info_modal ul.nav .telepathy-tab").click(function (e) {
    e.preventDefault();

    $("#spn_telepathy_info_modal .modal-title").text("Telepathy Info - " + e.currentTarget.innerText);

    var tab = $(this).data("tab");

    $(this).siblings().removeClass("active");
    $(this).addClass("active");

    $(".spn_telepathy_info_modal_content").hide();

    var content = $("#spn_telepathy_info_modal_" + tab);

    content.show();

    $("#spn_telepathy_info_modal .modal-footer").find("[data-action='close']").show();
    $("#spn_telepathy_info_modal .modal-footer").find("[data-action='close']").siblings().hide();
    
});
$("#spn_telepathy_info_modal ul.nav li ul li").click(function (e) {
    e.preventDefault();

    $("#spn_telepathy_info_modal .modal-title").text("Telepathy Info - " + e.currentTarget.innerText);

    var tab = $(this).data("tab");

    var parent = $(this).parent().parent();
    parent.addClass("active");

    $(this).parent().parent().siblings().removeClass("active");
    $(this).parent().parent().addClass("active");

    $(".spn_telepathy_info_modal_content").hide();

    var content = $("#spn_telepathy_info_modal_" + tab);

    content.show();

    $("#spn_telepathy_info_modal .modal-footer").find("[data-action='" + tab + "']").show();
    $("#spn_telepathy_info_modal .modal-footer").find("[data-action='" + tab + "']").siblings().hide();
});


NRS.forms.spnBTCDMakeTelepods = function ($modal) {
    var str = "{\"requestType\":\"maketelepods\",\"amount\":\"" + $("#spn_btcd_add_teleport_balance_amount").val() + "\",\"coin\":\"" + $("#spn_btcd_add_teleport_balance_currency").val() + "\"}";
    var result = initSuperNETrpc(str);

    $("#spn_btcd_add_teleport_balance_btnAdd").button('reset');
    $modal.modal("unlock");
    $modal.modal("hide");

    setTimeout(function () { getTeleportFund(); }, 3000);
}

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
            setTimeout(function () { guiPOLL(); }, 2000);
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
