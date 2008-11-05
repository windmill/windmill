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
import os, sys
from wx import py
from threading import Thread
import windmill

class Frame(wx.Frame):
    """Frame that displays the Main window"""

    def __init__(self, parent=None, id=-1, pos=wx.DefaultPosition, title='Windmill Service', shell_objects = None, **kwargs):
        
	self.shell_objects = shell_objects
	self.open_browser = []
	
        ##initialize the frame
        wx.Frame.__init__(self, parent, id, title, pos, **kwargs)
        
        #Call function to create menu items
        self.createMenu()

	    #Call function to setup the tabbed menus
        self.createTabs()

	    #Call funciton to setup the logging for the ui
        #self.setupListener()

	    #initialize the info for the about dialog box
        self.setupAboutInfo()

        ##bind the import objects
        self.Bind(wx.EVT_CLOSE, self.OnCloseWindow)

    def createMenu(self):
        """Creates the menu system"""

        menuBar = wx.MenuBar()

        ##setup the file menu and associated events
        #fileMenu = wx.Menu()
	
    	#self.Bind(wx.EVT_MENU, self.OnCloseWindow, fileMenu.Append(wx.ID_EXIT, "E&xit", "Exit wxWindmill"))

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

    	self.Bind(wx.EVT_MENU, self.OnLoadTest, loadMenu.Append(wx.NewId(), "&Test File(s)", "Load selected tests"))
    	#self.Bind(wx.EVT_MENU, self.OnLoadJSDir, runMenu.Append(wx.NewId(), "Load JS &Directory", "Select a javascript directory to load."))
    	self.Bind(wx.EVT_MENU, self.OnLoadDir, loadMenu.Append(wx.NewId(), "Test &Directory", "Load a directory of tests"))

    	testMenu.AppendMenu(wx.NewId(), "Load", loadMenu)
    	testMenu.AppendSeparator()
        self.Bind(wx.EVT_MENU, self.OnCloseWindow, testMenu.Append(wx.ID_EXIT, "E&xit", "Exit wxWindmill"))
    	
        
        
        ##setup the tools menu
    	toolsMenu = wx.Menu()
    	self.Bind(wx.EVT_MENU, self.OnClearQueue, toolsMenu.Append(wx.NewId(), "Clear Test Queue", "Clear the Queue"))	
    	self.Bind(wx.EVT_MENU, self.OnCloseBrowser, toolsMenu.Append(wx.NewId(), "Close Browsers", "Close the currently open browser"))	
        
    	#self.Bind(wx.EVT_MENU, self.OnPreferences, toolsMenu.Append(wx.ID_PREFERENCES, "Preferences", "Prefences Dialog"))
	
        ##setup the Help menu
        helpMenu = wx.Menu()
    	self.Bind(wx.EVT_MENU, self.OnWebsiteLink, helpMenu.Append(wx.NewId(), "Windmill Home Page", "Link to website"))
        self.Bind(wx.EVT_MENU, self.OnAbout, helpMenu.Append(wx.ID_ABOUT, "About", "About wxWindmill"))            


        ##Add menu items to the menu bar
        menuBar.Append(testMenu, "&File")
    	#menuBar.Append(testMenu, "T&ests")
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
	    #########################
	    ##  Launchers tab      ##
	    #########################
	    self.appSizer = wx.BoxSizer(wx.VERTICAL)
            #main panel
	    mainPanel = wx.Panel(self.book, -1, style=wx.MAXIMIZE_BOX)
	    mainSizer = wx.BoxSizer(wx.VERTICAL)
            mainPanel.SetSizer(mainSizer)
            
	    launcherPanel = wx.Panel(mainPanel, -1, style=wx.MAXIMIZE_BOX)       
	    launcherSizer = wx.BoxSizer(wx.HORIZONTAL)
	    launcherPanel.SetSizer(launcherSizer)

	    #add this stretch to keep buttons centered
	    launcherSizer.AddStretchSpacer(1)
	    
	    browsers = ['Firefox', 'Safari', 'IE']
	    self.browserButtons ={}	    
	    
	    for browser in browsers:
		
		try:
		    #create an img object for use in the button
		    img = wx.Bitmap(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'Images/'+browser.lower() +'.png'), wx.BITMAP_TYPE_PNG)
		    
		    #determine if the img was created successfully
		    if img:
			#got a valid img time to create the button
			self.browserButtons[browser] = wx.BitmapButton(launcherPanel, -1, img, size = (60, 60))
		    else:
			#bad img create a plain text button.
			self.browserButtons[browser] = wx.Button(launcherPanel, id=-1, label=browser)

		except Exception, e:
		    #for some reason an exception has occured so just creating a default text button
		    self.browserButtons[browser] = wx.Button(launcherPanel, id=-1, label=browser)
		    
		#Add the button to the button sizer
		launcherSizer.Add(self.browserButtons[browser], 1, wx.CENTER)    
		launcherSizer.AddStretchSpacer(1)		
		
		#bind the button to the event
		#this functions uses a lambda to brings all the calls together
		self.Bind(wx.EVT_BUTTON, lambda event, bwser=browser : self.OnBrowserButtonClick(event, bwser), self.browserButtons[browser])

	    #disable the buttons that won't work on specific platforms
            if sys.platform == "win32":
                self.browserButtons['Safari'].Disable()
            if sys.platform == "linux2":
                self.browserButtons['Safari'].Disable()
                self.browserButtons['IE'].Disable()
            if sys.platform == "darwin":
                self.browserButtons['IE'].Disable()

            morePanel = wx.Panel(mainPanel, -1,  style=wx.MAXIMIZE_BOX)
            moreSizer = wx.BoxSizer(wx.HORIZONTAL)
            morePanel.SetSizer(moreSizer)

            #setup input and textbox
            self.url_label = wx.StaticBox(morePanel, -1, 'Test URL', (5, 5), size=(70, 15))
            self.url_input = wx.TextCtrl(morePanel, -1, size = wx.Size(250, -1), value="http://www.getwindmill.com") 
            moreSizer.Add(self.url_label)
            moreSizer.Add(self.url_input)

            #setup close button
            closeBPanel = wx.Panel(mainPanel, -1, style=wx.MAXIMIZE_BOX)
            closeBSizer = wx.BoxSizer(wx.HORIZONTAL)
            closeBPanel.SetSizer(closeBSizer)
            closeBrowser = wx.Button(closeBPanel, label="Close Open Windmill Browsers")
            closeBrowser.Bind(wx.EVT_BUTTON, self.OnCloseBrowser)
            closeBSizer.Add(closeBrowser, 0, wx.ALL|wx.CENTER|wx.EXPAND, 20)

            
            mainSizer.Add(morePanel, 1, wx.ALIGN_CENTER)
            mainSizer.Add(launcherPanel,1, wx.ALIGN_CENTER)
            mainSizer.Add(closeBPanel, 1, wx.ALIGN_CENTER)

            #we want the launcher tab to be selected when the app comes up
	    self.book.AddPage(mainPanel, 'Browser Launcher', select=True)
	    #self.book.AddPage(morePanel, 'More', select=True)	 
              	    
	    #########################
	    ##  Windmill shell tab ##
	    #########################
	    
	    #self.appSizer = wx.BoxSizer(wx.VERTICAL)
	    #self.SetSizer(self.appSizer)
	    
	    #self.appSizer.Add(self.book, 2, wx.EXPAND)
    
	    ##setup the tab contain the shell
	    shellTab = wx.Panel(self.book, 2)
    
	    #define that the tabSizer for this panel be used.
	    shellTabSizer = wx.BoxSizer(wx.VERTICAL)
    
	    shellTab.SetSizer(shellTabSizer)
    
	    #create the shell frame
	    shellFrame = wx.py.shell.Shell(shellTab, locals=self.shell_objects)
    
	    import windmill
	    windmill.stdout = shellFrame.stdout
	    windmill.stdin = shellFrame.stdin	

	    #add the shell frame to the shellTab sizer
	    shellTabSizer.Add(shellFrame, 2, wx.EXPAND)        
    
	    #add the tab setup to the book
	    self.book.AddPage(shellTab, "Windmill Shell", select=False)
	    	    
	    #########################
	    ##  Python shell tab   ##
	    #########################
	    
	    self.SetSizer(self.appSizer)
	    
	    self.appSizer.Add(self.book, 1, wx.EXPAND)
    
	    ##setup the tab contain the shell
	    pyShellTab = wx.Panel(self.book, 1)
    
	    #define that the tabSizer for this panel be used.
	    pyShellTabSizer = wx.BoxSizer(wx.VERTICAL)
    
	    pyShellTab.SetSizer(pyShellTabSizer)
    
	    #create the shell frame
	    pyShellFrame = wx.py.shell.Shell(pyShellTab)

	    #add the shell frame to the shellTab sizer
	    pyShellTabSizer.Add(pyShellFrame, 1, wx.EXPAND)        
    
	    #add the tab setup to the book
	    self.book.AddPage(pyShellTab, "Python Shell", select=False)
   


	finally:
	    self.Thaw()	        

	self.SendSizeEvent()

   
    def setupAboutInfo(self):
        self.aboutInfo = wx.AboutDialogInfo()

        self.aboutInfo.SetName("wxWindmill")
        self.aboutInfo.SetWebSite("http://www.getwindmill.com")
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
	
	icon = wx.Icon( name = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'Images/wico.gif'), 
			type =wx.BITMAP_TYPE_GIF, 
			desiredWidth = -1, 
			desiredHeight = -1)
	
	self.SetIcon(icon)
	self.aboutInfo.SetIcon(icon)

    #def setupListener(self):
        #"""Sets up the listener to the logger"""
        #self.theLogger = logging.getLogger()
        #self.theLogger.addHandler(self.programOutput)       
        #self.theLogger.setLevel(logging._levelNames["DEBUG"])
        
    
    def OnAbout(self, event):
        #popup a About dialog 
        wx.AboutBox(self.aboutInfo)

    def OnRunTest(self, event):
        #popup a dialog here to run it
        dialog = wx.FileDialog (None,
                                message = u"Choose Test(s)",
                                defaultFile = u"",
                                wildcard =u"Python Files (*.py)|*.py|JSON Files (*.json)|*.json",	
                                style = wx.OPEN|wx.CHANGE_DIR | wx.MULTIPLE)        

	if dialog.ShowModal() == wx.ID_OK:
	    fileArr = dialog.GetPaths()
	    files = ','.join(fileArr)
#	    if filename.find(".js") is not -1:
#		print "Running the python version of run test"
#		x = Thread(target=self.shell_objects['run_js_test'], args=[filename])
		
#	    else:
	    x = Thread(target=self.shell_objects['run_test'], args=[files])		
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
                                wildcard =u"Python Files (*.py)|*.py|JSON Files (*.json)|*.json",	
                                style = wx.OPEN|wx.CHANGE_DIR|wx.MULTIPLE)        

	if dialog.ShowModal() == wx.ID_OK:
	    fileArr = dialog.GetPaths()
	    files = ','.join(fileArr)


#	    if filename.find(".js") is not -1:
#           x = Thread(target=self.shell_objects['load_js_test'], args=[filename]) 
#	    else:
	    x = Thread(target=self.shell_objects['load_test'], args=[files])
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

    def OnBrowserButtonClick(self, event, browser):
        print "Launching the " + browser + " browser \n with the event:\n"
        print event
        if self.url_input.Value == "":
            windmill.settings['TEST_URL'] = "http://tutorial.getwindmill.com"
        else:
            windmill.settings['TEST_URL'] = self.url_input.Value
        
        b = self.shell_objects['start_' + browser.lower()]()
        self.open_browser.append(b)

    def ConfirmDialog(self, text, title):
        dialog = wx.MessageDialog(self, text, title, wx.YES_NO | wx.ICON_QUESTION)
	retCode = dialog.ShowModal()
        return retCode

    def OnCloseWindow(self, event):
        #should probably manually stop logging to prevent output errors
        #self.theLogger.removeHandler(self.programOutput)
	retCode = self.ConfirmDialog('Are you sure you want to close all Windmill browsers and exit?', 'Warning')
	
	if retCode == wx.ID_YES:
	    self.OnCloseBrowser(self)
	    self.Destroy()
	
    def OnWebsiteLink(self, event):
        """Bring up a link to the windmill homepage"""
        import webbrowser
        webbrowser.open_new("http://www.getwindmill.com")
	
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

    def OnCloseBrowser(self, event):
        if len(self.open_browser) != 0:
            for browser in self.open_browser:
                browser.stop()
            self.open_browser = []
            
        #reset forwarding url
        windmill.settings['FORWARDING_TEST_URL'] = None
	
class MySplashScreen(wx.SplashScreen):
    """
    Create a splash screen widget.
    """
    def __init__(self, parent=None, shell_objects=None):
	
	#self.shell_objects = shell_objects
        # This is a recipe to a the screen.
        # Modify the following variables as necessary.
        aBitmap = wx.Image(name = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'Images/wmsplash.png')).ConvertToBitmap()
        splashStyle = wx.SPLASH_CENTRE_ON_SCREEN | wx.SPLASH_TIMEOUT
        splashDuration = 5000 # milliseconds

	# Call the constructor with the above arguments in exactly the
        # following order.
        wx.SplashScreen.__init__(self, aBitmap, splashStyle,
                                 splashDuration, parent)
        self.Bind(wx.EVT_CLOSE, self.OnExit)

        wx.Yield()

	# Initialize the main frame while the splash screen is being displayed.
	self.frame = Frame(shell_objects=shell_objects, size=(400, 250))

    #----------------------------------------------------------------------#
    def OnExit(self, evt):
        self.Hide()

	self.frame.Show()
	
        # The program will freeze without this line.
        evt.Skip()  # Make sure the default handler runs too...


class App(wx.App):
    """Application class."""
    def __init__(self, shell_objects = None, redirect=False, *args, **kwargs):
	#shell_objects = 
        self.shell_objects = shell_objects
	
	wx.App.__init__(self, redirect, *args, **kwargs)
	
    def OnInit(self):
	#create the splash screen that will create and control the main frame
	MySplash = MySplashScreen(shell_objects=self.shell_objects)

	#start the show
	MySplash.Show()

	return True
	
def main():
    import windmill
    windmill.stdout, windmill.stdin = sys.stdout, sys.stdin
    from windmill.bin.admin_lib import configure_global_settings, setup
    configure_global_settings()
    shell_objects = setup()
    app = App(shell_objects=shell_objects)
    #shell_objects['wxwindmill_app'] = app
    app.MainLoop()
