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
import  wx.lib.mixins.listctrl  as  listmix
import logging
import sys
import time
from wx.py.crust import CrustFrame
from StringIO import StringIO

class Frame(wx.Frame):
    """Frame that displays the Main window"""

    def __init__(self, parent=None, id=-1, pos=wx.DefaultPosition, title='WindyMill', shell_objects = None, **kwargs):
        
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
        
    def setupListener(self):
        """Sets up the listener to the logger"""
        #logging.basicConfig(format='%(asctime)s %(message)s')
        
        self.theLogger = logging.getLogger()
        self.theLogger.addHandler(self.programOutput)       
        self.theLogger.setLevel(logging._levelNames["INFO"])
        
    def createMenu(self):
        """Creates the menu system"""

        menuBar = wx.MenuBar()

        ##setup the file menu and associated events
        fileMenu = wx.Menu()
        self.Bind(wx.EVT_MENU, self.RunTest, fileMenu.Append(wx.NewId(), "Run &Test", "Select a test to run."))
        self.Bind(wx.EVT_MENU, self.RunSuite, fileMenu.Append(wx.NewId(), "Run &Suite", "Select a suite to run."))        
        fileMenu.Append(wx.NewId(), "&Preference", "")
        self.Bind(wx.EVT_MENU, self.OnCloseWindow, fileMenu.Append(wx.NewId(), "E&xit", "Exit Windmill"))

        ##setup the options menu
        optionsMenu = wx.Menu()

        ##setup the Help menu
        helpMenu = wx.Menu()
        helpMenu.Append(wx.NewId(), "Windmill", "Link to website")
        self.Bind(wx.EVT_MENU, self.OnAbout, helpMenu.Append(wx.NewId(), "About", "About windmill"))            

        ##Add menu items to the menu bar
        menuBar.Append(fileMenu, "&File")
        menuBar.Append(optionsMenu, "O&ptions")
        menuBar.Append(helpMenu, "&Help")

        self.SetMenuBar(menuBar)
        
    def RunTest(self, event):
        #popup a dialog here to run it
        dialog = wx.FileDialog (None,
                                message = u"Choose a Test",
                                defaultFile = u"",
                                wildcard = u"*.py",
                                style = wx.OPEN|wx.CHANGE_DIR)        
        dialog.ShowModal()
        
    def RunSuite(self, event):
        #popup a different dialog for running the suites
        dialog = wx.FileDialog (None,
                                message = u"Choose a Suite",
                                defaultFile = u"",
                                wildcard = u"*.py",
                                style = wx.OPEN|wx.CHANGE_DIR)        
        dialog.ShowModal()
        
    def OnAbout(self, event):
        #popup a About dialog 
        wx.AboutBox(aboutInfo)
            
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
        
        #########################
        ##create the output tab##
        #########################
        self.outputPanel = wx.Panel(self.book, -1, style=wx.MAXIMIZE_BOX)

        self.programOutput = WindmillOutputPanel(self.outputPanel, -1, style=wx.MAXIMIZE_BOX)
        outputSizer = wx.BoxSizer(wx.VERTICAL)
        self.outputPanel.SetSizer(outputSizer)

        #create the radiobox used to determine which type of output to display
        textLabel = wx.StaticText(self.outputPanel, -1, "  Set Log Output Level:   ",
                                  style=wx.ALIGN_LEFT)
        
        #grab the different types of levelnames from logging and use them as option in the combo box
        self.displayTypeBox = wx.ComboBox(self.outputPanel, -1, "INFO", 
                                          wx.DefaultPosition, wx.DefaultSize, 
                                          list(lvl for lvl in logging._levelNames.keys() if isinstance(lvl, str)),
                                          style=wx.CB_READONLY)                                          

        self.Bind(wx.EVT_COMBOBOX, self.EvtChangeLogeLvl, self.displayTypeBox)
        
        
        #grab the different types of levelnames from logging and use them as option in the combo box
        #self.filterType = wx.ComboBox(self.outputPanel, -1, "New Filter", 
                                      #wx.DefaultPosition, wx.DefaultSize, 
                                      #["New Filter"],
                                      #style=wx.CB_DROPDOWN)                                                                                    
        
        #self.Bind(wx.EVT_COMBOBOX, self.EvtOnComboFilter, self.filterType)
        self.filterType= wx.SearchCtrl(self.outputPanel, size=(200,-1), style=wx.TE_PROCESS_ENTER)
        self.Bind(wx.EVT_TEXT_ENTER, self.EvtOnDoSearch, self.filterType)
        self.Bind(wx.EVT_TEXT, self.EvtOnDoSearch, self.filterType)
                
        #Create a temp sizer to place the definition text and combo box on same horizontal line
        tempSizer = wx.BoxSizer(wx.HORIZONTAL)
        tempSizer.Add(textLabel, 0, wx.ALIGN_CENTER_VERTICAL)
        tempSizer.Add(self.displayTypeBox)
        
        tempSizer.AddStretchSpacer(1)

        tempSizer.Add(self.filterType)
        
        #Add the sizer to the main form
        outputSizer.Add(tempSizer, 0, wx.EXPAND)

        #create text control that displays the output
        #self.programOutput = WindmillTextCtrl(self.outputPanel, -1, "", style=wx.TE_MULTILINE|wx.TE_READONLY|wx.TE_RICH)
        outputSizer.Add(self.programOutput, 1, wx.EXPAND)
        
        self.book.AddPage(self.outputPanel, 'Output', select=False)
    
        ##create a panel to hold the buttons
        buttonPanel = wx.Panel(self, -1)
        
        self.appSizer.Add(buttonPanel, 0, wx.EXPAND)

        ##create a new sizer to handle the buttons on the button panel at bottom of screen
        bottomButtonSizer = wx.BoxSizer(wx.HORIZONTAL)

        #assign the button sizer to the button panel a the botton of the screen
        buttonPanel.SetSizer(bottomButtonSizer)

        #create the browser buttons
        try: 
            bmp = wx.Bitmap("Firefoxlogo2.png", wx.BITMAP_TYPE_ANY)
            bmp.SetMask(wx.Mask(bmp, wx.ColourDatabase.Find(wx.ColourDatabase(), 'YELLOW')))
            firstBrowserButton = wx.BitmapButton(buttonPanel, -1, bmp,
                                                 size = (bmp.GetWidth()+10, bmp.GetHeight()+10))
            firstBrowserButton.SetMaxSize((bmp.GetWidth()+10, bmp.GetHeight()+10))
        except wx.PyAssertionError:
            firstBrowserButton = firstBrowserButton = wx.Button(buttonPanel, id=-1, label="FF", size = (40, 40))
                    
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

    def EvtChangeLogeLvl(self, event):
        print "Change log level to:  ", event.GetString(), "   with int value:   ", logging._levelNames[event.GetString()]
        self.theLogger.setLevel(logging._levelNames[event.GetString()])
        
    def EvtOnDoSearch(self, event):
        self.programOutput.SearchItems(self.filterType.GetValue())
        #if(self.filterType.GetValue() == ""):
            ##print "Equals none\n"
        #else:
            ##print self.filterType.GetValue(),"\n"
        

    def OnFFButtonClick(self, event):
        self.shell_objects['start_firefox']()
        
    def EvtOnComboFilter(self, event):
        i = 0
        
    def OnCloseWindow(self, event):
        #should probably manually stop logging to prevent output errors
        print "Removing the log handler"
        self.theLogger.removeHandler(self.programOutput)

        #print "Shutdown logging"
        #logging.shutdown()
        
        print "Clean up wx controls and windows"
        self.Destroy()
        
class OnFilter(logging.Filter): filter = lambda self, record: True

class OffFilter(logging.Filter): filter = lambda self, record: False

class WindmillOutputPanel(wx.Panel, listmix.ColumnSorterMixin, logging.Handler):

    def __init__(self, *args, **kwargs):
        wx.Panel.__init__(self, *args, **kwargs)
        
        logging.Handler.__init__(self)

        self.listCtrl = WindmillListCtrl(self, wx.NewId(), 
                                     style=wx.LC_REPORT| wx.LC_VRULES
                                     | wx.LC_HRULES | wx.LC_SINGLE_SEL)

        sizer = wx.BoxSizer(wx.VERTICAL)
        self.SetSizer(sizer)
        sizer.Add(self.listCtrl, 1, wx.EXPAND)
        
        self.allLogItems = {}
        self.itemDataMap = {}
        listmix.ColumnSorterMixin.__init__(self, self.listCtrl.GetColumnCount())
        
        # the value used to parse the output for search purposes
        self.currentSearchValue = ""
    
    def SearchItems(self, searchValue):

        tempDict = {}

        if searchValue == "": # if the search val is none then display entire list
            #reassign currentSearchValue
            self.currentSearchValue = searchValue
            
            tempDict.update(self.allLogItems)
            
        # determine if this is a new search value
        elif(len(searchValue) > len(self.currentSearchValue)): # addition to current search
            #reassign currentSearchValue
            self.currentSearchValue = searchValue
            
            #search currently active dictionary
            for key, value in self.itemDataMap.items():
                #for item in value:
              
                if self.currentSearchValue in value[len(value)-1]: # Just search the message body
                    tempDict.update({key: value })
                    #break
        else:
            #reassign currentSearchValue
            self.currentSearchValue = searchValue
            
            #search currently active dictionary
            for key, value in self.allLogItems.items():
                #for item in value:
                if self.currentSearchValue in value[len(value)-1]: # Just search the message body
                    tempDict[key] = value 
                    #break
            
        self.itemDataMap.clear()
        self.itemDataMap.update(tempDict)
        #self.itemDataMap.update(self.allLogItems)
        
        self.listCtrl.ResetList(self.itemDataMap)
        #self.SortListItems()
        
    # Used by the ColumnSorterMixin, see wx/lib/mixins/listctrl.py
    def GetListCtrl(self):
        return self.listCtrl
    
    def emit(self, record):
        # Gets the index to the comlumns and their values
        index, rows = self.listCtrl.InsertRecord(record)

        # Assigns the unique index and their values to a datamap for sorting purposes
        self.allLogItems[index] = rows        
        
        if( self.currentSearchValue not in record.getMessage()):
            self.listCtrl.DeleteItem(index)
            
        else:
            self.itemDataMap[index] = rows

        self.SortListItems()
    
    def __del__(self):
        self.close()    
        
class WindmillListCtrl(wx.ListView, listmix.ListCtrlAutoWidthMixin):
    def __init__(self, *args, **kwargs):
        wx.ListCtrl.__init__(self, *args, **kwargs)
       
        self.InsertColumn(0, "Level", format=wx.LIST_FORMAT_CENTER)
        self.InsertColumn(1, "Time",format=wx.LIST_FORMAT_CENTER)
        self.InsertColumn(2, "Logger", format=wx.LIST_FORMAT_CENTER, width=len("Logger")*self.GetFont().GetPointSize())
        self.InsertColumn(3, "Message")

        self.SetColumnWidth(0, wx.LIST_AUTOSIZE_USEHEADER)

        listmix.ListCtrlAutoWidthMixin.__init__(self)
        
    def InsertRecord(self, record):
        recordTime = time.strftime("%H:%M:%S.", time.gmtime(record.created)) + (lambda x: x[x.rfind(".")+1:] )(str(record.created))

        index = self.InsertNewItem( (str(record.levelname),
                                     recordTime,
                                     record.name,
                                     str(record.getMessage())),
                                    record.levelno, sys.maxint)
        return index, self.GetRow(index)

    def InsertNewItem(self, items, levelno=0, index=-1):
        """Inserts a new item at the given debug level with defined items"""

        #print "\n\nIndex before insert: ", index
        #insert a str item in the first column to create a new row
        index = self.InsertStringItem(index, items[0])
        #print "\nIndex after insert: ", index

        ##Assign the row column depending on the record level
        cases = {
          logging.INFO : lambda: self.SetItemTextColour(index, wx.BLUE),
          logging.ERROR: lambda: self.SetItemTextColour(index, wx.RED),
          logging.DEBUG: lambda: self.SetItemTextColour(index, wx.ColourDatabase.Find(wx.ColourDatabase(), 'DARK GREEN')),
        }
        
        cases[levelno]()
       
        #spit out the rest of the values to the other columns
        for i in range(len(items)-1):
            self.SetStringItem(index, i+1, items[i+1])             
            
            ##auto size every column but the last one (the message column)
            self.SetColumnWidth(i, wx.LIST_AUTOSIZE)
            
        self.SetItemData(index, index)
        return index
    
    def GetRow(self, index):
        """GetRow(self) -> Tuple"""
        
        return [ self.GetItem(index, i).GetText() for i in range(self.GetColumnCount()) ]



    def ResetList(self, dictValues):
        """Resets the list according to the give dictValues"""
        self.DeleteAllItems()
        for index, values in dictValues.items():
            self.InsertNewItem(values, logging._levelNames[values[0]], index)
        
    def __del__(self):
        self.close()    
    
class App(wx.App):
    """Application class."""
    def __init__(self, shell_objects = None, redirect=False, *args, **kwargs):
     
        self.shell_objects = shell_objects
        wx.App.__init__(self, redirect, *args, **kwargs)
        
    def OnInit(self):
        self.frame = Frame(shell_objects=self.shell_objects, size=(800, wx.DefaultSize[0]))
        self.frame.Show()
        self.SetTopWindow(self.frame)
        return True