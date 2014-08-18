var NRS = (function (NRS, $, undefined) {
    NRS.forms.mgwSendMessage = function ($modal) {
        var data = {
            "messageIsText": false,
            "recipient": $.trim($("#mgw_gen_deposit_addr_recipient").val()),
            "feeNXT": $.trim($("#mgw_gen_deposit_addr_fee").val()),
            "deadline": $.trim($("#mgw_gen_deposit_addr_deadline").val()),
            "secretPhrase": $.trim($("#mgw_gen_deposit_addr_password").val())
        };
        
        var message = $.trim($("#mgw_gen_deposit_addr_msg").val());
        if (!message) {
            return {
                "error": "Message is a required field."
            };
        }

        var error = "";
        data["message"] = message;

        if (error) {
            return {
                "error": error
            };
        }

        return {
            "requestType": "sendMessage",
            "data": data
        };
    }

    NRS.forms.mgwTransferAsset = function ($modal) {
        var data = null;

        if (NRS.dgsBlockPassed)
        {
            data = {
                "message": $.trim($("#mgw_withdraw_modal_comment").val()),
                "recipient": $.trim($("#mgw_withdraw_modal_recipient").val()),
                "asset": $.trim($("#mgw_withdraw_modal_asset").val()),
                "quantityQNT": $.trim($("#mgw_withdraw_modal_quantityQNT").val()),
                "feeNXT": $.trim($("#mgw_withdraw_modal_feeNXT").val()),
                "deadline": $.trim($("#mgw_withdraw_modal_deadline").val()),
                "secretPhrase": $.trim($("#mgw_withdraw_modal_password").val())
            };
        }
        else {
            data = {
                "comment": $.trim($("#mgw_withdraw_modal_comment").val()),
                "recipient": $.trim($("#mgw_withdraw_modal_recipient").val()),
                "asset": $.trim($("#mgw_withdraw_modal_asset").val()),
                "quantityQNT": $.trim($("#mgw_withdraw_modal_quantityQNT").val()),
                "feeNXT": $.trim($("#mgw_withdraw_modal_feeNXT").val()),
                "deadline": $.trim($("#mgw_withdraw_modal_deadline").val()),
                "secretPhrase": $.trim($("#mgw_withdraw_modal_password").val())
            };
        }
        

        var error = "";

        if (error) {
            return {
                "error": error
            };
        }

        return {
            "requestType": "transferAsset",
            "data": data
        };
    }
    return NRS;
}(NRS || {}, jQuery));