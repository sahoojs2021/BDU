	var winArea    = $(window);
	var page       = $(document);
	var mainVideo;
	var mainVid
	
	var paramData = {};
	var viewFullScreen;
	var videoContainer;   
	var interactingWithSeekBar = false;
	var docElm;
	var viewFullScreen;
	var controlBar;  
	var vidWidth;
	var vidHeight;
	var loading;
	var centerPlay;
	var playbtn;
	var volume         = 0.75;
	var buffered       = 0;
	var lastX          = 0;
	var lastMove       = 0;
	var timerHover     = null;
	//page.ready(initPlayer());  // Wait till page ready

	function init(paramObj){
		paramData = paramObj;
		updateObj(paramData);
		initPlayer();
		loadPlayer();
	}	
	
	function loadPlayer(){
		updateSrc(paramData.file, paramData.autostart);
	}
	
	function updateSrc(url, auto){
		try{
			mainVid[0].src  = String(unescape(url));
			mainVid[0].type = "video/mp4";
			mainVid[0].loop = false;
			mainVid[0].load();
			mainVid[0].autoplay = auto;
			updateLog("Video loaded successfully.");
			mainVid.on('loadedmetadata', metaLoaded);
			mainVid.on('canplaythrough', canPlayVideo);
		}catch(e){}
		return false;
	}
	
	
	function canPlayVideo(e){
		updateLog("canPlayVideo  successfully !");
		loading.hide();
		controlBar.show();	
		
	}
	function metaLoaded(e){
		updateLog("first time meta loaded successfully !");
		
	}
	function updateObj(obj){
		for(var id in obj){
			updateLog(id+" = "+obj[id]);
		}
	}
	
	function updateLog(str){
		console.log(str)
	}
	
	function initPlayer(){
		//alert("page ready");
		var vidHolder = $("#video-box").empty();
		
		vidHolder.show();
		vidHolder.append('<!-- videoplayer STARTS here --->')
		vidHolder.append(createViewElem());	
		vidHolder.append('<!-- videoplayer ENDS here --->')
		videoContainer = $("#videoContainer");	
		controlBar = $("#controlBar").hide();	
		mainVid  = $("#contentElement");
		mainVideo  = document.getElementById('contentElement');
		loading = $("#loading");
		playbtn = $("#playbtn");		
		playPause  = document.getElementById("playPause");
		vidWidth   = videoContainer.width();
		vidHeight  = videoContainer.height();
		adButtonEvents();
		iniFullScreen();
		mainVideo.volume = 0;
		buttonMouseOut();	
		
		if(!paramData.autostart){
			playbtn.show();	
		}
		
		if (localStorageGetItem('videocontrols-muted') === null){
			localStorageSetItem('videocontrols-muted', '0');
		}
		mainVideo.muted = localStorageGetItem('videocontrols-muted') == '1' ? true : false;

		if (localStorageGetItem('videocontrols-volume') === null){
			localStorageSetItem('videocontrols-volume', volume);
		}
		volume = localStorageGetItem('videocontrols-volume', volume);
		mainVideo.volume = volume;
		
		videoContainer.parent().find('.vc-player').on('mouseenter touchstart', function (){
			clearTimeout(timerHover);
			$(this).addClass('hover');
		});
		
		videoContainer.parent().find('.vc-player').on('mouseleave touchend', function (){
			clearTimeout(timerHover);
			timerHover = setTimeout(function (){
				videoContainer.parent().find('.vc-player').removeClass('hover');
			}, 2000);
		}); 

		videoContainer.find('.videocontrols-seeker').on('click', function (e){
			e.preventDefault();
			e.stopPropagation();
			var clientX = getClientX(e);
			var left = clientX - videoContainer.find('.videocontrols-seeker').offset().left;
			left     = Math.max(0, left);
			left     = Math.min(videoContainer.find('.videocontrols-seeker').width(), left);
			
			//mainVideo.off('timeupdate', timeUpdate);
			mainVideo.removeEventListener('timeupdate', timeUpdate, false);
			
			videoContainer.find('.videocontrols-seekbar').animate({ left: left }, 150, 'linear', function ()				{
				seekbar_up(clientX);
			});
		});
		videoContainer.find('.videocontrols-seekbar').on('mousedown touchstart', function (e)			{
			e.preventDefault();
			$(document).one('mouseup touchend', seekbar_up);
			mainVideo.removeEventListener('timeupdate', timeUpdate, false);
			$(document).on('mousemove touchmove', seekbar_move);
		});

		function seekbar_move(e){
			e.preventDefault();
			e.stopPropagation();
			var clientX = getClientX(e);
			var left = clientX - videoContainer.find('.videocontrols-seeker').offset().left;
			left     = Math.max(0, left);
			left     = Math.min(videoContainer.find('.videocontrols-seeker').width(), left);
			videoContainer.find('.videocontrols-seekbar').css('left', left);
		}
		
		function seekbar_up(e){
			if (!$.isNumeric(e)){
				e.preventDefault();
				e.stopPropagation();
			}
			var clientX = getClientX(e);
			$(document).off('mousemove touchmove', seekbar_move);
			mainVideo.currentTime = (clientX - videoContainer.find('.videocontrols-seeker').offset().left) / videoContainer.find('.videocontrols-seeker').width() * mainVideo.duration;
			//$video.on('timeupdate', timeupdate);
			mainVideo.addEventListener('timeupdate', timeUpdate, false);
			videoContainer.find('.videocontrols-preview').remove(); 
		}
			
			// ------ volume change ----------
			
			//$video.on('volumechange', volumechange);
			
		videoContainer.find('.videocontrols-mute').on('click', function (e)	{
			e.preventDefault();
			updateLog("you clicked - ")
			
			if (!mainVideo.muted)				{
				mainVideo.muted = true;
				localStorageSetItem('videocontrols-muted', '1');
			}
			else
			{
				mainVideo.muted = false;
				localStorageSetItem('videocontrols-muted', '0');
			}
		});

		videoContainer.find('.videocontrols-weight-volume').on('click', function (e)
		{
			updateLog("volume weight clicked ")
			volume_move(e);
		});

		videoContainer.find('.videocontrols-volumebar').on('mousedown touchstart', function (e){
			e.preventDefault();
			$(document).one('mouseup touchend', volume_up);
			$(document).on('mousemove touchmove', volume_move);
		});

		function volume_move(e){
			e.preventDefault();
			e.stopPropagation();
			var clientX = getClientX(e);
			//alert(clientX);
			volume = (clientX - videoContainer.find('.videocontrols-volume').offset().left) / videoContainer.find('.videocontrols-volume').width();
			volume = Math.max(0, volume);
			volume = Math.min(1, volume);
			mainVideo.muted = false;
			mainVideo.volume = volume;
			localStorageSetItem('videocontrols-muted', '0');
			localStorageSetItem('videocontrols-volume', volume);
		}

		function volume_up(e){
			$(document).off('mousemove touchmove', volume_move);
			/*if (options.volumechange)
			{
				options.volumechange($(this));
			}*/
		}			
	}
	
	function volumeChange(){
				var pourcent = mainVideo.volume * 100;
				videoContainer.find('.videocontrols-volume-progressbar').css('width', pourcent + '%');
				videoContainer.find('.videocontrols-volumebar').css('left', pourcent + '%');
				videoContainer.find('.videocontrols-mute').removeClass('vc-icon-volume-high vc-icon-volume-medium vc-icon-volume-low vc-icon-volume-mute2 vc-icon-volume-mute');
				if (mainVideo.muted){
					videoContainer.find('.videocontrols-mute').addClass('vc-icon-volume-mute2');
				}else if (pourcent > 75){
					videoContainer.find('.videocontrols-mute').addClass('vc-icon-volume-high');
				}else if (pourcent > 50)
				{
					videoContainer.find('.videocontrols-mute').addClass('vc-icon-volume-medium');
				}
				else if (pourcent > 15)
				{
					videoContainer.find('.videocontrols-mute').addClass('vc-icon-volume-low');
				}
				else
				{
					videoContainer.find('.videocontrols-mute').addClass('vc-icon-volume-mute');
				}
			}

	function updateLog(str){
		console.log(str)
	}
	function buttonMouseOut(){			
			controlBar.parent().find('.vc-player').on('mouseenter touchstart', function (){
				clearTimeout(timerHover);
				$(this).addClass('hover');
			});
			controlBar.parent().find('.vc-player').on('mouseleave touchend', function (){
				clearTimeout(timerHover);
				timerHover = setTimeout(function ()
				{
					controlBar.parent().find('.vc-player').removeClass('hover');
				}, 2000);
			});
	}
	function adButtonEvents(){
		if (document.addEventListener) {
			playPause.addEventListener('click',togglePlayPause, false);	
			playbtn.on('click',togglePlayPause);	
			
			mainVideo.addEventListener('click',togglePlayPause, false);	
			mainVideo.addEventListener('loadedmetadata', videoMetaData, false);
			mainVideo.addEventListener('canplaythrough', videoMetaData, false);
			mainVideo.addEventListener('progress', videoMetaData, false);
			mainVideo.addEventListener('loadeddata', videoMetaData, false);
			mainVideo.addEventListener('timeupdate', timeUpdate, false );
			mainVideo.addEventListener('durationchange', durUpdate, false );
			mainVideo.addEventListener('play', updatePlayBtns, false);
			mainVideo.addEventListener('pause',updatePauseBtns , false);	
			mainVideo.addEventListener('volumechange', volumeChange, false);
		}		
	}
	function fullscreenMove(){
		var ids = videoContainer.find('.vc-player');
			if (!videoContainer.find('.vc-player').hasClass('hover')){
				videoContainer.find('.vc-player').addClass('hover');
				alert("I am updating class");
			}
			clearTimeout(timerHover);

			timerHover = setTimeout(function (){
				videoContainer.find('.vc-player').removeClass('hover');
			}, 2000);
		}
	
	function timeUpdate(){
		var pourcent = mainVideo.currentTime * 100 / mainVideo.duration;
		controlBar.find('.videocontrols-progressbar').css('width', pourcent + '%');
		controlBar.find('.videocontrols-seekbar').css('left', pourcent + '%');
		controlBar.find('.videocontrols-timer').html(secondsToTime(mainVideo.currentTime));
	}
	function durUpdate(){
		controlBar.find('.videocontrols-totaltime').html(' / ' + secondsToTime(mainVideo.duration));
	}
	
	function updatePauseBtns() {
		controlBar.find('.vc-icon-pause').removeClass('vc-icon-pause').addClass('vc-icon-play');
		playbtn.show();
	}
	function updatePlayBtns(e) {
		controlBar.find('.vc-icon-play').removeClass('vc-icon-play').addClass('vc-icon-pause');
		playbtn.hide();
	}
	 function togglePlayPause(e) {
				if (mainVideo.paused || mainVideo.ended) mainVideo.play();
				else mainVideo.pause();
			}
			
	winArea.resize(function() { // Stage resize event handler
		stageResize();
	});
	
	function stageResize(){
		if(isFullScreen()){
			videoContainer.width("100%");
			videoContainer.height("100%")
		}else{
			videoContainer.width(vidWidth);
			videoContainer.height(vidHeight)
		}
		updateFullBtns(isFullScreen()); 
	}
	function updateFullBtns(bool){
		if(!bool){
			controlBar.find('.vc-icon-contract').removeClass('vc-icon-contract').addClass('vc-icon-expand');
		}else{
			controlBar.find('.vc-icon-expand').removeClass('vc-icon-expand').addClass('vc-icon-contract');
		}
	}
	
	/* ---------------base modal --------------------- */
	function getClientX(e)
		{
			var clientX = 0;
			if ($.isNumeric(e))
			{
				clientX = e;
			}
			else if ($.isNumeric(e.clientX))
			{
				clientX = $(document).scrollLeft() + e.clientX;
			}
			else if (isTouch)
			{
				clientX = e.originalEvent.pageX + e.originalEvent.targetTouches[0].clientX;
			}
			return clientX;
		}

	// Checks if the document is currently in fullscreen mode
	function isFullScreen() {
		return !!(document.fullScreen || document.webkitIsFullScreen || document.mozFullScreen || document.msFullscreenElement || document.fullscreenElement);
	}
	function iniFullScreen(){
		viewFullScreen= document.getElementById("Fullscreen");
		if (viewFullScreen) {
			viewFullScreen.addEventListener("click", function () {
//				videoContainer.find('.vc-icon-expand').removeClass('vc-icon-expand').addClass('vc-icon-contract');
				docElm = document.getElementById("videoContainer");//document.documentElement;
				if(!isFullScreen()){
					if (docElm.requestFullscreen) {
						docElm.requestFullscreen();
					}else if (docElm.msRequestFullscreen) {
						docElm.msRequestFullscreen();
					}else if (docElm.mozRequestFullScreen) {
						docElm.mozRequestFullScreen();
					}else if (docElm.webkitRequestFullScreen) {
						docElm.webkitRequestFullScreen();
					}					
				}else{
					//videoContainer.find('.vc-icon-contract').removeClass('vc-icon-contract').addClass('vc-icon-expand');
				if (document.exitFullscreen) {
					document.exitFullscreen();
				}
				else if (document.msExitFullscreen) {
					document.msExitFullscreen();
				}
				else if (document.mozCancelFullScreen) {
					document.mozCancelFullScreen();
				}
				else if (document.webkitCancelFullScreen) {
					document.webkitCancelFullScreen();
				}
				}
				
			}, false);
		}
	}
	// -----  
	function localStorageGetItem(key, defaultValue)
		{
			var result = null;
			if (!!window.localStorage)
			{
				result = localStorage.getItem(key);
			}
			if (result === null)
			{
				result = defaultValue;
			}
			return result;
		}
		function localStorageSetItem(key, value)
		{
			if (!!window.localStorage)
			{
				try
				{
					localStorage.setItem(key, value);
				}
				catch (e) { }
			}
		}

			
		function secondsToTime(value){
			var hours = Math.floor(((value / 86400) % 1) * 24);
			var minutes = Math.floor(((value / 3600) % 1) * 60);
			var seconds = Math.round(((value / 60) % 1) * 60);
			var time = '';
			if (hours > 0){
				time += ((hours < 10) ? '0' + hours : hours) + ':';
			}
			time += ((minutes < 10) ? '0' + minutes : minutes) + ':';
			time += (seconds < 10) ? '0' + seconds : seconds;

			return time;
		}
	
	/*
		mainVideo.on('progress canplaythrough loadedmetadata loadeddata', function (e)
			{
				if (!mainVideo.attr('height') && this.videoHeight > 0)
				{
					mainVideo.attr('height', this.videoHeight);
				}
				if (!mainVideo.attr('width') && this.videoWidth > 0)
				{
					mainVideo.attr('width', this.videoWidth);
				}

				if (mainVideo[0].buffered && mainVideo[0].buffered.length > 0)
				{
					for (var i = 0; i < mainVideo[0].buffered.length; i++)
					{
						var buffer = mainVideo[0].buffered.end(i);
						if (buffer > buffered)
						{
							buffered = buffer;
							var pourcent = buffer / mainVideo.duration * 100;
							controlBar.find('.videocontrols-loadingbar').css('width', pourcent + '%');
						}
					}
				}
			});

	*/
	
	
function createViewElem(){
	  var createElemet = '<div id="videoContainer" class="vc-player">'
				+'<video id="contentElement" width="100%" height="100%" autoplay="false" preload="auto|metadata|none" playsinline webkit-playsinline></video>'
				+'<div id="topbg" style="background-image: url('+imgURL+'/logo_bg.png); display:block; position:absolute; left:0px; top:0px;width:226px; height:62px;"></div>'
				//+'<div id="logo" style="display:block; position:absolute; width:226px; height:62px; left:0px; top:0x;"  class="centerBtns">'	 
				//	+'<img src="./img/logo_bg.png" style="width:226px; height:62px;"/>'
				//+'</div>'
				
				+'<div id="loading" style="display:block; width:50px; height:50px; margin: -25px 0 0 -25px;"  class="centerBtns" >'	 
					+'<img src="'+imgURL+'/loading_2.gif" style="width:50px; height:50px;"/>'
				+'</div>'
					
				+'<div id="playbtn" style="display:none;width:70px; height:70px;"  class="centerBtns">'	 
					+'<img src="'+imgURL+'/centerPlay.png" style="width:70px; height:70px;"/>'
				+'</div>'
									 
				+'<div id="controlBar" class="videocontrols">'
					+'<div id="seekBar" class="videocontrols-seeker">'
						+'<div class="videocontrols-loadingbar" style="width: 100%;"></div>'
						+'<div class="videocontrols-progressbar progressbar-color-blue" style="width: 6.65126%;"></div>'
							+'<div class="videocontrols-seekbar videocontrols-range" style="left: 6.65126%;">'
								+'<div class="videocontrols-range-little range-little-pink"></div>'
							+'</div>'
					+'</div>'
					+'<div id="controlBtns" class="videocontrols-btn">'
						+'<div id="playPause" class="videocontrols-play videocontrols-button vc-icon-play"></div>'
						+'<div class="videocontrols-time"> <span class="videocontrols-timer">00:00</span><span class="videocontrols-totaltime"> / 00:00</span>		</div>'
						+'<div class="videocontrols-right">'
								+'<div class="videocontrols-button videocontrols-mute vc-icon-volume vc-icon-volume-medium"></div>'
								+'<div class="videocontrols-weight-volume">'
								+'<div class="videocontrols-volume">'
									+'<div class="videocontrols-volume-progressbar volumebar-color-pink" style="width: 75%;"></div>'
									+'<div class="videocontrols-volumebar videocontrols-volume-range" style="left: 75%;"></div>	'
								+'</div>'
							+'</div>'
							+'<div id="Fullscreen" class="videocontrols-fullscreen videocontrols-button vc-icon-expand"></div>	'
						+'</div>'
					+'</div>'					
				+'</div>'
			+'</div>'
			
			return createElemet;
	}
		
		
		
	function videoMetaData(e){
		///alert("Video meta tag ready")
				if (!mainVid.attr('height') && this.videoHeight > 0)
				{
					mainVid.attr('height', this.videoHeight);
				}
				if (!mainVid.attr('width') && this.videoWidth > 0)
				{
					mainVid.attr('width', this.videoWidth);
				}

				if (mainVid[0].buffered && mainVid[0].buffered.length > 0)
				{
					for (var i = 0; i < mainVid[0].buffered.length; i++)
					{
						var buffer = mainVid[0].buffered.end(i);
						if (buffer > buffered)
						{
							buffered = buffer;
							var pourcent = buffer / mainVid.duration * 100;
							controlBar.find('.videocontrols-loadingbar').css('width', pourcent + '%');
						}
					}
				} 
			}