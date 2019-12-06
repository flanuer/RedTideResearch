/*
   Milonic DHTML Menu Image Pre-loading Module preloadmenuimages.js version 1.3 June 27 2006
   This module is only compatible with the Milonic DHTML Menu version 5.16 or higher

   Copyright 2004 (c) Milonic Solutions Limited. All Rights Reserved.
   This is a commercial software product, please visit http://www.milonic.com/ for more information.
   
   USE: This module does not need any parameters but needs to be placed after the menus have been built
   
   Version 1.2 added ability to load images and give control back to the menu at the same time, the system is now more thread like
   
   SYNTAX: <script language="JavaScript1.2" type="text/javascript" src="preloadmenuimages.js"></script> 
*/

_mIms=new Array();
_mIms2=new Array();

function _mPLF(i)
{
	try{
	for(var x=0;x<_mIms.length;x++){
		if(i==_mIms[x])return
		x++
	}
	_mIms[_mIms.length]=i
	}
	catch (err){}
}

function mmPLIs(i,n){
	try{
	if(n){	
		_mIms2[i]=new Image()
		if(_mIms[i])_mIms2[i].src=_mIms[i]
	}
	
	if(!_mIms2[i].complete){
		_StO("mmPLIs("+(i)+",0)",5)
		return
	}
	
	if(i<_mIms.length)_StO("mmPLIs("+(i+1)+",1)",20)
	}
	catch (err){}
}

function mmenuPreLoadImages(){
	try{
	for(var x=0;x<_mi.length;x++){
		var I=_mi[x]
		if(I[24])_mPLF(I[24])
		if(I[29])_mPLF(I[29])
		if(I[32])_mPLF(I[32])
		if(I[46])_mPLF(I[46])
		if(I[47])_mPLF(I[47])
		if(I[48])_mPLF(I[48])
		if(I[56])_mPLF(I[56])
		if(I[69])_mPLF(I[69])
		if(I[71])_mPLF(I[71])
		if(I[73])_mPLF(I[73])
		if(I[79])_mPLF(I[79])
		if(I[82])_mPLF(I[82])
		if(I[83])_mPLF(I[83])
		if(I[85])_mPLF(I[85])
		if(I[88])_mPLF(I[88])
		if(I[90])_mPLF(I[90])
		if(I[91])_mPLF(I[91])
		if(I[92])_mPLF(I[92])
		
	}
	mmPLIs(0,1)
	}
	catch (err){}
}

mmenuPreLoadImages()