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
import wx.grid as gridlib
import logging
import sys
import time
import os
from wx.py.crust import CrustFrame
from StringIO import StringIO
from threading import Thread

class Frame(wx.Frame):
    """Frame that displays the Main window"""

    def __init__(self, parent=None, id=-1, pos=wx.DefaultPosition, title='Windmill', shell_objects = None, **kwargs):
        
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

	#self.SetupPreferences()
        ##bind the import objects
        self.Bind(wx.EVT_CLOSE, self.OnCloseWindow)

    #def SetupPreferences(self):
	#"""Setup the default preferences from loading the conf file"""
	#self.preferences = {}
	### Let's create a file and write it to disk.
	##filename = os.path.join(os.path.dirname(os.path.abspath(__file__)), "wx_windmill.conf")
	
	##try:
	    ##infile = open(filename,"r")

	    ### Let's get some data:
	    ##if infile:
		##line = infile.readline()
		
		##while len(line) is not 0:
		    ##attr, value = line.split(':')
		    ##self.preferences[attr] = value
		    ##line = infile.readline()

	    ##infile.close()

	##except IOError, ValueError:
	    ##"""take care of the null case with no attr file"""
	    ###the file needs to be created.
	    
    
    #def SavePreferences(self):
	#"""Saves all the preferences created"""
	#filename = os.path.join(os.path.dirname(os.path.abspath(__file__)), "wx_windmill.conf")
	
	#try:
	    #infile = open(filename,"r")

	    ## Let's get some data:
	    #if infile:
		#line = infile.readline()
		
		#while len(line) is not 0:
		    #attr, value = line.split(':')
		    #self.preferences[attr] = value
		    #line = infile.readline()

	#except IOError, ValueError:
	    #"""take care of the null case with no attr file"""

	    ##the file needs to be created.
	    
	    
	#finally:
	    #infile.close()


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
        #logging.basicConfig(format='%(asctime)s %(message)s')
        
        self.theLogger = logging.getLogger()
        self.theLogger.addHandler(self.programOutput)       
        self.theLogger.setLevel(logging._levelNames["DEBUG"])
        
    def createMenu(self):
        """Creates the menu system"""

        menuBar = wx.MenuBar()

        ##setup the file menu and associated events
        fileMenu = wx.Menu()
        self.Bind(wx.EVT_MENU, self.EvtOnRunTest, fileMenu.Append(wx.NewId(), "Run &Test File", "Select a test to run."))

	fileMenu.AppendSeparator()	
	
	self.Bind(wx.EVT_MENU, self.OnCloseWindow, fileMenu.Append(wx.NewId(), "E&xit", "Exit Windmill"))

	##setup the test menu and associated events
	testMenu = wx.Menu()
	self.Bind(wx.EVT_MENU, self.EvtOnRunDir, testMenu.Append(wx.NewId(), "Run Test &Directory", "Select a directory to run."))	
	testMenu.AppendSeparator()
	
	self.Bind(wx.EVT_MENU, self.EvtOnLoadTest, testMenu.Append(wx.NewId(), "Load Test", "Loads a single test"))
	self.Bind(wx.EVT_MENU, self.EvtOnLoadDir, testMenu.Append(wx.NewId(), "Load Test Directory", "Load a directory full of tests"))

        ##setup the options menu
        optionsMenu = wx.Menu()
	self.Bind(wx.EVT_MENU, self.EvtOnDefaultUrl, optionsMenu.Append(wx.NewId(), "Default URL", "Default Browser URL"))

	toolsMenu = wx.Menu()
	self.Bind(wx.EVT_MENU, self.EvtOnClearQueue, toolsMenu.Append(wx.NewId(), "Clear Queue", "Clear the Queue"))	
	
        ##setup the Help menu
        helpMenu = wx.Menu()
	self.Bind(wx.EVT_MENU, self.OnWebsiteLink, helpMenu.Append(wx.NewId(), "Windmill Home Page", "Link to website"))
        self.Bind(wx.EVT_MENU, self.OnAbout, helpMenu.Append(wx.NewId(), "About", "About windmill"))            

        ##Add menu items to the menu bar
        menuBar.Append(fileMenu, "&File")
	menuBar.Append(testMenu, "T&ests")
        menuBar.Append(optionsMenu, "O&ptions")
	menuBar.Append(toolsMenu, "&Tools")
	menuBar.Append(helpMenu, "&Help")

        self.SetMenuBar(menuBar)        
	
    def EvtOnRunTest(self, event):
        #popup a dialog here to run it
        dialog = wx.FileDialog (None,
                                message = u"Choose a Test",
                                defaultFile = u"",	
                                wildcard = u"Python files (*.py)|*.py|Json files (*.json)|*.json",
                                style = wx.OPEN|wx.CHANGE_DIR)        

	if dialog.ShowModal() == wx.ID_OK:
	    filename = dialog.GetPath()
	    
	    if filename.find(".py") is not -1:
		print "Running the python version of run test"
		x = Thread(target=self.shell_objects['run_python_test'], args=[filename])
		
	    else:
		print "Running the json version of run test"
		x = Thread(target=self.shell_objects['run_test_file'], args=[filename])
				
	    x.start()

    def EvtOnRunDir(self, event):
	dialog = wx.DirDialog(None,
			      message = u"Choose directory to load")
    
	if dialog.ShowModal() == wx.ID_OK:
	    x = Thread(target=   self.shell_objects['run_test_dir'], args=[dialog.GetPath()])
	    x.start()
	    
    def EvtOnLoadTest(self, event):
        #popup a dialog here to run it
        dialog = wx.FileDialog (None,
                                message = u"Choose a Test",
                                defaultFile = u"",
                                wildcard = u"Python files (*.py)|*.py|Json files (*.json)|*.json",
                                style = wx.OPEN|wx.CHANGE_DIR)        

	if dialog.ShowModal() == wx.ID_OK:
	    filename = dialog.GetPath()
	    
	    if filename.find(".py") is not -1:
		x = Thread(target=self.shell_objects['load_python_tests'], args=[filename])
	    
	    else:
		x = Thread(target=self.shell_objects['load_json_test_file'], args=[filename])
	    
	    x.start()

    def EvtOnLoadDir(self, event):
	dialog = wx.DirDialog(None,
			      message = u"Choose directory to load")
    
	if dialog.ShowModal() == wx.ID_OK:
	    x = Thread(target=self.shell_objects['load_json_test_dir'], args=[dialog.GetPath()])
	
	x.start()


    def OnAbout(self, event):
        #popup a About dialog 
        wx.AboutBox(self.aboutInfo)
            
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
    
	    #grab the different types of levelnames from logging and use them as option in the combo box
	    self.displayTypeBox = wx.ComboBox(self.outputPanel, -1, "DEBUG", 
					      wx.DefaultPosition, wx.DefaultSize, 
					      list(lvl for lvl in logging._levelNames.keys() if isinstance(lvl, str)),
					      style=wx.CB_READONLY)                                          
    
	    self.Bind(wx.EVT_COMBOBOX, self.EvtChangeLogeLvl, self.displayTypeBox)
	    
	    #self.Bind(wx.EVT_COMBOBOX, self.EvtOnComboFilter, self.filterType)
	    self.filterType= wx.SearchCtrl(self.outputPanel, size=(200,-1), style=wx.TE_PROCESS_ENTER)
    
	    self.Bind(wx.EVT_TEXT_ENTER, self.EvtOnDoSearch, self.filterType)
	    self.Bind(wx.EVT_TEXT, self.EvtOnDoSearch, self.filterType, 1)
    
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

	    #firstBrowserButton.SetMaxSize((bmp.GetWidth()+10, bmp.GetHeight()+10))
	    except Exception:
		firstBrowserButton = wx.Button(buttonPanel, id=-1, label="FF", size = (40, 40))
    
	    #secondBrowserButton = wx.Button(buttonPanel, id=-1, label="IE", size = (60, 40))
	    self.Bind(wx.EVT_BUTTON, self.EvtOnFFButtonClick, firstBrowserButton)
			     
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

    def EvtChangeLogeLvl(self, event):
        #print "Change log level to:  ", event.GetString(), "   with int value:   ", logging._levelNames[event.GetString()]
        self.theLogger.setLevel(logging._levelNames[event.GetString()])
        
    def EvtOnDoSearch(self, event):
	searchVal = self.filterType.GetValue()
	self.programOutput.SearchValues(searchVal)

    def EvtOnFFButtonClick(self, event):
	self.shell_objects['start_firefox']()
	
    def OnCloseWindow(self, event):
        #should probably manually stop logging to prevent output errors
        #print "Removing the log handler"
        self.theLogger.removeHandler(self.programOutput)

        #print "Clean up wx controls and windows"
        self.Destroy()
	
    def OnWebsiteLink(self, event):
	"""Bring up a link to the windmill homepage"""
	import webbrowser
	webbrowser.open_new("http://windmill.osafoundation.org")
	
	
    def EvtOnDefaultUrl(self, event):
	
	#get the url from the preferences file or use a default
	from windmill import settings

	textEntry = wx.TextEntryDialog(self, 
				       message = "Please select an URL to be used as the browser default.", 
				       caption = "Default Browser URL", 
				       defaultValue = settings['TEST_URL'],
				       style = wx.OK | wx.CANCEL | wx.CENTRE,
				       pos = wx.DefaultPosition)
	
	if textEntry.ShowModal() == wx.ID_OK:
	    settings['TEST_URL'] = textEntry.GetValue()

    def EvtOnClearQueue(self, event):
	try:
	    self.shell_objects['clear_queue']()
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

#--------------------------------------------------------------------------- 
class CustomDataTable(gridlib.PyGridTableBase): 
    def __init__(self): 
        gridlib.PyGridTableBase.__init__(self) 

        self.colLabels = ['Level', 'Time', 'Logger', 'Message'] 
        self.dataTypes = [gridlib.GRID_VALUE_STRING,
                          gridlib.GRID_VALUE_STRING, 
                          gridlib.GRID_VALUE_STRING,  
                          gridlib.GRID_VALUE_STRING ] 
        self.data = []
	
	self.previousSize = 0
        
    #-------------------------------------------------- 
    # required methods for the wxPyGridTableBase interface 
    def GetNumberRows(self): 
        return len(self.data) + 1 
    
    def GetNumberCols(self): 
        return len(self.colLabels)
    
    def IsEmptyCell(self, row, col): 
        try: 
            return not self.data[row][col] 
        except IndexError: 
            return True 

    # Get/Set values in the table.  The Python version of these 
    # methods can handle any data-type, (as long as the Editor and 
    # Renderer understands the type too,) not just strings as in the 
    # C++ version. 
    def GetValue(self, row, col): 
        try: 
            return self.data[row][col] 
        except IndexError: 
            return '' 
    
    def SetValue(self, row, col, value): 
        try: 
            self.data[row][col] = value 
        except IndexError: 
            # add a new row 
            self.data.append([''] * self.GetNumberCols()) 
            self.SetValue(row, col, value) 
            # tell the grid we've added a row 
            msg = gridlib.GridTableMessage(self,            # The table 
                    gridlib.GRIDTABLE_NOTIFY_ROWS_APPENDED, # what we did to it 
                    1                                       # how many 
                    ) 
            self.GetView().ProcessTableMessage(msg) 

    #-------------------------------------------------- 
    # Some optional methods 
    # Called when the grid needs to display labels 
    def GetColLabelValue(self, col): 
        return self.colLabels[col] 

    # Called to determine the kind of editor/renderer to use by 
    # default, doesn't necessarily have to be the same type used 
    # natively by the editor/renderer if they know how to convert. 
    def GetTypeName(self, row, col): 
        return self.dataTypes[col] 

    # Called to determine how the data can be fetched and stored by the 
    # editor and renderer.  This allows you to enforce some type-safety 
    # in the grid. 
    def CanGetValueAs(self, row, col, typeName): 
        colType = self.dataTypes[col].split(':')[0] 
        if typeName == colType: 
            return True 
        else: 
            return False 

    def CanSetValueAs(self, row, col, typeName): 
        return self.CanGetValueAs(row, col, typeName) 
    
    def DeleteRows(self, pos = 0, numRows = 0):
	try:
	    if len(self.data) != 0 and len(self.data) < pos+numRows:
		del self.data[pos:pos+numRows]
		
		## tell the grid we've added a row 
		msg = gridlib.GridTableMessage(self,            # The table
			gridlib.GRIDTABLE_NOTIFY_ROWS_DELETED, # what we did to it 
			pos,
			numRows# how many 
			) 
		self.GetView().ProcessTableMessage(msg)
	except Exception:
	    print "\nERROR IN DELETEROWS\n"
	    return False
	
	return True
	    
    def AppendNewRow(self, values):
        """Sets a row to a value"""
        
        self.data.append(values) 
    
        ## tell the grid we've added a row 
        msg = gridlib.GridTableMessage(self,            # The table 
                gridlib.GRIDTABLE_NOTIFY_ROWS_APPENDED, # what we did to it 
                1                                       # how many 
                ) 
        self.GetView().ProcessTableMessage(msg)

    def AppendRows(self, numRows = 1):
        """Sets a row to a value"""

	## tell the grid we've added a row 
        msg = gridlib.GridTableMessage(self,            # The table 
                gridlib.GRIDTABLE_NOTIFY_ROWS_APPENDED, # what we did to it 
                numRows                                       # how many 
                )
	
        self.GetView().ProcessTableMessage(msg)

    def GetRow(self, row):
        """Gets a row with the given index"""
        try:
            return self.data[row]
        except IndexError:
            print "Row not part of database"
        
    def ChangeDataSet(self, nwlst):
	#assign a value to retain the current length of the data list
	previousSize = len(self.data)
	
	#reassign the data list
	self.data = list(nwlst)
	
	#call the function to resize the number of rows if necessary
	self.ResizeTableRows(len(self.data), previousSize)
	
    def ResizeTableRows(self, now, prev):
	try:
	    if now - prev > 0: # need to adds some rows
		## tell the grid we've added a row 
		msg = gridlib.GridTableMessage(self,            # The table
					       gridlib.GRIDTABLE_NOTIFY_ROWS_APPENDED, # what we did to it 
					       now - prev       # how many 
					       ) 
		self.GetView().ProcessTableMessage(msg)
	    elif now - prev < 0: # need to delete empty rows
		## tell the grid we've added a row 
		msg = gridlib.GridTableMessage(self,            # The table
					       gridlib.GRIDTABLE_NOTIFY_ROWS_DELETED, # what we did to it 
					       0,
					       prev - now        # how many 
					   ) 
		self.GetView().ProcessTableMessage(msg)
	    else:
		return

	except wx._core.PyAssertionError:
	    return
	    
#--------------------------------------------------------------------------- 
class CustTableGrid(gridlib.Grid, logging.Handler): 
    def __init__(self, parent): 
        gridlib.Grid.__init__(self, parent, -1) 
        
        logging.Handler.__init__(self)        

        table = CustomDataTable() 
        
        self.masterList = []
	
        #determines the last column sorted
        self.lastSorted = [1, True] 

        #make the text in each cell wrap to fit within the width of each cell.
        self.SetDefaultRenderer(wx.grid.GridCellAutoWrapStringRenderer())
        
        # The second parameter means that the grid is to take ownership of the 
        # table and will destroy it when done.  Otherwise you would need to keep 
        # a reference to it and call it's Destroy method later. 
        self.SetTable(table, True) 
        
        #assign the second column to 150 width STATIC VALUE. MUST CHANGE
	self.SetColSize(2, 150)
	self.SetColSize(1, 100)
	
	#insure left side label is not displayed
        self.SetRowLabelSize(0) 

	#remove the extra space after the last column
        self.SetScrollLineX(1)

        #disable the editing of cells
        #self.EnableEditing(True)
	#self.EnableCellEditControl(True)        
	
        #Set the default alignment of the cells values
        self.SetDefaultCellAlignment(wx.ALIGN_LEFT, wx.ALIGN_CENTER)

        self.currentSearchValue = ""
        
        self.EnableDragColSize(False)

	##define the events to be used on the control##
        
        #Onsize for resizing the message column
        self.Bind(wx.EVT_SIZE, self.OnSize)
        
        #on column double click sorting values
        self.Bind(gridlib.EVT_GRID_LABEL_LEFT_DCLICK, self.SortSpecificColumn)
	
	#Handle when the data in a cell changes by changing it's color appropriately
	self.Bind(gridlib.EVT_GRID_CELL_CHANGE, self.EvtCellChange)

	#Handle when the data in a cell changes by changing it's color appropriately
	self.Bind(gridlib.EVT_GRID_CMD_SELECT_CELL, self.EvtCellChange)

    def emit(self, record):
	#parse the record into a list format that fits to the table
	lstItem = self.ParseRecordToList(record)

	#append the new item to the master list
	self.masterList.append(lstItem)
	
	#determine if the record should be place in the table
	if( record.getMessage().find(self.currentSearchValue) is not -1):
	    self.GetTable().AppendNewRow(lstItem)
	    self.SortColumn()

	    ##because of crashing purposes must call autesizerows less often, so i'm callin only every 5 times
	    #if(self.GetTable().GetNumberRows() % 7 == 0 ):
		#self.AutoSizeRows(False)
		
    def SearchValues(self, searchValue):

	#print "The search value is: ", searchValue, " and the len of data is: ", len(self.GetTable().data)
	if searchValue == "":
	    self.GetTable().ChangeDataSet(self.masterList)	    

	# determine if this is a new search value
	elif(len(searchValue) > len(self.currentSearchValue)): # addition to current search
	    ##search currently active list
	    self.GetTable().ChangeDataSet(filter(lambda lst: lst[self.GetNumberCols()-1].find(searchValue) is not -1, self.GetTable().data))
			    
	else:
	    #search master list
	    self.GetTable().ChangeDataSet(filter(lambda lst: lst[self.GetNumberCols()-1].find(searchValue) is not -1, self.masterList))
	
	#reassign currentSearchValue
	self.currentSearchValue = searchValue

	self.SortColumn()
	self.AutoSizeRows(False)
	
    def ParseRecordToList(self, record):
	#retrieve the record time
	recordTime = time.strftime("%H:%M:%S.", time.gmtime(record.created)) + (lambda x: x[x.rfind(".")+1:] )(str(record.created))

	#append the new record into the master list
	return [str(record.levelname), recordTime, record.name, str(record.getMessage())]
			
	
    def OnSize(self, event):
        """handles a window resize"""
	event.Skip()
        
        #determine the width of the last column to the edge of the screen
        totalSize = 0
        
        for cell in range(0, self.GetNumberCols() -1):
            totalSize += self.GetColSize(cell)
        #print "The scrollbar pos is: ", self.Parent.GetScrollBar(wx.HORIZONTAL)
        self.SetColSize(self.GetNumberCols() -1, event.Size[0] - totalSize - 15)        
        
        self.AutoSizeRows(True)

    
    def SortSpecificColumn(self, event):
        if self.lastSorted[0] == event.Col:
            self.lastSorted[1] = not(self.lastSorted[1])
        else:
            self.lastSorted[0] = event.Col
            self.lastSorted[1] = False

        self.SortColumn(event.Col, self.lastSorted[1])
	self.AutoSizeRows(False)
        
    def SortColumn(self, col = None, reverse = False):
	if( len(self.GetTable().data) is not 0):
	    if col is None:
		self.GetTable().data.sort(key=lambda lst: lst[self.lastSorted[0]], reverse=self.lastSorted[1])
	    else:
		self.GetTable().data.sort(key=lambda lst: lst[col], reverse=reverse)

	    #self.AutoSizeRows(False)
	    self.ForceRefresh()

    def EvtCellChange(self, event):
	"""Handle cell change event"""
	#print "Cell changed at: ", event.GetCol(), ", ", event.GetRow()
	#if(event.GetCol() == 0):
	    #self.SetRowAttr(event.GetRow(), gridlib.GridCellAttr(colText = wx.GREEN))

    def __del__(self):
        self.close()   

class App(wx.App):
    """Application class."""
    def __init__(self, shell_objects = None, redirect=False, *args, **kwargs):
     
        self.shell_objects = shell_objects
	
	wx.App.__init__(self, redirect, *args, **kwargs)
	
    def OnInit(self):
        MySplash = MySplashScreen(shell_objects=self.shell_objects)
        MySplash.Show()

	#self.frame = Frame(shell_objects=self.shell_objects, size=(800, wx.DefaultSize[0]))
        #self.frame.Show()
        #self.SetTopWindow(self.frame)
        return True