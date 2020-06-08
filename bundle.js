var is_downloading=0,
    list,
    now=0,
    download_lrc=1,
    res="",
    audio=$('#player')[0],
    lrcTime=[],
    lrc,
    lrcli,
    currentLine,
    currentTime,
    lrc_ppxx,
    songlist,
    screencenter=window.innerHeight/2,
    issl=[];
$('#download_lrc').click(function(){download_lrc^=1;});
function getlrc(id){
    var t=$.ajax({
        url: list[id].lrc,
        async: false
    }).responseText;
    lrcTime=[];
    lrcul=$("#lrclist")[0];lrcul.innerHTML="";
    lrcul.style.transform="translateY("+screencenter+"px)";
    currentLine=0;
    if(t==''){
        lrcul.innerHTML='<center>暂无歌词<center>';
        return;
    }
    t=t.split('\n');
    for(var i=0;i<t.length;++i){
        lrcTime[i]=parseFloat(t[i].substr(1,3))*60+parseFloat(t[i].substring(4,10));//00:00.000转化为00.000格式
        lrcul.innerHTML+="<li class='mdui-list-item'>"+t[i].substr(11,t[i].length)+"</li>";
    }
	lrcTime[lrcTime.length]=lrcTime[lrcTime.length-1]+3;
    lrcli=$("#lrclist>li");    
}
audio.ontimeupdate=function(){
	currentTime=audio.currentTime;
	for(var j=currentLine,len=lrcTime.length;j<len;j++){
		if (currentTime<lrcTime[j+1] && currentTime>lrcTime[j]){
			currentLine=j;
			lrc_ppxx=screencenter-(currentLine*48);
			lrcul.style.transform="translateY("+lrc_ppxx+"px)";
			lrcli.get(currentLine-1).className="mdui-list-item";
			lrcli.get(currentLine).className="mdui-list-item on";
			break;
		}
	}
};
audio.onseeked=function(){
    currentTime=audio.currentTime;
    lrcli.get(currentLine).className="";
    for(k=0,len=lrcTime.length;k<len;++k){
        if(currentTime<lrcTime[k+1]&&currentTime<lrcTime[k]){
            currentLine=k;
            break;
        }
    }
};
audio.onerror=function(){
    mdui.snackbar({message: '播放失败,自动下一首',timeout: 500,position: 'top'});
    nxt();
};
function play(i){
    songlist[now].children[1].style.fontWeight='normal';
    now=i;
    $("#player").attr("src",list[i].url);
    getlrc(i);
    songlist[i].scrollIntoView(false);
    songlist[i].children[1].style.fontWeight='bold';
}
function pre(){
    if(now>0)play(now-1);
    else play(list.length-1);
}
function nxt(){
    if(now<list.length-1)play(now+1);
    else play(0)
}
function rnd(){play(Math.floor((Math.random()*(list.length-1))));}
document.getElementById("player").addEventListener('ended',function(){nxt();});

function get(){
    var id=$('#playlistid').val(),
        typ=$('#playlisttyp').val();
    list=JSON.parse(
        $.ajax({
            url: "https://api.i-meto.com/meting/api?server="+typ+"&type=playlist&id="+id,
            async: false
        }).responseText
    );
}

function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
function download_(id){
    var name=list[id].author+"-"+list[id].title;
    if($("#download_name").val()==1)name=list[id].title+"-"+list[id].author;
    else if($("#download_name").val()==2)name=list[id].title;

    var tmp=name,r="/\\*?<>|?:";name='';
    for(var i=0;i<tmp.length;++i)
        if(r.indexOf(tmp[i])!=-1)name+='_';
        else name+=tmp[i];

    var xhr=new XMLHttpRequest();
    xhr.open('GET',list[id].url,true);
    xhr.responseType="blob";
    xhr.onload=async function(){
        is_downloading=1;
        if(this.status===200){
            var blob=this.response;
            var a=document.createElement('a');
            a.download=name+".mp3";
            a.href=window.URL.createObjectURL(blob);
            a.click();
            await sleep(2000);
            is_downloading=0;
        }
    };
    xhr.send();
    if(!download_lrc)return;
    var xhr=new XMLHttpRequest();
    xhr.open('GET',list[id].lrc,true);
    xhr.responseType="blob";
    xhr.onload=async function(){
        is_downloading=1;
        if(this.status===200){
            var blob=this.response;
            var a=document.createElement('a');
            a.download=name+".lrc";
            a.href=window.URL.createObjectURL(blob);
            a.click();
            await sleep(1000);
            is_downloading=0;
        }
    };
    xhr.send();
}
async function download(){
    mdui.snackbar({message: '加载中',timeout: 500,position: 'top'});
    get();
    mdui.snackbar({message: '开始下载',timeout: 500,position: 'top'});
    for(i in list)if(issl[i]){
        download_(i);
        while(is_downloading)await sleep(500);
    }
}
function expt_(id,typ){
    var name=list[id].author+"-"+list[id].title;
    if($("#download_name").val()==1)name=list[id].title+"-"+list[id].author;
    else if($("#download_name").val()==2)name=list[id].title;
    
    var tmp=name,r="/\\*?<>|?:";name='';
    for(var i=0;i<tmp.length;++i)
        if(r.indexOf(tmp[i])!=-1)name+='_';
        else name+=tmp[i];

    if(typ=='wget')
        res+="wget \""+list[i].url+"\" -O \""+name+".mp3\"\n";
    else if(typ=='certutil')
        res+="certutil -urlcache -split -f \""+list[id].url+"\" \""+name+".mp3\"\n";
    if(!download_lrc)return;
    if(typ=='wget')
        res+="wget \""+list[i].lrc+"\" -O \""+name+".lrc\"\n";
    else if(typ=='certutil')
        res+="certutil -urlcache -split -f \""+list[id].lrc+"\" \""+name+".lrc\"\n";
}
function expt(typ){
    mdui.snackbar({message: '加载中',timeout: 500,position: 'top'});
    get();
    res="";
    for(i in list)if(issl[i])expt_(i,typ);
    console.clear(),console.log(res);
    mdui.snackbar({message: '加载完毕',timeout: 500,position: 'top'});
    mdui.snackbar({
        message:"请按F12打开控制台(Console)复制,并在终端运行",
        timeout:5000,position:'top'
    });
}
function genlist(){
    mdui.snackbar({message: '加载中',timeout: 500,position: 'top'});
    $("#songlist").html("");
    get();
    for(i in list){
        $("#songlist").append(
"<li class='mdui-list-item'>\
    <div class='mdui-list-item-avatar'><img src='"+list[i].pic+"'></div>\
    <a onclick=\"play("+i+")\" class='mdui-list-item-content'>\
        <div class='mdui-list-item-title'>"+list[i].title+"</div>\
        <div class='mdui-list-item-text'>"+list[i].author+"</div>\
    </a>\
    <label class='mdui-checkbox'>\
        <input type='checkbox' onclick=\"issl["+i+"]^=1\">\
        <i class='mdui-checkbox-icon'></i>\
    </lable>\
</li>");
        issl[i]=0;
    }
    songlist=lrcli=$("#songlist>li");
    mdui.snackbar({message: '加载完毕',timeout: 500,position: 'top'});
}
function selectrev(){
    for(var i=0;i<songlist.length;++i){
        var x=songlist[i].children[2].children[0];
        if(issl[i])x.checked=false;
        else x.checked=1;
        issl[i]^=1;
    }
}