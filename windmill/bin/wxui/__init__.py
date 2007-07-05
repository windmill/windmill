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
import sys
from wx.py.crust import CrustFrame
from StringIO import StringIO

class Frame(wx.Frame):
    """Frame that displays the Main window"""

    def __init__(self, parent=None, id=-1, pos=wx.DefaultPosition, title='WindyMill', shell_objects = None):

        self.shell_objects = shell_objects

        ##initialize the frame
        wx.Frame.__init__(self, parent, id, title, pos)

        #Call function to create menu items
        self.createMenu()

        #Call function to setup the tabbed menus
        self.createTabs()

        #Call funciton to setup the logging for the ui
        self.setupListener()

        ##bind the import objects
        self.Bind(wx.EVT_CLOSE, self.OnCloseWindow)


    def setupListener(self):
        """Sets up the listener to the logger"""
        #Create a stream handler that will subscribe to all the data in the system
        self.logHandler = logging.StreamHandler(strm=self.programOutput)
        self.theLogger = logging.getLogger().addHandler(self.logHandler)

    def createMenu(self):
        """Creates the menu system"""

        menuBar = wx.MenuBar()

        ##setup the file menu
        fileMenu = wx.Menu()
        fileMenu.Append(wx.NewId(), "Run &Test", "Select a test to run.")
        fileMenu.Append(wx.NewId(), "Run &Suite", "Select a suite to run.")
        fileMenu.Append(wx.NewId(), "&Preference", "")
        exit = fileMenu.Append(wx.NewId(), "E&xit", "Exit Windmill")

        self.Bind(wx.EVT_MENU, self.OnCloseWindow, exit)

        ##setup the options menu
        optionsMenu = wx.Menu()

        ##setup the Help menu
        helpMenu = wx.Menu()
        helpMenu.Append(wx.NewId(), "Windmill", "Link to website")
        helpMenu.Append(wx.NewId(), "About", "About windmill")

        ##Add menu items to the menu bar
        menuBar.Append(fileMenu, "&File")
        menuBar.Append(optionsMenu, "O&ptions")
        menuBar.Append(helpMenu, "&Help")

        self.SetMenuBar(menuBar)

    def createTabs(self):
        """Creates and lays out the tab menu appropriately"""

        ##initialize a notebook widget
        self.book = fnb.FlatNotebook(self, wx.ID_ANY, style=fnb.FNB_NODRAG|fnb.FNB_NO_NAV_BUTTONS|fnb.FNB_NO_X_BUTTON)

        # Add some pages to the second notebook
        self.Freeze()

        self.appSizer = wx.BoxSizer(wx.VERTICAL)
        self.SetSizer(self.appSizer)

        self.appSizer.Add(self.book, 1, wx.EXPAND)

        ##setup the tab contain the shell
        shellTab = wx.Panel(self, -1)

        #define that the tabSizer for this panel be used.
        shellTabSizer = wx.BoxSizer(wx.VERTICAL)

        shellTab.SetSizer(shellTabSizer)

        #create the shell frame
        shellFrame = wx.py.shell.Shell(shellTab, locals=self.shell_objects)

        #add the shell frame to the shellTab sizer
        shellTabSizer.Add(shellFrame, 1, wx.EXPAND)        

        #add the tab setup to the book
        self.book.AddPage(shellTab, "Shell-Out")

        #create the output tab
        self.programOutput = WindmillTextCtrl(self.book, -1, "", style=wx.TE_MULTILINE|wx.TE_READONLY|wx.HSCROLL)
        self.book.AddPage(self.programOutput, 'Output', select=False)

        ##create a panel to hold the buttons
        buttonPanel = wx.Panel(self, -1)

        self.appSizer.Add(buttonPanel, 0, wx.EXPAND)

        ##create a new sizer to handle the buttons on the button panel at bottom of screen
        bottomButtonSizer = wx.BoxSizer(wx.HORIZONTAL)

        #assign the button sizer to the button panel a the botton of the screen
        buttonPanel.SetSizer(bottomButtonSizer)

        #create the browser buttons
        firstBrowserButton = wx.Button(buttonPanel, id=-1, label="FF", size = (60, 40))
        #secondBrowserButton = wx.Button(buttonPanel, id=-1, label="IE", size = (60, 40))
        self.Bind(wx.EVT_BUTTON, self.OnFFButtonClick, firstBrowserButton)

        #Add spacer in front for center purposes
        bottomButtonSizer.AddStretchSpacer(1)

        bottomButtonSizer.Add(firstBrowserButton, 1, wx.CENTER) 
        #bottomButtonSizer.Add(secondBrowserButton, 1, wx.ALIGN_CENTRE)         

        #Add Another spacer after for center purposes
        bottomButtonSizer.AddStretchSpacer(1)

        self.Thaw()	        
        self.SendSizeEvent()

    def OnFFButtonClick(self, event):
        self.shell_objects['start_firefox']()

    def OnCloseWindow(self, event):
        #should probably manually stop logging to prevent output errors
        print "Removing the log handler"
        logging.getLogger().removeHandler(self.logHandler)
        print "Shutdown the logger"
        logging.shutdown()
        print "Clean up wx controls and windows"
        self.Destroy()


class WindmillTextCtrl(wx.TextCtrl, StringIO):
    def __init__(self, *args, **kwargs):
        wx.TextCtrl.__init__(self, *args, **kwargs)
        StringIO.__init__(self)

class App(wx.App):
    """Application class."""
    def __init__(self, shell_objects = None, redirect=False, *args, **kwargs):

        self.shell_objects = shell_objects
        wx.App.__init__(self, redirect, *args, **kwargs)

    def OnInit(self):
        self.frame = Frame(shell_objects=self.shell_objects)
        self.frame.Show()
        self.SetTopWindow(self.frame)
        return True

if __name__ == '__main__':
    app = App()
    app.MainLoop()
