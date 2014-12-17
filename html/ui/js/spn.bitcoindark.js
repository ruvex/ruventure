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

    if (JSON.parse(params).requestType != "pricedb") {
        return JSON.parse(result);
    } 
}

$(document).ready(function () {
    $("#instantdex_exchange").select2({
        formatResult: format,
        formatSelection: format,
        escapeMarkup: function (m) { return m; }
    });
});

$("#spn_teleport").click(function () {
    setTimeout(function () { getTeleportFund(); }, 3000);

    setInterval(function () {
        refreshTeleport();
    }, 60000);
});
$("#spn_telepathy").click(function () {
    telepathyOnLoad();
});
$("#spn_instantdex").click(function () {
    instantDexOnLoad();
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
        rows += "<tr><td>" + v.handle + "</td><td>" + v.acct + "</td><td><button type='button' class='btn btn-xs btn-default' onclick='SPN.telepathyDeleteContact($(this))' data-contact='" + v.handle + "'>Delete</button></td></tr>";
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

function instantDexOnLoad() {
    getAssetDetails("instantdex_base_id");
    getAssetDetails("instantdex_rel_id");
}
function getAssetDetails(id) {
    if (id) {
        var assetid = $("#" + id).val().trim();

        $("#" + id).siblings().hide();
        $("#" + id).siblings(".loading").show();
        $("#" + id).siblings(".asset_name").text('');

        NRS.sendRequest("getAssets", {
            "assets": assetid
        }, function (response) {
            if (response.assets && response.assets.length) {
                $("#" + id).data("decimals", response.assets[0].decimals);
                $("#" + id).siblings().hide();
                $("#" + id).siblings(".asset_name").text(response.assets[0].name).show();
                $("#" + id).parent().removeClass("has-feedback has-error");

                if ($("#instantdex_base_id").siblings(".asset_name").text().trim() != '' && $("#instantdex_rel_id").siblings(".asset_name").text().trim() != '') {
                    loadInstantDEXDetails();
                    $("#instantdex_details").show();
                    getRecommendedRates();
                }
            } else {
                $("#" + id).removeData("decimals");
                $("#" + id).siblings().hide();
                $("#" + id).siblings(".show_popover").show();
                $("#" + id).siblings(".asset_name").text('');
                $("#" + id).parent().addClass("has-feedback has-error");
                $("#instantdex_details").hide();
                $("#spn_instantdex_page_instantdex_assets .alert-success").hide();
            }
        });
    }
}
function loadInstantDEXDetails() {
    var baseAssetBalance, relAssetBalance;
    var baseAsset = $("#instantdex_base_id").siblings(".asset_name").text();
    var relAsset = $("#instantdex_rel_id").siblings(".asset_name").text();
    $("#instantdex_buy_title").text("Buy " + baseAsset + " with " + relAsset);
    $("#instantdex_sell_title").text("Sell " + baseAsset + " for " + relAsset);

    if (NRS.accountInfo.unconfirmedAssetBalances) {
        for (var i = 0; i < NRS.accountInfo.unconfirmedAssetBalances.length; i++) {
            var balance = NRS.accountInfo.unconfirmedAssetBalances[i];

            if (balance.asset == $("#instantdex_base_id").val().trim()) {
                baseAssetBalance = NRS.formatQuantity(balance.unconfirmedBalanceQNT, $("#instantdex_base_id").data("decimals"));
                $("#instantdex_rel_balance").text(baseAssetBalance + " " + baseAsset);
                if (balance.unconfirmedBalanceQNT == "0") {
                    //$("#sell_automatic_price").addClass("zero").removeClass("nonzero");
                } else {
                    //$("#sell_automatic_price").addClass("nonzero").removeClass("zero");
                }
            }

            if (balance.asset == $("#instantdex_rel_id").val().trim()) {
                relAssetBalance = NRS.formatQuantity(balance.unconfirmedBalanceQNT, $("#instantdex_rel_id").data("decimals"));
                $("#instantdex_base_balance").text(relAssetBalance + " " + relAsset);
                if (balance.unconfirmedBalanceQNT == "0") {
                    //$("#sell_automatic_price").addClass("zero").removeClass("nonzero");
                } else {
                    //$("#sell_automatic_price").addClass("nonzero").removeClass("zero");
                }
            }

            if (baseAssetBalance && relAssetBalance) {
                break;
            }
        }
    }
    if (!baseAssetBalance) {
        $("#instantdex_rel_balance").html("0 " + baseAsset);
    }
    if (!relAssetBalance) {
        $("#instantdex_base_balance").html("0 " + relAsset);
    }

    $("#spn_instantdex_page .instantdex_base_asset_name").text(baseAsset);
    $("#spn_instantdex_page .instantdex_rel_asset_name").text(relAsset);

    getAssetOrder();
}
function getAssetOrder() {
    $("#instantdex_ask_orders_table tbody").empty();
    $("#instantdex_bid_orders_table tbody").empty();
    
    $("#instantdex_ask_orders_table").parent().addClass("data-loading").removeClass("data-empty");
    $("#instantdex_bid_orders_table").parent().addClass("data-loading").removeClass("data-empty");
    
    var str = "{\"requestType\":\"orderbook\",\"baseid\":\"" + $("#instantdex_base_id").val().trim() + "\",\"relid\":\"" + $("#instantdex_rel_id").val().trim() + "\"}";
    var result = initSuperNETrpc(str);
    //var result = JSON.parse('{"key":"12008998766472701676","baseid":"11060861818140490423","relid":"4551058913252105307","bids":[["0.01000000000","1.00000000"],["0.00399999009","1.00499999"],["0.00399999009","1.00499999"],["0.00399999009","1.00499999"]],"asks":[]}');

    if (!result.error) {
        if (result.asks.length > 0) {
            var rows = "";
            $.each(result.asks, function (i, v) {
                rows += "<tr><td>" + v[1] + "</td><td>" + v[0] + "</td></tr>";
            });
            $("#instantdex_ask_orders_table tbody").empty().append(rows);
            $("#instantdex_sell_orders_count").text("(" + result.asks.length + ")");
        } else {
            $("#instantdex_ask_orders_table").parent().addClass("data-empty");
            $("#instantdex_sell_orders_count").text("(0)");
        }

        if (result.bids.length > 0) {
            var rows = "";
            $.each(result.bids, function (i, v) {
                rows += "<tr><td>" + v[1] + "</td><td>" + v[0] + "</td></tr>";
            });
            $("#instantdex_bid_orders_table tbody").empty().append(rows);
            $("#instantdex_buy_orders_count").text("(" + result.bids.length + ")");
        } else {
            $("#instantdex_bid_orders_table").parent().addClass("data-empty");
            $("#instantdex_buy_orders_count").text("(0)");
        }
    }
    else {
        $("#instantdex_ask_orders_table").parent().addClass("data-empty");
        $("#instantdex_sell_orders_count").text("(0)");
        $("#instantdex_bid_orders_table").parent().addClass("data-empty");
        $("#instantdex_buy_orders_count").text("(0)");
    }
    $("#instantdex_ask_orders_table").parent().removeClass("data-loading");
    $("#instantdex_bid_orders_table").parent().removeClass("data-loading");
}
function getCharts() {
    
    
    var dataHighBid = [];
    var dataLowAsk = [];
    var title = $("#instantdex_base_id").siblings(".asset_name").text() + "/" + $("#instantdex_rel_id").siblings(".asset_name").text();

    var baseAssetName, relAssetName;
    
    if ($("#instantdex_base_id").siblings(".asset_name").text().substr(0, 3).toLowerCase() == "mgw") {
        baseAssetName = $("#instantdex_base_id").siblings(".asset_name").text().substr(3);
    } else {
        baseAssetName == $("#instantdex_base_id").siblings(".asset_name").text();
    }
    if ($("#instantdex_rel_id").siblings(".asset_name").text().substr(0, 3).toLowerCase() == "mgw") {
        relAssetName = $("#instantdex_rel_id").siblings(".asset_name").text().substr(3);
    } else {
        relAssetName == $("#instantdex_rel_id").siblings(".asset_name").text();
    }

    var result = initSuperNETrpc("{\"requestType\":\"getquotes\",\"exchange\":\"" + $("#instantdex_exchange").select2("val") + "\",\"base\":\"" + baseAssetName + "\",\"rel\":\"" + relAssetName + "\",\"oldest\":\"0\"}");
    
    $.each(result.hbla, function (i, obj) {
        var objHighBid = [];
        var objLowAsk = [];
        objHighBid[0] = obj[0] * 1000;
        objHighBid[1] = obj[1];

        objLowAsk[0] = obj[0] * 1000;
        objLowAsk[1] = obj[2];

        dataHighBid.push(objHighBid);
        dataLowAsk.push(objLowAsk);
    });

    dataHighBid.sort(function (a, b) { return a[0] - b[0] });
    dataLowAsk.sort(function (a, b) { return a[0] - b[0] });
    
    var seriesOptions = [];
    seriesOptions[0] = { name: "Low Ask", data: dataLowAsk };
    seriesOptions[1] = { name: "High Bid", data: dataHighBid };
    

    setTimeout(function () {
        $("#instantdex_chart").show();
        $("#spn_instantdex_page_instantdex_markets .data-loading-container").hide();

        $('#instantdex_chart').highcharts('StockChart', {


            rangeSelector: {
                selected: 1
            },

            title: {
                text: title
            },

            series: seriesOptions
        });
    }, 5000);
}
function getRecommendedRates() {
    $("#instantdex_conversion_rate").html("");
    $("#spn_instantdex_page_instantdex_assets .alert-success").show();

    NRS.sendRequest("getTrades", {
        "asset": $("#instantdex_base_id").val().trim(),
        "lastIndex": 0
    }, function (base) {
        if (base) {
            NRS.sendRequest("getTrades", {
                "asset": $("#instantdex_rel_id").val().trim(),
                "lastIndex": 0
            }, function (rel) {
                if (rel) {
                    if (base.trades.length > 0 && rel.trades.length > 0) {
                        var basePrice = NRS.calculateOrderPricePerWholeQNT(new BigInteger(base.trades[0].priceNQT), base.trades[0].decimals);
                        var relPrice = NRS.calculateOrderPricePerWholeQNT(new BigInteger(rel.trades[0].priceNQT), rel.trades[0].decimals);
                        var recommendPrice = utoFixed(basePrice / relPrice, 4);

                        $("#instantdex_conversion_rate").html("1 " + base.trades[0].name + " = " + recommendPrice + " " + rel.trades[0].name);
                    }
                    else {
                        $("#instantdex_conversion_rate").html("There is no trade history found");
                    }
                }
                else {
                    $("#spn_instantdex_page_instantdex_assets .alert-success").hide();
                }
            });
        }
        else {
            $("#spn_instantdex_page_instantdex_assets .alert-success").hide();
        }
    });
}
function startDataCollect() {
    var baseAssetName, relAssetName;

    if ($("#instantdex_base_id").siblings(".asset_name").text().substr(0, 3).toLowerCase() == "mgw") {
        baseAssetName = $("#instantdex_base_id").siblings(".asset_name").text().substr(3);
    } else {
        baseAssetName == $("#instantdex_base_id").siblings(".asset_name").text();
    }
    if ($("#instantdex_rel_id").siblings(".asset_name").text().substr(0, 3).toLowerCase() == "mgw") {
        relAssetName = $("#instantdex_rel_id").siblings(".asset_name").text().substr(3);
    } else {
        relAssetName == $("#instantdex_rel_id").siblings(".asset_name").text();
    }

    var result = initSuperNETrpc("{\"requestType\":\"pricedb\",\"exchange\":\"" + $("#instantdex_exchange").select2("val") + "\",\"base\":\"" + baseAssetName + "\",\"rel\":\"" + relAssetName + "\",\"stop\":\"0\"}");
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
$("#instantdex_buy_asset_box .box-header, #instantdex_sell_asset_box .box-header").click(function (e) {
    e.preventDefault();
    //Find the box parent        
    var box = $(this).parents(".box").first();
    //Find the body and the footer
    var bf = box.find(".box-body, .box-footer");
    if (!box.hasClass("collapsed-box")) {
        box.addClass("collapsed-box");
        $(this).find(".btn i.fa").removeClass("fa-minus").addClass("fa-plus");
        bf.slideUp();
    } else {
        box.removeClass("collapsed-box");
        bf.slideDown();
        $(this).find(".btn i.fa").removeClass("fa-plus").addClass("fa-minus");
    }
});
$("#instantdex_sell_automatic_price, #instantdex_buy_automatic_price").on("click", function (e) {
    //TODO
});
$("#instantdex_base_id, #instantdex_rel_id").bind("keyup paste", function (e) {
    clearTimeout($(this).data('timeout'));
    $(this).data('timeout', setTimeout(function () {
        if ($("#" + e.currentTarget.id).val().trim()) {
            getAssetDetails(e.currentTarget.id);
        }
    }, 200));
});
$("#instantdex_buy_asset_quantity, #instantdex_buy_asset_price, #instantdex_sell_asset_quantity, #instantdex_sell_asset_price").keydown(function (e) {
    var maxFractionLength;
    
    switch ($("#" + e.currentTarget.id).data("type")) {
        case "buy":
            if (e.currentTarget.id.toString().indexOf("quantity") > -1) {
                maxFractionLength = $("#instantdex_base_id").data("decimals");
            }
            else {
                maxFractionLength = $("#instantdex_rel_id").data("decimals");
            }
            break;
        case "sell":
            if (e.currentTarget.id.toString().indexOf("quantity") > -1) {
                maxFractionLength = $("#instantdex_rel_id").data("decimals");
            }
            else {
                maxFractionLength = $("#instantdex_base_id").data("decimals");
            }
            break;
    }

    var charCode = !e.charCode ? e.which : e.charCode;

    if (isControlKey(charCode) || e.ctrlKey || e.metaKey) {
        return;
    }

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
        var errorMessage = "Only " + maxFractionLength + " digits after the decimal mark are allowed for this asset.";
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
$("#instantdex_buy_asset_quantity, #instantdex_buy_asset_price, #instantdex_sell_asset_quantity, #instantdex_sell_asset_price").keyup(function (e) {
    var orderType = $(this).data("type").toLowerCase();
    
    try {
        var quantity = parseFloat($("#instantdex_" + orderType + "_asset_quantity").val());
        var price = parseFloat($("#instantdex_" + orderType + "_asset_price").val());
        total = quantity * price;
        total = utoFixed(total, 8);
        $("#instantdex_" + orderType + "_asset_total").val(total.toString());

    } catch (err) {
        $("#instantdex_" + orderType + "_asset_total").val("0");
    }
});
$("#instantdex_asset_order_modal").on("show.bs.modal", function (e) {
    var $invoker = $(e.relatedTarget);
    var orderType = $invoker.data("type");
    var baseAsset = $("#instantdex_base_id").siblings(".asset_name").text();
    var relAsset = $("#instantdex_rel_id").siblings(".asset_name").text();

    $("#instantdex_asset_order_modal_button").html(orderType + " Asset").data("resetText", orderType + " Asset");
    $("#instantdex_asset_order_modal_button").data("type", orderType.toLowerCase());
    
    var quantity = $("#instantdex_" + orderType.toLowerCase() + "_asset_quantity").val().trim();
    var price = $("#instantdex_" + orderType.toLowerCase() + "_asset_price").val().trim();
    

    if (quantity.toString() == "0" || price.toString() == "0") {
        $.growl($.t("error_amount_price_required"), {
            "type": "danger"
        });
        return e.preventDefault();
    }

    $("#instantdex_base_asset_id").val($("#instantdex_base_id").val().trim());
    $("#instantdex_rel_asset_id").val($("#instantdex_rel_id").val().trim());
    $("#instantdex_asset_order_quantity").val(quantity);
    $("#instantdex_asset_order_price").val(price);
    $("#instantdex_asset_order_description").html(orderType + " <b>" + quantity + " " + baseAsset + "</b> assets at <b>" + price + " " + relAsset + "</b> each.");
    $("#instantdex_asset_order_total").html($("#instantdex_" + orderType.toLowerCase() + "_asset_total").val() + " " + $("#instantdex_" + orderType.toLowerCase() + "_asset_total").siblings(".input-group-addon").text());
    
});
$("#instantdex_asset_order_modal_button").click(function (e) {
    $(this).button('loading');
    var orderType = $(this).data("type");
    var requestType = "";

    switch (orderType) {
        case "buy": requestType = "placebid";
            break;
        case "sell": requestType = "placeask";
            break;
    }

    var str = "{\"requestType\":\"" + requestType + "\",\"baseid\":\"" + $("#instantdex_base_asset_id").val().trim() + "\",\"relid\":\"" + $("#instantdex_rel_asset_id").val().trim() + "\",\"volume\":\"" + $("#instantdex_asset_order_quantity").val().trim() + "\",\"price\":\"" + $("#instantdex_asset_order_price").val().trim() + "\"}";
    var result = initSuperNETrpc(str);

    if (result.result) {
        NRS.unlockForm($("#" + e.currentTarget.id).closest(".modal"), $("#" + e.currentTarget.id), true);

        $.growl(result.result + result.txid, {
            "type": "success"
        });
    }

    getAssetOrder();
});
$("#spn_instantdex_page ul.nav li").click(function (e) {
    var tab = $(this).data("tab");
    $(this).siblings().removeClass("active");
    $(this).addClass("active");
    $(this).parent().siblings("div").hide();
    $("#spn_instantdex_page_" + tab).show();
});
$("#instantdex_markets").click(function (e) {
    $("#instantdex_chart").hide();
    $("#spn_instantdex_page_instantdex_markets .data-loading-container").show();

    startDataCollect();

    setTimeout(function () { getCharts(); }, 5000);
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

SPN.telepathyAddContact = function () {
    var str = "{\"requestType\":\"addcontact\",\"handle\":\"" + $("#spn_telepathy_add_contact_name").val() + "\",\"acct\":\"" + $("#spn_telepathy_add_contact_account_id").val() + "\"}";
    var result = initSuperNETrpc(str);

    if (result.result) {
        $.growl(result.result, {
            "type": "success"
        });
    }
    else if(result.error){
        $.growl(result.error, {
            "type": "danger"
        });
    }
    else{
        $.growl("Exception : telepathyAddContact", {
            "type": "danger"
        });
    }

    getTelepathyContacts();
}
SPN.telepathyDeleteContact = function (e) {
    var str = "{\"requestType\":\"removecontact\",\"contact\":\"" + e.data("contact") + "\"}";
    var result = initSuperNETrpc(str);

    if (result.result) {
        $.growl(result.result, {
            "type": "success"
        });
    }
    else if (result.error) {
        $.growl(result.error, {
            "type": "danger"
        });
    }
    else {
        $.growl("Exception : telepathyAddContact", {
            "type": "danger"
        });
    }

    getTelepathyContacts();
}
SPN.telepathyPing = function () {
    var str = "{\"requestType\":\"ping\",\"destip\":\"" + $("#spn_telepathy_ping_peers_ip").val() + "\"}";
    var result = initSuperNETrpc(str);
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
function format(exchange) {
    return exchange.text;
}