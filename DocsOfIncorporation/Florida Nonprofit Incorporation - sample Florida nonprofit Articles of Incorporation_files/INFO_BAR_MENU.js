_menuCloseDelay=500;
_menuOpenDelay=150;
_subOffsetTop=2;
_subOffsetLeft=2;
buildafterload="true";


with(menuStyle=new mm_style()){
align="center";
bordercolor="Black";
borderstyle="solid";
borderwidth="0";
fontfamily="Verdana, Tahoma, Arial";
fontsize="10pt";
fontstyle="normal";
fontweight="normal";
headerbgcolor="#ffffff";
headercolor="#000000";
offbgcolor="GhostWhite";
offcolor="Blue";
onbgcolor="#999999";
oncolor="#000000";
padding="6";
pagecolor="Blue";
separatorcolor="White";
separatorsize="1";
subimage="images/black_7x7.gif";
subimagepadding="6";
itemwidth="1000";
}

with(submenuStyle=new mm_style()){
bordercolor="#000000";
borderstyle="solid";
borderwidth="1";
fontfamily="Verdana, Tahoma, Arial";
fontsize="8pt";
fontstyle="bold";
headerbgcolor="#ffffff";
headercolor="#000000";
offbgcolor="#ffffff";
offcolor="#000000";
onbgcolor="#999999";
oncolor="#000000";
padding="4";
subimage="images/black_7x7.gif";
subimagepadding="5";
}

with(milonic=new menuname("Main Menu")){
position="relative";
menuwidth="100%";
style=menuStyle;
alwaysvisible="1";
orientation="horizontal";
aI("text=Home;target=;url=http://www.form990help.com/;");
aI("showmenu=Services/IRS Form 990 Penalty HelpINFO_BAR_MENU;text=Services;target=;url=david-mcree-cpa-services.html;");
aI("text=Penalty Relief;target=;url=form-990-penalty-relief.html;");
aI("text=Contact;target=;url=contact-david-mcree.html;");
aI("showmenu=Dig Deeper/Examples of SuccessINFO_BAR_MENU;text=Dig Deeper;target=;url=nonprofit-tax-help.html;");
aI("text=Resources;target=;url=links.html;");
}

with(milonic=new menuname("Services/IRS Form 990 Penalty HelpINFO_BAR_MENU")){
style=submenuStyle;
aI("text=IRS Form 990 Penalty Help;target=;url=form-990-penalty-help.html;");
aI("text=Form 990-EZ Preparation Services;target=;url=form-990-ez-preparation-services.html;");
aI("text=Form 990 Preparation;target=;url=form-990-preparation.html;");
aI("text=Form 1023 Preparation;target=;url=form-1023-preparation.html;");
aI("text=My Prices;target=;url=fee-structure.html;");
aI("text=Reinstate Exempt Status;target=;url=lost-tax-exempt-status.html;");
}

with(milonic=new menuname("Dig Deeper/Examples of SuccessINFO_BAR_MENU")){
style=submenuStyle;
aI("text=Examples of Success;target=;url=reasons-for-penalty-abatement-accepted-by-the-irs-reasonable-cause.html;");
aI("text=Videos;target=;url=free-video-reasonable-cause-letter-nonprofit.html;");
aI("text=Become a Nonprofit Expert;target=;url=become-a-nonprofit-expert.html;");
aI("text=Form 990-N info;target=;url=form-990-n-helpful-information.html;");
aI("text=IRS Requesting Form 990-N;target=;url=irs-is-requesting-our-990-n-letter-from-irs-cp259e.html;");
aI("text=Nonprofit Incorporation;target=;url=nonprofit-incorporation.html;");
aI("text=Mailing Documents to IRS;target=;url=mailing-documents-to-irs.html;");
aI("text=Amateur Athletics;target=;url=amateur-athletics-501c3.html;");
aI("text=Form 990 due date;target=;url=form-990-due-date.html;");
aI("text=Form 8868 Filing Extension for Form 990;target=;url=form-8868-filing-extension-for-form-990.html;");
aI("text=Filing Form 990 on the Correct Year's Form;target=;url=filing-form-990-on-the-correct-year-s-form.html;");
aI("text=Filing Form 990 Late: What to Expect From the IRS;target=;url=filing-form-990-late.html;");
aI("text=Form 990 Filing Thresholds - which form to file?;target=;url=form-990-filing-thresholds-which-form-to-file.html;");
aI("text=New Laws and Rules;target=;url=new-laws-and-rules-for-nonprofit-tax-compliance.html;");
aI("text=Hiring a nonprofit tax pro.;target=;url=hiring-a-tax-professional-to-advise-your-nonprofit.html;");
aI("text=990-prep-tips;target=;url=990-prep-tips.html;");
}


 drawMenus();
