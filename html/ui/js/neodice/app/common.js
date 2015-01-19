/* Show div with corresponding ID and call its controller */ 
app.showPage = function(page, params) {
	$('.page').hide();
	var $activePage = $('#page-' + page);
	$activePage.show();	
	if (!app.pages[page]) {
		console.error('Page %s is not defined', page);
		return;
	}
	app.pages[page](params);

	$("#spn_neodice_page").show();
}

/* Should be changed when integrating with the proper client */
app.getUserAccount = function() {
    //return '11752402018584872999';
    return NRS.account;
}

/* Poll chain till test callback return true or exceed maxTries */ 
app.pollForResult = function(options) {
	var opts = options.options || {}, tries = 0, maxTries = 600, interval = 1000;

    opts.requestType = options.requestType || 'getUnconfirmedTransactions';
	opts.account = options.account || app.getUserAccount();
	opts.transaction = options.transaction;

	var defaultTest = function(pollResponse) {
		if (pollResponse) {
			return _.find(pollResponse.unconfirmedTransactions, function(tx) {
				return tx.referencedTransactionFullHash === opts.transaction.fullHash;
			}); 
		}
		else 
			return false;
	};

	var testFn = options.test || defaultTest;

	var poll = app.callChain.bind(null, opts, function(err, response) {
		tries++;
		if (err || tries > maxTries || testFn(response)) {
			clearInterval(timer);
		}
		if (tries > maxTries) {
			options.error('maxTries exceed');
		}
		if (testFn(response)) {
			options.success(testFn(response));
		}
	});	

	var timer = setInterval(poll, interval); 
}

/* Initialize top navigation */
app.initNavigation = function() {
	$('.neodice.nav a').each(function() {
		var $nav = $(this), url = $nav.data('url');
		$nav.click(function() {
		    $('.page').hide();
			$('.neodice.nav li').removeClass('active');
			$nav.parent().addClass('active');
			app.showPage(url, { rerender: true });
		});
	});
}

/* Call NXT API */
app.callChain = function(options, callback) {

	var config = app.config;

    if (options.account && typeof options.account !='string') {
        console.error('Wrong account id in chain call (%s)', options.account);
    }

    $.ajax({ 
    	url: config.apiUrl, 
    	type: 'POST', 
    	data: options, 
    	success: function(responseText, status, request) {
    		var data = JSON.parse(responseText), error;
	        if (data.errorCode && data.errorCode > 0) {
	            error = data.errorCode;
//	            console.error('Chain error', error);
	        }
	        if (typeof data == 'string') {
	            data = JSON.parse(data);
	        }
	        callback(error, data);
	    }, error: function(err) {
	    	callback(err);
	    }
	});
}

app.loadingWindowShow = function(opts) {
	$modal = $('#loadingWindow');
	$modal.find('.modal-body p').html(opts.text);
	$modal.modal();
}

app.loadingWindowHide = function() {
	$('#loadingWindow').modal('hide');
}

app.updateBalance = function() {
	var config = app.config, balance = 0;
	app.callChain({
		requestType: 'getAccount',
		account: app.getUserAccount()
	}, function(err, response) {
		if (err) {
			return;
		}
		var pluckBalance = function(array, field) {
			var pluck = _.find(array, { asset: config.chipsAssetId });
			var value = pluck? parseInt(pluck[field]) / config.chipNQT: 0;
			var precise = 100000000;
			return parseInt(value*precise)/precise;
		}
		if (response.assetBalances) {
			var confirmed = pluckBalance(response.assetBalances, 'balanceQNT');
			var unconfirmed = pluckBalance(response.unconfirmedAssetBalances, 'unconfirmedBalanceQNT');
			balance = confirmed + ' NC';
		} else {
			balance = 'n/a';
		}
/*
		if (unconfirmed == 0) {
			balance = confirmed;
		} else {
			balance = confirmed + ' (+' + (unconfirmed - confirmed) + ')';
		}
*/		
		$('.neodice.nav .amount').html(balance);
	});
}
