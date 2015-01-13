

var Utils={
	getServerData:function(callback){

		/*
		var url='pull/data.json';
		$.getJSON( url, callback);
		*/

		setTimeout(function(){
			callback({  
				"secret":{  
					"yesterday":"238472938e729423",
					"todayhash":"9238472932342323"
				},
				"bankrol":{  
					"total":12345,
					"minbet":50,
					"maxbet":1000
				}
			});
		},500)
	},

	calcGain:function(odds){

		var edge = 0.01;

		return (100 / odds) * (1 - edge);

	},

	calcOdds:function(percent,leastChance, bestChance){

		return (percent*(bestChance-leastChance)/100)+leastChance;
	},

	calcMinBet:function(odds){

		var edge = 0.01;
		var transactionFee = 1;

		var minbet = Math.ceil((2 * transactionFee * odds) / (100 * (1 - edge) - odds));
		return (minbet < 2) ? 2 : minbet;
	},

	calcMaxBet:function(odds){

		var edge = 0.01;
		var bankroll = 2000000;

		return bankroll * (odds / 100) / ((1 - edge) * 100);
	}
}




function afterFloatPoint(num,howMuch){

	var result = num.toFixed(howMuch)+"";

    var fp = result.indexOf(".");

    if(fp>=0){
    	
        result=result.replace(/\.[0]+$/g,'');

        result=result.replace(/[0]+$/g,'');
    }

    return result;

    
}


$.fn.bindText=function(model,property){

    var self=this;

    self.text(model.get(property));
    self.val(model.get(property));
    
    
    model.on(property,function(val){
        self.text(val);
        self.val(val);
    });

    self.on("change keyup",function(){

    	model.set(property,self.val());
    });
}
