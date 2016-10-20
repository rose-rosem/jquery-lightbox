/**
 * Created by zhangqing on 2016/10/19.
 */
;(function ($) {

    // 构造函数
    var LightBox = function (settings) {
        var self = this;

        this.settings = {
             speed:500,
             winScales:0.8
        };
        $.extend(this.settings,settings || {});
        //创建遮罩和弹出框
        this.popupMsak = $('<div id="G-lightbox-mask">');
        this.popupWin = $('<div id="G-lightbox-popup">');

        //保存body
        this.bodyNode = $(document.body);

        //渲染剩余的DOM,并插入到body
        this.renderDOM();

        this.picViewArea = this.popupWin.find("div.lightbox-pic-view"); //获取图片的预览区域
        this.popupPic = this.popupWin.find("img.lightbox-image"); //图片
        this.picCaptionArea = this.popupWin.find("div.lightbox-pic-caption"); //图片描述区域
        this.nextBtn = this.popupWin.find("span.lightbox-next-btn");
        this.prevBtn = this.popupWin.find("span.lightbox-prev-btn");

        this.captionText = this.popupWin.find("p.lightbox-pic-desc"); //图片描述
        this.currentIndex = this.popupWin.find("span.lightbox-of-index"); //图片当前索引
        this.closeBtn = this.popupWin.find("span.lightbox-close-btn"); //关闭按钮

        //准备开发事件委托，获取组数据

        //事件委托机制 防止后续加载的图片还要再去获取绑定事件（把事件委托给body）
        // var lightbox =$(".js-lightbox,[data-role=lightbox]");
        // lightbox.click(function () {
        //     alert('1');
        // })

        this.groupName = null;
        this.groupData = []; //放置同一组数据

        //jquery事件委托机制 delegate
        this.bodyNode.delegate(".js-lightbox,*[data-role=lightbox]","click",function (e) {
            //阻止事件冒泡 不让插件的本身功能影响用户自身的业务逻辑
            e.stopPropagation();

            var currentGroupName = $(this).attr("data-group");

            //为了不重复获取数据
            if(currentGroupName != self.groupName){
                self.groupName = currentGroupName;
                //根据当前组名获取同一组数据
                self.getGroup();
            };

            //初始化弹出
            self.initPopup($(this));

        });

        //关闭弹出
        this.popupMsak.click(function(){
            self.popupMsak.fadeOut();
            self.popupWin.fadeOut();
            self.clear = false;
        });
        this.closeBtn.click(function(){
            self.popupMsak.fadeOut();
            self.popupWin.fadeOut();
            self.clear = false;
        });

        //绑定上下切换按钮功能事件
        //this.prevBtn this.nextBtn
        this.flag = true;
        this.nextBtn.hover(function () {
            if(!$(this).hasClass("disabled") && self.groupData.length>1){
                $(this).addClass("lightbox-next-btn-show");
            };
        },function () {
            if(!$(this).hasClass("disabled") && self.groupData.length>1) {
                $(this).removeClass("lightbox-next-btn-show");
            };
        }).click(function (e) {
            e.stopPropagation();
            if(!$(this).hasClass("disabled") && self.flag && self.groupData.length>1){
                self.flag = false;
                self.goto("next");
            };

        });

        this.prevBtn.hover(function () {
            if(!$(this).hasClass("disabled") && self.groupData.length>1){
                $(this).addClass("lightbox-prev-btn-show");
            };
        },function () {
            if(!$(this).hasClass("disabled") && self.groupData.length>1) {
                $(this).removeClass("lightbox-prev-btn-show");
            };
        }).click(function (e) {
            if(!$(this).hasClass("disabled")&& self.flag && self.groupData.length>1){
                self.flag = false;
                e.stopPropagation();
                self.goto("prev");
            };
        });
        //绑定窗口调整事件
        var timer = null;
        this.clear = false;
        $(window).resize(function () {
            if(self.clear){
                window.clearTimeout(timer);
                timer = window.setTimeout(function () {
                    self.loadPicSize(self.groupData[self.index].src);
                },500)
            };
        }).keyup(function (e) {   //键盘切换事件
            // console.log(e.which); jquery 捕获键盘相对应的值
            var keyValue = e.which;
            if(self.clear){
                if(keyValue == 39 || keyValue == 40){
                    self.nextBtn.click();
                }else if(keyValue == 37 || keyValue == 38){
                    self.prevBtn.click();
                };
            };
        });
    };

//一个功能一个方法
    LightBox.prototype={
        goto:function (dir) {
            if(dir === "next"){
                //this.groupData  this.index
                this.index++;
                if(this.index >= this.groupData.length-1){
                    this.nextBtn.addClass("disabled").removeClass("lightbox-next-btn-show");
                };
                if(this.index !=0){
                    this.prevBtn.removeClass("disabled");
                };
                var src = this.groupData[this.index].src;
                this.loadPicSize(src);

            }else if (dir === "prev" ){
                this.index--;
                if(this.index <= 0){
                    this.prevBtn.addClass("disabled").removeClass("lightbox-prev-btn-show");
                };
                if(this.index != this.groupData.length-1){
                    this.nextBtn.removeClass("disabled");
                };
                var src = this.groupData[this.index].src;
                this.loadPicSize(src);

            }

        },
        loadPicSize:function (sourceSrc) {
            var self = this;
            self.popupPic.css({width:"auto",height:"auto"}).hide(); //设置每次加载图片宽高自适应
            self.picCaptionArea.hide();
          //判断这张图是否加载完成 完成就赋值给popupPic 并拿它的宽、高
            this.preLoadImg(sourceSrc,function () {
                self.popupPic.attr("src",sourceSrc);
                var picWidth = self.popupPic.width(),
                    picHeight = self.popupPic.height();
                self.changePic(picWidth,picHeight);
            });
        },
        changePic:function (width,height) {
            var self = this;
            var winWidth = $(window).width(),
                winHeight = $(window).height();

            //如果图片的宽高大于浏览器视口的宽高的比例，我就看下是否溢出

            var scale = Math.min(winWidth/(width+10),winHeight/(height+10),1);
            width = width*scale*self.settings.winScales;
            height = height*scale*self.settings.winScales;

            this.picViewArea.animate({
                width:width-10,
                height:height-10
            },self.settings.speed);
            this.popupWin.animate({
                width:width,
                height:height,
                marginLeft:-(width/2),
                top:(winHeight-height)/2
            },self.settings.speed,function () {
                self.popupPic.css({
                    width:width-10,
                    height:height-10
                }).fadeIn();
                self.picCaptionArea.fadeIn();
                self.flag = true;
                self.clear = true;
            });
            //设置描述文字和当前索引
            //console.log(this.index);
            //groupData
            this.captionText.text(this.groupData[this.index].caption);
            this.currentIndex.text("当前索引："+(this.index+1)+ " of " +(this.groupData.length));
        },
        preLoadImg:function (src,callback) {
            //IE的兼容
            var img = new Image();
            if(!!window.ActiveXObject){
                img.onreadystatechange = function () {
                  if(this.readyState == "complete"){
                      callback();
                  };
                };
            }else{
                img.onload = function () {
                    callback();
                };
            };
            img.src = src;
        },
        showMaskAndPopup:function (sourceSrc,currentId) {
            var self =this;
            this.popupPic.hide();
            this.picCaptionArea.hide();

            this.popupMsak.fadeIn(); //淡出来

            var winWidth = $(window).width(),
                winHeight = $(window).height();

            this.picViewArea.css({

                width:winWidth/2,
                height:winHeight/2
            });

            this.popupWin.fadeIn();

            var viewHeight = winHeight/2+10;

            this.popupWin.css({
                width:winWidth/2+10,
                height:winHeight/2+10,
                marginLeft:-(winWidth/2+10)/2,
                top:-viewHeight
            }).animate({
                top:(winHeight-viewHeight)/2
            },self.settings.speed,function () {
                    //获取图片尺寸 加载图片
                self.loadPicSize(sourceSrc);

            }); //过渡  回调
        //根据当前点击的元素ID获取在当前组别里面的索引

            this.index = this.getIndexOf(currentId);
            // $(this).index()
            var groupDataLength = this.groupData.length;
            if(groupDataLength>1){
                //this.nextBtn

                if(this.index === 0){
                    this.prevBtn.addClass("disabled");
                    this.nextBtn.removeClass("disabled");
                }else if(this.index === groupDataLength-1){
                    this.nextBtn.addClass("disabled");
                    this.prevBtn.removeClass("disabled");
                }else{
                    this.prevBtn.removeClass("disabled");
                    this.nextBtn.removeClass("disabled");
                };

            };

        },

            getIndexOf:function (currentId) {

                var index = 0;
                $(this.groupData).each(function(i){
                    index = i;
                    if(this.id === currentId){
                        return false;
                    };
                });

                return index;
            },


        initPopup:function (currentObj) {

            var self      = this,
                sourceSrc = currentObj.attr("data-source"),
                currentId = currentObj.attr("data-id");

            this.showMaskAndPopup(sourceSrc,currentId);

        },
        getGroup:function () {

            var self = this;

            //根据当前的组别名称获取页面中所有相同组别的对象
            var groupList = this.bodyNode.find("*[data-group = "+this.groupName+" ]");
                //清空数组数据
                self.groupData.length = 0;
                groupList.each(function () {
                    self.groupData.push({
                        src:$(this).attr("data-source"),
                        id:$(this).attr("data-id"),
                        caption:$(this).attr("data-caption")
                    });
                });
            // console.log(self.groupData);

        },

        renderDOM:function () {
            var strDOM =    '<div class="lightbox-pic-view">'+
                                '<span class="lightbox-btn lightbox-prev-btn "></span>'+
                                '<img class="lightbox-image" src="images/2-2.jpg"  >'+
                                '<span class="lightbox-btn lightbox-next-btn "></span>'+
                            '</div>'+
                            '<div class="lightbox-pic-caption">'+
                                '<div class="lightbox-capton-area">'+
                                    '<p class="lightbox-pic-desc"></p>'+
                                    '<span class="lightbox-of-index">当前索引：0 of 0</span>'+
                                '</div>'+
                                '<span class="lightbox-close-btn"></span>'+
                            '</div>'
            //插入到popupWin
            this.popupWin.html(strDOM);
            //把遮罩和弹出框插入到body
            this.bodyNode.append(this.popupMsak,this.popupWin)
        }
    };
    window["LightBox"] = LightBox;  //注册到全局对象上
})(jQuery);