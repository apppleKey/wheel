declare var $: any;

enum DAMNU_TYPE {
    SYSETEM_INFO = 1, //系统消息公告类
    SEND_TEXT = 2, //普通文字弹幕
    FANS_WELCOME = 3,  //粉丝团欢迎效果
    USER_WELCOME = 4,  //vip欢迎效果
    QUIZ_TIP = 5,//竞猜通知
};
interface danmuItemOption {
    duration: number;
    type: DAMNU_TYPE

    data?: {
        userName?: string,
        carName?: string
        carImg?: string
        avatar?: string
        level?: (string | number)
        groupName?: string
        fansLevel?: (string | number)
        link?: (string | number)
    } | undefined
}

//单条弹幕
class DanMuItem {
    width!: number   //弹幕宽度
    duration!: number   //走过屏幕的用时
    speed!: number      //行驶速度
    type!: danmuItemOption['type']      //弹幕类型
    runInTime!: number       //完全进入视线的时间
    currentTime: number = 0  //已经跑了多久
    pContainer!: any  //父组件
    el!: any
    isdelete!: boolean
    data!: danmuItemOption['data']
    hasEmitBusy: boolean = false //通知了轨道是可用状态
    track!: Track
    id!: string  //弹幕唯一id
    paused = false  //该弹幕是否被鼠标移上去暂停
    constructor(options: danmuItemOption) {
        this.duration = options.duration
        this.type = options.type
        this.data = options.data;
        this.init()
    }
    // 初始化元素
    init() {
        var data = <danmuItemOption['data']>this.data || {
            userName: '',
            groupName: '',
            carName: '',
            carImg: '',
            level: '',
            avatar: '',
            fansLevel: '',
            link: '',

        };
        this.id = this.getID()
        switch (this.type) {
            case DAMNU_TYPE.USER_WELCOME: this.el =
                $(`<div class="running level${data.level}"  style="width:542px;"> 
                    <div class="gif">
                    </div>
                    <span class="r_user_name">${data.userName}</span><span class="r_user_car">骑着${data.carName}驾临直播间</span>
                    </div>
                </div>`);
                break;
            case DAMNU_TYPE.FANS_WELCOME:
                this.el = $(`<div class="king-funs" data-type="0">
                    <div class="funs-avatar">
                        <img src="${data.avatar}" onerror="setDefaultImg(this)" class="funs-avatar-img">
                        <span class="semicircle1"></span>
                        <span class="semicircle2"></span>
                        <span class="semicircle3"></span>
                    </div>
                    <div class="funs-lighter">
                        <div class="funs-lighter-bg"></div>
                        <div class="funs-lighter-flash"></div>
                        <div class="funs-lighter-content">
                            <div class="funs-icon"><span class="the-icon"></span>${data.groupName || '粉丝团'} ${data.fansLevel}</div>
                            <p class="funs-name">${data.userName} 进入直播间</p>
                        </div>
                        <span class="meteor meteor1"></span>
                        <span class="meteor meteor2"></span>
                        <span class="meteor meteor3"></span>
                    </div>
                </div>`);
                break;
            case DAMNU_TYPE.QUIZ_TIP:
                this.el = this.el = $(`<a class="announcement "  href="${data.link || 'javascript:void(0);'}">主播 <i>${data.userName}</i> 开启竞猜了，赶紧到竞猜大厅参与~ &nbsp;&nbsp;</a>`);
                //注册暂停事件
                this.el.on("mouseenter", () => {
                    this.el.css({
                        'animation-play-state': 'paused',
                        'z-index': 203
                    })
                    this.paused = true;
                }).on("mouseleave", () => {
                    this.el.css({
                        'animation-play-state': 'running'
                    })
                    this.paused = false;

                })
        }
    }
    getID() {
        return Math.random().toString().replace(".", "");
    }
    run() {
        var pWidth = this.pContainer.outerWidth()
        var totalDistance = pWidth + this.el.innerWidth()
        this.speed = totalDistance / this.duration;
        this.runInTime = this.el.innerWidth() / this.speed;
        
        //这种属性的需要暂停
        if (DAMNU_TYPE.QUIZ_TIP == this.type) {
            this.el.css({
                top: `${this.track.top}px`,
                'animation': `${this.duration}s linear danmu_${this.id}`
            })
            var runkeyframes = ` @keyframes danmu_${this.id}{
                                    from{
                                        translateX(0px);
                                    }
                                    to{
                                        transform:translateX(-${pWidth + this.el.innerWidth()}px);
                                    }
                                }`
            var style = document.styleSheets[0];
            style.insertRule(runkeyframes);
        }else{
            this.el.css({
                transition: `transform ${this.duration}s linear `,
                transform: `translateX(-${pWidth + this.el.innerWidth()}px)`,//头部顶到父元素的左边
                top: `${this.track.top}px`,
            })
        }

    }
    remmove() {
        this.el.remove()

    }
    append2PContainer() {
        this.pContainer.append(this.el)
    }
}

interface DanMuOptions {
    container: string
}
interface TrackOptions {
    onIsBusyChange?: any
}
interface Track {
    isBusy: boolean;  //是否繁忙
    height: number;   //轨道高度
    top: number
    zIndex:number
}

enum DANMU_STATE {
    READY = 0,
    RUNNING = 1,
    PAUSE = 2,
    STOP = 3
}

class DanMu {
    danmus: Array<DanMuItem> = []
    container!: any
    maxLength = 1
    bufferList: Array<DanMuItem> = []
    tracks: Array<Track> = []
    loopTime: number = 200
    status: DANMU_STATE = DANMU_STATE.READY
    runingTimer!: any  //时钟
    constructor(options: DanMuOptions) {
        this.container = $(options.container)
        this.tracks[0] = { isBusy: false, height: 50, top: 20,zIndex:202 }
        this.tracks[1] = { isBusy: false, height: 50, top: 70,zIndex:202 }
        this.init()
    }
    init() {

    }
    // 实时监测并删除元素            
    doCheck() {
        if (this.danmus.length > 0) {
            // console.log('this.danmus.length',this.danmus.length)

            for (var i = this.danmus.length - 1; i >= 0; i--) {
                var danmuItem = this.danmus[i]
                if(danmuItem.paused){continue}
                // console.log('danmuItem.currentTime',danmuItem.currentTime)
                if (danmuItem.currentTime == 0) {
                    danmuItem.run()
                }
                //如果完全出现在页面，通知轨道可以添加
                if (!danmuItem.hasEmitBusy && danmuItem.currentTime > danmuItem.runInTime) {
                    danmuItem.hasEmitBusy = true;
                    danmuItem.track.isBusy = false;
                    this.push2Track()

                }
                //到时间了就清掉
                if (danmuItem.currentTime > danmuItem.duration) {
                    danmuItem.remmove();
                    danmuItem.isdelete = true

                    this.danmus.splice(i, 1)
                } else {
                    danmuItem.currentTime += this.loopTime / 1000;
                }
            }
        }

        else {
            if (this.bufferList.length > 0) {
                return this.push2Track();
            }
            this.status = DANMU_STATE.READY
            clearInterval(this.runingTimer);
            // console.log('休息')
        }
    }
    push(danmu: DanMuItem, isForce: boolean = false) {
        if (this.status === DANMU_STATE.STOP) return;
        danmu.pContainer = this.container
        this.bufferList.push(danmu);
        this.push2Track()
        this.start()
    }
    push2Track() {
        if (this.status === DANMU_STATE.STOP) { return }
        if (this.bufferList.length > 0) {
            for (var i = 0; i < this.tracks.length; i++) {
                var track = this.tracks[i];
                if (!track.isBusy) {
                    var danmu = <DanMuItem>this.bufferList.shift()
                    danmu.track = track;
                    this.danmus.push(danmu);
                    track.isBusy = true;
                    danmu.append2PContainer();
                    break

                }
            }
        }
    }
    start() {
        if (this.status !== DANMU_STATE.RUNNING) {
            // console.log('start');
            this.status = DANMU_STATE.RUNNING
            this.runingTimer = setInterval(() => {
                // 实时监测并删除元素   
                this.doCheck()
            }, this.loopTime);
        }
        return this
    }
    // 暂停   
    pause() {
        this.status = DANMU_STATE.PAUSE
        this.bufferList.length = 0;  //保证暂停
        clearInterval(this.runingTimer);
    }
    //停止 1.清定时器 2.移除所有轨道里的元素，并在页面移除，3将所有的轨道都置位不繁忙
    stop() {
        this.status = DANMU_STATE.STOP
        this.runingTimer && clearInterval(this.runingTimer);
        for (var i = this.danmus.length - 1; i >= 0; i--) {
            var danmuItem = this.danmus[i]
            danmuItem.track.isBusy = false;  //将所有的轨道都置位不繁忙
            danmuItem.remmove();
            danmuItem.isdelete = true
            this.danmus.splice(i, 1)
        }
        this.bufferList = [];
    }
}
if (localStorage.danmu_debug) {


    $('body').append($(`<div style="position:fixed;top:0;color:white; background:red;z-index: 10000;right:0">
<button class="sendVipBtn">发送vip进场</button>
<button class="sendFansBtn">发送粉丝进场</button>
<button class="sendQuizBtn">发送竞猜消息</button>
<button class="pauseBtn">暂停</button>
<button class="startBtn">继续</button>
<button class="stopBtn">停止</button>
<p id="danmuLength"></p>
<p id="bufferLength"></p>
<p id="timeStatus"></p>
<p id="busyStatus"></p>
<p id="busyStatus1"></p>
</div>`))

    var myDanmu = new DanMu({ container: '#container' })
    myDanmu.start()
    // var myDanmu = new DanMu({ container: '.video' })
    var nameList = ["且", "微光倾城紫色的彩虹", "偷得浮生", "雨晨的清风", "烛光里的愿", "紫色的彩虹浅浅嫣然笑", "伊人泪满",
        "面青丝茧偷得浮生", "微醉阳光", "如花的旋律泪梦里花", "代价是折磨雨晨的清风", "倚靠窗畔", "花舞花落", "泪梦里花", "浅浅嫣然笑"]
    var carList = { 7: '如意石羊', 8: '吉祥福貂', 9: '聚财宝鹰', 10: '纳福神驹', 11: '猎宝金狼', 12: '富贵灵豹', 13: '财运仙虎', 14: '神尊凤凰', 15: '创世狮王', 16: '天尊麒麟' }
    $('.sendVipBtn').on('click', function () {
        for (var i = 7; i <= 16; i++) {

            myDanmu.push(new DanMuItem({
                duration: 10, type: DAMNU_TYPE.USER_WELCOME,
                data: {
                    userName: nameList[2], carName: <string>carList[i],
                    carImg: '/public/front/images/level/fenghuang.png'
                    ,
                    groupName: '',
                    level: i,
                    avatar: '',
                    fansLevel: '',
                }
            }))
        }

    })
    $('.sendFansBtn').on('click', function () {
        var data = {
            avatar: "https://a0-prod-upload.oss-accelerate.aliyuncs.com/https://a03-pre-web.we-pj.com/default.png",
            avatar_thumb: "https://a0-prod-upload.oss-accelerate.aliyuncs.com/https://a03-pre-web.we-pj.com/default.png",
            car_id: "0",
            car_swf: "",
            car_swftime: "0",
            car_words: "",
            fansLevel: 2,
            groupName: "粉丝团",
            id: 261571,
            isFans: true,
            level: "4",
            unameAfterReplace: "聊了个球聊了个球聊了",
            user_nicename: "聊了个球聊了个球聊了",
            vip: 0
        }
        myDanmu.push(new DanMuItem({
            duration: 10, type: DAMNU_TYPE.FANS_WELCOME,
            data: {
                userName: data.unameAfterReplace || data.user_nicename,
                level: data.level,
                groupName: data.groupName,
                avatar: data.avatar,
                fansLevel: data.fansLevel
            }
        }))

    })
    $('.sendQuizBtn').on('click', function () {

        myDanmu.push(new DanMuItem({
            duration: 15, type: DAMNU_TYPE.QUIZ_TIP,
            data: {
                userName: "聊了个球聊了个球聊了",
                link: '//baidu.com'
            }
        }))

    })

    $('.pauseBtn').on('click', function () {
        myDanmu.pause()
    })
    $('.video').on('click', function () {
        $(this).css("overflow", 'hidden')
    })
    $('.stopBtn').on('click', function () {
        myDanmu.stop()
    })
    $('.startBtn').on('click', function () {
        myDanmu.start()
    })
    setInterval(() => {
        $('#danmuLength').text('当前弹幕长度:' + myDanmu.danmus.length)
        $('#bufferLength').text('等待队列当前长度:' + myDanmu.bufferList.length)
        $('#timeStatus').text('弹幕状态:' + DANMU_STATE[myDanmu.status])
        $('#busyStatus').text('轨道一:' + myDanmu.tracks[0].isBusy)
        $('#busyStatus1').text('轨道二:' + myDanmu.tracks[1].isBusy)
    }, 200)
}