#   Copyright (c) 2007 Open Source Applications Foundation
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.

import wx
import wx.lib.flatnotebook as fnb
import logging
import os
from gridcontrol import CustTableGrid
from wx.py.crust import CrustFrame
from threading import Thread

class Frame(wx.Frame):
    """Frame that displays the Main window"""

    def __init__(self, parent=None, id=-1, pos=wx.DefaultPosition, title='Windmill Service', shell_objects = None, **kwargs):
        
        self.shell_objects = shell_objects
	
        ##initialize the frame
        wx.Frame.__init__(self, parent, id, title, pos, **kwargs)
        
        #Call function to create menu items
        self.createMenu()

	#Call function to setup the tabbed menus
        self.createTabs()

	#Call funciton to setup the logging for the ui
        self.setupListener()

	#initialize the info for the about dialog box
        self.setupAboutInfo()

        ##bind the import objects
        self.Bind(wx.EVT_CLOSE, self.OnCloseWindow)

    def createMenu(self):
        """Creates the menu system"""

        menuBar = wx.MenuBar()

        ##setup the file menu and associated events
        fileMenu = wx.Menu()
	
	self.Bind(wx.EVT_MENU, self.OnCloseWindow, fileMenu.Append(wx.ID_EXIT, "E&xit", "Exit Windmill"))

	##setup the test menu and associated events
	testMenu = wx.Menu()
	
	###setup run
	runMenu = wx.Menu()
	self.Bind(wx.EVT_MENU, self.OnRunTest, runMenu.Append(wx.NewId(), "&Test File(s)", "Select a test to run."))
	
	#self.Bind(wx.EVT_MENU, self.OnRunJSDir, runMenu.Append(wx.NewId(), "Test JS &Directory", "Select a javascript directory to run."))	
	
	self.Bind(wx.EVT_MENU, self.OnRunDir, runMenu.Append(wx.NewId(), "Test &Directory", "Select a directory to run."))
	
	testMenu.AppendMenu(wx.NewId(), "Run", runMenu)
	
	testMenu.AppendSeparator()

	###setup load
	loadMenu = wx.Menu()

	self.Bind(wx.EVT_MENU, self.OnLoadTest, loadMenu.Append(wx.NewId(), "&Test File(s)", "Loads a single test"))
	#self.Bind(wx.EVT_MENU, self.OnLoadJSDir, runMenu.Append(wx.NewId(), "Load JS &Directory", "Select a javascript directory to load."))
	self.Bind(wx.EVT_MENU, self.OnLoadDir, loadMenu.Append(wx.NewId(), "Test &Directory", "Load a directory full of tests"))

	testMenu.AppendMenu(wx.NewId(), "Load", loadMenu)
	
        ##setup the tools menu
	toolsMenu = wx.Menu()
	self.Bind(wx.EVT_MENU, self.OnClearQueue, toolsMenu.Append(wx.NewId(), "Clear Queue", "Clear the Queue"))	
	self.Bind(wx.EVT_MENU, self.OnPreferences, toolsMenu.Append(wx.ID_PREFERENCES, "Preferences", "Prefences Dialog"))
	
        ##setup the Help menu
        helpMenu = wx.Menu()
	self.Bind(wx.EVT_MENU, self.OnWebsiteLink, helpMenu.Append(wx.NewId(), "Windmill Home Page", "Link to website"))
        self.Bind(wx.EVT_MENU, self.OnAbout, helpMenu.Append(wx.ID_ABOUT, "About", "About windmill"))            

        ##Add menu items to the menu bar
        menuBar.Append(fileMenu, "&File")
	menuBar.Append(testMenu, "T&ests")
	menuBar.Append(toolsMenu, "&Tools")
	menuBar.Append(helpMenu, "&Help")

        self.SetMenuBar(menuBar)        
	
    def createTabs(self):
        """Creates and lays out the tab menu appropriately"""
        ##initialize a notebook widget
        self.book = fnb.FlatNotebook(self, wx.ID_ANY, style=fnb.FNB_NODRAG|fnb.FNB_NO_NAV_BUTTONS|fnb.FNB_NO_X_BUTTON)

        # Add some pages to the second notebook
        self.Freeze()
	try:     
	    self.appSizer = wx.BoxSizer(wx.VERTICAL)
	    self.SetSizer(self.appSizer)
	    
	    self.appSizer.Add(self.book, 1, wx.EXPAND)
    
	    ##setup the tab contain the shell
	    shellTab = wx.Panel(self.book, -1)
    
	    #define that the tabSizer for this panel be used.
	    shellTabSizer = wx.BoxSizer(wx.VERTICAL)
    
	    shellTab.SetSizer(shellTabSizer)
    
	    #create the shell frame
	    shellFrame = wx.py.shell.Shell(shellTab, locals=self.shell_objects)
    
	    import windmill
	    windmill.stdout = shellFrame.stdout
	    windmill.stdin = shellFrame.stdin	

	    #add the shell frame to the shellTab sizer
	    shellTabSizer.Add(shellFrame, 1, wx.EXPAND)        
    
	    #add the tab setup to the book
	    self.book.AddPage(shellTab, "Shell-Out")
	    
	    #########################
	    ##create the output tab##
	    #########################
    
	    self.outputPanel = wx.Panel(self.book, -1, style=wx.MAXIMIZE_BOX)
    
	    self.programOutput = CustTableGrid(self.outputPanel)
	    outputSizer = wx.BoxSizer(wx.VERTICAL)
	    self.outputPanel.SetSizer(outputSizer)
    
	    #create the radiobox used to determine which type of output to display
	    textLabel = wx.StaticText(self.outputPanel, -1, "  Set Log Output Level:   ",
				      style=wx.ALIGN_LEFT)
    
	    loglist = list(lvl for lvl in logging._levelNames.keys() if isinstance(lvl, str))
	    
	    def mylogsort(one, two):
		if logging._levelNames[one] > logging._levelNames[two]: return -1
		elif logging._levelNames[one] < logging._levelNames[two]: return 1 
		else: return 0
		
	    loglist.sort(cmp=mylogsort)
	    
	    #removes a duplicate message
	    try:
		loglist.remove('WARN')
	    except Exception:
		"""error don't worry"""
	    
	    #grab the different types of levelnames from logging and use them as option in the combo box
	    self.displayTypeBox = wx.ComboBox(self.outputPanel, -1, "INFO", 
					      wx.DefaultPosition, wx.DefaultSize, 
					      loglist,
					      style=wx.CB_READONLY)                                          
    
	    self.Bind(wx.EVT_COMBOBOX, self.OnChangeLogeLvl, self.displayTypeBox)
	    
	    #self.Bind(wx.EVT_COMBOBOX, self.OnComboFilter, self.filterType)
	    self.filterType= wx.SearchCtrl(self.outputPanel, size=(200,-1), style=wx.TE_PROCESS_ENTER)
    
	    self.Bind(wx.EVT_TEXT_ENTER, self.OnDoSearch, self.filterType)
	    self.Bind(wx.EVT_TEXT, self.OnDoSearch, self.filterType, 1)
    
	    #Create a temp sizer to place the definition text and combo box on same horizontal line
	    tempSizer = wx.BoxSizer(wx.HORIZONTAL)
	    tempSizer.Add(textLabel, 0, wx.ALIGN_CENTER_VERTICAL)
	    tempSizer.Add(self.displayTypeBox)
	    
	    tempSizer.AddStretchSpacer(2)
    
	    tempSizer.Add(self.filterType)
	    
	    #Add spacer in front for center purposes
	    tempSizer.AddStretchSpacer(1)
	    
	    #Add the sizer to the main form
	    outputSizer.Add(tempSizer, 0, wx.EXPAND)
    
	    #create text control that displays the output
	    outputSizer.Add(self.programOutput, 1, wx.EXPAND)
	    
	    ##create a panel to hold the buttons
	    buttonPanel = wx.Panel(self, -1)
	    
	    self.appSizer.Add(buttonPanel, 0, wx.EXPAND)
    
	    ##create a new sizer to handle the buttons on the button panel at bottom of screen
	    bottomButtonSizer = wx.BoxSizer(wx.HORIZONTAL)
    
	    #assign the button sizer to the button panel a the botton of the screen
	    buttonPanel.SetSizer(bottomButtonSizer)

	    #import os
    
	    #create the browser buttons
	    try: 
		bmp = wx.Bitmap(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'Firefoxlogo2.png'), wx.BITMAP_TYPE_PNG)
		if(bmp):	
		    bmp.SetMask(wx.Mask(bmp, wx.ColourDatabase.Find(wx.ColourDatabase(), 'YELLOW')))
		
		    firstBrowserButton = wx.BitmapButton(buttonPanel, -1, bmp,
							 size = (bmp.GetWidth()+10, bmp.GetHeight()+10))
		else:
		    firstBrowserButton = wx.Button(buttonPanel, id=-1, label="FF", size = (40, 40))

	    except Exception:
		firstBrowserButton = wx.Button(buttonPanel, id=-1, label="FF", size = (40, 40))
    
	    #secondBrowserButton = wx.Button(buttonPanel, id=-1, label="IE", size = (60, 40))
	    self.Bind(wx.EVT_BUTTON, self.OnFFButtonClick, firstBrowserButton)
			     
	    #Add spacer in front for center purposes
	    bottomButtonSizer.AddStretchSpacer(1)
	    
	    #Add the button to the button sizer
	    bottomButtonSizer.Add(firstBrowserButton, 1, wx.CENTER) 
	    
	    #Add Another spacer after for center purposes
	    bottomButtonSizer.AddStretchSpacer(1)
    
	    self.book.AddPage(self.outputPanel, 'Output', select=True)

	finally:
	    self.Thaw()	        

	self.SendSizeEvent()

   
    def setupAboutInfo(self):
        self.aboutInfo = wx.AboutDialogInfo()

        self.aboutInfo.SetName("Windmill")
        self.aboutInfo.SetWebSite("http://windmill.osafoundation.org/trac")
        self.aboutInfo.SetDescription("Windmill is a web testing framework intended for complete automation\n"+
                                 "of user interface testing, with strong test debugging capabilities.")
        self.aboutInfo.SetCopyright("Copyright 2006-2007 Open Source Applications Foundation")
        self.aboutInfo.SetDevelopers(["Mikeal Rogers", "Adam Christian", "Jacob Robinson"])
        self.aboutInfo.SetLicence("\n".join(["Licensed under the Apache License, Version 2.0 (the \"License\")",
                              "you may not use this file except in compliance with the License.",
                              "You may obtain a copy of the License at",
                              "\n\thttp://www.apache.org/licenses/LICENSE-2.0\n",
                              "Unless required by applicable law or agreed to in writing, software",
                              "distributed under the License is distributed on an \"AS IS\" BASIS,",
                              "WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.",
                              "See the License for the specific language governing permissions and",
                              "limitations under the License."]))
	
	icon = wx.Icon( name = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'wico.gif'), 
			type =wx.BITMAP_TYPE_GIF, 
			desiredWidth = -1, 
			desiredHeight = -1)
	
	self.SetIcon(icon)
	self.aboutInfo.SetIcon(icon)

    def setupListener(self):
        """Sets up the listener to the logger"""
        self.theLogger = logging.getLogger()
        self.theLogger.addHandler(self.programOutput)       
        self.theLogger.setLevel(logging._levelNames["DEBUG"])
        
    
    def OnAbout(self, event):
        #popup a About dialog 
        wx.AboutBox(self.aboutInfo)

    def OnRunTest(self, event):
        #popup a dialog here to run it
        dialog = wx.FileDialog (None,
                                message = u"Choose Test(s)",
                                defaultFile = u"",	
				wildcard = u"|Json files (*.json)|*.json|Python files (*.py)|*.py", #|*.js|Python files (*.py)|*.py
                                style = wx.OPEN|wx.CHANGE_DIR | wx.MULTIPLE)        

	if dialog.ShowModal() == wx.ID_OK:
	    filename = dialog.GetPaths()
	    
#	    if filename.find(".js") is not -1:
#		print "Running the python version of run test"
#		x = Thread(target=self.shell_objects['run_js_test'], args=[filename])
		
#	    else:
	    x = Thread(target=self.shell_objects['run_test'], args=[filename])
				
	    x.start()

    def OnRunJSDir(self, event):
	dialog = wx.DirDialog(None,
		      message = u"Choose js directory to run")

	if dialog.ShowModal() == wx.ID_OK:
	    x = Thread(target=self.shell_objects['run_js_dir'], args=[dialog.GetPath()])
	    x.start()

    def OnLoadJSDir(self, event):
	dialog = wx.DirDialog(None,
		      message = u"Choose js directory to load")

	if dialog.ShowModal() == wx.ID_OK:
	    x = Thread(target=self.shell_objects['load_js_dir'], args=[dialog.GetPath()])
	    x.start()


    def OnRunDir(self, event):
	dialog = wx.DirDialog(None,
			      message = u"Choose directory to load")
    
	if dialog.ShowModal() == wx.ID_OK:
	    x = Thread(target=self.shell_objects['run_test'], args=[dialog.GetPath()])
	    x.start()
	    
    def OnLoadTest(self, event):
        #popup a dialog here to run it
        dialog = wx.FileDialog (None,
                                message = u"Choose a Test",
                                defaultFile = u"",
                                wildcard = u"Json files (*.json)|*.json|Python files (*.py)|*.py", #|*.js|Python files (*.py)|*.py
                                style = wx.OPEN|wx.CHANGE_DIR|wx.MULTIPLE)        

	if dialog.ShowModal() == wx.ID_OK:
	    filename = dialog.GetPaths()

#	    if filename.find(".js") is not -1:
#           x = Thread(target=self.shell_objects['load_js_test'], args=[filename]) 
#	    else:
	    x = Thread(target=self.shell_objects['load_test'], args=[filename])
	    x.start()

    def OnLoadDir(self, event):
	dialog = wx.DirDialog(None,
			      message = u"Choose directory to load")
    
	if dialog.ShowModal() == wx.ID_OK:
	    x = Thread(target=self.shell_objects['load_test'], args=[dialog.GetPath()])		    
	    
	    x.start()
	    

    def OnChangeLogeLvl(self, event):
        self.theLogger.setLevel(logging._levelNames[event.GetString()])
        
    def OnDoSearch(self, event):
	searchVal = self.filterType.GetValue()
	self.programOutput.SearchValues(searchVal)

    def OnFFButtonClick(self, event):
	self.shell_objects['start_firefox']()
	
    def OnCloseWindow(self, event):
        #should probably manually stop logging to prevent output errors
        self.theLogger.removeHandler(self.programOutput)
	
	self.Destroy()
	
    def OnWebsiteLink(self, event):
	"""Bring up a link to the windmill homepage"""
	import webbrowser
	webbrowser.open_new("http://windmill.osafoundation.org")
		
    def OnPreferences(self, event):
	
	from windmill import settings
	from preferencesDialog import PrefDialog

	prefsMenu = PrefDialog(self, preferences=settings)

	if prefsMenu.ShowModal() == wx.ID_OK:
	    settings.update(prefsMenu.preferences)

    def OnClearQueue(self, event):
	try:
	    self.shell_objects['httpd'].xmlrpc_methods_instance.clear_queue()
	except Exception:
	    print "Clear Queue Failed"

	
class MySplashScreen(wx.SplashScreen):
    """
    Create a splash screen widget.
    """
    def __init__(self, parent=None, shell_objects=None):
	self.shell_objects = shell_objects
        # This is a recipe to a the screen.
        # Modify the following variables as necessary.
        aBitmap = wx.Image(name = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'wmsplash.png')).ConvertToBitmap()
        splashStyle = wx.SPLASH_CENTRE_ON_SCREEN | wx.SPLASH_TIMEOUT
        splashDuration = 5000 # milliseconds

	# Call the constructor with the above arguments in exactly the
        # following order.
        wx.SplashScreen.__init__(self, aBitmap, splashStyle,
                                 splashDuration, parent)
        self.Bind(wx.EVT_CLOSE, self.OnExit)

        wx.Yield()

	# Initialize the main frame while the splash screen is being displayed.
	self.frame = Frame(shell_objects=self.shell_objects, size=(800, 500))

    #----------------------------------------------------------------------#
    def OnExit(self, evt):
        self.Hide()

	self.frame.Show()
	
        # The program will freeze without this line.
        evt.Skip()  # Make sure the default handler runs too...


class App(wx.App):
    """Application class."""
    def __init__(self, shell_objects = None, redirect=False, *args, **kwargs):
     
        self.shell_objects = shell_objects
	
	wx.App.__init__(self, redirect, *args, **kwargs)
	
    def OnInit(self):
	#create the splash screen that will create and control the main frame
	MySplash = MySplashScreen(shell_objects=self.shell_objects)

	#start the show
	MySplash.Show()

	return True
