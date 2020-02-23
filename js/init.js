// Initialize app
var nwapp = false, desktopweb = false, mobileweb = !!$.mobile, localhtml, localhost, blink_on = false, jsonstr, city = "colombo", hijrioffset = 0;

if(typeof nw == "object") nwapp = true; // if nw App
else if(typeof $.fn.popover == "function") desktopweb = true; // if desktopweb
localhtml = location.protocol == "file:"; // if local html file
localhost = location.hostname == "localhost"; // you get it...

// UpperCase First char
function ucfirst(word) { return word.charAt(0).toUpperCase()+word.slice(1); }
// trims white space from string
function trim(str) { return str.replace(/^\s\s*/, '').replace(/\s\s*$/, ''); }
// Custom function to check if array contains string
Array.prototype.contains = function(arg){ return this.indexOf(arg) != -1 };

var supports_audio = !!document.createElement('audio').canPlayType;
function supports_local_storage() {
    try {
        return 'localStorage' in window && window['localStorage'] !== null;
    } catch(e){
        return false;
    }
}
if(supports_audio){
    if(supports_local_storage()) {
        if(!localStorage.volume) localStorage.volume = "0.5";
        if(!localStorage.play) localStorage.play = "true";
        if(!localStorage.blink) localStorage.blink = "false";
        if(!localStorage.city) localStorage.city = "colombo";
        if(!localStorage.hijri) localStorage.hijri = "0";
        var azan_on = localStorage.play=="true";
        blink_on = localStorage.blink=="true";
        city = localStorage.city;
        hijrioffset = localStorage.hijri;
    }

	var otheraudio = new Audio();
	var fajraudio = new Audio();

	if (mobileweb) { // workaround for android user gesture restriction
		function mediaPlaybackRequiresUserGesture() {
		  	// test if play() is ignored when not called from an input event handler
		  	var audio = document.createElement('audio');
		  	audio.play();
		  	return audio.paused;
		}
		
		if (mediaPlaybackRequiresUserGesture()) {
		  	$(document).on('keydown', removeBehaviorsRestrictions);
		  	$(document).on('mousedown', removeBehaviorsRestrictions);
		  	$(document).on('touchstart', removeBehaviorsRestrictions);
		} else {
		  	setSource();
		}
		
		function removeBehaviorsRestrictions() {
		  	otheraudio.load(); fajraudio.load();
		  	$(document).off('keydown', removeBehaviorsRestrictions);
		  	$(document).off('mousedown', removeBehaviorsRestrictions);
		  	$(document).off('touchstart', removeBehaviorsRestrictions);
		  	setTimeout(setSource, 1000);
		}

		function setSource() {
            if(supports_local_storage()) {
                otheraudio.src = '../sound/azan.mp3'; otheraudio.volume = localStorage.volume; otheraudio.preload="none";
                fajraudio.src = '../sound/fajr_azan.mp3'; fajraudio.volume = localStorage.volume; fajraudio.preload="none";
            }
		}
	} else {
        if(supports_local_storage()) {
            otheraudio.src = 'sound/azan.mp3'; otheraudio.volume = localStorage.volume; otheraudio.preload="none";
            fajraudio.src = 'sound/fajr_azan.mp3'; fajraudio.volume = localStorage.volume; fajraudio.preload="none";
        }
	}

	// Event Listeners
	$([fajraudio,otheraudio]).on("ended", iconstop).on("pause", iconstop).on("play", iconplay);

	function iconstop() {
		if(nwapp) {
			tray.icon="img/icon.png";
			//$("#titlebar").prev().attr("src", "img/icon.png");
		}
		$("#favicon").attr("href", mobileweb?"../img/icon.png":"img/icon.png");
	}
	function iconplay() {
		if(nwapp) {
			tray.icon="img/iconplay.png";
			//$("#titlebar").prev().attr("src", "img/iconplay.png");
		}
		$("#favicon").attr("href", mobileweb?"../img/iconplay.png":"img/iconplay.png");
	}
}

// Error Handling
window.onerror = function(errorMsg, url, lineNumber) {
    console.log("Error caught: "+errorMsg+"\n in "+url+"\n at lineNumber "+lineNumber);
    return false;
}

// Load JSON
if(!localhtml) {
	$.ajaxSetup({ async: false });
	$.getJSON(mobileweb?"../docs/"+city+".json":"docs/"+city+".json", function (result,status,xhr) {
		jsonstr = result;
	});
	$.ajaxSetup({ async: true });
}

// nw App
if(nwapp) {
	// Built-in Node modules
	var fs = require('fs');
	var execFile = require('child_process').execFile;
	var cryptos = require('crypto');
	var path = require('path');
	var http = require('http');
	
	// Thirdparty Modules
// 	var mkdirp = require('mkdirp');
// 	var httpget = require('http-get');

	if(!localStorage.notification) localStorage.notification = "true";
	var notify_on = localStorage.notification=="true";

	$('html').on('contextmenu', function(){ return false; });
	
	var home = localStorage.home=="true";
	
	var startup_path = process.env.APPDATA.replace(/\\/g, '/')+"/Microsoft/Windows/Start Menu/Programs/StartUp/Azan Startup.lnk";
	var startup_on = fs.existsSync(startup_path);
	
	// Get the current window
	var win = nw.Window.get();
	
	setTimeout(function() {
	  	if(!nw.App.argv.toString().split(",").contains("-startup") && localStorage.devReload!="true"){ // if not on startup
	  		win.show();
	  	    win.focus();
	  	}
		delete localStorage.devReload;
	}, 1000);
	
	// Create a tray icon
	var tray = new nw.Tray({ icon: 'img/icon.png' });
	tray.tooltip = "Azan";
	
	// Give it a menu
	var menu = new nw.Menu();

	// If admin (ie. ME!)
	if(home) {
		menu.append(new nw.MenuItem({ label: 'Dev Tools (Console)', click: function() {
			win.showDevTools();
		} }));
	}
	
	menu.append(new nw.MenuItem({ label: 'Purge Memory (Reload)', click: function() {
		localStorage.devReload="true";
		//win.reloadDev(); // 
		win.reload(3);
	} }));

	menu.append(new nw.MenuItem({ label: 'Exit', click: function() {
		win.close(true);
	} }));
	
	tray.menu = menu;
	
	// Listen to the close event
	win.on('close', function() {
	  	this.hide(); // Pretend to be closed
	});
	
	// Show window
	tray.on('click', function() {
	  	win.show();
	  	win.focus();
	});
} else if(!localhtml && !localhost) {
	// TODO: only enforce https if domain is azan.shazvi.com
	// if (location.protocol != "https:") {
	// 	location.href = "https:" + location.href.substring(location.protocol.length);
	// }
}