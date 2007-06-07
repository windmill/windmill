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
from wx.py.crust import CrustFrame

class Frame(wx.Frame):
    """Frame that displays the Main window"""

    def __init__(self, parent=None, id=-1, pos=wx.DefaultPosition, title='WindyMill'):

        ##initialize the frame
        wx.Frame.__init__(self, parent, id, title, pos)

        #Call function to create menu items
        self.CreateMenu()

        ##Call function to setup the tabbed menus
        self.CreateTabs()

        self.SetupListener()

    def SetupListener(self):
        """Sets up the listener to the logger"""



    def CreateMenu(self):
        """Creates the menu system"""

        menuBar = wx.MenuBar()

        ##setup the file menu
        fileMenu = wx.Menu()
        fileMenu.Append(wx.NewId(), "&Open", "Open whatever")
        fileMenu.Append(wx.NewId(), "E&xit", "Exit Windmill")

        ##setup the options menu
        optionsMenu = wx.Menu()

        ##Add menu items to the menu bar
        menuBar.Append(fileMenu, "&File")
        menuBar.Append(optionsMenu, "O&ptions")

        self.SetMenuBar(menuBar)

    def CreateTabs(self):
        """Creates and lays out the tab menu appropriately"""

        ##initialize a notebook widget
        self.book = fnb.FlatNotebook(self, wx.ID_ANY, style=fnb.FNB_NODRAG)

        # Add some pages to the second notebook
        self.Freeze()

        ##setup the tab contain the shell and other components
        shellTab = wx.Panel(self, -1)

        #define that the tabSizer for this panel be used.
        shellTabSizer = wx.BoxSizer(wx.VERTICAL)

        shellTab.SetSizer(shellTabSizer)

        #create the shell frame
        shellFrame = wx.py.shell.Shell(shellTab)
        bottomButtonSizer = wx.BoxSizer(wx.HORIZONTAL)
        bottomButtonSizer.SetMinSize((shellTab.GetSize()[0], 0))
        #create the start and stop button
        startButton = wx.Button(shellTab, id=-1, label="IE", size = (60, 40))
        stopButton = wx.Button(shellTab, id=-1, label="FF", size = (60, 40))

        bottomButtonSizer.Add(startButton, 0, wx.ALIGN_CENTER)
        bottomButtonSizer.AddSpacer((40,0))
        bottomButtonSizer.Add(stopButton, 0, wx.ALIGN_CENTER)    
        #add the shell to the sizer
        shellTabSizer.Add(shellFrame, 3, wx.EXPAND)        

        shellTabSizer.Add(bottomButtonSizer, 1, wx.FIXED_MINSIZE |wx.ALIGN_CENTER_HORIZONTAL)

        #add the tab setup to the book
        self.book.AddPage(shellTab, "Shell-Out")

        #create the output tab
        output = wx.TextCtrl(self.book, -1, "...Output Goes Here...\n", style=wx.TE_MULTILINE|wx.TE_READONLY)
        self.book.AddPage(output, 'Output')



        ##set up the the interactive shell in the first tab.

        self.Thaw()	        
        self.SendSizeEvent()


class App(wx.App):
    """Application class."""

    def OnInit(self):
        self.frame = Frame()
        self.frame.Show()
        self.SetTopWindow(self.frame)
        return True
