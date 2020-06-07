var is_downloading=0,
    list,
    now=0,
    download_lrc=1,
    res="";
$('#download_lrc').click(function(){download_lrc^=1;});
function node(i){
    return "<li class='mdui-list-item' style='max-width: 500px;'>\
        <div class='mdui-list-item-avatar'><img src='"+list[i].pic+"'></div>\
        <a onclick=\"play("+i+")\" class='mdui-list-item-content'>\
            <div class='mdui-list-item-title'>"+list[i].title+"</div>\
            <div class='mdui-list-item-text'>"+list[i].author+"</div>\
        </a>\
        <a href=\"javascript:download("+i+",1)\">\
            \<i class='mdui-list-item-icon mdui-icon material-icons'>file_download</i>\
        </a>\
    </li>";
}
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
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
function download(id,typ){
    var name=list[id].author+"-"+list[id].title;
    if($("#download_name").val()==1)name=list[id].title+"-"+list[id].author;
    else if($("#download_name").val()==2)name=list[id].title;

    if(typ>0){
        name=name.replace('/\/|\\|\||*|>|<|?|:/g','_');
        var tmp=name,r="/\\*?<>|?:";name='';
        for(var i=0;i<tmp.length;++i)
            if(r.indexOf(tmp[i])!=-1)name+='_';
            else name+=tmp[i];
    }

    if(typ==2)
        res+="wget \""+list[i].url+"\" -O \""+name+".mp3\"\n";
    else if(typ==3)
        res+="certutil -urlcache -split -f \""+list[i].url+"\" \""+name+".mp3\"\n";
    else{
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
    }
    if(!download_lrc)return;
    if(typ==2)
        res+="wget \""+list[i].lrc+"\" -O \""+name+".lrc\"\n";
    else if(typ==3)
        res+="certutil -urlcache -split -f \""+list[i].lrc+"\" \""+name+".lrc\"\n";
    else{
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
}
async function render(b){
    mdui.snackbar({
        message: '加载中',
        timeout: 500,
        position: 'top'
    });
    if(b>1)res="";
    if(b==0)$("#songlist").html("");
    var id=$('#playlistid').val(),
        typ=$('#playlisttyp').val();
    var t=$.ajax({
        url: "https://api.i-meto.com/meting/api?server="+typ+"&type=playlist&id="+id,
        async: false
    }).responseText;
    list=JSON.parse(t);
    for(i in list)
        if(b==0)$("#songlist").append(node(i));
        else{
            download(i,b);
            while(is_downloading)await sleep(500);
        }
    mdui.mutation();
    mdui.snackbar({
        message: '加载完毕',
        timeout: 500,
        position: 'top'
    });
    if(b>1){
        mdui.snackbar({
            message:"请按F12打开控制台(Console)复制,并在终端运行",
            timeout:5000,
            position:'top'
        });
        console.log(res);
    }
}