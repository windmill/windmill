/*
 * Danne Lundqvist
 * http://www.dotvoid.com
 * 
 * May 19, 2004, Danne Lundqvist
 * Verson 1.0 - Inital version
 *
 * June 23, 2004
 * Version 1.1 - Functions for Post-Drawing Manipulation
 */

/*function TabFocus(event)
{
	if (!event) event = window.event;
	evtTarget = (browser.isIE5up) ? event.srcElement : event.target;
	evtTarget.tab.group.focus(evtTarget.tab.id);

	return false;
}*/

function TabFocus(e) 
{ 
    var targ; 
    
    if (!e) var e = window.event; 
    if (e.target) targ = e.target; 
    else if (e.srcElement) targ = e.srcElement; 
    
    if (targ.nodeType == 3) // defeat Safari bug 
        targ = targ.parentNode; 
        targ.tab.group.focus(targ.tab.id); 
        
        return false; 
}

function Tab(group, id, title)
{
	this.id      = id;
	this.tid     = id + '_tab';
	this.group   = group;

	var tab = document.createElement('div');
	var a   = document.createElement('a');

	if (browser.isIE5up)
	{
		a.attachEvent("onclick", TabFocus);
	}
	else
	{
		a.addEventListener("click", TabFocus, false);
	}
	a.tab = this;
	a.href = '#';
	a.innerHTML = title;

	tab.id = this.tid;
	tab.className = 'TabStyleTabNormal';
	tab.appendChild(a);

	group.tablist.appendChild(tab);

	return this;
}


function TabGroupTabFocus(id)
{
	var toId = id;
	var fromId = this.aid;

	if (fromId)
	{
		var e = document.getElementById(fromId);
		if (e) e.style.display = 'none';
	}
	if (toId)
	{
		var e = document.getElementById(toId);
		if (e) e.style.display = 'block';
	}

	if (!id)
		id = this.aid;
	else
		this.aid = id;

	for (n = 0; n < this.length(); n++)
	{
		var t = document.getElementById(this.tabs[n].tid);
		if (this.tabs[n].id == id)
		{
			t.className = 'TabStyleTabActive';
			this.onTabFocusGained(this.tabs[n].id);
		}
		else if (t.className == "TabStyleTabActive")
		{
			t.className = 'TabStyleTabNormal';
			this.onTabFocusLost(this.tabs[n].id);
		}
	}
}




function TabGroupLength()
{
	return this.tabs.length;
}

function TabGroupAdd(id, title)
{
	this.tabs[this.tabs.length] = new Tab(this, id, title, this.tabs.length + 1);
}

function TabGroupRemove(id)
{
	if (this.tabs.length==1) { this.tabs=new Array(); return; }
	var newTabs = new Array(this.tabs.length - 1);
	var m = 0;
	for (n = 0; n < this.tabs.length; n++)
	{
		if (this.tabs[n].id != id)
			newTabs[m++] = this.tabs[n];
	}
	this.tabs = newTabs;
}


function TabGroupDraw()
{
	if (!this.id)
		return;

	this.content.innerHTML = '';
	for (n = 0; n < this.length(); n++)
	{
		var t = document.getElementById(this.tabs[n].id);
		var p = t.parentNode;
		if (p) t = p.removeChild(t);
		this.content.appendChild(t);
	}
}


/**************************************************************
 *  Extension Functions for Post-Drawing Manipulation
 ***************************************************************/

function TabGroupTabSetForeground(id,c){
	var t=document.getElementById(id+"_tab");
	if (t){
		var links=t.getElementsByTagName("a");
		if(links&&links.length>0){
			links[0].style.color=c
		}
	}
}


function TabGroupTabSetTitle(id,title){
	var t=document.getElementById(id+"_tab");
	if (t){
		var links=t.getElementsByTagName("a");
		if(links&&links.length>0){
			links[0].innerHTML=title;
		}
	}
}

function TabGroupRemoveEx(id){
	if (! document.getElementById(id)) return;
	this.remove(id);
	var e = document.getElementById(id);
	if (e){
		e.style.display='none';
		if (e.parentNode) e.parentNode.removeChild(e);
	}
	e = document.getElementById(id+"_tab");
	if (e){
		e.style.display='none';
		if (e.parentNode) e.parentNode.removeChild(e);
	}
	
	if (this.aid==id && this.length()>0){
		this.focus(this.tabs[0].id);
	}
}


function TabGroupAddEx(id, title){
	var t = document.getElementById(id);
	if (! t){
		t=document.createElement('div');
		t.innerHTML="";
		t.style.display='none';
		t.id=id;
	}
	
	this.add(id,title);
	if (t){
		var p = t.parentNode;
		if (p) t = p.removeChild(t);
		this.content.appendChild(t);
	}
}

/**************************************************************
 * END: Dov Katz Function Extensions
 **************************************************************/

function TabGroup(id)
{
	this.id = id;
	this.tabs = new Array();
	this.aid = '';

	this.add    = TabGroupAdd;
	this.remove = TabGroupRemove;
	this.length = TabGroupLength;
	this.focus  = TabGroupTabFocus;
	this.draw   = TabGroupDraw;

	this.removeEx = TabGroupRemoveEx;
	this.addEx = TabGroupAddEx;
	this.setTitle=TabGroupTabSetTitle;
	this.onTabFocusGained=function(id){this.setTabForeground(id,'black');};
	this.onTabFocusLost=function(id){this.setTabForeground(id,'black');};

	// Not sure this should exist. Should really be in the css!!!
	this.setTabForeground=TabGroupTabSetForeground;

	this.content = document.createElement('div');
	this.content.className = 'TabStyleContent';
	this.content.appendChild(document.createTextNode('Init...'));

	this.tablist = document.createElement('div');
	this.tablist.className = 'TabStyleTabList';

	e = document.getElementById(id);
	e.appendChild(this.tablist);
	e.appendChild(this.content);

	return this;
}