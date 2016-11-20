/*LINKS:
[Convert excel to json and more]http://shancarter.github.io/mr-data-converter/
[tweet at azan time]http://blog.joeandrieu.com/2012/01/30/the-worlds-simplest-autotweeter-in-node-js/
Adding new locations manually:- add json file to docs folder, insert option in index.html select dropdown(desktop & mobi).

TODO:
hijri calculator(past/future)
generate installer using src files
fix devreload
hijri date update at maghrib
*/
// Handle Azan Options on load
if(supports_audio){
	if(mobileweb){
		$(document).ready(function() {
			$('#flip-1').val(azan_on+'').slider("refresh"); // mobile azan toggle
			if (supports_local_storage()) $("#volume").val(Math.round(localStorage.volume*100)).slider("refresh"); // mobile azan volume
		});
	}else{
        if(supports_local_storage) {
            $("#volbox").val(Math.round(localStorage.volume*100)); // desktop azan volume
            $("#volume").val(Math.round(localStorage.volume*100));
        }
	
		if(azan_on) $("#azantoggle").children().eq(1).addClass("active"); // desktop azan toggle
		else $("#azantoggle").children().eq(0).addClass("active");
		
		if(blink_on) $("#blinkbtns").children().eq(1).addClass("active"); // desktop blink toggle
		else $("#blinkbtns").children().eq(0).addClass("active");

		$('.hijriopts').eq(hijrioffset*1+2).attr('selected', true); // desktop hijri options

		if(nwapp){
			$(".modal-body").append( $("#apptpl").html() );
			if(notify_on) $("#notifbtns").children().eq(1).addClass("active"); // app notifications toggle
			else $("#notifbtns").children().eq(0).addClass("active");

			if(startup_on) $("#startupbtns").children().eq(1).addClass("active"); // app startup toggle
			else $("#startupbtns").children().eq(0).addClass("active");

			/*if(update_on) $("#updatebtns").children().eq(1).addClass("active"); // app update toggle
			else $("#updatebtns").children().eq(0).addClass("active");*/
		}
	}
}else{
	$("#azanoptions").hide(); // hide mobile azan options
	$("#optionlink").parent().hide().prev().hide(); // disable desktop azan options
}

if(!localhtml) {
	$(".modal-body").prepend( $("#locationtpl").html() );
	$("#selectloc option").filter(function(){return this.value==city;}).attr("selected", true); // set current city
	$("#loggedcity").html("<strong>"+ucfirst(city)+"</strong> times");
}

// Print current time, updates every second
var now, blinkID=null, notmain=false;
var tomm = new Date(); tomm.setHours(0); tomm.setDate(tomm.getDate()+1); //var nextfridate = now.getDate() + (7 + 5 - now.getDay()) % 7; if(nextfridate == now.getDate()) nextfridate = (now.getDate()+7); var friday = new Date(); friday.setDate(nextfridate); friday.setHours(0);
setInterval(printime,1000);

function printime() {
	now = new Date();
	now.setTime( now.getTime() + (now.getTimezoneOffset()*60*1000) + jsonstr["offset"] ); // Local time
	//now.setHours(now.getHours()+3);
	//now.setMinutes(now.getMinutes()+20);
	if(!mobileweb){
		$("#time").html(now.toLocaleTimeString());
		$("#date").html(now.toDateString());
	}
}

$(document).ready(function() {
	table();
});
$("#content").html($('#index-tpl').html());
printime();

////////////////  Create table of prayer times (last 2 days, today, next 2 days)  /////////////////
function table(navigated) {
	var m_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	var next = document.getElementById("next");
	var title = document.getElementById("title");
	var done = false;
	var azantext;
	var custdate = new Date();
	custdate.setDate(custdate.getDate()-2);

	// Repeat every minute
	if(!navigated) setTimeout(table, (60000 - now % 60000));

	// Print Hijri Date
	if(!mobileweb) $("#hijri").html(writeIslamicDate(hijrioffset));

	// Reset classes on each repeat
	if(mobileweb) $("#2 li, #3 li:eq(0)").removeClass("ui-btn-up-f").addClass("ui-btn-up-e");
	else $("td").removeClass("redcell");
	
	// For 5 days
	for (var j = 0; j < 5; j++) {
		if(mobileweb) document.getElementById(j).children[0].children[0].children[0].children[0].innerHTML=custdate.getDate()+" "+m_names[custdate.getMonth()];
		else $("#"+j).children().first().html(custdate.getDate()+" "+m_names[custdate.getMonth()]);
		object = jsonstr[custdate.getMonth()][custdate.getDate()];
		var i = mobileweb?0:1;

		// Loop through current day's prayer times
		for(var index in object) {
			if(mobileweb) document.getElementById(j).children[1].children[0].children[i].innerHTML = ucfirst(index)+" - "+hr12(object[index]);
			else $("#"+j+" :eq("+i+")").html(hr12(object[index]));

			// Notify next prayer
			if (j==2 && !done) {
				var praytime = new Date(); // Time of next prayer
				praytime.setHours(object[index].split(":")[0]);
				praytime.setMinutes(object[index].split(":")[1]);
				var audio = mobileweb?((i==0)?fajraudio:otheraudio):((i==1)?fajraudio:otheraudio);
				var diff;

				if(mobileweb) ////////////////////////////   MOBILE   /////////////////////////////
				{
					if (praytime > now) { // if prayer time is after now()
						$("#"+j+" li:eq("+i+")").removeClass("ui-btn-up-e").addClass("ui-btn-up-f");
						diff = (praytime-now)/1000; // Difference in seconds
	
						if(diff>=60){ // if difference is 1 minute or more
							azantext = ["Coming Up:", ucfirst(index)+" is at "+hr12(object[index]), " ("+ timeremain(diff) +" from now)."];
							for (var k = 0; k < azantext.length; k++) {
								next.children[k].innerHTML = azantext[k];
							}
							title.innerHTML="Azan: "+azantext[1]+azantext[2];
							if(supports_audio && azan_on && i!=1 && Math.round(diff/60)==1){ // prep azan
								if(audio.readyState!=4) audio.load();
								else audio.currentTime = 0;
							}
							// If prayer is within next 20 minutes
							if(diff <1200){
								$("#next").addClass("redshade");
							}
						}else{ // if difference is less than 1 minute
							azantext = ["", "It's time for "+ucfirst(index)+" prayer.", "Click here to stop Azan"];
							for (var k = 0; k < azantext.length; k++) {
								next.children[k].innerHTML = azantext[k];
							}
							title.innerHTML="Azan: "+azantext[1];
							// Play Azan audio
							if(supports_audio && azan_on && i!=1 && audio.paused) audio.play();
							$("#next").removeClass("redshade");
						}
						done=true;

					// between Isha and 12:00(ie. nextprayer is tomorrow's Subah)
					}else if(i==5){
						$("#3 li:eq(0)").removeClass("ui-btn-up-e").addClass("ui-btn-up-f");
						custdate.setDate(custdate.getDate()+1);
						var nexsubah=jsonstr[custdate.getMonth()][custdate.getDate()]["subah"];
						praytime.setDate(praytime.getDate()+1);
						praytime.setHours(nexsubah.split(":")[0]);praytime.setMinutes(nexsubah.split(":")[1]);
						
						diff = (praytime - now)/1000; // tomorrow's subah minus now(), in seconds
						azantext = ["Coming Up:", "Subah is at "+hr12(nexsubah)+" tomorrow.", " ("+ timeremain(diff) + " from now)."];
						for (var k = 0; k < azantext.length; k++) {
							next.children[k].innerHTML = azantext[k];
						}
						title.innerHTML="Azan: "+azantext[1]+azantext[2];
	
						custdate.setDate(custdate.getDate()-1);
						done=true;
					}
				}
				else //////////////////////////   DESKTOP   //////////////////////////////////
				{
					if (praytime > now) { // if prayer time is after now()
						$("#"+j+" :eq("+i+")").addClass("redcell");
						diff = (praytime-now)/1000; // Difference in seconds
						if(diff>=60){ // if difference is 1 minute or more
							azantext = ucfirst(index)+" is at "+hr12(object[index])+"\n("+ timeremain(diff) +" from now).";
							$("#next").html("Coming up: " + azantext.replace("\n", " "));
							$("#title").html("Azan: " + azantext.replace("\n", " "));
							if(nwapp){
								tray.tooltip= "Azan: " + azantext;
								$("#titlebar").html("Azan: " + azantext.replace("\n", " "));
								if(notify_on && Math.round(diff/60)==20) {
									var notifName = new Notification("Reminder", { 
										body: azantext.replace("\n", " "),
										icon: '/img/icon.png'
									});
									setTimeout(function() {
										notifName.close();
									}, 5000);
								}
							}
	
							if(Math.round(diff/60)==1 && supports_audio && azan_on && i!=2){ // prep azan
								if (nwapp) {
									ifloggedin(function() {
										if(audio.readyState!=4) audio.load();
										else audio.currentTime = 0;
									});
								}else{
									if(audio.readyState!=4) audio.load();
									else audio.currentTime = 0;
								}
							}
							
							// If prayer is in 20 minutes
							if(diff <1200 && blinkID===null){
								$("#next").addClass("blink");
								if(!nwapp) $("#next").addClass("redblink");
								$("#bar").parent().addClass("progress-danger");
								if(blink_on) startblink();
							}
							
						}else{ // if difference is less than 1 minute
							azantext = "It's time for "+ucfirst(index)+" prayer.";
							$("#title,#next").html("Azan: "+ azantext);
							if(nwapp){
								tray.tooltip = "Azan: "+ azantext;
								$("#titlebar").html("Azan: " + azantext);
								if(notify_on && i!=2) {
									var notifName = new Notification("Azan", { 
										body: azantext +"\nTime to go and pray.",
										icon: '/img/icon.png'
									});
									setTimeout(function() {
										notifName.close();
									}, 5000);
								}
								
							}
							if(supports_audio && azan_on && i!=2 && audio.paused) { // Play Azan audio
								if (nwapp){
									ifloggedin(function() {
										audio.play();
									});
								}else audio.play();
							}
							
							clearBlink();
							$("#next").removeClass("blink redblink");
							$("#bar").parent().removeClass("progress-danger");
						}
						if (!notmain){ // Calculate Progress Bar
							var prevprayer=new Date(); // Time of previous prayer
							prevprayer.setHours(hr24(document.getElementById((i==1)?1:2).children[(i==1)?6:i-1].innerHTML)[0]);
							prevprayer.setMinutes(hr24(document.getElementById((i==1)?1:2).children[(i==1)?6:i-1].innerHTML)[1]);
							if(i==1)prevprayer.setDate(prevprayer.getDate()-1);
							var barsize= 100-( Math.round( ( diff/ ( (praytime-prevprayer) /1000) )*100 ) );
							$("#bar").width(barsize+"%");
						}
						done=true;

					}else if(i==6){ // between Isha and 12:00(ie. nextprayer is tomorrow's Subah)
						$("#3 :eq(1)").addClass("redcell");
						praytime.setDate(praytime.getDate()+1);
						var nexsubah=jsonstr[praytime.getMonth()][praytime.getDate()]["subah"];
						praytime.setHours(nexsubah.split(":")[0]);praytime.setMinutes(nexsubah.split(":")[1]);
	
						diff = (praytime - now)/1000; // tomorrow's subah minus now(), in seconds
						azantext = "Subah is at "+hr12(nexsubah)+" tomorrow"+"\n("+ timeremain(diff) +" from now).";
						$("#next").html("Coming up: "+ azantext.replace("\n", " "));
						$("#title").html("Azan: "+ azantext.replace("\n", " "));
						if(nwapp) {
							tray.tooltip = "Azan: "+ azantext;
							$("#titlebar").html("Azan: " + azantext.replace("\n", " "));
						}
	
						if (!notmain){ // Calculate Progress Bar
							var prevprayer=new Date(); // Time of previous prayer
							prevprayer.setHours(hr24(document.getElementById(2).children[6].innerHTML)[0]);
							prevprayer.setMinutes(hr24(document.getElementById(2).children[6].innerHTML)[1]);
							var barsize= 100-( Math.round( ( diff/ ( (praytime-prevprayer) /1000) )*100 ) );
							$("#bar").width(barsize+"%");
						}
						done=true;
					}
				} ///////////////////////////   ENDIF   /////////////////////////////////
			}
			i++; // next prayer
		}
		custdate.setDate(custdate.getDate()+1); //next day
	}
}
$("body").on('click', function(e) { 
	if( e.which == 2 ) e.preventDefault();
});


if(nwapp) {
	// CSS modifications
	$("body").css("-webkit-user-select","none").prepend($("#titlebar-tpl").html());
	$("body").css("background","url(img/nwback.jpg) no-repeat center center fixed").css("background-size","cover");
	$("#footer,#next").css("color", "lightgrey");
	$("#content,#loggedcity").css("cursor", "default");
	$(".container-fluid.navbar").css("padding-top","41px");
	window.ondragstart = function() { return false; };
	$(window).resize(function() {
		if(screen.availHeight <= win.height) {
			$("#maxmap").attr('title', 'Restore');
			$("#maximize").attr('src', 'img/restore.png');
		} else {
			$("#maxmap").attr('title', 'Maximize');
			$("#maximize").attr('src', 'img/max.png');
		}
	});
	$("map area").each(function() {
		$(this).mouseover(function() {
		    $(".pull-right a").eq($("map area").index(this)).css("opacity", 1);
		}).mouseout(function(){
		    $(".pull-right a").eq($("map area").index(this)).css("opacity", 0.75);
		}).mousedown(function() {
			$(".pull-right a").eq($("map area").index(this)).css("opacity", 0.50);
		});
	});

	

	// Notification function
	function notifu(message, type, title, duration) {
		type = type || "info";
		title = title || "Azan";
		duration = duration || "6000";
		execFile(
			"node_modules\\notifu-1.6\\notifu.exe",
			[
				'/p', title, // title
				'/m', message, // message
				'/t', type, // popup icon type('info' <- [default], 'warn', 'error')
				'/i', 'i.ico', // tray icon
				'/d', duration // duration in milliseconds(1*1000)
			],
			function(stdout, error, stderr){
				console.log(stdout, error, stderr);
			}
		);
	}

	// Check if user is logged in, execute arg function
	function ifloggedin(execute, elseexec) {
		elseexec = elseexec || function() { // else default function
			console.log("Not logged in.");
		};
		execFile("cmd64.exe", ["/c", "query", "user", process.env.USERNAME], function(stdout, error, stderr) {
			console.log(stdout, stderr);
			if(error.toLowerCase().indexOf("active") != -1) {
				execute();
			} else {
				elseexec();
			}
		});
	}
}

// Load main page
function indexpage() {
	$("#content").fadeOut(500, function(){
		$(this).html($('#index-tpl').html());
		$('li.active').removeClass('active');
		$("#indexlink").parent().addClass('active');
		notmain=false;
		blinkID=null;
		printime();
		table(true);
		if(nwapp) $("#footer,#next").css("color", "lightgrey");
	});
	$("#content").fadeIn(500);
}

// Load pdf page
function pdfpage() {
	$("#content").fadeOut(500, function(){
		$('#content').html($('#pdf-tpl').html());
		$('li.active').removeClass('active');
		$("#pdflink").parent().addClass('active');
		notmain=true;
		pdftable(now.getMonth());
	
		$("#monthoption option").filter(function(){return this.value==now.getMonth();}).attr("selected", true);
		$('#qiblahpop').popover({
			html: true,
			title: "Qiblah: 296.7<sup>o</sup>",
			content: nwapp?"<img src='img/qiblah.png'>":"<a href='http://www.qiblaway.com/qibla-direction-colombo-sri-lanka/' target='_blank'><img src='img/qiblah.png'></a>",
			placement: "bottom"
		});
	
		if(nwapp) {
			$("p").last().css("color", "lightgrey");
		}
	});
	$("#content").fadeIn(500);
}

// Print pdf table
function pdftable(month) {
	var m_names=["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	var i, row, cell, rowabove, custdate = new Date(), samechk = [];
	custdate.setDate(1);
	custdate.setMonth(month);
	document.getElementById("table").innerHTML="";
	document.getElementById("month").innerHTML=m_names[custdate.getMonth()]+" "+custdate.getFullYear();

	// For each day of the month
	do {
		row=document.getElementById("table").insertRow(-1);
		row.className="warning";
		row.insertCell(-1).innerHTML = custdate.getDate();
		if((custdate.getDate() == now.getDate()) && (custdate.getMonth() == now.getMonth())) row.className="success";
		rowabove = $(row).prev().children();
		object = jsonstr[custdate.getMonth()][custdate.getDate()];
		i=1;

		// Loop through current day's prayer times
		for(var index in object) {
			cell = row.insertCell(-1);
			cell.innerHTML = hr12(object[index]);
			samechk[i-1] = $(cell).html() == rowabove.eq(i).html();
			i++;
		}
		
		// Merge duplicate rows
		if(samechk.every(Boolean)){
			if($(row).hasClass("success")) $(row).prev()[0].className = "success";
			document.getElementById("table").deleteRow(-1);
		}else if(rowabove.eq(0).html() != row.children[0].innerHTML-1){
			rowabove.eq(0).append(" to "+(row.children[0].innerHTML-1));
		}
		//next day
		custdate.setDate(custdate.getDate()+1);
	}while(custdate.getMonth()==month);

	// Handle last row
	custdate.setDate(custdate.getDate()-1);
	var lastrow = $("#table tr :last").children().eq(0);
	if(custdate.getDate() != lastrow.html()) lastrow.append(" to "+custdate.getDate());
}

// Load Hijri Calendar
function hijripage() {
	$("#content").fadeOut(500, function(){
		$(this).html($('#hijri-tpl').html());
		$('li.active').removeClass('active');
		$("#hijrilink").parent().addClass('active');
		notmain=true;
		hijritable(now.getMonth());
		$("#hijrioption option").filter(function(){return this.value==now.getMonth();}).attr("selected", true);
		if(nwapp) $("p").last().css("color", "lightgrey");
	});
	$("#content").fadeIn(500);
}

// Print hijri Calendar
function hijritable(month) {
	var e_names=["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	var a_names = ["Muharram", "Safar", "Rabi'ul Awwal", "Rabi'ul Akhir", "Jumadal Ula", "Jumadal Akhira", "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhul Qa'ada", "Dhul Hijja"];
	var custdate = new Date(); custdate.setDate(1); custdate.setMonth(month);
	var row, cell, iDate, spanE, spanA, cellcolor = "greencell", cellclass = "slash1";
	var thisarabmonth = kuwaiticalendar(hijrioffset, custdate);
	document.getElementById("table").innerHTML="";
	$("#tblegend").children().not(".bluecell").each(function() {
		this.outerHTML="";
	});

	document.getElementById("month").innerHTML = e_names[custdate.getMonth()]+" "+custdate.getFullYear();
	document.getElementsByClassName("bluecell")[0].innerHTML = e_names[custdate.getMonth()];
	
	var tblzero_cell = document.getElementById("tblegend").insertCell(-1);
	tblzero_cell.className = cellcolor;
	tblzero_cell.innerHTML = a_names[thisarabmonth[6]];

	row = document.getElementById("table").insertRow(-1);
	row.style.height = "50px";
	for (var i = 0; i < custdate.getDay(); i++) { // Padding
		row.insertCell(-1);
	}

	do {
		iDate = kuwaiticalendar(hijrioffset, custdate);
		if(iDate[6] != thisarabmonth[6]) { // if hijri month changes, note in legend table
			cellcolor = "yellowcell";
			cellclass = "slash2";
			thisarabmonth = kuwaiticalendar(hijrioffset, custdate);
			tblzero_cell = document.getElementById("tblegend").insertCell(-1);
			tblzero_cell.className = cellcolor;
			tblzero_cell.style = "white-space:nowrap;";
			tblzero_cell.innerHTML = a_names[thisarabmonth[6]];
		}

		cell = row.insertCell(-1);
		cell.className = cellclass;
		// Gregorian Date
		spanE = document.createElement("span");
		spanE.className = "spanE";
		spanE.innerHTML = custdate.getDate();
		spanE.setAttribute("title", e_names[custdate.getMonth()]);
		cell.appendChild(spanE);
		// Hijri Date
		spanA = document.createElement("span");
		spanA.className = "spanA";
		spanA.innerHTML = iDate[5];
		spanA.setAttribute("title", a_names[iDate[6]]);
		cell.appendChild(spanA);
		
		if((custdate.getDate() == now.getDate()) && (custdate.getMonth() == now.getMonth())) { // if today
			spanE.style.color = "red";
			spanA.style.color = "red";
		}

		if(custdate.getDay() == 6) { // next week
			row = document.getElementById("table").insertRow(-1);
			row.style.height = "50px";
		}
		//next day
		custdate.setDate(custdate.getDate()+1);
	}while(custdate.getMonth() == month);
	
	$(".greencell, .yellowcell, .bluecell").css("white-space", "nowrap");
}

function calcHijri() {
	var a_names = ["Muharram", "Safar", "Rabi'ul Awwal", "Rabi'ul Akhir", "Jumadal Ula", "Jumadal Akhira", "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhul Qa'ada", "Dhul Hijja"];
	var input = $("#inputhijri").val();
	var edate = input.substring(8,10);
	var emonth = input.substring(5,7);
	var eyear = input.substring(0,4);
	var efulldate = new Date();
	efulldate.setDate(edate);
	efulldate.setMonth(emonth);
	efulldate.setFullYear(eyear);
	var adate = kuwaiticalendar(hijrioffset, efulldate);
	$("#hijrioutput").html(adate[5] + " " + a_names[adate[6]] + " " + adate[7]);
}

setTimeout(function() { // update everyday
	if(notmain) {
		hijripage();
	}
}, tomm-now);

// City Change
function citychange(option) {
	if(supports_local_storage) localStorage.city = option;
	city = option;

	$.ajaxSetup({ async: false });
	$.getJSON(mobileweb?"../docs/"+city+".json":"docs/"+city+".json", function (result,status,xhr) {
		jsonstr = result;
	});
	$.ajaxSetup({ async: true });

	if(mobileweb) {
		printime();
		table(true);
	}else{
		$("#loggedcity").html("<strong>"+ucfirst(city)+"</strong> prayer times");
		indexpage();
	}
}

// On closing options
$("#option").on("hidden", function() {
	$("#optionlink").blur();
});

// Blink for prayers within next 20 minutes
function startblink(){
	$('.blink').fadeToggle("slow");
	blinkID = setTimeout(startblink, 800);
}
function clearBlink() {
	clearInterval(blinkID);
	$('#next').fadeIn("slow");
	blinkID=null;
}

// Convert times to 12hr format (for object[index])
function hr12(index) {
	var hr = index.split(":")[0];
	var min = index.split(":")[1];
	var apm = (hr>11)?"pm":"am";
	hr %= 12;
	if(hr==0)hr=12;
	return hr+":"+min+" "+apm;
}

// Convert times to 24hr format (for previous prayer times)
function hr24(index) {
	var hr = index.split(":")[0];
	var min = index.split(":")[1].split(" ")[0];
	var apm = index.split(":")[1].split(" ")[1];
	if(hr=="12")hr=0;
	if(apm=="pm") hr=(hr*1)+12;
	return [hr*1,min*1];
}

// Difference(time remaining)
function timeremain(difference) {
	var min = Math.round(difference/60)%60;
	var minval;
	if(min==1){
		minval = "1 minute";
	} else if(min==0) {
		minval = "";
	} else {
		minval = min+" minutes";
	}

	var hr = Math.floor(difference/60/60);
	var hrval;
	if(hr==1) {
		hrval = "1 hour";
	} else if(hr==0) {
		hrval = "";
	} else {
		hrval = hr+" hours";
	}

	var and = (hr!=0 && min!=0)?" and ":"";
	
	return hrval+and+minval;
}
//console.log("testing "+jsonstr[5][25]["asr"], "june 25 asr");
//console.log("still testing "+Date.parse(now)+"	"+now.getTime());