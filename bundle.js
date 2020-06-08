var is_downloading=0,
    list,
    now=0,
    download_lrc=1,
    res="",
    audio=document.getElementById('player'),
    lrcTime=[],
    lrc,
    lrcli,
    currentLine,
    currentTime,
    lrc_ppxx,
    songlist,
    screencenter=window.innerHeight/2,
    issl=[];
function getlrc(id){
    var t=$.ajax({
        url: list[id].lrc,
        async: false
    }).responseText;
    lrcTime=[];
    lrcul=document.getElementById('lrclist');
    lrcul.innerHTML="";
    lrcul.style.transform="translateY("+screencenter+"px)";
    currentLine=0;
    if(t==''){
        lrcul.innerHTML='<center>暂无歌词<center>';
        return;
    }
    t=t.split('\n');
    for(var i=0;i<t.length;++i){
        lrcTime[i]=parseFloat(t[i].substr(1,3))*60+parseFloat(t[i].substring(4,10));
        lrcul.innerHTML+="<li class='mdui-list-item'>"+t[i].substr(11,t[i].length)+"</li>";
    }
	lrcTime[lrcTime.length]=lrcTime[lrcTime.length-1]+3;
    lrcli=document.querySelectorAll('#lrclist li');
}
audio.ontimeupdate=function(){
	currentTime=audio.currentTime;
	for(var j=currentLine,len=lrcTime.length;j<len;j++){
		if (currentTime<lrcTime[j+1]&&currentTime>lrcTime[j]){
			currentLine=j;
			lrc_ppxx=screencenter-(currentLine*48);
			lrcul.style.transform="translateY("+lrc_ppxx+"px)";
            try{lrcli[currentLine-1].classList.remove('on')}catch{}
			lrcli[currentLine].classList.add('on');
			break;
		}
	}
};
audio.onseeked=function(){
    currentTime=audio.currentTime;
    try{lrcli[currentLine].classList.remove('on');}catch{}
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
    audio.setAttribute('src',list[i].url);
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
    var id=document.getElementById('playlistid').value,
        typ=document.getElementById('playlisttyp').value,
        xhr=new XMLHttpRequest();
    xhr.open('GET',"https://api.i-meto.com/meting/api?server="+typ+"&type=playlist&id="+id,false);
    xhr.send();
    list=JSON.parse(xhr.responseText);
}

function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
function saveas(res,filename){
    var blob=res,a=document.createElement('a');
    a.download=filename;
    a.href=window.URL.createObjectURL(blob);
    a.click();
}
function download_(id){
    while(!issl[id]&&id<list.length)++id;
    if(id>=list.length)return;
    songlist[id].scrollIntoView(false);
    
    var name=list[id].author+"-"+list[id].title,
        val=document.getElementById('download_name').value;
    if(val==1)name=list[id].title+"-"+list[id].author;
    else if(val==2)name=list[id].title;

    var tmp=name,r="/\\*?<>|?:";name='';
    for(var i=0;i<tmp.length;++i)
        if(r.indexOf(tmp[i])!=-1)name+='_';
        else name+=tmp[i];
    console.log(id);
    var xhr=new XMLHttpRequest();
    xhr.onprogress=function(e){
        if(e.lengthComputable)
            document.getElementById("progressbar_").style.width=Math.round(100*e.loaded/e.total)+'%';
    };
    xhr.responseType="blob";
    xhr.open("GET",list[id].url,true);
    xhr.onreadystatechange=function(e){
        if(this.readyState==4){
            if(this.status==200)
                saveas(this.response,name+'.mp3');
            download_(id+1);
        }
    }
    xhr.send();

    if(!download_lrc)return;

    var xhr=new XMLHttpRequest();
    xhr.responseType="blob";
    xhr.open("GET",list[id].lrc,true);
    xhr.onreadystatechange=function(e){
        if(this.readyState==4&&this.status==200)
            saveas(this.response,name+'.lrc');
    }
    xhr.send();
}
function download(){
    mdui.snackbar({message: '开始下载',timeout: 500,position: 'top'});
    document.getElementById('progressbar').hidden=0;
    download_(0);
    document.getElementById('progressbar').hidden=1;
    mdui.snackbar({message: '下载完成',timeout: 500,position: 'top'});
}
function expt_(id,typ){
    var name=list[id].author+"-"+list[id].title,
        val=document.getElementById('download_name').value;
    if(val==1)name=list[id].title+"-"+list[id].author;
    else if(val==2)name=list[id].title;
    
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
    get();
    var tmp=''
    for(i in list){
        tmp+=
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
</li>";
        issl[i]=0;
    }
    songlist=document.getElementById('songlist');
    songlist.innerHTML=tmp;
    songlist=songlist.children;
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