app.pages['gamble'] = function(params) {

	if ($('.slideWrapper1 div').length == 0) {
		sliderInit();
	}

	if (params.secretPhrase) {
		app.gamble(params.secretPhrase);		
	}

	$btn = $('.btn-roll');
	$btn.off();
	$btn.click(function() {
		if (!app.vars.secretPhrase) {
			app.showPage('login', { nextPage: 'gamble' });
		} else {
			app.gamble(app.vars.secretPhrase);
		}
	});
}

/* Take bet size and odds, send API call, poll for result */ 
app.gamble = function(secretPhrase) {
	var amount = $('#betSize').val();
	var odds = $('.oddSize').val(); 
	var config = app.config;

	var opts = {
		requestType: 'transferAsset',
		secretPhrase: secretPhrase,
		recipient: config.banker,
		quantityQNT: amount * config.chipNQT,
		deadline: config.deadline,
		feeNQT: config.NQT,
		asset: config.chipsAssetId,
		messageToEncrypt: odds,
		messageToEncryptIsText: true
	};

	app.callChain(opts, function(err, response) {
		if (err) {
			return;
		}
    	app.loadingWindowShow({ text: 'Rolling NeoDice<br/>It might take a minute...' });
		app.pollForResult({
			options: { 
				requestType: 'getUnconfirmedTransactions',
				account: app.getUserAccount()
			},
			test: function(pollResponse) {
				if (pollResponse) {
					return _.find(pollResponse.unconfirmedTransactions, function(tx) {
						if (!tx.attachment || !tx.attachment.message) {
							return null;
						}
						var message = tx.attachment.message;
						var originalTx = new RegExp(/Betting TX ID: (\d+)/).exec(message);
						originalTx = (originalTx && originalTx[1])? originalTx[1]: 0;

						if (tx.referencedTransactionFullHash) {
							return tx.referencedTransactionFullHash === response.fullHash;
						} else {
  						    return originalTx === response.transaction;
						}

					}); 
				}
				else 
					return false;
			},
			success: function(response) {
                app.loadingWindowHide();
    		    app.showBetResults(response);
    		    app.updateBalance();
			},
			error: function() {
                app.loadingWindowHide();
    		    console.error('Error while polling');
			},
		});
	});

}

/* Display modal with bet result based on transaction's message */ 
app.showBetResults = function(response) {
  	var message = response.attachment.message;
	var $popupContent = $('#betResultWindow .modal-body');

	var luckyNumber = new RegExp(/Lucky Number: (\d+)?/gi).exec(message);
	luckyNumber = luckyNumber[1] || 'n/a';

	var result = response.attachment.quantityQNT > 0? 'Your bet has WON!': 'Your bet has lost';

	var balance = new RegExp(/balance after transaction: ([\d.]+)?/gi).exec(message)
	balance = balance[1] || 'n/a'

	$popupContent.find('.luckyNumber').html(luckyNumber);
	$popupContent.find('.result').html(result);
	$popupContent.find('.balance').html(balance);
	$('#betResultWindow').modal();
}
