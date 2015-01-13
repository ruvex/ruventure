

function SlideBar(model,property,tmplateName,func,textLeft,textRight){


    var calcedValue = new Model();

    

    var label = new LabelTemplate(tmplateName,calcedValue,"value",".value");

   
    



    this.el=$($("#slide-template").text());

    var self=this;


    this.el.find(".ball").append(label.el);

    var mousedown=false;

    var first=null;

    var current=0;

    this.el.find(".ball").bind("mousedown",function(e){

        mousedown=true;

        first=e.pageX;

        current = self.el.find(".ball").position().left;

    });

    $(document).bind("mouseup",function(e){
        if(mousedown){
            mousedown=false;
        }
    });
    

    $(document).bind("mousemove",function(e){

        if(mousedown){

            var current2=current+e.pageX-first;

            setLeft(current2);
        }
    });

    function setLeft(left){

        var ballWidth = self.el.find(".ball").outerWidth();

        var width = self.el.width();

        if( left>width-ballWidth){
           left=width-ballWidth;
        }

        if( left<0){
            left=0;
        }

        self.el.find(".ball").css("left",left+"px");


        if(width-ballWidth===0){
            return;
        }

        var percent=(left/(width-ballWidth))*100;

        percent=Math.round(percent*10)/10;


        model.set(property,percent);
    }

    model.on(property,function(val){
        if(!mousedown){

            var ballWidth = self.el.find(".ball").outerWidth();

            var width = self.el.width();

            var left = val*(width-ballWidth)/100;
            current=left;

            setLeft(left);
        }

        calcedValue.set("value",func(val));
    });


    self.el.find(".numLeft").text(func(0));

    self.el.find(".numRight").text(func(100));

     self.el.find(".textLeft").text(textLeft);
      self.el.find(".textRight").text(textRight);

}



function LabelTemplate(tmplId,model,property,elmPath){

    this.el=$($(tmplId).text());

    this.el.parent().find(elmPath).text(model.get(property));

    var self=this;

    model.on(property,function(val){

        self.el.parent().find(elmPath).text(val);
    });

}



