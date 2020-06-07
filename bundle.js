var is_downloading=0,
    list,
    now=0,
    download_lrc=1,
    res="";
$('#download_lrc').click(function(){download_lrc^=1;});
function play(i){
    now=i;
    $("#player").attr("src",list[i].url);
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
    for(i in list){
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
    for(i in list)expt_(i,typ);
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
    for(i in list)$("#songlist").append(
"<li class='mdui-list-item' style='max-width: 500px;'>\
    <div class='mdui-list-item-avatar'><img src='"+list[i].pic+"'></div>\
    <a onclick=\"play("+i+")\" class='mdui-list-item-content'>\
        <div class='mdui-list-item-title'>"+list[i].title+"</div>\
        <div class='mdui-list-item-text'>"+list[i].author+"</div>\
    </a>\
    <a href=\"javascript:download_("+i+")\">\
        \<i class='mdui-list-item-icon mdui-icon material-icons'>file_download</i>\
    </a>\
</li>");
    mdui.snackbar({message: '加载完毕',timeout: 500,position: 'top'});
}